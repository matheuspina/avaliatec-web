/**
 * WhatsApp Business Service Layer
 * 
 * This service provides core business logic for WhatsApp integration,
 * including message processing, contact management, client matching,
 * and auto-reply functionality.
 * 
 * Requirements covered:
 * - 3.1: Process incoming messages from webhook
 * - 3.2: Store messages in Supabase
 * - 3.3: Store/update contact data
 * - 6.3: Replace message variables
 * - 6.4: Support {nome_cliente} variable
 * - 7.1: Verify client with matching phone
 * - 7.2: Associate contact with client
 * - 7.6: Normalize phone numbers
 * - 9.4: Check availability schedule
 * - 9.5: Send auto-reply outside hours
 */

import { createClient } from '@supabase/supabase-js'
import {
  WhatsAppContact,
  WhatsAppMessage,
  WhatsAppInstance,
  WhatsAppInstanceSettings,
  WhatsAppAutoReplyLog,
  WhatsAppQuickMessage,
  Client,
  WebhookData,
  WhatsAppServiceError
} from '@/lib/types'
import { getEvolutionApiClient } from './evolutionApiClient'
import { isWithinAvailability } from './availabilityChecker'
import {
  validatePhoneNumber,
  normalizePhoneNumber,
  sanitizeTextContent
} from '@/lib/utils/security'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * WhatsApp Service Class
 * 
 * Provides business logic for WhatsApp operations including message processing,
 * contact management, client matching, and automated responses.
 */
export class WhatsAppService {
  private evolutionApi = getEvolutionApiClient()

  /**
   * Process incoming message from Evolution API webhook (Requirements 3.1, 3.2, 3.3)
   * 
   * @param webhookData - Data received from Evolution API webhook
   */
  async processIncomingMessage(webhookData: WebhookData): Promise<void> {
    try {
      const { event, instance: instanceName, data } = webhookData

      console.log(`[WEBHOOK] Processing ${event} for instance: ${instanceName}`)
      console.log(`[WEBHOOK] Event data:`, JSON.stringify(data, null, 2))

      // Get instance from database
      const instance = await this.getInstanceByName(instanceName)
      if (!instance) {
        console.error(`[WEBHOOK ERROR] Instance not found in database: ${instanceName}`)
        const availableInstances = await this.listAllInstanceNames()
        console.error('[WEBHOOK ERROR] Available instances in DB:', availableInstances)
        console.error('[WEBHOOK ERROR] Total instances:', availableInstances.length)

        // Don't throw error - just log and return
        // This prevents webhook from failing when instance doesn't exist
        console.warn(`[WEBHOOK] Ignoring event for unknown instance: ${instanceName}`)
        return
      }

      console.log(`[WEBHOOK] Found instance in DB:`, {
        id: instance.id,
        instance_name: instance.instance_name,
        display_name: instance.display_name,
        status: instance.status
      })

      switch (event) {
        case 'MESSAGES_UPSERT':
          await this.handleMessageUpsert(instance, data)
          break
        case 'MESSAGES_UPDATE':
          await this.handleMessageUpdate(instance, data)
          break
        case 'CONNECTION_UPDATE':
          await this.handleConnectionUpdate(instance, data)
          break
        case 'QRCODE_UPDATED':
          await this.handleQRCodeUpdate(instance, data)
          break
        case 'CONTACTS_UPSERT':
          await this.handleContactUpsert(instance, data)
          break
        default:
          console.log(`Unhandled webhook event: ${event}`)
      }
    } catch (error) {
      console.error('Error processing incoming message:', error)
      throw error
    }
  }

  /**
   * Handle MESSAGES_UPSERT event - new message received
   */
  private async handleMessageUpsert(instance: WhatsAppInstance, data: any): Promise<void> {
    if (!data.messages || !Array.isArray(data.messages)) {
      return
    }

    for (const messageData of data.messages) {
      // Skip if message is from us
      if (messageData.key?.fromMe) {
        continue
      }

      // Sync contact first
      const contact = await this.syncContact(instance.id, {
        remoteJid: messageData.key.remoteJid,
        phoneNumber: this.extractPhoneFromJid(messageData.key.remoteJid),
        name: messageData.pushName || null,
        profilePictureUrl: null // Will be updated separately if available
      })

      // Store message
      await this.storeMessage(instance.id, contact.id, messageData)

      // Check for auto-reply
      if (await this.shouldSendAutoReply(instance.id, contact.id)) {
        await this.sendAutoReply(instance.id, contact.id)
      }
    }
  }

