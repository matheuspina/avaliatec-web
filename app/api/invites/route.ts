import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createInvite, getPendingInvites } from '@/lib/services/invites'
import { isAdmin } from '@/lib/services/permissions'
import { InviteError } from '@/lib/types'

/**
 * API Route for Invites Management
 * 
 * GET /api/invites - List pending invites (admin only)
 * POST /api/invites - Create new invite (admin only)
 */

export async function GET(request: NextRequest) {
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

    // Get pending invites
    const invites = await getPendingInvites()

    return NextResponse.json({
      success: true,
      data: invites
    })

  } catch (error) {
    console.error('Error in GET /api/invites:', error)
    
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
      .select('id, full_name')
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

    // Parse request body
    const body = await request.json()
    const { email, group_id } = body

    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Validate group_id
    if (!group_id || typeof group_id !== 'string') {
      return NextResponse.json(
        { error: 'Group ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Verify that the group exists
    const { data: group, error: groupError } = await supabase
      .from('user_groups')
      .select('id, name')
      .eq('id', group_id)
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Group not found', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Create invite
    const invite = await createInvite({
      email,
      groupId: group_id,
      invitedBy: currentUser.id,
      inviterName: currentUser.full_name
    })

    return NextResponse.json({
      success: true,
      data: invite
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/invites:', error)
    
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
