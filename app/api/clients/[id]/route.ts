import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Individual Client Operations
 * 
 * GET /api/clients/[id] - Get client details
 * PUT /api/clients/[id] - Update client
 * DELETE /api/clients/[id] - Delete client
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'clientes', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json(
          { error: 'Client not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: client
      })
    } catch (error) {
      console.error('Error in GET /api/clients/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'clientes', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()
      const body = await request.json()

      const { data: client, error } = await supabase
        .from('clients')
        .update(body)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating client:', error)
        return NextResponse.json(
          { error: 'Failed to update client', code: 'UPDATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: client,
        message: 'Client updated successfully'
      })
    } catch (error) {
      console.error('Error in PUT /api/clients/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'clientes', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json(
          { error: 'Failed to delete client', code: 'DELETE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Client deleted successfully'
      })
    } catch (error) {
      console.error('Error in DELETE /api/clients/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
