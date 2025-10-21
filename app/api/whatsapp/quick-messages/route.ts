import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { 
  validateQuickMessageShortcut, 
  sanitizeTextContent, 
  addSecurityHeaders 
} from '@/lib/utils/security'
import type { WhatsAppQuickMessage } from '@/lib/types'

/**
 * API Route for WhatsApp Quick Messages Management
 * 
 * GET /api/whatsapp/quick-messages - List all quick messages
 * POST /api/whatsapp/quick-messages - Create new quick message
 * 
 * Requirements covered:
 * - 6.1: Recognize shortcuts starting with "/"
 * - 6.2: Substitute shortcut with full message text
 * - 6.5: Store quick messages in database
 * - 6.6: Allow create, edit, delete through interface
 */

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'atendimento', async (userId) => {
    try {
      const supabase = await createClient()

      // Fetch all quick messages ordered by shortcut
      const { data: quickMessages, error } = await supabase
        .from('whatsapp_quick_messages')
        .select('*')
        .order('shortcut', { ascending: true })

      if (error) {
        console.error('Error fetching quick messages:', error)
        return NextResponse.json(
          { error: 'Failed to fetch quick messages', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          quickMessages: quickMessages || []
        }
      })

    } catch (error) {
      console.error('Error in GET /api/whatsapp/quick-messages:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'atendimento', async (userId) => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      // Validate required fields
      const { shortcut, message_text, description } = body

      if (!shortcut || !message_text) {
        return NextResponse.json(
          { error: 'Shortcut and message text are required', code: 'MISSING_FIELDS' },
          { status: 400 }
        )
      }

      // Validate shortcut format using security utility
      if (!validateQuickMessageShortcut(shortcut)) {
        return NextResponse.json(
          { error: 'Invalid shortcut format. Must start with "/" and contain only letters, numbers, and underscores (2-20 characters)', code: 'INVALID_SHORTCUT_FORMAT' },
          { status: 400 }
        )
      }

      // Sanitize and validate message text
      const sanitizedMessageText = sanitizeTextContent(message_text)
      if (!sanitizedMessageText || sanitizedMessageText.length === 0) {
        return NextResponse.json(
          { error: 'Message text cannot be empty', code: 'EMPTY_MESSAGE' },
          { status: 400 }
        )
      }

      if (sanitizedMessageText.length > 4096) {
        return NextResponse.json(
          { error: 'Message text cannot exceed 4096 characters', code: 'MESSAGE_TOO_LONG' },
          { status: 400 }
        )
      }

      // Sanitize description if provided
      const sanitizedDescription = description ? sanitizeTextContent(description) : null

      // Check if shortcut already exists (unique constraint)
      const { data: existingShortcut, error: checkError } = await supabase
        .from('whatsapp_quick_messages')
        .select('id')
        .eq('shortcut', shortcut.toLowerCase())
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking shortcut uniqueness:', checkError)
        return NextResponse.json(
          { error: 'Failed to validate shortcut', code: 'VALIDATION_ERROR' },
          { status: 500 }
        )
      }

      if (existingShortcut) {
        return NextResponse.json(
          { error: 'Shortcut already exists', code: 'SHORTCUT_EXISTS' },
          { status: 409 }
        )
      }

      // Create new quick message with sanitized content
      const { data: quickMessage, error: insertError } = await supabase
        .from('whatsapp_quick_messages')
        .insert({
          shortcut: shortcut.toLowerCase(),
          message_text: sanitizedMessageText,
          description: sanitizedDescription,
          created_by: userId
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating quick message:', insertError)
        
        // Handle unique constraint violation
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'Shortcut already exists', code: 'SHORTCUT_EXISTS' },
            { status: 409 }
          )
        }

        return NextResponse.json(
          { error: 'Failed to create quick message', code: 'CREATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          quickMessage
        }
      }, { status: 201 })

    } catch (error) {
      console.error('Error in POST /api/whatsapp/quick-messages:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}