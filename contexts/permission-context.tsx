'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { UserPermissions, SectionKey, User } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface PermissionContextValue {
  permissions: UserPermissions
  hasPermission: (section: SectionKey, action: 'view' | 'create' | 'edit' | 'delete') => boolean
  isLoading: boolean
  currentUser: User | null
  refreshPermissions: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined)

interface PermissionProviderProps {
  children: React.ReactNode
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const [permissions, setPermissions] = useState<UserPermissions>({})
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadPermissions = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Get current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        console.error('Error getting authenticated user:', authError)
        setPermissions({})
        setCurrentUser(null)
        return
      }

      // Get user record from users table
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single()

      if (userError || !user) {
        console.error('Error fetching user:', userError)
        setPermissions({})
        setCurrentUser(null)
        return
      }

      setCurrentUser(user)

      // If user has no group, they have no permissions
      if (!user.group_id) {
        setPermissions({})
        return
      }

      // Get group permissions
      const { data: groupPermissions, error: permError } = await supabase
        .from('group_permissions')
        .select('section_key, can_view, can_create, can_edit, can_delete')
        .eq('group_id', user.group_id)

      if (permError) {
        console.error('Error fetching group permissions:', permError)
        setPermissions({})
        return
      }

      // Transform database permissions into UserPermissions object format
      const userPermissions: UserPermissions = {}
      
      if (groupPermissions) {
        for (const perm of groupPermissions) {
          userPermissions[perm.section_key as SectionKey] = {
            view: perm.can_view,
            create: perm.can_create,
            edit: perm.can_edit,
            delete: perm.can_delete
          }
        }
      }

      setPermissions(userPermissions)
    } catch (error) {
      console.error('Error loading permissions:', error)
      setPermissions({})
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [])

  const hasPermission = (
    section: SectionKey,
    action: 'view' | 'create' | 'edit' | 'delete'
  ): boolean => {
    return permissions[section]?.[action] ?? false
  }

  const refreshPermissions = async () => {
    await loadPermissions()
  }

  const value: PermissionContextValue = {
    permissions,
    hasPermission,
    isLoading,
    currentUser,
    refreshPermissions
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext)
  
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  
  return context
}