  /**
   * Handle MESSAGES_UPDATE event - message status update
   */
  private async handleMessageUpdate(instance: WhatsAppInstance, data: any): Promise<void> {
    if (!data.messages || !Array.isArray(data.messages)) {
      return
    }

    for (const messageData of data.messages) {
      await this.updateMessageStatus(instance.id, messageData)
    }
  }

  /**
   * Handle CONNECTION_UPDATE event - connection status change
   */
  private async handleConnectionUpdate(instance: WhatsAppInstance, data: any): Promise<void> {
    const newStatus = this.mapConnectionStatus(data.state)

    console.log(`CONNECTION_UPDATE for instance ${instance.id}:`, {
      currentStatus: instance.status,
      newStatus,
      state: data.state,
      hasQrCode: !!instance.qr_code
    })

    // Don't change status to 'disconnected' if currently showing QR code
    // This prevents the QR code from disappearing while waiting for user to scan
    if (newStatus === 'disconnected' && instance.status === 'qr_code') {
      console.log(`✓ Ignoring disconnected status for instance ${instance.id} - QR code is still active`)
      // Still update last_seen_at to show the instance is being monitored
      await supabase
        .from('whatsapp_instances')
        .update({
          last_seen_at: new Date().toISOString()
        })
        .eq('id', instance.id)
      return
    }

    // Only update to 'connecting' if we're not already in a better state
    if (newStatus === 'connecting' && (instance.status === 'connected' || instance.status === 'qr_code')) {
      console.log(`✓ Ignoring connecting status for instance ${instance.id} - already in ${instance.status}`)
      return
    }

    console.log(`✓ Updating instance ${instance.id} status from ${instance.status} to ${newStatus}`)

    await supabase
      .from('whatsapp_instances')
      .update({
        status: newStatus,
        connected_at: newStatus === 'connected' ? new Date().toISOString() : null,
        last_seen_at: new Date().toISOString(),
        phone_number: data.instance?.wid ? this.extractPhoneFromJid(data.instance.wid) : null
      })
      .eq('id', instance.id)
  }

