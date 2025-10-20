import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/services/permissions'
import { SECTIONS, type SectionKey, type GroupPermission } from '@/lib/types'

/**
 * API Route for Group Permissions Management
 * 
 * GET /api/groups/[id]/permissions - Get group permissions
 * PUT /api/groups/[id]/permissions - Update group permissions (admin only)
 */

export async function GET(
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

    // Get group permissions
    const { data: permissions, error: permError } = await supabase
      .from('group_permissions')
      .select('*')
      .eq('group_id', groupId)
      .order('section_key')

    if (permError) {
      console.error('Error fetching group permissions:', permError)
      return NextResponse.json(
        { error: 'Failed to fetch permissions', code: 'FETCH_ERROR' },
        { status: 500 }
      )
    }

    // Format permissions for UI consumption
    const formattedPermissions: Record<string, any> = {}

    // Initialize all sections with false permissions
    Object.keys(SECTIONS).forEach(sectionKey => {
      formattedPermissions[sectionKey] = {
        section_key: sectionKey,
        section_label: SECTIONS[sectionKey as SectionKey].label,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false
      }
    })

    // Override with actual permissions from database
    permissions?.forEach(perm => {
      if (formattedPermissions[perm.section_key]) {
        formattedPermissions[perm.section_key] = {
          ...formattedPermissions[perm.section_key],
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        group: existingGroup,
        permissions: Object.values(formattedPermissions)
      }
    })

  } catch (error) {
    console.error('Error in GET /api/groups/[id]/permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

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

    // Validate permissions format
    if (!body.permissions || !Array.isArray(body.permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array', code: 'INVALID_PERMISSIONS' },
        { status: 400 }
      )
    }

    // Validate that at least one section is selected (has view permission)
    const hasAnyViewPermission = body.permissions.some((perm: any) =>
      perm.can_view === true
    )

    if (!hasAnyViewPermission) {
      return NextResponse.json(
        { error: 'At least one section must have view permission', code: 'NO_SECTIONS_SELECTED' },
        { status: 400 }
      )
    }

    // Process and validate permissions
    const validPermissions: Array<{
      section_key: string
      can_view: boolean
      can_create: boolean
      can_edit: boolean
      can_delete: boolean
    }> = []

    for (const perm of body.permissions) {
      // Validate section key
      if (!perm.section_key || !SECTIONS[perm.section_key as SectionKey]) {
        return NextResponse.json(
          { error: `Invalid section key: ${perm.section_key}`, code: 'INVALID_SECTION' },
          { status: 400 }
        )
      }

      // Auto-check "view" permission when other permissions are set
      let canView = Boolean(perm.can_view)
      const canCreate = Boolean(perm.can_create)
      const canEdit = Boolean(perm.can_edit)
      const canDelete = Boolean(perm.can_delete)

      // If any higher permission is set, automatically enable view
      if (canCreate || canEdit || canDelete) {
        canView = true
      }

      validPermissions.push({
        section_key: perm.section_key,
        can_view: canView,
        can_create: canCreate,
        can_edit: canEdit,
        can_delete: canDelete
      })
    }

    // Delete existing permissions for this group
    const { error: deleteError } = await supabase
      .from('group_permissions')
      .delete()
      .eq('group_id', groupId)

    if (deleteError) {
      console.error('Error deleting existing permissions:', deleteError)
      return NextResponse.json(
        { error: 'Failed to update permissions', code: 'DELETE_ERROR' },
        { status: 500 }
      )
    }

    // Insert new permissions (only for sections that have at least view permission)
    const permissionsToInsert = validPermissions
      .filter(perm => perm.can_view) // Only insert permissions for sections with view access
      .map(perm => ({
        group_id: groupId,
        ...perm
      }))

    if (permissionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('group_permissions')
        .insert(permissionsToInsert)

      if (insertError) {
        console.error('Error inserting new permissions:', insertError)
        return NextResponse.json(
          { error: 'Failed to save permissions', code: 'INSERT_ERROR' },
          { status: 500 }
        )
      }
    }

    // Fetch updated permissions for response
    const { data: updatedPermissions, error: fetchError } = await supabase
      .from('group_permissions')
      .select('*')
      .eq('group_id', groupId)
      .order('section_key')

    if (fetchError) {
      console.error('Error fetching updated permissions:', fetchError)
      // Don't fail the request, just return success without data
    }

    // Format permissions for UI consumption
    const formattedPermissions: Record<string, any> = {}

    // Initialize all sections with false permissions
    Object.keys(SECTIONS).forEach(sectionKey => {
      formattedPermissions[sectionKey] = {
        section_key: sectionKey,
        section_label: SECTIONS[sectionKey as SectionKey].label,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false
      }
    })

    // Override with actual permissions from database
    updatedPermissions?.forEach(perm => {
      if (formattedPermissions[perm.section_key]) {
        formattedPermissions[perm.section_key] = {
          ...formattedPermissions[perm.section_key],
          can_view: perm.can_view,
          can_create: perm.can_create,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        group: existingGroup,
        permissions: Object.values(formattedPermissions)
      },
      message: 'Permissions updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/groups/[id]/permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}