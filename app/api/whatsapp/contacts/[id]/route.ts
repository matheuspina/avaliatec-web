import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import type { WhatsAppContact } from '@/lib/types'

/**
 * API Route for Individual WhatsApp Contact Management
 * 
 * GET /api/whatsapp/contacts/[id] - Get contact details
 * PUT /api/whatsapp/contacts/[id] - Update contact information
 * 
 * Requirements covered:
 * - 7.3: Display contact information
 * - 7.4: Allow manual client association
 * - 7.5: Allow creating new client from contact
 * - 8.2: Allow contact type selection
 * - 8.3: Associate contact with client when classified
 * - 8.6: Update contact type immediately in Supabase
 */

interface ContactUpdateRequest {
    contactType?: 'cliente' | 'lead' | 'profissional' | 'prestador' | 'unknown'
    clientId?: string | null
    name?: string
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withPermissionCheck(request, 'atendimento', async (userId) => {
        try {
            const supabase = await createClient()
            const { id: contactId } = await params

            if (!contactId) {
                return NextResponse.json(
                    { error: 'Contact ID is required', code: 'MISSING_CONTACT_ID' },
                    { status: 400 }
                )
            }

            // Fetch contact with related client information
            const { data: contact, error: contactError } = await supabase
                .from('whatsapp_contacts')
                .select(`
          id,
          instance_id,
          remote_jid,
          phone_number,
          name,
          profile_picture_url,
          contact_type,
          client_id,
          last_message_at,
          created_at,
          updated_at,
          whatsapp_instances(id, display_name, phone_number),
          clients(id, name, email, phone, type)
        `)
                .eq('id', contactId)
                .single()

            if (contactError || !contact) {
                return NextResponse.json(
                    { error: 'Contact not found', code: 'CONTACT_NOT_FOUND' },
                    { status: 404 }
                )
            }

            // Get message statistics for this contact
            const { data: messageStats, error: statsError } = await supabase
                .from('whatsapp_messages')
                .select('from_me, created_at')
                .eq('contact_id', contactId)
                .order('created_at', { ascending: false })
                .limit(1)

            let lastMessageInfo = null
            if (!statsError && messageStats && messageStats.length > 0) {
                const lastMessage = messageStats[0]
                lastMessageInfo = {
                    timestamp: lastMessage.created_at,
                    fromMe: lastMessage.from_me
                }
            }

            // Get total message count
            const { count: totalMessages } = await supabase
                .from('whatsapp_messages')
                .select('*', { count: 'exact', head: true })
                .eq('contact_id', contactId)

            // Transform contact data
            const transformedContact = {
                id: contact.id,
                instanceId: contact.instance_id,
                instanceName: (contact as any).whatsapp_instances?.display_name || null,
                instancePhone: (contact as any).whatsapp_instances?.phone_number || null,
                remoteJid: contact.remote_jid,
                phoneNumber: contact.phone_number,
                name: contact.name,
                profilePictureUrl: contact.profile_picture_url,
                contactType: contact.contact_type,
                clientId: contact.client_id,
                client: contact.clients ? {
                    id: (contact as any).clients.id,
                    name: (contact as any).clients.name,
                    email: (contact as any).clients.email,
                    phone: (contact as any).clients.phone,
                    type: (contact as any).clients.type
                } : null,
                lastMessageAt: contact.last_message_at,
                lastMessage: lastMessageInfo,
                totalMessages: totalMessages || 0,
                createdAt: contact.created_at,
                updatedAt: contact.updated_at
            }

            return NextResponse.json({
                success: true,
                data: {
                    contact: transformedContact
                }
            })

        } catch (error) {
            console.error('Error in GET /api/whatsapp/contacts/[id]:', error)
            return NextResponse.json(
                { error: 'Internal server error', code: 'INTERNAL_ERROR' },
                { status: 500 }
            )
        }
    })
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withPermissionCheck(request, 'atendimento', async (userId) => {
        try {
            const supabase = await createClient()
            const { id: contactId } = await params
            const body: ContactUpdateRequest = await request.json()

            if (!contactId) {
                return NextResponse.json(
                    { error: 'Contact ID is required', code: 'MISSING_CONTACT_ID' },
                    { status: 400 }
                )
            }

            // Validate contact exists
            const { data: existingContact, error: fetchError } = await supabase
                .from('whatsapp_contacts')
                .select('id, contact_type, client_id, name')
                .eq('id', contactId)
                .single()

            if (fetchError || !existingContact) {
                return NextResponse.json(
                    { error: 'Contact not found', code: 'CONTACT_NOT_FOUND' },
                    { status: 404 }
                )
            }

            // Prepare update data
            const updateData: Partial<WhatsAppContact> = {}

            // Validate and set contact type
            if (body.contactType !== undefined) {
                const validTypes = ['cliente', 'lead', 'profissional', 'prestador', 'unknown']
                if (!validTypes.includes(body.contactType)) {
                    return NextResponse.json(
                        { error: 'Invalid contact type', code: 'INVALID_CONTACT_TYPE' },
                        { status: 400 }
                    )
                }
                updateData.contact_type = body.contactType
            }

            // Validate and set client association
            if (body.clientId !== undefined) {
                if (body.clientId === null) {
                    // Remove client association
                    updateData.client_id = null
                } else {
                    // Validate client exists
                    const { data: client, error: clientError } = await supabase
                        .from('clients')
                        .select('id, name')
                        .eq('id', body.clientId)
                        .single()

                    if (clientError || !client) {
                        return NextResponse.json(
                            { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
                            { status: 400 }
                        )
                    }

                    updateData.client_id = body.clientId
                }
            }

            // Set contact name
            if (body.name !== undefined) {
                if (typeof body.name !== 'string') {
                    return NextResponse.json(
                        { error: 'Name must be a string', code: 'INVALID_NAME' },
                        { status: 400 }
                    )
                }
                updateData.name = body.name.trim() || null
            }

            // Check if there are any changes to make
            if (Object.keys(updateData).length === 0) {
                return NextResponse.json(
                    { error: 'No valid fields to update', code: 'NO_UPDATES' },
                    { status: 400 }
                )
            }

            // Update the contact
            const { data: updatedContact, error: updateError } = await supabase
                .from('whatsapp_contacts')
                .update(updateData)
                .eq('id', contactId)
                .select(`
          id,
          instance_id,
          remote_jid,
          phone_number,
          name,
          profile_picture_url,
          contact_type,
          client_id,
          last_message_at,
          created_at,
          updated_at,
          clients(id, name, email, phone, type)
        `)
                .single()

            if (updateError) {
                console.error('Error updating WhatsApp contact:', updateError)
                return NextResponse.json(
                    { error: 'Failed to update contact', code: 'UPDATE_ERROR' },
                    { status: 500 }
                )
            }

            // Transform updated contact data
            const transformedContact = {
                id: updatedContact.id,
                instanceId: updatedContact.instance_id,
                remoteJid: updatedContact.remote_jid,
                phoneNumber: updatedContact.phone_number,
                name: updatedContact.name,
                profilePictureUrl: updatedContact.profile_picture_url,
                contactType: updatedContact.contact_type,
                clientId: updatedContact.client_id,
                client: updatedContact.clients ? {
                    id: (updatedContact as any).clients.id,
                    name: (updatedContact as any).clients.name,
                    email: (updatedContact as any).clients.email,
                    phone: (updatedContact as any).clients.phone,
                    type: (updatedContact as any).clients.type
                } : null,
                lastMessageAt: updatedContact.last_message_at,
                createdAt: updatedContact.created_at,
                updatedAt: updatedContact.updated_at
            }

            return NextResponse.json({
                success: true,
                data: {
                    contact: transformedContact
                },
                message: 'Contact updated successfully'
            })

        } catch (error) {
            console.error('Error in PUT /api/whatsapp/contacts/[id]:', error)
            return NextResponse.json(
                { error: 'Internal server error', code: 'INTERNAL_ERROR' },
                { status: 500 }
            )
        }
    })
}