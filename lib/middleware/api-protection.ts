import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/services/permissions'
import type { SectionKey } from '@/lib/types'

/**
 * Permission denied error details
 */
interface PermissionDeniedLog {
  userId: string
  userEmail: string
  section: SectionKey
  action: 'view' | 'create' | 'edit' | 'delete'
  path: string
  method: string
  timestamp: string
}

/**
 * Logs permission denied attempts for security audit
 */
function logPermissionDenied(details: PermissionDeniedLog): void {
  console.warn('[PERMISSION_DENIED]', JSON.stringify({
    ...details,
    severity: 'WARNING',
    type: 'UNAUTHORIZED_ACCESS_ATTEMPT'
  }))
}

/**
 * Maps HTTP methods to permission actions
 */
function getActionFromMethod(method: string): 'view' | 'create' | 'edit' | 'delete' | null {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'view'
    case 'POST':
      return 'create'
    case 'PUT':
    case 'PATCH':
      return 'edit'
    case 'DELETE':
      return 'delete'
    default:
      return null
  }
}

/**
 * Middleware to verify user permissions before API operations
 * 
 * @param request - The Next.js request object
 * @param section - The section key to check permissions for
 * @param handler - The actual API handler function to execute if permission is granted
 * @returns NextResponse with either the handler result or 403 Forbidden
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withPermissionCheck(request, 'projetos', async (userId) => {
 *     // Your API logic here
 *     return NextResponse.json({ data: [] })
 *   })
 * }
 * ```
 */
export async function withPermissionCheck(
  request: NextRequest,
  section: SectionKey,
  handler: (userId: string, authUserId: string) => Promise<NextResponse>
): Promise<NextResponse> {
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
      .select('id, email, status')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if user is active
    if (currentUser.status !== 'active') {
      return NextResponse.json(
        { error: 'User account is inactive', code: 'USER_INACTIVE' },
        { status: 403 }
      )
    }

    // Determine the action based on HTTP method
    const action = getActionFromMethod(request.method)
    if (!action) {
      return NextResponse.json(
        { error: 'Invalid HTTP method', code: 'INVALID_METHOD' },
        { status: 405 }
      )
    }

    // Check if user has permission for this action
    const hasPermission = await checkPermission(currentUser.id, section, action)
    
    if (!hasPermission) {
      // Log the permission denied attempt
      logPermissionDenied({
        userId: currentUser.id,
        userEmail: currentUser.email,
        section,
        action,
        path: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        {
          error: 'Permission denied',
          code: 'PERMISSION_DENIED',
          details: {
            section,
            action,
            message: `You do not have permission to ${action} in ${section}`
          }
        },
        { status: 403 }
      )
    }

    // Permission granted, execute the handler
    return await handler(currentUser.id, user.id)

  } catch (error) {
    console.error('[API_PROTECTION_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * Middleware specifically for admin-only operations
 * 
 * @param request - The Next.js request object
 * @param handler - The actual API handler function to execute if user is admin
 * @returns NextResponse with either the handler result or 403 Forbidden
 * 
 * @example
 * ```typescript
 * export async function DELETE(request: NextRequest) {
 *   return withAdminCheck(request, async (userId) => {
 *     // Your admin-only API logic here
 *     return NextResponse.json({ success: true })
 *   })
 * }
 * ```
 */
export async function withAdminCheck(
  request: NextRequest,
  handler: (userId: string, authUserId: string) => Promise<NextResponse>
): Promise<NextResponse> {
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

    // Get current user from users table with group info
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        status,
        user_groups!inner(name)
      `)
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if user is active
    if (currentUser.status !== 'active') {
      return NextResponse.json(
        { error: 'User account is inactive', code: 'USER_INACTIVE' },
        { status: 403 }
      )
    }

    // Check if user is admin
    const isAdmin = (currentUser as any).user_groups?.name === 'Administrador'
    
    if (!isAdmin) {
      // Log the permission denied attempt
      logPermissionDenied({
        userId: currentUser.id,
        userEmail: currentUser.email,
        section: 'configuracoes',
        action: 'edit',
        path: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        {
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED',
          details: {
            message: 'This operation requires administrator privileges'
          }
        },
        { status: 403 }
      )
    }

    // Admin check passed, execute the handler
    return await handler(currentUser.id, user.id)

  } catch (error) {
    console.error('[ADMIN_CHECK_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * Helper to get authenticated user without permission checks
 * Useful for endpoints that need user info but have custom permission logic
 * 
 * @param request - The Next.js request object
 * @returns Object with user IDs or null if not authenticated
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ userId: string; authUserId: string; email: string } | null> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return null
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, email, status')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !currentUser || currentUser.status !== 'active') {
      return null
    }

    return {
      userId: currentUser.id,
      authUserId: user.id,
      email: currentUser.email
    }
  } catch (error) {
    console.error('[GET_AUTH_USER_ERROR]', error)
    return null
  }
}
