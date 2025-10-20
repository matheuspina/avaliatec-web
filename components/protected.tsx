'use client'

import React from 'react'
import { usePermissions } from '@/contexts/permission-context'
import type { SectionKey } from '@/lib/types'

interface ProtectedProps {
  section: SectionKey
  action: 'view' | 'create' | 'edit' | 'delete'
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Protected component wrapper that conditionally renders children based on user permissions
 * 
 * @example
 * <Protected section="projetos" action="create">
 *   <Button>Create Project</Button>
 * </Protected>
 * 
 * @example
 * <Protected section="clientes" action="delete" fallback={<p>No access</p>}>
 *   <DeleteButton />
 * </Protected>
 */
export function Protected({ section, action, fallback = null, children }: ProtectedProps) {
  const { hasPermission, isLoading } = usePermissions()

  // Don't render anything while loading permissions
  if (isLoading) {
    return null
  }

  // Check if user has the required permission
  if (!hasPermission(section, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
