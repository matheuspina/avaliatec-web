import { createClient } from '@/lib/supabase/server'
import { syncUserWithDatabase } from '@/lib/services/user-sync'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

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

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
