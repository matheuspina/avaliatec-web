import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { getEvolutionApiClient, EvolutionApiError } from '@/lib/services/evolutionApiClient'

/**
 * API Route for Individual WhatsApp Instance Management
 * 
 * GET /api/whatsapp/instances/[id] - Get instance details
 * PUT /api/whatsapp/instances/[id] - Update instance configuration
 * DELETE /api/whatsapp/instances/[id] - Delete instance
 * 
 * Requirements covered:
 * - 2.4: Get instance details
 * - 2.5: Update instance configuration
 * - 10.2: Manage instances with unique identifiers
 * - 10.6: Maintain independent connection state
 */

export async function GET(
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
      const { data: instance, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !instance) {
        return NextResponse.json(
          { error: 'Instance not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      try {
        // Get current status from Evolution API
        const evolutionClient = getEvolutionApiClient()
        const connectionState = await evolutionClient.getConnectionState(instance.instance_name)
        
        // Update status in database if different
        if (connectionState.state !== instance.status) {
          const newStatus = connectionState.state === 'open' ? 'connected' : 
                           connectionState.state === 'connecting' ? 'connecting' : 'disconnected'
          
          await supabase
            .from('whatsapp_instances')
            .update({ 
              status: newStatus,
              last_seen_at: new Date().toISOString()
            })
            .eq('id', id)
          
          instance.status = newStatus
        }
      } catch (evolutionError) {
        console.warn('Failed to get Evolution API status:', evolutionError)
        // Continue with database status if Evolution API is unavailable
      }

      // Transform response
      const responseData = {
        id: instance.id,
        instanceName: instance.instance_name,
        displayName: instance.display_name,
        phoneNumber: instance.phone_number,
        status: instance.status,
        qrCode: instance.qr_code,
        qrCodeUpdatedAt: instance.qr_code_updated_at,
        webhookUrl: instance.webhook_url,
        connectedAt: instance.connected_at,
        lastSeenAt: instance.last_seen_at,
        createdAt: instance.created_at,
        updatedAt: instance.updated_at
      }

      return NextResponse.json({
        success: true,
        data: {
          instance: responseData
        }
      })

    } catch (error) {
      console.error('Error in GET /api/whatsapp/instances/[id]:', error)
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
      const { id } = await params
      const body = await request.json()

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: 'Invalid instance ID format', code: 'INVALID_ID' },
          { status: 400 }
        )
      }

      // Fetch current instance
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

      // Validate and prepare update data
      const updateData: any = {}
      
      if (body.displayName !== undefined) {
        if (typeof body.displayName !== 'string' || body.displayName.trim().length === 0) {
          return NextResponse.json(
            { error: 'Display name must be a non-empty string', code: 'INVALID_INPUT' },
            { status: 400 }
          )
        }
        updateData.display_name = body.displayName.trim()
      }

      if (body.phoneNumber !== undefined) {
        if (body.phoneNumber !== null && typeof body.phoneNumber !== 'string') {
          return NextResponse.json(
            { error: 'Phone number must be a string or null', code: 'INVALID_INPUT' },
            { status: 400 }
          )
        }
        updateData.phone_number = body.phoneNumber
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update', code: 'NO_CHANGES' },
          { status: 400 }
        )
      }

      updateData.updated_at = new Date().toISOString()

      // Update instance in database
      const { data: updatedInstance, error: updateError } = await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating instance:', updateError)
        return NextResponse.json(
          { error: 'Failed to update instance', code: 'UPDATE_ERROR' },
          { status: 500 }
        )
      }

      // Transform response
      const responseData = {
        id: updatedInstance.id,
        instanceName: updatedInstance.instance_name,
        displayName: updatedInstance.display_name,
        phoneNumber: updatedInstance.phone_number,
        status: updatedInstance.status,
        qrCode: updatedInstance.qr_code,
        qrCodeUpdatedAt: updatedInstance.qr_code_updated_at,
        webhookUrl: updatedInstance.webhook_url,
        connectedAt: updatedInstance.connected_at,
        lastSeenAt: updatedInstance.last_seen_at,
        createdAt: updatedInstance.created_at,
        updatedAt: updatedInstance.updated_at
      }

      return NextResponse.json({
        success: true,
        data: {
          instance: responseData
        },
        message: 'Instance updated successfully'
      })

    } catch (error) {
      console.error('Error in PUT /api/whatsapp/instances/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
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

      // Fetch instance to get instance_name for Evolution API
      const { data: instance, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('id', id)
        .single()

      if (fetchError || !instance) {
        return NextResponse.json(
          { error: 'Instance not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      try {
        // Delete from Evolution API first
        const evolutionClient = getEvolutionApiClient()
        await evolutionClient.deleteInstance(instance.instance_name)
      } catch (evolutionError) {
        console.warn('Failed to delete from Evolution API:', evolutionError)
        // Continue with database deletion even if Evolution API fails
      }

      // Delete from database (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting instance from database:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete instance', code: 'DELETE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Instance deleted successfully'
      })

    } catch (error) {
      console.error('Error in DELETE /api/whatsapp/instances/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}