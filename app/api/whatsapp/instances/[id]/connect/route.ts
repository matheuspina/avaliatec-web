import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { getEvolutionApiClient, EvolutionApiError } from '@/lib/services/evolutionApiClient'

/**
 * API Route for WhatsApp Instance Connection
 * 
 * POST /api/whatsapp/instances/[id]/connect - Initiate connection and get QR code
 * 
 * Requirements covered:
 * - 2.2: Connect instance and display QR code
 * - 2.4: QR code updates in real-time
 * - 2.5: Connection status management
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

      // Check if instance is already connected
      if (instance.status === 'connected') {
        return NextResponse.json(
          { error: 'Instance is already connected', code: 'ALREADY_CONNECTED' },
          { status: 400 }
        )
      }

      try {
        const evolutionClient = getEvolutionApiClient()
        
        // First check current connection state
        const connectionState = await evolutionClient.getConnectionState(instance.instance_name)
        
        if (connectionState.state === 'open') {
          // Instance is already connected in Evolution API
          await supabase
            .from('whatsapp_instances')
            .update({ 
              status: 'connected',
              connected_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString()
            })
            .eq('id', id)

          return NextResponse.json({
            success: true,
            data: {
              status: 'connected',
              message: 'Instance is already connected'
            }
          })
        }

        // Initiate connection to get QR code
        const qrResponse = await evolutionClient.connectInstance(instance.instance_name)
        
        // Update instance status and QR code in database
        const updateData = {
          status: 'qr_code' as const,
          qr_code: qrResponse.base64,
          qr_code_updated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        }

        const { data: updatedInstance, error: updateError } = await supabase
          .from('whatsapp_instances')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating instance with QR code:', updateError)
          return NextResponse.json(
            { error: 'Failed to update instance status', code: 'UPDATE_ERROR' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          data: {
            qrCode: qrResponse.base64,
            status: 'qr_code',
            qrCodeUpdatedAt: updateData.qr_code_updated_at
          },
          message: 'QR code generated successfully'
        })

      } catch (evolutionError) {
        console.error('Evolution API error during connection:', evolutionError)
        
        // Update instance status to indicate connection failure
        await supabase
          .from('whatsapp_instances')
          .update({ 
            status: 'disconnected',
            last_seen_at: new Date().toISOString()
          })
          .eq('id', id)

        if (evolutionError instanceof EvolutionApiError) {
          return NextResponse.json(
            { 
              error: 'Failed to initiate WhatsApp connection', 
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
      console.error('Error in POST /api/whatsapp/instances/[id]/connect:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}