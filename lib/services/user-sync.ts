import { createClient } from '@/lib/supabase/server'
import { User, UserSyncError } from '@/lib/types'

/**
 * Parameters for syncing a user with the database
 */
export interface SyncUserParams {
  authUserId: string
  email: string
  fullName: string
  avatarUrl?: string | null
}

/**
 * Syncs an authenticated user with the users table in Supabase.
 * 
 * This function:
 * - Checks if the user exists by auth_user_id
 * - Creates a new user with default group if not exists
 * - Updates existing user data and last_access timestamp
 * - Handles database connection errors gracefully
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5, 8.7
 * 
 * @param params - User data from authentication provider
 * @returns The synced user record
 * @throws UserSyncError if sync fails
 */
export async function syncUserWithDatabase(params: SyncUserParams): Promise<User> {
  const { authUserId, email, fullName, avatarUrl } = params

  try {
    const supabase = await createClient()

    // Check if user exists by auth_user_id
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (fetchError) {
      throw new UserSyncError(
        `Failed to fetch user from database: ${fetchError.message}`
      )
    }

    // If user exists, update their data and last_access timestamp
    if (existingUser) {
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          email,
          full_name: fullName,
          avatar_url: avatarUrl,
          last_access: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        throw new UserSyncError(
          `Failed to update user in database: ${updateError.message}`
        )
      }

      return updatedUser
    }

    // User doesn't exist, create new user with default group
    // First, get the default group
    const { data: defaultGroup, error: groupError } = await supabase
      .from('user_groups')
      .select('id')
      .eq('is_default', true)
      .maybeSingle()

    if (groupError) {
      throw new UserSyncError(
        `Failed to fetch default group: ${groupError.message}`
      )
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUserId,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
        group_id: defaultGroup?.id || null,
        status: 'active',
        last_access: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      throw new UserSyncError(
        `Failed to create user in database: ${createError.message}`
      )
    }

    return newUser
  } catch (error) {
    // If it's already a UserSyncError, rethrow it
    if (error instanceof UserSyncError) {
      throw error
    }

    // Wrap other errors in UserSyncError
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new UserSyncError(
      `User sync failed: ${errorMessage}`
    )
  }
}
