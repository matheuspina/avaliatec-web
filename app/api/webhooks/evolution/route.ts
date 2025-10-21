/**
 * Evolution API Webhook Handler
 * 
 * This endpoint receives webhook events from the Evolution API and processes them
 * to update the local database and handle real-time WhatsApp events.
 * 
 * Requirements covered:
 * - 3.1: Process incoming messages from webhook
 * - 3.2: Store messages in Supabase
 * - 3.3: Store/update contact data
 * - 3.6: Process message status updates
 * - 12.1: Expose webhook endpoint at /api/webhooks/evolution
 * - 12.2: Validate webhook origin/signature
 * - 12.3: Process MESSAGES_UPSERT events
 * - 12.4: Process CONNECTION_UPDATE events
 * - 12.5: Process QRCODE_UPDATED events
 * - 12.6: Process CONTACTS_UPSERT events
 * - 12.7: Respond within 5 seconds
 * - 12.8: Log errors without blocking response
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppService } from '@/lib/services/whatsappService'
import { WebhookData } from '@/lib/types'
import { validateWebhookSignature, addSecurityHeaders } from '@/lib/utils/security'

// Idempotency tracking to prevent duplicate processing
const processedEvents = new Map<string, number>()
const IDEMPOTENCY_TTL = 5 * 60 * 1000 // 5 minutes

function isEventProcessed(eventId: string): boolean {
  const timestamp = processedEvents.get(eventId)
  if (!timestamp) {
    return false
  }
  
  // Check if event is still within TTL
  if (Date.now() - timestamp > IDEMPOTENCY_TTL) {
    processedEvents.delete(eventId)
    return false
  }
  
  return true
}

function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now())
  
  // Clean up old entries periodically
  if (processedEvents.size > 1000) {
    const cutoff = Date.now() - IDEMPOTENCY_TTL
    for (const [id, timestamp] of processedEvents.entries()) {
      if (timestamp < cutoff) {
        processedEvents.delete(id)
      }
    }
  }
}

/**
 * POST /api/webhooks/evolution
 * 
 * Handles webhook events from Evolution API
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse request body
    const body = await request.text()
    let webhookData: WebhookData
    
    try {
      webhookData = JSON.parse(body)
    } catch (error) {
      console.error('Invalid JSON in webhook payload:', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!webhookData.event || !webhookData.instance || !webhookData.data) {
      console.error('Missing required fields in webhook payload:', {
        event: !!webhookData.event,
        instance: !!webhookData.instance,
        data: !!webhookData.data
      })
      return NextResponse.json(
        { error: 'Missing required fields: event, instance, data' },
        { status: 400 }
      )
    }

    // Validate webhook signature if secret is configured (Requirement 12.2)
    const signature = request.headers.get('x-signature-256') || 
                     request.headers.get('x-hub-signature-256')
    const webhookSecret = process.env.WEBHOOK_SECRET
    
    if (webhookSecret && !validateWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Create unique event ID for idempotency
    const eventId = `${webhookData.instance}-${webhookData.event}-${webhookData.date_time || Date.now()}`
    
    // Check if event was already processed (idempotency)
    if (isEventProcessed(eventId)) {
      console.log(`Event already processed: ${eventId}`)
      return NextResponse.json({ status: 'already_processed' })
    }

    // Mark event as being processed
    markEventProcessed(eventId)

    // Log incoming webhook for debugging
    console.log(`Webhook received: ${webhookData.event} from instance ${webhookData.instance}`)

    // Process webhook based on event type
    const whatsappService = getWhatsAppService()
    
    try {
      switch (webhookData.event) {
        case 'MESSAGES_UPSERT':
          // Process incoming messages (Requirements 12.3, 3.1, 3.2, 3.3)
          await whatsappService.processIncomingMessage(webhookData)
          console.log(`Processed MESSAGES_UPSERT for instance ${webhookData.instance}`)
          break

        case 'MESSAGES_UPDATE':
          // Process message status updates (Requirement 3.6)
          await whatsappService.processIncomingMessage(webhookData)
          console.log(`Processed MESSAGES_UPDATE for instance ${webhookData.instance}`)
          break

        case 'CONNECTION_UPDATE':
          // Process connection status changes (Requirement 12.4)
          await whatsappService.processIncomingMessage(webhookData)
          console.log(`Processed CONNECTION_UPDATE for instance ${webhookData.instance}`)
          break

        case 'QRCODE_UPDATED':
          // Process QR code updates (Requirement 12.5)
          await whatsappService.processIncomingMessage(webhookData)
          console.log(`Processed QRCODE_UPDATED for instance ${webhookData.instance}`)
          break

        case 'CONTACTS_UPSERT':
          // Process contact updates (Requirement 12.6)
          await whatsappService.processIncomingMessage(webhookData)
          console.log(`Processed CONTACTS_UPSERT for instance ${webhookData.instance}`)
          
          // Trigger automatic client matching for new contacts
          try {
            const { matchSingleContact } = await import('@/lib/services/clientMatchingJob')
            // Note: In a real implementation, you might want to queue this for background processing
            // For now, we'll run it inline but with error handling to not block the webhook
            if (webhookData.data?.contacts && Array.isArray(webhookData.data.contacts)) {
              for (const contactData of webhookData.data.contacts) {
                // This would need the contact ID, which we'd need to get from the database
                // after the contact is created. For now, we'll skip this inline processing
                // and rely on the background job to catch unmatched contacts
              }
            }
          } catch (matchingError) {
            // Log but don't fail the webhook
            console.error('Error in automatic client matching:', matchingError)
          }
          break

        default:
          // Log unhandled events but don't fail
          console.log(`Unhandled webhook event: ${webhookData.event} from instance ${webhookData.instance}`)
          break
      }

      // Check processing time (Requirement 12.7)
      const processingTime = Date.now() - startTime
      if (processingTime > 4000) { // Warn if close to 5 second limit
        console.warn(`Webhook processing took ${processingTime}ms for event ${webhookData.event}`)
      }

      const response = NextResponse.json({ 
        status: 'success',
        event: webhookData.event,
        instance: webhookData.instance,
        processingTime: processingTime
      })
      
      return addSecurityHeaders(response)

    } catch (processingError) {
      // Log processing errors but don't fail the webhook (Requirement 12.8)
      console.error(`Error processing webhook event ${webhookData.event}:`, {
        error: processingError instanceof Error ? {
          message: processingError.message,
          stack: processingError.stack,
          name: processingError.name
        } : processingError,
        instance: webhookData.instance,
        event: webhookData.event,
        processingTime: Date.now() - startTime,
        webhookData: {
          event: webhookData.event,
          instance: webhookData.instance,
          dataKeys: Object.keys(webhookData.data || {})
        }
      })

      // Still return success to prevent Evolution API retries
      const response = NextResponse.json({ 
        status: 'error_logged',
        event: webhookData.event,
        instance: webhookData.instance,
        error: processingError instanceof Error ? processingError.message : 'Unknown error',
        processingTime: Date.now() - startTime
      })
      
      return addSecurityHeaders(response)
    }

  } catch (error) {
    // Log critical errors (Requirement 12.8)
    console.error('Critical webhook error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type')
    })

    // Return success to prevent retries even on critical errors
    const response = NextResponse.json({ 
      status: 'critical_error_logged',
      error: error instanceof Error ? error.message : 'Critical error occurred',
      processingTime: Date.now() - startTime
    })
    
    return addSecurityHeaders(response)
  }
}

/**
 * GET /api/webhooks/evolution
 * 
 * Health check endpoint for webhook
 */
export async function GET() {
  const response = NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'evolution-webhook'
  })
  
  return addSecurityHeaders(response)
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}