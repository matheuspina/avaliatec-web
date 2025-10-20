import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { acceptInvite, validateInviteToken } from '@/lib/services/invites'
import { InviteError } from '@/lib/types'

/**
 * API Route for Invite Acceptance
 * 
 * POST /api/invites/accept - Accept an invite and update user group
 * 
 * This endpoint requires authentication as the user must be logged in to accept
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get current user from users table
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { token } = body

    // Validate token parameter
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // First validate the token to provide better error messages
    const invite = await validateInviteToken(token)

    if (!invite) {
      return NextResponse.json(
        { 
          error: 'Token de convite inválido ou expirado', 
          code: 'INVALID_TOKEN' 
        },
        { status: 400 }
      )
    }

    // Check if the invite email matches the current user's email
    if (invite.email !== currentUser.email) {
      return NextResponse.json(
        { 
          error: 'Este convite não foi enviado para o seu email', 
          code: 'EMAIL_MISMATCH' 
        },
        { status: 403 }
      )
    }

    // Accept the invite
    await acceptInvite({
      token,
      userId: currentUser.id
    })

    return NextResponse.json({
      success: true,
      message: 'Convite aceito com sucesso',
      data: {
        group_id: invite.group_id
      }
    })

  } catch (error) {
    console.error('Error in POST /api/invites/accept:', error)
    
    if (error instanceof InviteError) {
      return NextResponse.json(
        { error: error.message, code: 'INVITE_ERROR' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
