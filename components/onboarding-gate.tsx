"use client"

import { useEffect, useState } from "react"
import { usePermissions } from "@/contexts/permission-context"
import { OnboardingModal } from "@/components/onboarding-modal"

/**
 * Renders the onboarding modal for new users who haven't completed onboarding yet.
 * Must be used inside PermissionProvider.
 */
export function OnboardingGate() {
  const { currentUser, isLoading, refreshPermissions } = usePermissions()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isLoading && currentUser && !currentUser.onboarding_completed) {
      setShowModal(true)
    }
  }, [isLoading, currentUser])

  if (!showModal || !currentUser) return null

  const handleComplete = async (fullName: string, avatarUrl: string | null) => {
    setShowModal(false)
    // Refresh so sidebar/avatar reflect the new data immediately
    await refreshPermissions()
  }

  return (
    <OnboardingModal
      open={showModal}
      initialName={currentUser.full_name ?? ""}
      userId={currentUser.id}
      onComplete={handleComplete}
    />
  )
}
