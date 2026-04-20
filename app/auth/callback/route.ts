import { createClient } from '@/lib/supabase/server'
import { syncUserWithDatabase } from '@/lib/services/user-sync'
import { resolveSiteOrigin, sanitizeOAuthNextParam } from '@/lib/auth/resolve-site-origin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeOAuthNextParam(searchParams.get('next'))
  const origin = resolveSiteOrigin(request)

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && sessionData?.user) {
      const user = sessionData.user
      // provider_token is available directly from exchangeCodeForSession
      const providerToken = sessionData.session?.provider_token ?? null

      try {
        // Try metadata fields first (Google, etc.)
        let fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          null

        // If no name in metadata, try Microsoft Graph API with the provider token
        if (!fullName && providerToken) {
          try {
            const graphRes = await fetch(
              'https://graph.microsoft.com/v1.0/me?$select=displayName',
              { headers: { Authorization: `Bearer ${providerToken}` } }
            )
            if (graphRes.ok) {
              const graphData = await graphRes.json()
              fullName = graphData.displayName || null
            }
          } catch {
            // Graph API call failed, fall through to email fallback
          }
        }

        await syncUserWithDatabase({
          authUserId: user.id,
          email: user.email!,
          fullName: fullName || user.email!.split('@')[0],
          avatarUrl: user.user_metadata?.avatar_url || null,
        })
      } catch (syncError) {
        // Log the error but don't block login
        console.error('User sync failed:', syncError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
