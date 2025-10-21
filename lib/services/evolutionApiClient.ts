/**
 * Evolution API Client Service
 * 
 * This service provides a client for interacting with the Evolution API (unofficial WhatsApp API).
 * It handles instance management, message sending, and configuration settings.
 * 
 * Requirements covered:
 * - 1.1: Load Evolution API credentials from environment variables
 * - 1.2: Validate API configuration
 * - 1.3: Include API key in Authorization header
 * - 1.4: Create instances with webhook configuration
 * - 2.3: Create instances via Evolution API
 * - 2.6: Configure webhook events
 * - 4.1: Send text messages
 * - 4.2: Send audio messages
 * - 11.2: Configure instance settings
 * - 11.6: Sync settings with Evolution API
 */

// Types for Evolution API
export interface EvolutionApiConfig {
  baseUrl: string
  apiKey: string
  webhookUrl?: string
}

export interface CreateInstanceData {
  instanceName: string
  token?: string
  qrcode?: boolean
  number?: string
  integration?: string
  webhook?: string
  webhook_by_events?: boolean
  events?: string[]
}

export interface Instance {
  instance: {
    instanceName: string
    instanceId?: string
    integration?: string
    status: string
  }
  hash?: string | {
    apikey: string
  }
  qrcode?: {
    pairingCode: string | null
    code: string
    base64: string
    count: number
  }
  webhook?: any
  websocket?: any
  rabbitmq?: any
  nats?: any
  sqs?: any
  settings?: any
}

export interface ConnectionState {
  instance: string
  state: 'close' | 'connecting' | 'open'
}

export interface QRCodeResponse {
  base64: string
  code: string
}

export interface SendTextData {
  number: string
  text: string
  quoted?: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
  }
}

export interface SendAudioData {
  number: string
  audio: string // URL or base64
  quoted?: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
  }
}

export interface MessageResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: any
  messageTimestamp: number
  status: string
}

export interface InstanceSettings {
  rejectCall?: boolean
  msgCall?: string
  groupsIgnore?: boolean
  alwaysOnline?: boolean
  readMessages?: boolean
  readStatus?: boolean
}

export interface WebhookEvents {
  QRCODE_UPDATED?: boolean
  MESSAGES_SET?: boolean
  MESSAGES_UPSERT?: boolean
  MESSAGES_UPDATE?: boolean
  MESSAGES_DELETE?: boolean
  SEND_MESSAGE?: boolean
  CONTACTS_SET?: boolean
  CONTACTS_UPSERT?: boolean
  CONTACTS_UPDATE?: boolean
  PRESENCE_UPDATE?: boolean
  CHATS_SET?: boolean
  CHATS_UPSERT?: boolean
  CHATS_UPDATE?: boolean
  CHATS_DELETE?: boolean
  GROUPS_UPSERT?: boolean
  GROUP_UPDATE?: boolean
  GROUP_PARTICIPANTS_UPDATE?: boolean
  CONNECTION_UPDATE?: boolean
  LABELS_EDIT?: boolean
  LABELS_ASSOCIATION?: boolean
  CALL?: boolean
}

// Custom error class for Evolution API errors
export class EvolutionApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message)
    this.name = 'EvolutionApiError'
  }
}

/**
 * Evolution API Client
 * 
 * Provides methods to interact with the Evolution API for WhatsApp integration.
 * Includes error handling, retry logic, and proper authentication.
 */
export class EvolutionApiClient {
  private config: EvolutionApiConfig
  private maxRetries: number = 3
  private retryDelay: number = 1000 // 1 second

