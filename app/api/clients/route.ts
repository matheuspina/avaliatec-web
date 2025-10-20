import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Clients Management
 * 
 * GET /api/clients - List all clients (filtered by RLS)
 * POST /api/clients - Create new client
 */

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'clientes', async (userId) => {
    try {
      const supabase = await createClient()

      // RLS policies will automatically filter clients based on assigned_users
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json(
          { error: 'Failed to fetch clients', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: clients
      })
    } catch (error) {
      console.error('Error in GET /api/clients:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'clientes', async (userId) => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      // Validate required fields
      if (!body.name) {
        return NextResponse.json(
          { error: 'Client name is required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // Create client with user as assigned user
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          ...body,
          created_by: userId,
          assigned_users: [userId, ...(body.assigned_users || [])]
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating client:', error)
        return NextResponse.json(
          { error: 'Failed to create client', code: 'CREATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: client,
        message: 'Client created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error in POST /api/clients:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
