import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/lib/types'

/**
 * API Route for Users Management
 * 
 * GET /api/users - List all users with filtering and search
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

    // Get query parameters for filtering and search
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const groupId = searchParams.get('group_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('users')
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
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    if (status && (status === 'active' || status === 'inactive')) {
      query = query.eq('status', status)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: users, error: usersError, count } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users', code: 'FETCH_ERROR' },
        { status: 500 }
      )
    }

    // Transform data to include group information
    const usersWithGroup = users?.map(user => ({
      id: user.id,
      auth_user_id: user.auth_user_id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      group_id: user.group_id,
      status: user.status,
      last_access: user.last_access,
      created_at: user.created_at,
      updated_at: user.updated_at,
      group: (user as any).user_groups ? {
        id: (user as any).user_groups.id,
        name: (user as any).user_groups.name,
        description: (user as any).user_groups.description
      } : null
    })) || []

    return NextResponse.json({
      success: true,
      data: usersWithGroup,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
