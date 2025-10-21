import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { getEvolutionApiClient } from '@/lib/services/evolutionApiClient'
import { getWhatsAppService } from '@/lib/services/whatsappService'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  validateRequiredFields,
  API_ERROR_CODES,
  createApiError
} from '@/lib/utils/api-error-handler'
import { 
  messageRateLimiter, 
  validateMessageContent, 
  addSecurityHeaders 
} from '@/lib/utils/security'
import type { WhatsAppMessage } from '@/lib/types'

/**
 * API Route for WhatsApp Messages Management
 * 
 * GET /api/whatsapp/messages - Get message history with pagination
 * POST /api/whatsapp/messages - Send text or audio message
 * 
 * Requirements covered:
 * - 4.1: Send text messages
 * - 4.2: Send audio messages  
 * - 4.3: Store sent messages immediately
 * - 4.4: Mark messages as sent by user (fromMe: true)
 * - 4.5: Show sending indicator
 * - 4.6: Handle send failures with retry
 * - 5.1: Load messages for selected contact
 * - 5.2: Display messages chronologically
 * - 5.3: Differentiate sent vs received messages
 * - 5.4: Display message timestamps
 * - 5.5: Support audio message playback
 * - 5.6: Implement pagination for performance
 */

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'atendimento', async (userId, authUserId) => {
    // Get query parameters outside try block for error handling
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // cursor for pagination
    
    try {
      const supabase = await createClient()
      
      // Validate required parameters
      if (!contactId) {
        throw createApiError(
          'Contact ID is required',
          'MISSING_REQUIRED_FIELDS',
          400,
          { missingFields: ['contactId'] }
        )
      }

      // Validate limit
      if (limit < 1 || limit > 100) {
        throw createApiError(
          'Limit must be between 1 and 100',
          'INVALID_INPUT',
          400,
          { field: 'limit', value: limit, validRange: '1-100' }
        )
      }

      // Verify contact exists and get instance info
      const { data: contact, error: contactError } = await supabase
        .from('whatsapp_contacts')
        .select(`
          id,
          instance_id,
          remote_jid,
          whatsapp_instances!inner(id, created_by)
        `)
        .eq('id', contactId)
        .single()

      if (contactError || !contact) {
        throw createApiError(
          'Contact not found',
          'CONTACT_NOT_FOUND',
          404,
          { contactId, error: contactError }
        )
      }

      // Build query for messages with optimized cursor-based pagination
      let query = supabase
        .from('whatsapp_messages')
        .select(`
          id,
          message_id,
          from_me,
          message_type,
          text_content,
          media_url,
          media_mime_type,
          media_size,
          media_filename,
          quoted_message_id,
          status,
          timestamp,
          created_at
        `)
        .eq('contact_id', contactId)
        .order('timestamp', { ascending: false })
        .limit(limit + 1) // Get one extra to check if there are more

      // Apply cursor pagination with timestamp
      if (before) {
        // Parse cursor - it should be a timestamp
        const cursorDate = new Date(before)
        if (isNaN(cursorDate.getTime())) {
          throw createApiError(
            'Invalid cursor format',
            'INVALID_INPUT',
            400,
            { cursor: before }
          )
        }
        query = query.lt('timestamp', before)
      }

      const { data: messages, error: messagesError } = await query

      if (messagesError) {
        throw createApiError(
          'Failed to fetch messages',
          'DATABASE_ERROR',
          500,
          { contactId, error: messagesError }
        )
      }

      // Check if there are more messages (pagination)
      const hasMore = messages.length > limit
      const messagesToReturn = hasMore ? messages.slice(0, limit) : messages
      const nextCursor = hasMore ? messagesToReturn[messagesToReturn.length - 1]?.timestamp : null

      // Reverse to show chronological order (oldest first)
      const chronologicalMessages = messagesToReturn.reverse()

      // Add pagination metadata
      const paginationInfo = {
        hasMore,
        nextCursor,
        totalReturned: messagesToReturn.length,
        requestedLimit: limit
      }

      return createSuccessResponse({
        messages: chronologicalMessages,
        pagination: paginationInfo
      })

    } catch (error) {
      return createErrorResponse(error, {
        endpoint: '/api/whatsapp/messages',
        method: 'GET',
        userId,
        timestamp: new Date().toISOString()
      }, { contactId, limit, before })
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'atendimento', async (userId, authUserId) => {
    // Parse body outside try block for error handling
    const body = await request.json()
    
    try {
      const supabase = await createClient()
      
      // Validate required fields
      const { instanceId, contactId, messageType, textContent, audioUrl, quotedMessageId } = body
      
      validateRequiredFields(body, ['instanceId', 'contactId', 'messageType'])

      if (!['text', 'audio'].includes(messageType)) {
        throw createApiError(
          'Message type must be text or audio',
          'INVALID_INPUT',
          400,
          { field: 'messageType', value: messageType, validValues: ['text', 'audio'] }
        )
      }

      if (messageType === 'text' && !textContent) {
        throw createApiError(
          'Text content is required for text messages',
          'MISSING_REQUIRED_FIELDS',
          400,
          { missingFields: ['textContent'] }
        )
      }

      if (messageType === 'audio' && !audioUrl) {
        throw createApiError(
          'Audio URL is required for audio messages',
          'MISSING_REQUIRED_FIELDS',
          400,
          { missingFields: ['audioUrl'] }
        )
      }

      // Rate limiting check (Requirement: 1 msg/sec per instance)
      if (!messageRateLimiter.canSendMessage(instanceId)) {
        const resetTime = messageRateLimiter.getResetTime(instanceId)
        throw createApiError(
          'Rate limit exceeded. Please wait before sending another message.',
          'SERVICE_UNAVAILABLE',
          429,
          { 
            resetTimeMs: resetTime,
            resetTimeSeconds: Math.ceil(resetTime / 1000),
            limit: '1 message per second per instance'
          }
        )
      }

      // Validate and sanitize message content
      if (messageType === 'text' && textContent) {
        const validation = validateMessageContent(textContent, 'text')
        if (!validation.isValid) {
          throw createApiError(
            'Invalid message content',
            'VALIDATION_ERROR',
            400,
            { errors: validation.errors }
          )
        }
        // Use sanitized content
        body.textContent = validation.sanitizedContent
      }

      // Get instance and contact information
      const [instanceResult, contactResult] = await Promise.all([
        supabase
          .from('whatsapp_instances')
          .select('id, instance_name, status')
          .eq('id', instanceId)
          .single(),
        supabase
          .from('whatsapp_contacts')
          .select('id, remote_jid, instance_id')
          .eq('id', contactId)
          .single()
      ])

      if (instanceResult.error || !instanceResult.data) {
        throw createApiError(
          'Instance not found',
          'INSTANCE_NOT_FOUND',
          404,
          { instanceId, error: instanceResult.error }
        )
      }

      if (contactResult.error || !contactResult.data) {
        throw createApiError(
          'Contact not found',
          'CONTACT_NOT_FOUND',
          404,
          { contactId, error: contactResult.error }
        )
      }

      const instance = instanceResult.data
      const contact = contactResult.data

      // Verify contact belongs to instance
      if (contact.instance_id !== instanceId) {
        throw createApiError(
          'Contact does not belong to specified instance',
          'INVALID_INPUT',
          400,
          { contactId, instanceId, contactInstanceId: contact.instance_id }
        )
      }

      // Check if instance is connected
      if (instance.status !== 'connected') {
        throw createApiError(
          'Instance is not connected',
          'INSTANCE_NOT_CONNECTED',
          400,
          { instanceId, status: instance.status }
        )
      }

      // Process quick message variables if text message
      let processedTextContent = body.textContent // Use sanitized content
      if (messageType === 'text' && processedTextContent) {
        const whatsappService = getWhatsAppService()
        const contactData = await supabase
          .from('whatsapp_contacts')
          .select('*')
          .eq('id', contactId)
          .single()
        
        if (contactData.data) {
          processedTextContent = await whatsappService.replaceMessageVariables(processedTextContent, contactData.data)
        }
      }

      // Prepare message data for Evolution API
      const evolutionApi = getEvolutionApiClient()
      let messageResponse
      let quotedData = undefined

      // Handle quoted message if provided
      if (quotedMessageId) {
        const { data: quotedMessage } = await supabase
          .from('whatsapp_messages')
          .select('message_id, remote_jid, from_me')
          .eq('id', quotedMessageId)
          .single()

        if (quotedMessage) {
          quotedData = {
            key: {
              remoteJid: quotedMessage.remote_jid,
              fromMe: quotedMessage.from_me,
              id: quotedMessage.message_id
            }
          }
        }
      }

      // Store message in database first with pending status (Requirement 4.3)
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const timestamp = new Date().toISOString()

      const { data: storedMessage, error: storeError } = await supabase
        .from('whatsapp_messages')
        .insert({
          instance_id: instanceId,
          contact_id: contactId,
          message_id: messageId,
          remote_jid: contact.remote_jid,
          from_me: true, // Requirement 4.4
          message_type: messageType,
          text_content: messageType === 'text' ? processedTextContent : null,
          media_url: messageType === 'audio' ? audioUrl : null,
          media_mime_type: messageType === 'audio' ? 'audio/ogg' : null,
          quoted_message_id: quotedMessageId || null,
          status: 'pending', // Requirement 4.5
          timestamp
        })
        .select()
        .single()

      if (storeError) {
        throw createApiError(
          'Failed to store message',
          'DATABASE_ERROR',
          500,
          { error: storeError, messageData: { instanceId, contactId, messageType } }
        )
      }

      try {
        // Send message via Evolution API
        if (messageType === 'text') {
          messageResponse = await evolutionApi.sendTextMessage(instance.instance_name, {
            number: contact.remote_jid,
            text: processedTextContent,
            quoted: quotedData
          })
        } else if (messageType === 'audio') {
          messageResponse = await evolutionApi.sendWhatsAppAudio(instance.instance_name, {
            number: contact.remote_jid,
            audio: audioUrl,
            quoted: quotedData
          })
        }

        if (!messageResponse) {
          throw new Error('No response received from Evolution API')
        }

        // Update message with Evolution API response
        const { error: updateError } = await supabase
          .from('whatsapp_messages')
          .update({
            message_id: messageResponse.key.id,
            status: 'sent'
          })
          .eq('id', storedMessage.id)

        if (updateError) {
          console.error('Error updating message status:', updateError)
        }

        // Update contact's last message timestamp
        await supabase
          .from('whatsapp_contacts')
          .update({ last_message_at: timestamp })
          .eq('id', contactId)

        return createSuccessResponse({
          message: {
            id: storedMessage.id,
            messageId: messageResponse.key.id,
            status: 'sent',
            timestamp,
            fromMe: true,
            messageType,
            textContent: messageType === 'text' ? processedTextContent : null,
            mediaUrl: messageType === 'audio' ? audioUrl : null
          }
        }, 'Message sent successfully')

      } catch (evolutionError) {
        console.error('Error sending message via Evolution API:', evolutionError)
        
        // Update message status to failed (Requirement 4.6)
        await supabase
          .from('whatsapp_messages')
          .update({ status: 'failed' })
          .eq('id', storedMessage.id)

        throw createApiError(
          'Failed to send message',
          'MESSAGE_SEND_FAILED',
          500,
          { 
            originalError: evolutionError instanceof Error ? evolutionError.message : 'Unknown error',
            messageId: storedMessage.id,
            retryable: true
          }
        )
      }

    } catch (error) {
      return createErrorResponse(error, {
        endpoint: '/api/whatsapp/messages',
        method: 'POST',
        userId,
        timestamp: new Date().toISOString()
      }, { instanceId: body?.instanceId, contactId: body?.contactId, messageType: body?.messageType })
    }
  })
}