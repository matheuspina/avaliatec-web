import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, invalidatePermissionsCache } from '@/lib/services/permissions'

/**
 * API Route for Individual User Management
 * 
 * PUT /api/users/[id] - Update user (admin only)
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: userId } = await params

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

    // Check if user is admin
    const adminCheck = await isAdmin(currentUser.id)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'ADMIN_REQUIRED' },
        { status: 403 }
      )
    }

    // Validate user ID format
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid user ID', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        group_id,
        status,
        user_groups!group_id(name)
      `)
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Prepare update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Handle group_id change
    if (body.group_id !== undefined) {
      if (body.group_id === null) {
        updates.group_id = null
      } else {
        // Validate new group exists
        const { data: newGroup, error: groupError } = await supabase
          .from('user_groups')
          .select('id, name')
          .eq('id', body.group_id)
          .single()

        if (groupError || !newGroup) {
          return NextResponse.json(
            { error: 'Group not found', code: 'GROUP_NOT_FOUND' },
            { status: 404 }
          )
        }

        updates.group_id = body.group_id

        // Log group change (could be expanded to a proper audit trail)
        console.log(`User ${targetUser.email} group changed from ${(targetUser as any).user_groups?.name || 'none'} to ${newGroup.name} by admin ${currentUser.id}`)
        
        // Invalidate user's permission cache
        invalidatePermissionsCache(userId)
      }
    }

    // Handle status change
    if (body.status !== undefined) {
      if (body.status !== 'active' && body.status !== 'inactive') {
        return NextResponse.json(
          { error: 'Invalid status. Must be "active" or "inactive"', code: 'INVALID_STATUS' },
          { status: 400 }
        )
      }

      // If deactivating, check if this is the last admin user
      if (body.status === 'inactive' && (targetUser as any).user_groups?.name === 'Administrador') {
        // Count active admin users
        const { data: adminUsers, error: adminError } = await supabase
          .from('users')
          .select('id, user_groups!group_id(name)')
          .eq('status', 'active')

        if (adminError) {
          console.error('Error checking admin users:', adminError)
          return NextResponse.json(
            { error: 'Failed to validate admin status', code: 'VALIDATION_ERROR' },
            { status: 500 }
          )
        }

        // Count how many active admins exist
        const activeAdminCount = adminUsers?.filter(u => 
          (u as any).user_groups?.name === 'Administrador'
        ).length || 0

        if (activeAdminCount <= 1) {
          return NextResponse.json(
            { 
              error: 'Cannot deactivate the last admin user', 
              code: 'LAST_ADMIN',
              details: { 
                message: 'At least one admin user must remain active in the system.'
              }
            },
            { status: 409 }
          )
        }
      }

      updates.status = body.status

      // Log status change
      console.log(`User ${targetUser.email} status changed from ${targetUser.status} to ${body.status} by admin ${currentUser.id}`)
      
      // If deactivating, invalidate user's permission cache
      if (body.status === 'inactive') {
        invalidatePermissionsCache(userId)
      }
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select(`
        id,
        auth_user_id,
        email,
        full_name,
        avatar_url,
        group_id,
        status,
        last_access,
        created_at,
        updated_at,
        user_groups!group_id(
          id,
          name,
          description
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user', code: 'UPDATE_ERROR' },
        { status: 500 }
      )
    }

    // Transform response to include group information
    const response = {
      id: updatedUser.id,
      auth_user_id: updatedUser.auth_user_id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      avatar_url: updatedUser.avatar_url,
      group_id: updatedUser.group_id,
      status: updatedUser.status,
      last_access: updatedUser.last_access,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
      group: (updatedUser as any).user_groups ? {
        id: (updatedUser as any).user_groups.id,
        name: (updatedUser as any).user_groups.name,
        description: (updatedUser as any).user_groups.description
      } : null
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
