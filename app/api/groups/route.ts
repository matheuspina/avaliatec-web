import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/services/permissions'
import type { UserGroup } from '@/lib/types'

/**
 * API Route for Groups Management
 * 
 * GET /api/groups - List all groups
 * POST /api/groups - Create new group (admin only)
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

    // Fetch all groups with user count
    const { data: groups, error: groupsError } = await supabase
      .from('user_groups')
      .select(`
        id,
        name,
        description,
        is_default,
        created_by,
        created_at,
        updated_at,
        users!group_id(count)
      `)
      .order('name')

    if (groupsError) {
      console.error('Error fetching groups:', groupsError)
      return NextResponse.json(
        { error: 'Failed to fetch groups', code: 'FETCH_ERROR' },
        { status: 500 }
      )
    }

    // Transform the data to include user count
    const groupsWithCount = groups?.map(group => ({
      ...group,
      user_count: group.users?.[0]?.count || 0,
      users: undefined // Remove the users array from response
    })) || []

    return NextResponse.json({
      success: true,
      data: groupsWithCount
    })

  } catch (error) {
    console.error('Error in GET /api/groups:', error)
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

    // Check if group name already exists
    const { data: existingGroup, error: checkError } = await supabase
      .from('user_groups')
      .select('id')
      .eq('name', body.name.trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking group name:', checkError)
      return NextResponse.json(
        { error: 'Failed to validate group name', code: 'VALIDATION_ERROR' },
        { status: 500 }
      )
    }

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Group name already exists', code: 'NAME_EXISTS' },
        { status: 409 }
      )
    }

    // Create new group
    const { data: newGroup, error: createError } = await supabase
      .from('user_groups')
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        is_default: body.is_default || false,
        created_by: currentUser.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating group:', createError)
      return NextResponse.json(
        { error: 'Failed to create group', code: 'CREATE_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newGroup,
      message: 'Group created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/groups:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}