import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * GET /api/activities
 * Returns paginated activity log with optional filters
 */
export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'dashboard', async () => {
    try {
      const supabase = await createClient()
      const { searchParams } = new URL(request.url)

      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const entityType = searchParams.get('entity_type') || null
      const action = searchParams.get('action') || null

      const offset = (page - 1) * limit

      // Build query
      let query = supabase
        .from('activity_log')
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          details,
          created_at,
          user:profiles!activity_log_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (entityType) {
        query = query.eq('entity_type', entityType)
      }
      if (action) {
        query = query.eq('action', action)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching activities:', error)
        return NextResponse.json(
          { success: false, message: 'Não foi possível processar sua solicitação' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          activities: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        },
      })
    } catch (error) {
      console.error('Error in GET /api/activities:', error)
      return NextResponse.json(
        { success: false, message: 'Não foi possível processar sua solicitação' },
        { status: 500 }
      )
    }
  })
}
