import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Tasks Management
 * 
 * GET /api/tasks - List all tasks (filtered by RLS)
 * POST /api/tasks - Create new task
 */

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'kanban', async (userId) => {
    try {
      const supabase = await createClient()

      // RLS policies will automatically filter tasks based on assigned users and watchers
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tasks:', error)
        return NextResponse.json(
          { error: 'Failed to fetch tasks', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: tasks
      })
    } catch (error) {
      console.error('Error in GET /api/tasks:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'kanban', async (userId) => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      // Validate required fields
      if (!body.title) {
        return NextResponse.json(
          { error: 'Task title is required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // Create task with user as watcher
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          ...body,
          created_by: userId,
          watchers: [userId, ...(body.watchers || [])]
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating task:', error)
        return NextResponse.json(
          { error: 'Failed to create task', code: 'CREATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: task,
        message: 'Task created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error in POST /api/tasks:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
