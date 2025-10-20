import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/services/permissions'

/**
 * API Route for Current User
 * 
 * GET /api/users/me - Get current user with permissions
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

    // Get current user from users table with group information
    const { data: currentUser, error: userError } = await supabase
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
      `)
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if user is inactive
    if (currentUser.status === 'inactive') {
      return NextResponse.json(
        { error: 'User account is inactive', code: 'USER_INACTIVE' },
        { status: 403 }
      )
    }

    // Get user permissions
    const permissions = await getUserPermissions(currentUser.id)

    // Transform response to include group and permissions
    const response = {
      id: currentUser.id,
      auth_user_id: currentUser.auth_user_id,
      email: currentUser.email,
      full_name: currentUser.full_name,
      avatar_url: currentUser.avatar_url,
      group_id: currentUser.group_id,
      status: currentUser.status,
      last_access: currentUser.last_access,
      created_at: currentUser.created_at,
      updated_at: currentUser.updated_at,
      group: (currentUser as any).user_groups ? {
        id: (currentUser as any).user_groups.id,
        name: (currentUser as any).user_groups.name,
        description: (currentUser as any).user_groups.description
      } : null,
      permissions
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Error in GET /api/users/me:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
