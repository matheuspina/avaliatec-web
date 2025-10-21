import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { addSecurityHeaders, sanitizeTextContent } from '@/lib/utils/security'
import type { WhatsAppContact } from '@/lib/types'

/**
 * API Route for WhatsApp Contacts Management
 * 
 * GET /api/whatsapp/contacts - List contacts with filtering and search
 * 
 * Query Parameters:
 * - instanceId: string (required) - Filter by WhatsApp instance
 * - type: string (optional) - Filter by contact type (cliente, lead, profissional, prestador, unknown)
 * - search: string (optional) - Search by name or phone number
 * 
 * Requirements covered:
 * - 7.1: List contacts for instance
 * - 7.3: Display contact information
 * - 8.1: Filter by contact type
 * - 8.4: Display contact type indicators
 * - 8.5: Filter conversations by type
 */

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'atendimento', async (userId, authUserId) => {
    try {
      const supabase = await createClient()
      const { searchParams } = new URL(request.url)
      
      // Get query parameters
      const instanceId = searchParams.get('instanceId')
      const contactType = searchParams.get('type')
      const searchQuery = searchParams.get('search')

      // Validate required parameters
      if (!instanceId) {
        return NextResponse.json(
          { error: 'Instance ID is required', code: 'MISSING_INSTANCE_ID' },
          { status: 400 }
        )
      }

      // Verify instance exists and user has access
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('id', instanceId)
        .single()

      if (instanceError || !instance) {
        return NextResponse.json(
          { error: 'Instance not found', code: 'INSTANCE_NOT_FOUND' },
          { status: 404 }
        )
      }

      // Build optimized query for contacts with proper joins
      let query = supabase
        .from('whatsapp_contacts')
        .select(`
          id,
          remote_jid,
          phone_number,
          name,
          profile_picture_url,
          contact_type,
          client_id,
          last_message_at,
          created_at,
          updated_at,
          clients!left(id, name)
        `)
        .eq('instance_id', instanceId)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      // Apply contact type filter
      if (contactType && ['cliente', 'lead', 'profissional', 'prestador', 'unknown'].includes(contactType)) {
        query = query.eq('contact_type', contactType)
      }

      // Apply search filter with sanitization
      if (searchQuery && searchQuery.trim()) {
        const sanitizedSearchTerm = sanitizeTextContent(searchQuery.trim())
        if (sanitizedSearchTerm) {
          query = query.or(`name.ilike.%${sanitizedSearchTerm}%,phone_number.ilike.%${sanitizedSearchTerm}%`)
        }
      }

      const { data: contacts, error: contactsError } = await query

      if (contactsError) {
        console.error('Error fetching WhatsApp contacts:', contactsError)
        return NextResponse.json(
          { error: 'Failed to fetch contacts', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      // Get unread message counts using optimized query
      const contactIds = contacts.map(contact => contact.id)
      let unreadCounts: { [contactId: string]: number } = {}

      // Note: Unread counts calculation is simplified for now
      // In a production environment, this would be calculated using a database view or function

      // Transform contacts data
      const transformedContacts = contacts.map((contact: any) => ({
        id: contact.id,
        remoteJid: contact.remote_jid,
        phoneNumber: contact.phone_number,
        name: contact.name,
        profilePictureUrl: contact.profile_picture_url,
        contactType: contact.contact_type,
        clientId: contact.client_id,
        clientName: contact.clients?.name || null,
        lastMessageAt: contact.last_message_at,
        unreadCount: unreadCounts[contact.id] || 0,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      }))

      return NextResponse.json({
        success: true,
        data: {
          contacts: transformedContacts
        }
      })

    } catch (error) {
      console.error('Error in GET /api/whatsapp/contacts:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}