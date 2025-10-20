import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Individual Project Operations
 * 
 * GET /api/projects/[id] - Get project details
 * PUT /api/projects/[id] - Update project
 * DELETE /api/projects/[id] - Delete project
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'projetos', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching project:', error)
        return NextResponse.json(
          { error: 'Project not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: project
      })
    } catch (error) {
      console.error('Error in GET /api/projects/[id]:', error)
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
  return withPermissionCheck(request, 'projetos', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()
      const body = await request.json()

      const { data: project, error } = await supabase
        .from('projects')
        .update(body)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating project:', error)
        return NextResponse.json(
          { error: 'Failed to update project', code: 'UPDATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: project,
        message: 'Project updated successfully'
      })
    } catch (error) {
      console.error('Error in PUT /api/projects/[id]:', error)
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
  return withPermissionCheck(request, 'projetos', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting project:', error)
        return NextResponse.json(
          { error: 'Failed to delete project', code: 'DELETE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Project deleted successfully'
      })
    } catch (error) {
      console.error('Error in DELETE /api/projects/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
