import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { getEvolutionApiClient, EvolutionApiError } from '@/lib/services/evolutionApiClient'
import type { WhatsAppInstance } from '@/lib/types'

/**
 * API Route for WhatsApp Instances Management
 * 
 * GET /api/whatsapp/instances - List all instances for the authenticated user
 * POST /api/whatsapp/instances - Create new WhatsApp instance
 * 
 * Requirements covered:
 * - 2.1: List instances for user
 * - 2.2: Create new instance with Evolution API
 * - 10.1: Support multiple instances
 * - 10.2: Store instances with unique identifiers
 * - 10.6: Maintain independent connection state
 */

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'atendimento', async (userId) => {
    try {
      const supabase = await createClient()

      // Fetch instances created by the user or accessible to them
      const { data: instances, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching WhatsApp instances:', error)
        return NextResponse.json(
          { error: 'Failed to fetch instances', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      // Transform data to match API response format
      const transformedInstances = instances.map((instance: any) => ({
        id: instance.id,
        instanceName: instance.instance_name,
        displayName: instance.display_name,
        phoneNumber: instance.phone_number,
        status: instance.status,
        connectedAt: instance.connected_at,
        lastSeenAt: instance.last_seen_at,
        createdAt: instance.created_at,
        updatedAt: instance.updated_at
      }))

      return NextResponse.json({
        success: true,
        data: {
          instances: transformedInstances
        }
      })
    } catch (error) {
      console.error('Error in GET /api/whatsapp/instances:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'atendimento', async (userId, authUserId) => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      // Validate required fields
      if (!body.displayName || typeof body.displayName !== 'string') {
        return NextResponse.json(
          { error: 'Display name is required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      if (body.displayName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Display name cannot be empty', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // Generate unique instance name
      const timestamp = Date.now()
      const instanceName = `instance_${timestamp}_${Math.random().toString(36).substring(2, 8)}`
      
      // Get webhook URL from environment or construct it
      let webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`
        : `${request.nextUrl.origin}/api/webhooks/evolution`
      
      // Warn if using localhost (won't work with external Evolution API)
      if (webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
        console.warn('⚠️  Webhook URL uses localhost - Evolution API may not be able to reach it:', webhookUrl)
        console.warn('   Configure NEXT_PUBLIC_APP_URL with a public URL (e.g., ngrok, production domain)')
      }

      try {
        // Create instance in Evolution API
        const evolutionClient = getEvolutionApiClient()
        
        console.log('Creating WhatsApp instance:', {
          instanceName,
          webhookUrl,
          displayName: body.displayName
        })
        
        const evolutionResponse = await evolutionClient.createInstance({
          instanceName,
          qrcode: true,
          webhook: webhookUrl,
          webhook_by_events: true,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'QRCODE_UPDATED',
            'CONTACTS_UPSERT'
          ]
        })
        
        console.log('Evolution API response:', {
          instanceName: evolutionResponse.instance?.instanceName,
          status: evolutionResponse.instance?.status,
          hasQrCode: !!evolutionResponse.qrcode?.base64,
          hasHash: !!evolutionResponse.hash
        })

        // Extract token from response (can be string or object)
        const instanceToken = typeof evolutionResponse.hash === 'string' 
          ? evolutionResponse.hash 
          : evolutionResponse.hash?.apikey || ''

        // Extract QR Code from response
        const qrCodeBase64 = evolutionResponse.qrcode?.base64 || null
        const qrCodeUpdatedAt = qrCodeBase64 ? new Date().toISOString() : null

        // Store instance in Supabase with QR Code
        // Note: created_by references profiles(id) which is the same as auth.uid()
        const { data: instance, error: dbError } = await supabase
          .from('whatsapp_instances')
          .insert({
            instance_name: instanceName,
            instance_token: instanceToken,
            display_name: body.displayName.trim(),
            status: 'qr_code', // Initial status is qr_code waiting for scan
            qr_code: qrCodeBase64,
            qr_code_updated_at: qrCodeUpdatedAt,
            webhook_url: webhookUrl,
            created_by: authUserId // Use authUserId which matches profiles(id)
          })
          .select()
          .single()

        if (dbError) {
          console.error('Error storing instance in database:', dbError)
          console.error('Database error details:', {
            code: dbError.code,
            message: dbError.message,
            details: dbError.details,
            hint: dbError.hint
          })
          
          // Try to cleanup Evolution API instance
          try {
            await evolutionClient.deleteInstance(instanceName)
          } catch (cleanupError) {
            console.error('Failed to cleanup Evolution API instance:', cleanupError)
          }

          return NextResponse.json(
            { 
              error: 'Failed to create instance', 
              code: 'CREATE_ERROR',
              details: dbError.message 
            },
            { status: 500 }
          )
        }

        // Transform response with QR Code
        const responseData = {
          id: instance.id,
          instanceName: instance.instance_name,
          displayName: instance.display_name,
          status: instance.status,
          qrCode: instance.qr_code,
          qrCodeUpdatedAt: instance.qr_code_updated_at,
          createdAt: instance.created_at
        }

        return NextResponse.json({
          success: true,
          data: {
            instance: responseData
          },
          message: 'Instance created successfully. Scan the QR code to connect.'
        }, { status: 201 })

      } catch (evolutionError) {
        console.error('Evolution API error:', evolutionError)
        
        if (evolutionError instanceof EvolutionApiError) {
          return NextResponse.json(
            { 
              error: 'Failed to create WhatsApp instance', 
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
      console.error('Error in POST /api/whatsapp/instances:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}