"use client"

import { useAuth } from "@/hooks/use-auth"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  const pathname = usePathname()

  // Show loading state while checking auth
  if (loading && !pathname.startsWith("/login")) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Carregando...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
