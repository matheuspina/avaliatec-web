import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Individual Task Operations
 * 
 * GET /api/tasks/[id] - Get task details
 * PUT /api/tasks/[id] - Update task
 * DELETE /api/tasks/[id] - Delete task
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'kanban', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching task:', error)
        return NextResponse.json(
          { error: 'Task not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: task
      })
    } catch (error) {
      console.error('Error in GET /api/tasks/[id]:', error)
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
  return withPermissionCheck(request, 'kanban', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()
      const body = await request.json()

      const { data: task, error } = await supabase
        .from('tasks')
        .update(body)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating task:', error)
        return NextResponse.json(
          { error: 'Failed to update task', code: 'UPDATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: task,
        message: 'Task updated successfully'
      })
    } catch (error) {
      console.error('Error in PUT /api/tasks/[id]:', error)
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
  return withPermissionCheck(request, 'kanban', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting task:', error)
        return NextResponse.json(
          { error: 'Failed to delete task', code: 'DELETE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Task deleted successfully'
      })
    } catch (error) {
      console.error('Error in DELETE /api/tasks/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
