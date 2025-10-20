import { NextRequest, NextResponse } from 'next/server'
import { validateInviteToken } from '@/lib/services/invites'

/**
 * API Route for Invite Token Validation
 * 
 * POST /api/invites/validate - Validate an invite token
 * 
 * This endpoint is public (no auth required) as it's used during registration
 */

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { token } = body

    // Validate token parameter
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { 
          error: 'Token is required', 
          code: 'VALIDATION_ERROR',
          valid: false 
        },
        { status: 400 }
      )
    }

    // Validate the invite token
    const invite = await validateInviteToken(token)

    if (!invite) {
      return NextResponse.json(
        { 
          error: 'Token de convite inválido ou expirado', 
          code: 'INVALID_TOKEN',
          valid: false 
        },
        { status: 400 }
      )
    }

    // Return invite details (without sensitive information like the token itself)
    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        email: invite.email,
        group_id: invite.group_id,
        expires_at: invite.expires_at,
        // Include group name if available from the join
        group_name: (invite as any).user_groups?.name || null
      }
    })

  } catch (error) {
    console.error('Error in POST /api/invites/validate:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        valid: false 
      },
      { status: 500 }
    )
  }
}
