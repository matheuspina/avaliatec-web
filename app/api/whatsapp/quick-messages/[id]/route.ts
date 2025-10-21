import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import type { WhatsAppQuickMessage } from '@/lib/types'

/**
 * API Route for Individual WhatsApp Quick Message Management
 * 
 * GET /api/whatsapp/quick-messages/[id] - Get specific quick message
 * PUT /api/whatsapp/quick-messages/[id] - Update quick message
 * DELETE /api/whatsapp/quick-messages/[id] - Delete quick message
 * 
 * Requirements covered:
 * - 6.1: Recognize shortcuts starting with "/"
 * - 6.2: Substitute shortcut with full message text
 * - 6.5: Store quick messages in database
 * - 6.6: Allow create, edit, delete through interface
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
          { error: 'Invalid quick message ID format', code: 'INVALID_ID_FORMAT' },
          { status: 400 }
        )
      }

      // Fetch the quick message
      const { data: quickMessage, error } = await supabase
        .from('whatsapp_quick_messages')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return NextResponse.json(
            { error: 'Quick message not found', code: 'NOT_FOUND' },
            { status: 404 }
          )
        }

        console.error('Error fetching quick message:', error)
        return NextResponse.json(
          { error: 'Failed to fetch quick message', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          quickMessage
        }
      })

    } catch (error) {
      console.error('Error in GET /api/whatsapp/quick-messages/[id]:', error)
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
          { error: 'Invalid quick message ID format', code: 'INVALID_ID_FORMAT' },
          { status: 400 }
        )
      }

      // Check if quick message exists
      const { data: existingMessage, error: fetchError } = await supabase
        .from('whatsapp_quick_messages')
        .select('id, shortcut')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // No rows returned
          return NextResponse.json(
            { error: 'Quick message not found', code: 'NOT_FOUND' },
            { status: 404 }
          )
        }

        console.error('Error fetching quick message for update:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch quick message', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      // Validate and prepare update data
      const { shortcut, message_text, description } = body
      const updateData: Partial<WhatsAppQuickMessage> = {}

      // Validate shortcut if provided
      if (shortcut !== undefined) {
        if (!shortcut || typeof shortcut !== 'string') {
          return NextResponse.json(
            { error: 'Shortcut must be a non-empty string', code: 'INVALID_SHORTCUT' },
            { status: 400 }
          )
        }

        // Validate shortcut format - must start with /
        if (!shortcut.startsWith('/')) {
          return NextResponse.json(
            { error: 'Shortcut must start with "/"', code: 'INVALID_SHORTCUT_FORMAT' },
            { status: 400 }
          )
        }

        // Validate shortcut length and characters
        if (shortcut.length < 2) {
          return NextResponse.json(
            { error: 'Shortcut must have at least 2 characters', code: 'SHORTCUT_TOO_SHORT' },
            { status: 400 }
          )
        }

        // Check for valid shortcut characters (alphanumeric and underscore only after /)
        const shortcutPattern = /^\/[a-zA-Z0-9_]+$/
        if (!shortcutPattern.test(shortcut)) {
          return NextResponse.json(
            { error: 'Shortcut can only contain letters, numbers, and underscores after "/"', code: 'INVALID_SHORTCUT_CHARS' },
            { status: 400 }
          )
        }

        // Check if shortcut already exists (only if different from current)
        const normalizedShortcut = shortcut.toLowerCase()
        if (normalizedShortcut !== existingMessage.shortcut) {
          const { data: duplicateShortcut, error: checkError } = await supabase
            .from('whatsapp_quick_messages')
            .select('id')
            .eq('shortcut', normalizedShortcut)
            .neq('id', id)
            .single()

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error checking shortcut uniqueness:', checkError)
            return NextResponse.json(
              { error: 'Failed to validate shortcut', code: 'VALIDATION_ERROR' },
              { status: 500 }
            )
          }

          if (duplicateShortcut) {
            return NextResponse.json(
              { error: 'Shortcut already exists', code: 'SHORTCUT_EXISTS' },
              { status: 409 }
            )
          }
        }

        updateData.shortcut = normalizedShortcut
      }

      // Validate message_text if provided
      if (message_text !== undefined) {
        if (!message_text || typeof message_text !== 'string') {
          return NextResponse.json(
            { error: 'Message text must be a non-empty string', code: 'INVALID_MESSAGE' },
            { status: 400 }
          )
        }

        if (message_text.trim().length === 0) {
          return NextResponse.json(
            { error: 'Message text cannot be empty', code: 'EMPTY_MESSAGE' },
            { status: 400 }
          )
        }

        if (message_text.length > 4096) {
          return NextResponse.json(
            { error: 'Message text cannot exceed 4096 characters', code: 'MESSAGE_TOO_LONG' },
            { status: 400 }
          )
        }

        updateData.message_text = message_text.trim()
      }

      // Handle description (can be null)
      if (description !== undefined) {
        updateData.description = description && typeof description === 'string' 
          ? description.trim() || null 
          : null
      }

      // If no fields to update
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields provided for update', code: 'NO_UPDATE_FIELDS' },
          { status: 400 }
        )
      }

      // Update the quick message
      const { data: updatedMessage, error: updateError } = await supabase
        .from('whatsapp_quick_messages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating quick message:', updateError)
        
        // Handle unique constraint violation
        if (updateError.code === '23505') {
          return NextResponse.json(
            { error: 'Shortcut already exists', code: 'SHORTCUT_EXISTS' },
            { status: 409 }
          )
        }

        return NextResponse.json(
          { error: 'Failed to update quick message', code: 'UPDATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          quickMessage: updatedMessage
        }
      })

    } catch (error) {
      console.error('Error in PUT /api/whatsapp/quick-messages/[id]:', error)
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
          { error: 'Invalid quick message ID format', code: 'INVALID_ID_FORMAT' },
          { status: 400 }
        )
      }

      // Check if quick message exists before deletion
      const { data: existingMessage, error: fetchError } = await supabase
        .from('whatsapp_quick_messages')
        .select('id, shortcut')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // No rows returned
          return NextResponse.json(
            { error: 'Quick message not found', code: 'NOT_FOUND' },
            { status: 404 }
          )
        }

        console.error('Error fetching quick message for deletion:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch quick message', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      // Delete the quick message
      const { error: deleteError } = await supabase
        .from('whatsapp_quick_messages')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting quick message:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete quick message', code: 'DELETE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Quick message deleted successfully'
      })

    } catch (error) {
      console.error('Error in DELETE /api/whatsapp/quick-messages/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}