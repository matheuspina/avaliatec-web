"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)

      if (event === "SIGNED_IN") {
        setUser(session?.user ?? null)
        router.refresh()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        router.push("/login")
        router.refresh()
      } else if (event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null)
        router.refresh()
      } else if (event === "USER_UPDATED") {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return {
    user,
    loading,
    isAuthenticated: !!user,
  }
}
