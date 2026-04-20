import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPermissions } from '@/lib/services/permissions'

/**
 * API Route for Current User
 *
 * GET  /api/users/me - Get current user with permissions
 * PATCH /api/users/me - Update own profile (full_name, avatar_url, onboarding_completed)
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        auth_user_id,
        email,
        full_name,
        avatar_url,
        group_id,
        status,
        last_access,
        onboarding_completed,
        created_at,
        updated_at,
        user_groups!group_id(
          id,
          name,
          description
        )
      `)
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (currentUser.status === 'inactive') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const permissions = await getUserPermissions(currentUser.id)

    return NextResponse.json({
      success: true,
      data: {
        ...currentUser,
        permissions,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível processar sua solicitação' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, status')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (currentUser.status === 'inactive') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()

    // Only allow updating safe self-service fields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.full_name === 'string' && body.full_name.trim().length > 0) {
      updates.full_name = body.full_name.trim()
    }

    if (body.avatar_url !== undefined) {
      updates.avatar_url = body.avatar_url ?? null
    }

    if (body.onboarding_completed === true) {
      updates.onboarding_completed = true
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.id)
      .select('id, email, full_name, avatar_url, onboarding_completed')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Não foi possível processar sua solicitação' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: updatedUser })
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível processar sua solicitação' },
      { status: 500 }
    )
  }
}
