import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/services/permissions'

/**
 * API Route for Individual Group Management
 * 
 * PUT /api/groups/[id] - Update group (admin only)
 * DELETE /api/groups/[id] - Delete group (admin only)
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: groupId } = await params

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

    // Validate group ID format
    if (!groupId || typeof groupId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid group ID', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // Check if group exists
    const { data: existingGroup, error: groupError } = await supabase
      .from('user_groups')
      .select('id, name')
      .eq('id', groupId)
      .single()

    if (groupError || !existingGroup) {
      return NextResponse.json(
        { error: 'Group not found', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string', code: 'INVALID_NAME' },
        { status: 400 }
      )
    }

    // Validate name length
    if (body.name.length < 3 || body.name.length > 50) {
      return NextResponse.json(
        { error: 'Name must be between 3 and 50 characters', code: 'INVALID_NAME_LENGTH' },
        { status: 400 }
      )
    }

    // Check if new name already exists (excluding current group)
    if (body.name.trim() !== existingGroup.name) {
      const { data: nameCheck, error: checkError } = await supabase
        .from('user_groups')
        .select('id')
        .eq('name', body.name.trim())
        .neq('id', groupId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking group name:', checkError)
        return NextResponse.json(
          { error: 'Failed to validate group name', code: 'VALIDATION_ERROR' },
          { status: 500 }
        )
      }

      if (nameCheck) {
        return NextResponse.json(
          { error: 'Group name already exists', code: 'NAME_EXISTS' },
          { status: 409 }
        )
      }
    }

    // Update group
    const { data: updatedGroup, error: updateError } = await supabase
      .from('user_groups')
      .update({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        is_default: body.is_default || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating group:', updateError)
      return NextResponse.json(
        { error: 'Failed to update group', code: 'UPDATE_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedGroup,
      message: 'Group updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/groups/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: groupId } = await params

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

    // Validate group ID format
    if (!groupId || typeof groupId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid group ID', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    // Check if group exists
    const { data: existingGroup, error: groupError } = await supabase
      .from('user_groups')
      .select('id, name')
      .eq('id', groupId)
      .single()

    if (groupError || !existingGroup) {
      return NextResponse.json(
        { error: 'Group not found', code: 'GROUP_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if group has assigned users
    const { data: assignedUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('group_id', groupId)
      .limit(1)

    if (usersError) {
      console.error('Error checking assigned users:', usersError)
      return NextResponse.json(
        { error: 'Failed to check group usage', code: 'CHECK_ERROR' },
        { status: 500 }
      )
    }

    if (assignedUsers && assignedUsers.length > 0) {
      // Get user count for error message
      const { count: userCount, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)

      return NextResponse.json(
        { 
          error: 'Cannot delete group with assigned users', 
          code: 'GROUP_HAS_USERS',
          details: { 
            userCount: userCount || 0,
            message: `This group has ${userCount || 'some'} assigned users. Please reassign them to another group first.`
          }
        },
        { status: 409 }
      )
    }

    // Delete group
    const { error: deleteError } = await supabase
      .from('user_groups')
      .delete()
      .eq('id', groupId)

    if (deleteError) {
      console.error('Error deleting group:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete group', code: 'DELETE_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/groups/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}