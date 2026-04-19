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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Sync user with database after successful authentication
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          await syncUserWithDatabase({
            authUserId: user.id,
            email: user.email!,
            fullName: user.user_metadata?.full_name || user.email!.split('@')[0],
            avatarUrl: user.user_metadata?.avatar_url || null
          })
        }
      } catch (syncError) {
        // Log the error but don't block login
        // User can continue with limited permissions
        console.error('User sync failed:', syncError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
