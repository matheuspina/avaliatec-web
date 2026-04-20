import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * GET /api/dashboard
 * Returns aggregated dashboard data via the get_dashboard_data RPC.
 */
export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'dashboard', async () => {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase.rpc('get_dashboard_data')

      if (error) {
        console.error('Error calling get_dashboard_data RPC:', error)
        return NextResponse.json(
          { success: false, message: 'Não foi possível processar sua solicitação' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    } catch (error) {
      console.error('Error in GET /api/dashboard:', error)
      return NextResponse.json(
        { success: false, message: 'Não foi possível processar sua solicitação' },
        { status: 500 }
      )
    }
  })
}
