import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Projects Management
 * 
 * GET /api/projects - List all projects (filtered by RLS)
 * POST /api/projects - Create new project
 */

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'projetos', async (userId) => {
    try {
      const supabase = await createClient()

      // RLS policies will automatically filter projects based on team_members
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching projects:', error)
        return NextResponse.json(
          { error: 'Failed to fetch projects', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: projects
      })
    } catch (error) {
      console.error('Error in GET /api/projects:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'projetos', async (userId) => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      // Validate required fields
      if (!body.name) {
        return NextResponse.json(
          { error: 'Project name is required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // Create project with user as team member
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          ...body,
          created_by: userId,
          team_members: [userId, ...(body.team_members || [])]
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating project:', error)
        return NextResponse.json(
          { error: 'Failed to create project', code: 'CREATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: project,
        message: 'Project created successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error in POST /api/projects:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
