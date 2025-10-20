import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cancelInvite } from '@/lib/services/invites'
import { isAdmin } from '@/lib/services/permissions'
import { InviteError } from '@/lib/types'

/**
 * API Route for Individual Invite Management
 * 
 * DELETE /api/invites/[id] - Cancel a pending invite (admin only)
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: inviteId } = await params

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
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Verify admin permissions
    const isUserAdmin = await isAdmin(currentUser.id)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'Permission denied', code: 'PERMISSION_DENIED' },
        { status: 403 }
      )
    }

    // Validate invite ID
    if (!inviteId) {
      return NextResponse.json(
        { error: 'Invite ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Cancel the invite
    await cancelInvite(inviteId)

    return NextResponse.json({
      success: true,
      message: 'Invite cancelled successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/invites/[id]:', error)
    
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