  constructor(config?: Partial<EvolutionApiConfig>) {
    // Load configuration from environment variables (Requirement 1.1)
    const baseUrl = config?.baseUrl || process.env.EVOLUTION_API_BASE_URL
    const apiKey = config?.apiKey || process.env.EVOLUTION_API_KEY

    // Validate configuration (Requirement 1.2)
    if (!baseUrl) {
      throw new EvolutionApiError(
        'EVOLUTION_API_BASE_URL is required',
        400,
        { field: 'baseUrl' }
      )
    }

    if (!apiKey) {
      throw new EvolutionApiError(
        'EVOLUTION_API_KEY is required',
        400,
        { field: 'apiKey' }
      )
    }

    // Validate URL format (Requirement 1.3)
    try {
      new URL(baseUrl)
    } catch {
      throw new EvolutionApiError(
        'EVOLUTION_API_BASE_URL must be a valid URL',
        400,
        { field: 'baseUrl', value: baseUrl }
      )
    }

    this.config = {
      baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
      apiKey,
      webhookUrl: config?.webhookUrl
    }
  }

  /**
   * Make HTTP request to Evolution API with enhanced error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`
    
    // Include API key in Authorization header (Requirement 1.3)
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.config.apiKey,
      ...options.headers
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        // Handle non-JSON responses
        const text = await response.text()
        throw new EvolutionApiError(
          `Invalid JSON response: ${text}`,
          response.status,
          { originalError: parseError, responseText: text }
        )
      }

      if (!response.ok) {
        // Enhanced error messages based on status codes
        let errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`
        
        // Add context for common errors
        switch (response.status) {
          case 400:
            errorMessage = `Bad Request: ${errorMessage}`
            break
          case 401:
            errorMessage = `Unauthorized: Check your API key. ${errorMessage}`
            break
          case 403:
            errorMessage = `Forbidden: ${errorMessage}`
            break
          case 404:
            errorMessage = `Not Found: The requested resource was not found. ${errorMessage}`
            break
          case 429:
            errorMessage = `Rate Limited: Too many requests. ${errorMessage}`
            break
          case 500:
            errorMessage = `Server Error: ${errorMessage}`
            break
          case 502:
            errorMessage = `Bad Gateway: Evolution API server is down. ${errorMessage}`
            break
          case 503:
            errorMessage = `Service Unavailable: Evolution API is temporarily unavailable. ${errorMessage}`
            break
          case 504:
            errorMessage = `Gateway Timeout: Evolution API took too long to respond. ${errorMessage}`
            break
        }

        throw new EvolutionApiError(errorMessage, response.status, data)
      }

      return data
    } catch (error) {
      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new EvolutionApiError(
          'Request timeout: Evolution API took too long to respond',
          408,
          { originalError: error }
        )
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new EvolutionApiError(
          'Network error: Unable to connect to Evolution API',
          0,
          { originalError: error }
        )
      }

      // Re-throw EvolutionApiError as-is
      if (error instanceof EvolutionApiError) {
        // Log error for debugging (Requirement 12.8)
        console.error(`Evolution API Error [${error.statusCode}]:`, {
          endpoint,
          error: error.message,
          response: error.response,
          retryCount,
          timestamp: new Date().toISOString()
        })

        // Retry logic for server errors and network issues
        if (
          retryCount < this.maxRetries &&
          (error.statusCode >= 500 || error.statusCode === 429 || error.statusCode === 0)
        ) {
          const delay = this.retryDelay * Math.pow(2, retryCount)
          console.warn(`Retrying Evolution API request in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`)
          
          await this.delay(delay)
          return this.makeRequest<T>(endpoint, options, retryCount + 1)
        }

        throw error
      }

      // Handle unexpected errors
      throw new EvolutionApiError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        { originalError: error }
      )
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create a new WhatsApp instance (Requirements 2.3, 1.4, 2.6)
   */
  async createInstance(data: CreateInstanceData): Promise<Instance> {
    const webhookUrl = data.webhook || this.config.webhookUrl
    
    // Configure webhook with required events (Requirement 2.6)
    // IMPORTANT: webhook must be a nested object, not flat fields!
    const payload = {
      instanceName: data.instanceName,
      token: data.token || data.instanceName, // Use instanceName as token if not provided
      qrcode: data.qrcode !== false, // Default to true
      number: data.number,
      integration: data.integration || 'WHATSAPP-BAILEYS', // Required field - default to WHATSAPP-BAILEYS
      webhook: {
        url: webhookUrl,
        byEvents: true,
        base64: false,
        events: data.events || [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE', 
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
          'CONTACTS_UPSERT'
        ]
      }
    }

    console.log('[Evolution API] Creating instance with payload:', JSON.stringify(payload, null, 2))

    const response = await this.makeRequest<Instance>('/instance/create', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    console.log('[Evolution API] Instance created successfully:', {
      instanceName: response.instance?.instanceName,
      hasWebhook: !!response.webhook,
      webhookConfig: response.webhook
    })

    return response
  }

  /**
   * Connect an instance (initiate QR code process)
   */
  async connectInstance(instanceName: string): Promise<QRCodeResponse> {
    return this.makeRequest<QRCodeResponse>(`/instance/connect/${instanceName}`, {
      method: 'GET'
    })
  }

  /**
   * Get connection state of an instance
   */
  async getConnectionState(instanceName: string): Promise<ConnectionState> {
    return this.makeRequest<ConnectionState>(`/instance/connectionState/${instanceName}`, {
      method: 'GET'
    })
  }

  /**
   * Send text message (Requirement 4.1)
   */
  async sendTextMessage(instanceName: string, data: SendTextData): Promise<MessageResponse> {
    return this.makeRequest<MessageResponse>(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Send WhatsApp audio message (Requirement 4.2)
   */
  async sendWhatsAppAudio(instanceName: string, data: SendAudioData): Promise<MessageResponse> {
    return this.makeRequest<MessageResponse>(`/message/sendWhatsAppAudio/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Set instance settings (Requirements 11.2, 11.6)
   */
  async setSettings(instanceName: string, settings: InstanceSettings): Promise<void> {
    await this.makeRequest(`/settings/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(settings)
    })
  }

  /**
   * Get instance settings
   */
  async getSettings(instanceName: string): Promise<InstanceSettings> {
    return this.makeRequest<InstanceSettings>(`/settings/find/${instanceName}`, {
      method: 'GET'
    })
  }

  /**
   * Delete an instance
   */
  async deleteInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/delete/${instanceName}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get instance information
   */
  async getInstance(instanceName: string): Promise<Instance> {
    return this.makeRequest<Instance>(`/instance/fetchInstances/${instanceName}`, {
      method: 'GET'
    })
  }

  /**
   * Logout instance (disconnect)
   */
  async logoutInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/logout/${instanceName}`, {
      method: 'DELETE'
    })
  }

  /**
   * Restart instance
   */
  async restartInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/restart/${instanceName}`, {
      method: 'PUT'
    })
  }

  /**
   * Set webhook URL for instance
   */
  async setWebhook(instanceName: string, webhookUrl: string, events?: string[]): Promise<void> {
    const payload = {
      webhook: webhookUrl,
      webhook_by_events: true,
      events: events || [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE', 
        'QRCODE_UPDATED',
        'CONTACTS_UPSERT'
      ]
    }

    await this.makeRequest(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  /**
   * Get webhook configuration
   */
  async getWebhook(instanceName: string): Promise<{ webhook: string; events: string[] }> {
    return this.makeRequest(`/webhook/find/${instanceName}`, {
      method: 'GET'
    })
  }
}

// Export a default instance for convenience
let defaultClient: EvolutionApiClient | null = null

/**
 * Get the default Evolution API client instance
 */
export function getEvolutionApiClient(): EvolutionApiClient {
  if (!defaultClient) {
    defaultClient = new EvolutionApiClient()
  }
  return defaultClient
}

/**
 * Create a new Evolution API client with custom configuration
 */
export function createEvolutionApiClient(config: Partial<EvolutionApiConfig>): EvolutionApiClient {
  return new EvolutionApiClient(config)
}