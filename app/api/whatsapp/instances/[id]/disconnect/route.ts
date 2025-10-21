import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { getEvolutionApiClient, EvolutionApiError } from '@/lib/services/evolutionApiClient'

/**
 * API Route for WhatsApp Instance Disconnection
 * 
 * POST /api/whatsapp/instances/[id]/disconnect - Disconnect instance
 * 
 * Requirements covered:
 * - 2.5: Disconnect instance functionality
 * - 10.6: Maintain independent connection state per instance
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'atendimento', async (userId) => {
    try {
      const supabase = await createClient()
      const { id } = await params

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: 'Invalid instance ID format', code: 'INVALID_ID' },
          { status: 400 }
        )
      }

      // Fetch instance from database
      const { data: instance, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !instance) {
        return NextResponse.json(
          { error: 'Instance not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      // Check if instance is already disconnected
      if (instance.status === 'disconnected') {
        return NextResponse.json(
          { error: 'Instance is already disconnected', code: 'ALREADY_DISCONNECTED' },
          { status: 400 }
        )
      }

      try {
        const evolutionClient = getEvolutionApiClient()
        
        // Logout/disconnect the instance in Evolution API
        await evolutionClient.logoutInstance(instance.instance_name)
        
        // Update instance status in database
        const updateData = {
          status: 'disconnected' as const,
          qr_code: null,
          qr_code_updated_at: null,
          phone_number: null, // Clear phone number on disconnect
          last_seen_at: new Date().toISOString()
        }

        const { data: updatedInstance, error: updateError } = await supabase
          .from('whatsapp_instances')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating instance status after disconnect:', updateError)
          return NextResponse.json(
            { error: 'Failed to update instance status', code: 'UPDATE_ERROR' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: {
            status: 'disconnected',
            disconnectedAt: updateData.last_seen_at
          },
          message: 'Instance disconnected successfully'
        })

      } catch (evolutionError) {
        console.error('Evolution API error during disconnection:', evolutionError)
        
        // Even if Evolution API fails, update local status
        await supabase
          .from('whatsapp_instances')
          .update({ 
            status: 'disconnected',
            qr_code: null,
            qr_code_updated_at: null,
            last_seen_at: new Date().toISOString()
          })
          .eq('id', id)

        if (evolutionError instanceof EvolutionApiError) {
          // If it's a 404, the instance might already be deleted in Evolution API
          if (evolutionError.statusCode === 404) {
            return NextResponse.json({
              success: true,
              data: {
                status: 'disconnected',
                disconnectedAt: new Date().toISOString()
              },
              message: 'Instance disconnected (was already removed from service)'
            })
          }

          return NextResponse.json(
            { 
              error: 'Failed to disconnect WhatsApp instance', 
              code: 'EVOLUTION_API_ERROR',
              details: evolutionError.response
            },
            { status: evolutionError.statusCode >= 400 && evolutionError.statusCode < 500 ? 400 : 500 }
          )
        }

        return NextResponse.json(
          { error: 'Failed to connect to WhatsApp service', code: 'SERVICE_UNAVAILABLE' },
          { status: 503 }
        )
      }

    } catch (error) {
      console.error('Error in POST /api/whatsapp/instances/[id]/disconnect:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}