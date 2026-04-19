import { NextResponse } from 'next/server'

/**
 * API Error Handler Utilities
 * 
 * Provides consistent error handling and user-friendly error responses
 * for API routes with proper logging and status codes.
 * 
 * Requirements covered:
 * - 4.6: Show user-friendly error messages for API failures
 * - 12.8: Log errors to console for debugging
 */

export interface ApiError {
  message: string
  code: string
  statusCode: number
  details?: any
}

export interface ApiErrorContext {
  endpoint: string
  method: string
  userId?: string
  requestId?: string
  timestamp: string
}

/**
 * Standard API error codes
 */
export const API_ERROR_CODES = {
  // Client errors (4xx)
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  TIMEOUT: 'TIMEOUT'
} as const

/**
 * Create standardized API error response
 */
export function createApiError(
  message: string,
  code: keyof typeof API_ERROR_CODES,
  statusCode: number = 500,
  details?: any
): ApiError {
  return {
    message,
    code: API_ERROR_CODES[code],
    statusCode,
    details
  }
}

/**
 * Log API error with context
 */
export function logApiError(
  error: unknown,
  context: ApiErrorContext,
  additionalData?: any
) {
  const errorInfo = {
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    additionalData,
    timestamp: new Date().toISOString()
  }

  console.error(`API Error [${context.endpoint}]:`, errorInfo)
}

/**
 * Convert various error types to standardized API error
 */
export function normalizeApiError(error: unknown, context: ApiErrorContext): ApiError {
  // Handle network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createApiError(
      'Unable to connect to external service',
      'SERVICE_UNAVAILABLE',
      503,
      { originalError: error.message }
    )
  }

  // Handle timeout errors
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return createApiError(
      'Request timeout',
      'TIMEOUT',
      408,
      { originalError: error.message }
    )
  }

  // Handle validation errors (from Zod or similar)
  if (error && typeof error === 'object' && 'issues' in error) {
    return createApiError(
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      { validationErrors: error }
    )
  }

  // Handle database errors (Supabase)
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any
    
    switch (dbError.code) {
      case '23505': // Unique constraint violation
        return createApiError(
          'Resource already exists',
          'CONFLICT',
          409,
          { constraint: dbError.constraint }
        )
      case '23503': // Foreign key violation
        return createApiError(
          'Referenced resource not found',
          'NOT_FOUND',
          404,
          { constraint: dbError.constraint }
        )
      case '23502': // Not null violation
        return createApiError(
          'Required field missing',
          'MISSING_REQUIRED_FIELDS',
          400,
          { column: dbError.column }
        )
      default:
        return createApiError(
          'Database operation failed',
          'DATABASE_ERROR',
          500,
          { code: dbError.code, details: dbError.details }
        )
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return createApiError(
      error.message,
      'INTERNAL_ERROR',
      500,
      { originalError: error.message }
    )
  }

  // Handle unknown errors
  return createApiError(
    'An unexpected error occurred',
    'INTERNAL_ERROR',
    500,
    { originalError: error }
  )
}

/**
 * Create error response with proper logging
 */
export function createErrorResponse(
  error: unknown,
  context: ApiErrorContext,
  additionalData?: any
): NextResponse {
  // Log the error
  logApiError(error, context, additionalData)

  // Normalize the error
  const apiError = normalizeApiError(error, context)

  // Create response
  return NextResponse.json(
    {
      success: false,
      error: apiError.message,
      code: apiError.code,
      ...(process.env.NODE_ENV === 'development' && {
        details: apiError.details
      })
    },
    { status: apiError.statusCode }
  )
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  endpoint: string
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as Request
    const context: ApiErrorContext = {
      endpoint,
      method: request.method,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }

    try {
      return await handler(...args)
    } catch (error) {
      return createErrorResponse(error, context)
    }
  }
}

/**
 * Validation helper for required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  )

  if (missingFields.length > 0) {
    throw createApiError(
      `Missing required fields: ${missingFields.join(', ')}`,
      'MISSING_REQUIRED_FIELDS',
      400,
      { missingFields }
    )
  }
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status: statusCode }
  )
}

/**
 * User-friendly error messages for common scenarios
 */
export const USER_FRIENDLY_MESSAGES = {
  [API_ERROR_CODES.SERVICE_UNAVAILABLE]: 'O serviço está temporariamente indisponível. Tente novamente em alguns minutos.',
  [API_ERROR_CODES.RATE_LIMITED]: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
  [API_ERROR_CODES.UNAUTHORIZED]: 'Você não tem permissão para realizar esta ação.',
  [API_ERROR_CODES.FORBIDDEN]: 'Acesso negado.',
  [API_ERROR_CODES.NOT_FOUND]: 'O recurso solicitado não foi encontrado.',
  [API_ERROR_CODES.VALIDATION_ERROR]: 'Os dados fornecidos são inválidos.',
  [API_ERROR_CODES.INTERNAL_ERROR]: 'Ocorreu um erro interno. Tente novamente ou entre em contato com o suporte.'
} as const

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(code: string): string {
  return USER_FRIENDLY_MESSAGES[code as keyof typeof USER_FRIENDLY_MESSAGES] || 
         'Ocorreu um erro inesperado. Tente novamente.'
}