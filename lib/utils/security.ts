/**
 * Security utilities for WhatsApp feature
 * 
 * This module provides security functions including:
 * - Input sanitization
 * - Phone number validation
 * - Rate limiting
 * - Content validation
 */

import crypto from 'crypto'

/**
 * Phone number validation regex
 * Supports international formats with country codes
 */
const PHONE_NUMBER_REGEX = /^(\+?[1-9]\d{1,14})$/

/**
 * Sanitizes text content to prevent XSS and injection attacks
 * 
 * @param input - The text content to sanitize
 * @returns Sanitized text content
 */
export function sanitizeTextContent(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove null bytes and control characters except newlines and tabs
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Limit length to prevent abuse (WhatsApp has a 4096 character limit)
  sanitized = sanitized.substring(0, 4096)
  
  // Remove potentially dangerous HTML/script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
  
  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/data:/gi, '')
  
  return sanitized.trim()
}

/**
 * Validates phone number format
 * 
 * @param phoneNumber - The phone number to validate
 * @returns True if valid, false otherwise
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  if (typeof phoneNumber !== 'string') {
    return false
  }

  // Remove common formatting characters
  const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '')
  
  // Check against regex
  return PHONE_NUMBER_REGEX.test(cleaned)
}

/**
 * Normalizes phone number for consistent storage and comparison
 * 
 * @param phoneNumber - The phone number to normalize
 * @returns Normalized phone number or null if invalid
 */
export function normalizePhoneNumber(phoneNumber: string): string | null {
  if (!validatePhoneNumber(phoneNumber)) {
    return null
  }

  // Remove all formatting
  let normalized = phoneNumber.replace(/[\s\-\(\)\.]/g, '')
  
  // Ensure it starts with + for international format
  if (!normalized.startsWith('+')) {
    // If it starts with 00, replace with +
    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.substring(2)
    } else {
      // Assume it's a Brazilian number if no country code
      normalized = '+55' + normalized
    }
  }
  
  return normalized
}

/**
 * Rate limiter for message sending
 * Uses in-memory storage with TTL cleanup
 */
class MessageRateLimiter {
  private limits = new Map<string, { count: number; resetTime: number }>()
  private readonly maxMessages = 1 // 1 message per second per instance
  private readonly windowMs = 1000 // 1 second window

  /**
   * Checks if a message can be sent for the given instance
   * 
   * @param instanceId - The WhatsApp instance ID
   * @returns True if message can be sent, false if rate limited
   */
  canSendMessage(instanceId: string): boolean {
    const now = Date.now()
    const key = `msg_${instanceId}`
    const limit = this.limits.get(key)

    if (!limit || now >= limit.resetTime) {
      // Reset or create new limit
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (limit.count >= this.maxMessages) {
      return false
    }

    // Increment count
    limit.count++
    this.limits.set(key, limit)
    return true
  }

  /**
   * Gets remaining time until rate limit resets
   * 
   * @param instanceId - The WhatsApp instance ID
   * @returns Milliseconds until reset, or 0 if not rate limited
   */
  getResetTime(instanceId: string): number {
    const key = `msg_${instanceId}`
    const limit = this.limits.get(key)
    
    if (!limit) {
      return 0
    }

    const now = Date.now()
    return Math.max(0, limit.resetTime - now)
  }

  /**
   * Cleanup expired entries (called periodically)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, limit] of this.limits.entries()) {
      if (now >= limit.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

// Global rate limiter instance
export const messageRateLimiter = new MessageRateLimiter()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  messageRateLimiter.cleanup()
}, 5 * 60 * 1000)

/**
 * Validates webhook signature using HMAC-SHA256
 * 
 * @param payload - The raw webhook payload
 * @param signature - The signature from webhook headers
 * @param secret - The webhook secret
 * @returns True if signature is valid, false otherwise
 */
export function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    const providedSignature = signature.replace('sha256=', '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

/**
 * Validates message content for security and compliance
 * 
 * @param content - The message content to validate
 * @param messageType - The type of message (text, audio, etc.)
 * @returns Validation result with sanitized content
 */
export function validateMessageContent(
  content: string,
  messageType: 'text' | 'audio' | 'image' | 'video' | 'document'
): { isValid: boolean; sanitizedContent: string; errors: string[] } {
  const errors: string[] = []
  let sanitizedContent = content

  if (messageType === 'text') {
    // Sanitize text content
    sanitizedContent = sanitizeTextContent(content)
    
    // Check for empty content after sanitization
    if (!sanitizedContent || sanitizedContent.length === 0) {
      errors.push('Message content cannot be empty')
    }
    
    // Check for excessive length
    if (sanitizedContent.length > 4096) {
      errors.push('Message content exceeds maximum length of 4096 characters')
    }
    
    // Check for suspicious patterns (basic spam detection)
    const suspiciousPatterns = [
      /(.)\1{50,}/g, // Repeated characters (50+ times)
      /https?:\/\/[^\s]+/gi // URLs (could be made configurable)
    ]
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitizedContent)) {
        // Don't block, just log for monitoring
        console.warn('Suspicious message pattern detected:', {
          pattern: pattern.source,
          contentLength: sanitizedContent.length
        })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedContent,
    errors
  }
}

/**
 * Validates shortcut format for quick messages
 * 
 * @param shortcut - The shortcut to validate
 * @returns True if valid, false otherwise
 */
export function validateQuickMessageShortcut(shortcut: string): boolean {
  if (typeof shortcut !== 'string') {
    return false
  }

  // Must start with /
  if (!shortcut.startsWith('/')) {
    return false
  }

  // Must be between 2 and 20 characters
  if (shortcut.length < 2 || shortcut.length > 20) {
    return false
  }

  // Can only contain letters, numbers, and underscores after the /
  const pattern = /^\/[a-zA-Z0-9_]+$/
  return pattern.test(shortcut)
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
} as const

/**
 * Adds security headers to a NextResponse
 * 
 * @param response - The NextResponse to add headers to
 * @returns The response with security headers added
 */
export function addSecurityHeaders(response: Response): Response {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}