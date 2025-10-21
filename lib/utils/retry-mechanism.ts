/**
 * Retry Mechanism Utilities
 * 
 * Provides retry logic for failed operations, particularly message sending
 * and API calls with exponential backoff and user feedback.
 * 
 * Requirements covered:
 * - 4.6: Add retry mechanism for failed message sends
 * - 12.8: Handle Evolution API connection errors gracefully
 */

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
  onRetry?: (error: unknown, attempt: number) => void
  onFinalFailure?: (error: unknown, attempts: number) => void
}

export interface RetryableOperation<T> {
  (): Promise<T>
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  shouldRetry: (error: unknown, attempt: number) => {
    // Don't retry client errors (4xx), only server errors (5xx) and network errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as any).statusCode
      return statusCode >= 500 || statusCode === 429 // Retry server errors and rate limits
    }
    
    // Retry network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true
    }
    
    // Don't retry other errors by default
    return false
  },
  onRetry: (error: unknown, attempt: number) => {
    console.warn(`Retry attempt ${attempt}:`, error)
  },
  onFinalFailure: (error: unknown, attempts: number) => {
    console.error(`Operation failed after ${attempts} attempts:`, error)
  }
}

/**
 * Execute an operation with retry logic
 */
export async function withRetry<T>(
  operation: RetryableOperation<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: unknown
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Check if we should retry
      if (attempt === config.maxAttempts || !config.shouldRetry(error, attempt)) {
        config.onFinalFailure(error, attempt)
        throw error
      }
      
      // Call retry callback
      config.onRetry(error, attempt)
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      )
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, jitteredDelay))
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw lastError
}

/**
 * Retry mechanism specifically for message sending
 */
export class MessageRetryManager {
  private retryQueue = new Map<string, {
    operation: () => Promise<any>
    attempts: number
    maxAttempts: number
    lastError: unknown
  }>()

  /**
   * Add a failed message to the retry queue
   */
  addToRetryQueue(
    messageId: string,
    operation: () => Promise<any>,
    maxAttempts: number = 3
  ) {
    this.retryQueue.set(messageId, {
      operation,
      attempts: 0,
      maxAttempts,
      lastError: null
    })
  }

  /**
   * Retry sending a specific message
   */
  async retryMessage(messageId: string): Promise<boolean> {
    const retryItem = this.retryQueue.get(messageId)
    if (!retryItem) {
      console.warn(`No retry item found for message ${messageId}`)
      return false
    }

    retryItem.attempts++

    try {
      await retryItem.operation()
      this.retryQueue.delete(messageId) // Remove from queue on success
      return true
    } catch (error) {
      retryItem.lastError = error
      
      if (retryItem.attempts >= retryItem.maxAttempts) {
        console.error(`Message ${messageId} failed after ${retryItem.attempts} attempts:`, error)
        this.retryQueue.delete(messageId) // Remove from queue after max attempts
        return false
      }
      
      console.warn(`Message ${messageId} retry ${retryItem.attempts} failed:`, error)
      return false
    }
  }

  /**
   * Retry all failed messages in the queue
   */
  async retryAllMessages(): Promise<{ succeeded: string[], failed: string[] }> {
    const succeeded: string[] = []
    const failed: string[] = []

    for (const [messageId] of this.retryQueue) {
      const success = await this.retryMessage(messageId)
      if (success) {
        succeeded.push(messageId)
      } else {
        failed.push(messageId)
      }
    }

    return { succeeded, failed }
  }

  /**
   * Get the number of messages in retry queue
   */
  getQueueSize(): number {
    return this.retryQueue.size
  }

  /**
   * Get retry information for a specific message
   */
  getRetryInfo(messageId: string) {
    return this.retryQueue.get(messageId)
  }

  /**
   * Remove a message from retry queue
   */
  removeFromQueue(messageId: string): boolean {
    return this.retryQueue.delete(messageId)
  }

  /**
   * Clear all messages from retry queue
   */
  clearQueue(): void {
    this.retryQueue.clear()
  }
}

/**
 * Global message retry manager instance
 */
export const messageRetryManager = new MessageRetryManager()

/**
 * Retry configuration for different types of operations
 */
export const retryConfigs = {
  // For message sending
  messageSend: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 8000,
    shouldRetry: (error: unknown) => {
      // Retry on network errors and server errors
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as any).statusCode
        return statusCode >= 500 || statusCode === 429
      }
      return error instanceof TypeError && error.message.includes('fetch')
    }
  },

  // For API calls
  apiCall: {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    shouldRetry: (error: unknown) => {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = (error as any).statusCode
        return statusCode >= 500 || statusCode === 429
      }
      return error instanceof TypeError && error.message.includes('fetch')
    }
  },

  // For connection attempts
  connection: {
    maxAttempts: 5,
    baseDelay: 3000,
    maxDelay: 15000,
    backoffFactor: 1.5,
    shouldRetry: () => true // Always retry connection attempts
  },

  // For webhook processing (minimal retries)
  webhook: {
    maxAttempts: 1, // Don't retry webhooks to avoid duplicates
    baseDelay: 0,
    maxDelay: 0,
    shouldRetry: () => false
  }
}

/**
 * Utility function to create a retryable version of an async function
 */
export function makeRetryable<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    return withRetry(() => fn(...args), options)
  }
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }

  reset() {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = 'closed'
  }
}

/**
 * Global circuit breaker for Evolution API
 */
export const evolutionApiCircuitBreaker = new CircuitBreaker(3, 30000) // 3 failures, 30 second recovery