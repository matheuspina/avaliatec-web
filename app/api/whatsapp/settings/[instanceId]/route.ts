/**
 * WhatsApp Instance Settings API Route
 * 
 * This route handles getting and updating settings for WhatsApp instances.
 * It syncs settings with Evolution API and stores them locally in Supabase.
 * 
 * Requirements covered:
 * - 9.1: Store configuration settings in Supabase
 * - 9.2: Define availability schedule for each day
 * - 9.3: Configure auto-reply message
 * - 9.6: Enable/disable auto-reply functionality
 * - 11.1: Provide interface for instance settings
 * - 11.2: Configure reject calls via Evolution API
 * - 11.3: Configure reject call message
 * - 11.4: Configure ignore groups setting
 * - 11.5: Configure read messages automatically
 * - 11.6: Sync settings with Evolution API
 * - 11.7: Store settings locally for reference
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { getEvolutionApiClient, InstanceSettings } from '@/lib/services/evolutionApiClient'
import { WhatsAppInstanceSettings, AvailabilitySchedule } from '@/lib/types'
import { InstanceSettingsCache } from '@/lib/utils/cache'

interface RouteParams {
  params: Promise<{
    instanceId: string
  }>
}

/**
 * GET /api/whatsapp/settings/[instanceId]
 * 
 * Retrieves settings for a specific WhatsApp instance.
 * Returns both local Supabase settings and Evolution API settings.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  return withPermissionCheck(request, 'atendimento', async (userId) => {
    try {
      const supabase = await createClient()
      const { instanceId } = await params

      // Validate instanceId parameter
      if (!instanceId) {
        return NextResponse.json(
          { error: 'Instance ID is required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // Verify instance exists and user has access
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, created_by')
        .eq('id', instanceId)
        .single()

      if (instanceError || !instance) {
        return NextResponse.json(
          { error: 'Instance not found', code: 'INSTANCE_NOT_FOUND' },
          { status: 404 }
        )
      }

      // Check if user has access to this instance (created by user or user is admin)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (instance.created_by !== userId && profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied to this instance', code: 'ACCESS_DENIED' },
          { status: 403 }
        )
      }

    // Try to get settings from cache first
    let settings = InstanceSettingsCache.get(instanceId)
    let settingsError = null

    if (!settings) {
      // Get settings from Supabase if not in cache
      const result = await supabase
        .from('whatsapp_instance_settings')
        .select('*')
        .eq('instance_id', instanceId)
        .single()
      
      settings = result.data
      settingsError = result.error

      // Cache the settings if successfully retrieved
      if (settings && !settingsError) {
        InstanceSettingsCache.set(instanceId, settings)
      }
    }

    // If no settings exist, create default settings
    if (settingsError && settingsError.code === 'PGRST116') {
      const defaultSettings: Partial<WhatsAppInstanceSettings> = {
        instance_id: instanceId,
        reject_calls: false,
        reject_call_message: null,
        ignore_groups: true,
        always_online: false,
        read_messages: false,
        read_status: false,
        auto_reply_enabled: false,
        auto_reply_message: null,
        availability_schedule: {
          monday: { enabled: true, start: '08:00', end: '18:00' },
          tuesday: { enabled: true, start: '08:00', end: '18:00' },
          wednesday: { enabled: true, start: '08:00', end: '18:00' },
          thursday: { enabled: true, start: '08:00', end: '18:00' },
          friday: { enabled: true, start: '08:00', end: '18:00' },
          saturday: { enabled: false, start: '08:00', end: '12:00' },
          sunday: { enabled: false, start: '08:00', end: '12:00' }
        }
      }

      const { data: newSettings, error: createError } = await supabase
        .from('whatsapp_instance_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (createError) {
        console.error('Error creating default settings:', createError)
        return NextResponse.json(
          { error: 'Failed to create default settings', code: 'CREATE_ERROR' },
          { status: 500 }
        )
      }

      // Cache the new settings
      InstanceSettingsCache.set(instanceId, newSettings)

      return NextResponse.json({
        success: true,
        data: { settings: newSettings }
      })
    }

    if (settingsError) {
      console.error('Error fetching settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to fetch settings', code: 'FETCH_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { settings }
    })

    } catch (error) {
      console.error('Error in GET /api/whatsapp/settings/[instanceId]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

/**
 * PUT /api/whatsapp/settings/[instanceId]
 * 
 * Updates settings for a specific WhatsApp instance.
 * Syncs settings with Evolution API and stores locally in Supabase.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  return withPermissionCheck(request, 'atendimento', async (userId) => {
    try {
      const supabase = await createClient()
      const { instanceId } = await params

      // Validate instanceId parameter
      if (!instanceId) {
        return NextResponse.json(
          { error: 'Instance ID is required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // Parse request body
      const body = await request.json()
      const {
        reject_calls,
        reject_call_message,
        ignore_groups,
        always_online,
        read_messages,
        read_status,
        auto_reply_enabled,
        auto_reply_message,
        availability_schedule
      } = body

      // Verify instance exists and user has access
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, created_by')
        .eq('id', instanceId)
        .single()

      if (instanceError || !instance) {
        return NextResponse.json(
          { error: 'Instance not found', code: 'INSTANCE_NOT_FOUND' },
          { status: 404 }
        )
      }

      // Check if user has access to this instance
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (instance.created_by !== userId && profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied to this instance', code: 'ACCESS_DENIED' },
          { status: 403 }
        )
      }

    // Validate availability_schedule if provided
    if (availability_schedule) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

      for (const [day, schedule] of Object.entries(availability_schedule)) {
        if (!validDays.includes(day)) {
          return NextResponse.json(
            { error: `Invalid day: ${day}`, code: 'INVALID_INPUT' },
            { status: 400 }
          )
        }

        const daySchedule = schedule as { enabled: boolean; start: string; end: string }
        if (typeof daySchedule.enabled !== 'boolean') {
          return NextResponse.json(
            { error: `Invalid enabled value for ${day}`, code: 'INVALID_INPUT' },
            { status: 400 }
          )
        }

        if (!timeRegex.test(daySchedule.start) || !timeRegex.test(daySchedule.end)) {
          return NextResponse.json(
            { error: `Invalid time format for ${day}. Use HH:mm format`, code: 'INVALID_INPUT' },
            { status: 400 }
          )
        }
      }
    }

    // Prepare Evolution API settings (Requirements 11.2, 11.6)
    const evolutionSettings: InstanceSettings = {}
    
    if (typeof reject_calls === 'boolean') {
      evolutionSettings.rejectCall = reject_calls
    }
    
    if (reject_call_message !== undefined) {
      evolutionSettings.msgCall = reject_call_message
    }
    
    if (typeof ignore_groups === 'boolean') {
      evolutionSettings.groupsIgnore = ignore_groups
    }
    
    if (typeof always_online === 'boolean') {
      evolutionSettings.alwaysOnline = always_online
    }
    
    if (typeof read_messages === 'boolean') {
      evolutionSettings.readMessages = read_messages
    }
    
    if (typeof read_status === 'boolean') {
      evolutionSettings.readStatus = read_status
    }

    // Sync settings with Evolution API if there are settings to update
    if (Object.keys(evolutionSettings).length > 0) {
      try {
        const evolutionClient = getEvolutionApiClient()
        await evolutionClient.setSettings(instance.instance_name, evolutionSettings)
      } catch (evolutionError) {
        console.error('Error syncing settings with Evolution API:', evolutionError)
        return NextResponse.json(
          { error: 'Failed to sync settings with Evolution API', code: 'EVOLUTION_API_ERROR' },
          { status: 500 }
        )
      }
    }

    // Prepare update data for Supabase (Requirements 9.1, 11.7)
    const updateData: Partial<WhatsAppInstanceSettings> = {}
    
    if (typeof reject_calls === 'boolean') {
      updateData.reject_calls = reject_calls
    }
    
    if (reject_call_message !== undefined) {
      updateData.reject_call_message = reject_call_message
    }
    
    if (typeof ignore_groups === 'boolean') {
      updateData.ignore_groups = ignore_groups
    }
    
    if (typeof always_online === 'boolean') {
      updateData.always_online = always_online
    }
    
    if (typeof read_messages === 'boolean') {
      updateData.read_messages = read_messages
    }
    
    if (typeof read_status === 'boolean') {
      updateData.read_status = read_status
    }
    
    if (typeof auto_reply_enabled === 'boolean') {
      updateData.auto_reply_enabled = auto_reply_enabled
    }
    
    if (auto_reply_message !== undefined) {
      updateData.auto_reply_message = auto_reply_message
    }
    
    if (availability_schedule) {
      updateData.availability_schedule = availability_schedule as AvailabilitySchedule
    }

    // Update settings in Supabase
    const { data: updatedSettings, error: updateError } = await supabase
      .from('whatsapp_instance_settings')
      .upsert({
        instance_id: instanceId,
        ...updateData
      })
      .select()
      .single()

    if (updateError) {
      console.error('Error updating settings in Supabase:', updateError)
      return NextResponse.json(
        { error: 'Failed to update settings', code: 'UPDATE_ERROR' },
        { status: 500 }
      )
    }

    // Update cache with new settings
    InstanceSettingsCache.set(instanceId, updatedSettings)

    return NextResponse.json({
      success: true,
      data: { settings: updatedSettings },
      message: 'Settings updated successfully'
    })

    } catch (error) {
      console.error('Error in PUT /api/whatsapp/settings/[instanceId]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}