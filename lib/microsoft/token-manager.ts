/**
 * Token Management Utility
 * Handles Microsoft OAuth token extraction, validation, and refresh
 */

import { createClient } from "@/lib/supabase/client"

export interface TokenResult {
  token: string | null
  error: string | null
}

/**
 * Extract the Microsoft provider token from the current Supabase session
 */
export async function getMicrosoftToken(): Promise<TokenResult> {
  const supabase = createClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return {
        token: null,
        error: `Failed to get session: ${error.message}`,
      }
    }

    if (!session) {
      return {
        token: null,
        error: "No active session found",
      }
    }

    // Extract the provider token (Microsoft OAuth token)
    const providerToken = session.provider_token

    if (!providerToken) {
      return {
        token: null,
        error: "No provider token found in session",
      }
    }

    return {
      token: providerToken,
      error: null,
    }
  } catch (error) {
    return {
      token: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Refresh the Microsoft token by refreshing the Supabase session
 */
export async function refreshMicrosoftToken(): Promise<TokenResult> {
  const supabase = createClient()

  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()

    if (error) {
      return {
        token: null,
        error: `Failed to refresh session: ${error.message}`,
      }
    }

    if (!session) {
      return {
        token: null,
        error: "No session returned after refresh",
      }
    }

    const providerToken = session.provider_token

    if (!providerToken) {
      return {
        token: null,
        error: "No provider token found after refresh",
      }
    }

    return {
      token: providerToken,
      error: null,
    }
  } catch (error) {
    return {
      token: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get Microsoft token with automatic refresh on expiration
 * If refresh fails, returns null and the caller should redirect to login
 */
export async function getMicrosoftTokenWithRefresh(): Promise<TokenResult> {
  // Try to get the current token
  let result = await getMicrosoftToken()

  // If we have a token, return it
  if (result.token) {
    return result
  }

  // If no token or error, try to refresh
  result = await refreshMicrosoftToken()

  return result
}

/**
 * Check if the error is a token expiration error
 */
export function isTokenExpiredError(error: Error): boolean {
  const message = error.message.toLowerCase()
  return (
    message.includes("401") ||
    message.includes("unauthorized") ||
    message.includes("token") && message.includes("expired") ||
    message.includes("invalid_grant")
  )
}

/**
 * Handle token expiration by attempting refresh or redirecting to login
 */
export async function handleTokenExpiration(): Promise<string | null> {
  const result = await refreshMicrosoftToken()

  if (result.token) {
    return result.token
  }

  // If refresh failed, redirect to login
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname
    window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`
  }

  return null
}
