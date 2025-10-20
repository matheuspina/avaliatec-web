import { createClient } from '@/lib/supabase/server'
import type { UserPermissions, SectionKey, Permission } from '@/lib/types'

// Cache for user permissions to minimize database queries
const permissionsCache = new Map<string, { permissions: UserPermissions; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches user's group permissions from database and transforms them into UserPermissions format
 * @param userId - The user's ID from the users table
 * @returns UserPermissions object with permissions for each section
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  // Check cache first
  const cached = permissionsCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions
  }

  const supabase = await createClient()

  // Get user's group_id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('group_id')
    .eq('id', userId)
    .single()

  if (userError || !user?.group_id) {
    console.error('Error fetching user group:', userError)
    return {}
  }

  // Get group permissions
  const { data: groupPermissions, error: permError } = await supabase
    .from('group_permissions')
    .select('section_key, can_view, can_create, can_edit, can_delete')
    .eq('group_id', user.group_id)

  if (permError) {
    console.error('Error fetching group permissions:', permError)
    return {}
  }

  // Transform database permissions into UserPermissions object format
  const permissions: UserPermissions = {}
  
  if (groupPermissions) {
    for (const perm of groupPermissions) {
      permissions[perm.section_key as SectionKey] = {
        view: perm.can_view,
        create: perm.can_create,
        edit: perm.can_edit,
        delete: perm.can_delete
      }
    }
  }

  // Cache the permissions
  permissionsCache.set(userId, {
    permissions,
    timestamp: Date.now()
  })

  return permissions
}

/**
 * Quick boolean check for a specific permission
 * @param userId - The user's ID from the users table
 * @param section - The section key to check
 * @param action - The action to check (view, create, edit, delete)
 * @returns Boolean indicating if user has the permission
 */
export async function checkPermission(
  userId: string,
  section: SectionKey,
  action: 'view' | 'create' | 'edit' | 'delete'
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  return permissions[section]?.[action] ?? false
}

/**
 * Invalidates the permissions cache for a specific user
 * Should be called when user's group changes or group permissions are updated
 * @param userId - The user's ID to invalidate cache for
 */
export function invalidatePermissionsCache(userId?: string): void {
  if (userId) {
    permissionsCache.delete(userId)
  } else {
    // Clear entire cache if no userId specified
    permissionsCache.clear()
  }
}

/**
 * Checks if a user is an administrator
 * @param userId - The user's ID from the users table
 * @returns Boolean indicating if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      group_id,
      user_groups!inner(name)
    `)
    .eq('id', userId)
    .single()

  if (error || !user) {
    return false
  }

  return (user as any).user_groups?.name === 'Administrador'
}