  /**
   * Handle QRCODE_UPDATED event - QR code update
   */
  private async handleQRCodeUpdate(instance: WhatsAppInstance, data: any): Promise<void> {
    await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: data.qrcode?.base64 || null,
        qr_code_updated_at: new Date().toISOString(),
        status: 'qr_code'
      })
      .eq('id', instance.id)
  }

  /**
   * Handle CONTACTS_UPSERT event - contact information update
   */
  private async handleContactUpsert(instance: WhatsAppInstance, data: any): Promise<void> {
    if (!data.contacts || !Array.isArray(data.contacts)) {
      return
    }

    for (const contactData of data.contacts) {
      await this.syncContact(instance.id, {
        remoteJid: contactData.id,
        phoneNumber: this.extractPhoneFromJid(contactData.id),
        name: contactData.name || contactData.pushName || null,
        profilePictureUrl: contactData.profilePictureUrl || null
      })
    }
  }

  /**
   * Sync contact data - create or update contact (Requirement 3.3)
   * 
   * @param instanceId - WhatsApp instance ID
   * @param contactData - Contact data to sync
   * @returns Updated or created contact
   */
  async syncContact(instanceId: string, contactData: {
    remoteJid: string
    phoneNumber: string
    name?: string | null
    profilePictureUrl?: string | null
  }): Promise<WhatsAppContact> {
    try {
      // Check if contact already exists
      const { data: existingContact } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('remote_jid', contactData.remoteJid)
        .single()

      const normalizedPhone = this.normalizePhoneNumber(contactData.phoneNumber)

      // Try to match with existing client (Requirements 7.1, 7.2)
      const matchedClient = await this.matchContactWithClient(normalizedPhone)

      const contactUpdate = {
        phone_number: normalizedPhone,
        name: contactData.name || (matchedClient?.name) || existingContact?.name || null,
        profile_picture_url: contactData.profilePictureUrl || existingContact?.profile_picture_url || null,
        client_id: matchedClient?.id || existingContact?.client_id || null,
        contact_type: matchedClient ? 'cliente' : (existingContact?.contact_type || 'unknown'),
        last_message_at: new Date().toISOString()
      }

      if (existingContact) {
        // Update existing contact
        const { data: updatedContact, error } = await supabase
          .from('whatsapp_contacts')
          .update(contactUpdate)
          .eq('id', existingContact.id)
          .select()
          .single()

        if (error) throw error
        return updatedContact
      } else {
        // Create new contact
        const { data: newContact, error } = await supabase
          .from('whatsapp_contacts')
          .insert({
            instance_id: instanceId,
            remote_jid: contactData.remoteJid,
            ...contactUpdate
          })
          .select()
          .single()

        if (error) throw error
        return newContact
      }
    } catch (error) {
      console.error('Error syncing contact:', error)
      throw new WhatsAppServiceError(
        'Failed to sync contact',
        'CONTACT_SYNC_ERROR',
        { contactData, error }
      )
    }
  }

  /**
   * Match contact with existing client by phone number (Requirements 7.1, 7.2, 7.6)
   * 
   * @param phoneNumber - Normalized phone number
   * @returns Matched client or null
   */
  async matchContactWithClient(phoneNumber: string): Promise<Client | null> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber)

      // Search for client with matching phone number
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .ilike('phone', `%${normalizedPhone}%`)

      if (error) throw error

      // Find exact match after normalizing all client phones
      for (const client of clients || []) {
        const clientNormalizedPhone = this.normalizePhoneNumber(client.phone)
        if (clientNormalizedPhone === normalizedPhone) {
          return client
        }
      }

      return null
    } catch (error) {
      console.error('Error matching contact with client:', error)
      return null
    }
  }

  /**
   * Run automatic client matching for all unmatched contacts (Requirements 7.1, 7.2, 7.6, 8.3)
   * This method can be called as a background job or webhook handler
   * 
   * @param instanceId - Optional instance ID to limit matching to specific instance
   * @returns Number of contacts matched
   */
  async runAutomaticClientMatching(instanceId?: string): Promise<number> {
    try {
      console.log('Starting automatic client matching process...')

      // Get all unmatched contacts (client_id is null)
      let query = supabase
        .from('whatsapp_contacts')
        .select('*')
        .is('client_id', null)
        .not('phone_number', 'is', null)
        .not('phone_number', 'eq', '')

      if (instanceId) {
        query = query.eq('instance_id', instanceId)
      }

      const { data: unmatchedContacts, error } = await query

      if (error) {
        throw new WhatsAppServiceError(
          'Failed to fetch unmatched contacts',
          'FETCH_CONTACTS_ERROR',
          { error }
        )
      }

      if (!unmatchedContacts || unmatchedContacts.length === 0) {
        console.log('No unmatched contacts found')
        return 0
      }

      console.log(`Found ${unmatchedContacts.length} unmatched contacts`)
      let matchedCount = 0

      // Process contacts in batches to avoid overwhelming the database
      const batchSize = 10
      for (let i = 0; i < unmatchedContacts.length; i += batchSize) {
        const batch = unmatchedContacts.slice(i, i + batchSize)

        for (const contact of batch) {
          try {
            // Try to match with existing client
            const matchedClient = await this.matchContactWithClient(contact.phone_number)

            if (matchedClient) {
              // Update contact with client association and name
              const updateData: any = {
                client_id: matchedClient.id,
                contact_type: 'cliente'
              }

              // Update contact name from client name if contact doesn't have a name
              if (!contact.name || contact.name.trim() === '') {
                updateData.name = matchedClient.name
              }

              const { error: updateError } = await supabase
                .from('whatsapp_contacts')
                .update(updateData)
                .eq('id', contact.id)

              if (updateError) {
                console.error(`Error updating contact ${contact.id}:`, updateError)
                continue
              }

              matchedCount++
              console.log(`Matched contact ${contact.phone_number} with client ${matchedClient.name}`)
            }
          } catch (contactError) {
            console.error(`Error processing contact ${contact.id}:`, contactError)
            continue
          }
        }

        // Small delay between batches to avoid overwhelming the system
        if (i + batchSize < unmatchedContacts.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`Automatic client matching completed. Matched ${matchedCount} contacts.`)
      return matchedCount
    } catch (error) {
      console.error('Error in automatic client matching:', error)
      throw new WhatsAppServiceError(
        'Failed to run automatic client matching',
        'AUTO_MATCHING_ERROR',
        { error }
      )
    }
  }

  /**
   * Match a specific contact with clients and update if match found (Requirements 7.1, 7.2, 7.6, 8.3)
   * 
   * @param contactId - Contact ID to match
   * @returns true if match found and updated, false otherwise
   */
  async matchSpecificContact(contactId: string): Promise<boolean> {
    try {
      // Get contact details
      const { data: contact, error: contactError } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('id', contactId)
        .single()

      if (contactError || !contact) {
        throw new WhatsAppServiceError(
          'Contact not found',
          'CONTACT_NOT_FOUND',
          { contactId, error: contactError }
        )
      }

      // Skip if already matched
      if (contact.client_id) {
        console.log(`Contact ${contactId} already matched with client`)
        return false
      }

      // Try to match with existing client
      const matchedClient = await this.matchContactWithClient(contact.phone_number)

      if (matchedClient) {
        // Update contact with client association and name
        const updateData: any = {
          client_id: matchedClient.id,
          contact_type: 'cliente'
        }

        // Update contact name from client name if contact doesn't have a name
        if (!contact.name || contact.name.trim() === '') {
          updateData.name = matchedClient.name
        }

        const { error: updateError } = await supabase
          .from('whatsapp_contacts')
          .update(updateData)
          .eq('id', contactId)

        if (updateError) {
          throw new WhatsAppServiceError(
            'Failed to update contact with client match',
            'UPDATE_CONTACT_ERROR',
            { contactId, clientId: matchedClient.id, error: updateError }
          )
        }

        console.log(`Successfully matched contact ${contact.phone_number} with client ${matchedClient.name}`)
        return true
      }

      return false
    } catch (error) {
      console.error(`Error matching specific contact ${contactId}:`, error)
      throw error
    }
  }

  /**
   * Normalize phone number for comparison (Requirement 7.6)
   * 
   * @param phoneNumber - Raw phone number
   * @returns Normalized phone number (digits only)
   */
  normalizePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return ''

    // Use security utility for validation and normalization
    const normalized = normalizePhoneNumber(phoneNumber)
    if (!normalized) {
      console.warn('Invalid phone number format:', phoneNumber)
      return ''
    }

    // Remove the + prefix for internal storage consistency
    return normalized.startsWith('+') ? normalized.substring(1) : normalized
  }

  /**
   * Replace message variables with actual values (Requirements 6.3, 6.4)
   * 
   * @param message - Message text with variables
   * @param contact - Contact data for variable replacement
   * @returns Message with variables replaced
   */
  async replaceMessageVariables(message: string, contact: WhatsAppContact): Promise<string> {
    if (!message) return message

    // Sanitize the input message first
    let processedMessage = sanitizeTextContent(message)

    // Replace {nome_cliente} variable (Requirement 6.4)
    const clientName = await this.getClientNameForContact(contact)
    const sanitizedClientName = sanitizeTextContent(clientName || contact.name || 'Cliente')
    processedMessage = processedMessage.replace(
      /\{nome_cliente\}/g,
      sanitizedClientName
    )

    // Add more variables as needed
    const sanitizedContactName = sanitizeTextContent(contact.name || 'Contato')
    processedMessage = processedMessage.replace(
      /\{nome_contato\}/g,
      sanitizedContactName
    )

    const sanitizedPhone = sanitizeTextContent(contact.phone_number || '')
    processedMessage = processedMessage.replace(
      /\{telefone\}/g,
      sanitizedPhone
    )

    return processedMessage
  }

  /**
   * Check if auto-reply should be sent (Requirement 9.4)
   * 
   * @param instanceId - WhatsApp instance ID
   * @param contactId - Contact ID
   * @returns true if auto-reply should be sent
   */
  async shouldSendAutoReply(instanceId: string, contactId: string): Promise<boolean> {
    try {
      // Get instance settings
      const settings = await this.getInstanceSettings(instanceId)

      if (!settings?.auto_reply_enabled || !settings.auto_reply_message) {
        return false
      }

      // Check if within availability hours
      const isAvailable = isWithinAvailability(settings.availability_schedule)
      if (isAvailable) {
        return false // Don't send auto-reply during available hours
      }

      // Check if we already sent auto-reply recently (within last 4 hours)
      const fourHoursAgo = new Date()
      fourHoursAgo.setHours(fourHoursAgo.getHours() - 4)

      const { data: recentReply } = await supabase
        .from('whatsapp_auto_reply_log')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('contact_id', contactId)
        .gte('sent_at', fourHoursAgo.toISOString())
        .order('sent_at', { ascending: false })
        .limit(1)
        .single()

      return !recentReply // Send auto-reply if no recent reply found
    } catch (error) {
      console.error('Error checking auto-reply conditions:', error)
      return false
    }
  }

  /**
   * Send auto-reply message (Requirement 9.5)
   * 
   * @param instanceId - WhatsApp instance ID
   * @param contactId - Contact ID
   */
  async sendAutoReply(instanceId: string, contactId: string): Promise<void> {
    try {
      // Get instance and settings
      const [instance, settings, contact] = await Promise.all([
        this.getInstanceById(instanceId),
        this.getInstanceSettings(instanceId),
        this.getContactById(contactId)
      ])

      if (!instance || !settings || !contact || !settings.auto_reply_message) {
        return
      }

      // Replace variables in auto-reply message
      const processedMessage = await this.replaceMessageVariables(
        settings.auto_reply_message,
        contact
      )

      // Send message via Evolution API
      await this.evolutionApi.sendTextMessage(instance.instance_name, {
        number: contact.remote_jid,
        text: processedMessage
      })

      // Log auto-reply
      await supabase
        .from('whatsapp_auto_reply_log')
        .insert({
          instance_id: instanceId,
          contact_id: contactId,
          message_sent: processedMessage
        })

      console.log(`Auto-reply sent to ${contact.phone_number}`)
    } catch (error) {
      console.error('Error sending auto-reply:', error)
      throw new WhatsAppServiceError(
        'Failed to send auto-reply',
        'AUTO_REPLY_ERROR',
        { instanceId, contactId, error }
      )
    }
  }

  /**
   * Store incoming message in database
   */
  private async storeMessage(instanceId: string, contactId: string, messageData: any): Promise<void> {
    try {
      const messageType = this.determineMessageType(messageData)
      const textContent = this.extractTextContent(messageData)
      const mediaInfo = this.extractMediaInfo(messageData)

      await supabase
        .from('whatsapp_messages')
        .insert({
          instance_id: instanceId,
          contact_id: contactId,
          message_id: messageData.key.id,
          remote_jid: messageData.key.remoteJid,
          from_me: messageData.key.fromMe || false,
          message_type: messageType,
          text_content: textContent,
          media_url: mediaInfo.url,
          media_mime_type: mediaInfo.mimeType,
          media_size: mediaInfo.size,
          media_filename: mediaInfo.filename,
          quoted_message_id: messageData.message?.extendedTextMessage?.contextInfo?.quotedMessage?.key?.id || null,
          status: 'received',
          timestamp: new Date(messageData.messageTimestamp * 1000).toISOString()
        })
    } catch (error) {
      console.error('Error storing message:', error)
      throw error
    }
  }

  /**
   * Update message status
   */
  private async updateMessageStatus(instanceId: string, messageData: any): Promise<void> {
    try {
      const status = this.mapMessageStatus(messageData.update?.status)

      if (status) {
        await supabase
          .from('whatsapp_messages')
          .update({ status })
          .eq('instance_id', instanceId)
          .eq('message_id', messageData.key.id)
      }
    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  /**
   * Helper methods
   */

  private async getInstanceByName(instanceName: string): Promise<WhatsAppInstance | null> {
    const { data } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instanceName)
      .single()

    return data
  }

  private async getInstanceById(instanceId: string): Promise<WhatsAppInstance | null> {
    const { data } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single()

    return data
  }

  private async listAllInstanceNames(): Promise<string[]> {
    const { data } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .order('created_at', { ascending: false })
      .limit(10)

    return data?.map(i => i.instance_name) || []
  }

  private async getInstanceSettings(instanceId: string): Promise<WhatsAppInstanceSettings | null> {
    const { data } = await supabase
      .from('whatsapp_instance_settings')
      .select('*')
      .eq('instance_id', instanceId)
      .single()

    return data
  }

  private async getContactById(contactId: string): Promise<WhatsAppContact | null> {
    const { data } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    return data
  }

  private async getClientNameForContact(contact: WhatsAppContact): Promise<string | null> {
    if (!contact.client_id) return null

    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', contact.client_id)
      .single()

    return client?.name || null
  }

  private extractPhoneFromJid(jid: string): string {
    // Extract phone number from JID format (e.g., "5511999999999@s.whatsapp.net")
    return jid.split('@')[0] || jid
  }

  private mapConnectionStatus(state: string): WhatsAppInstance['status'] {
    switch (state) {
      case 'open': return 'connected'
      case 'connecting': return 'connecting'
      case 'close': return 'disconnected'
      default: return 'disconnected'
    }
  }

  private determineMessageType(messageData: any): WhatsAppMessage['message_type'] {
    const message = messageData.message

    if (message?.conversation || message?.extendedTextMessage) return 'text'
    if (message?.audioMessage) return 'audio'
    if (message?.imageMessage) return 'image'
    if (message?.videoMessage) return 'video'
    if (message?.documentMessage) return 'document'
    if (message?.stickerMessage) return 'sticker'
    if (message?.locationMessage) return 'location'
    if (message?.contactMessage) return 'contact'

    return 'other'
  }

  private extractTextContent(messageData: any): string | null {
    const message = messageData.message

    if (message?.conversation) {
      return message.conversation
    }

    if (message?.extendedTextMessage?.text) {
      return message.extendedTextMessage.text
    }

    return null
  }

  private extractMediaInfo(messageData: any): {
    url: string | null
    mimeType: string | null
    size: number | null
    filename: string | null
  } {
    const message = messageData.message

    // Check different message types for media
    const mediaMessage =
      message?.audioMessage ||
      message?.imageMessage ||
      message?.videoMessage ||
      message?.documentMessage

    if (mediaMessage) {
      return {
        url: mediaMessage.url || null,
        mimeType: mediaMessage.mimetype || null,
        size: mediaMessage.fileLength || null,
        filename: mediaMessage.fileName || null
      }
    }

    return {
      url: null,
      mimeType: null,
      size: null,
      filename: null
    }
  }

  private mapMessageStatus(status: number): WhatsAppMessage['status'] | null {
    switch (status) {
      case 1: return 'sent'
      case 2: return 'delivered'
      case 3: return 'read'
      default: return null
    }
  }
}

// Export singleton instance
let whatsappServiceInstance: WhatsAppService | null = null

/**
 * Get the WhatsApp service singleton instance
 */
export function getWhatsAppService(): WhatsAppService {
  if (!whatsappServiceInstance) {
    whatsappServiceInstance = new WhatsAppService()
  }
  return whatsappServiceInstance
}

/**
 * Create a new WhatsApp service instance
 */
export function createWhatsAppService(): WhatsAppService {
  return new WhatsAppService()
}