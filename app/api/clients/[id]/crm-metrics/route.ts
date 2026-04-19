import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * GET /api/clients/[id]/crm-metrics
 *
 * Returns full CRM detail for a single client via the get_client_crm_detail RPC.
 * Includes revenue totals, project counts, dates, and an embedded project list.
 * Period filtering (for average calculations) is done client-side.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'clientes', async () => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data, error } = await supabase.rpc('get_client_crm_detail', {
        p_client_id: id,
      })

      if (error) {
        console.error('Error fetching client CRM detail:', error)
        return NextResponse.json(
          { error: 'Failed to load CRM metrics', code: 'RPC_ERROR' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Client not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('Error in GET /api/clients/[id]/crm-metrics:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
