import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Files Management
 * 
 * GET /api/files - List all files (filtered by RLS based on project access)
 * POST /api/files - Upload new file
 */

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'arquivos', async (userId) => {
    try {
      const supabase = await createClient()
      const { searchParams } = new URL(request.url)
      const projectId = searchParams.get('project_id')

      let query = supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false })

      // Filter by project if specified
      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data: files, error } = await query

      if (error) {
        console.error('Error fetching files:', error)
        return NextResponse.json(
          { error: 'Failed to fetch files', code: 'FETCH_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: files
      })
    } catch (error) {
      console.error('Error in GET /api/files:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'arquivos', async (userId) => {
    try {
      const supabase = await createClient()
      const body = await request.json()

      // Validate required fields
      if (!body.name || !body.path) {
        return NextResponse.json(
          { error: 'File name and path are required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // If project_id is provided, verify user has access to the project
      if (body.project_id) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('id', body.project_id)
          .single()

        if (projectError || !project) {
          return NextResponse.json(
            { error: 'Project not found or access denied', code: 'PROJECT_ACCESS_DENIED' },
            { status: 403 }
          )
        }
      }

      // Create file record
      const { data: file, error } = await supabase
        .from('files')
        .insert({
          ...body,
          uploaded_by: userId
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating file record:', error)
        return NextResponse.json(
          { error: 'Failed to create file record', code: 'CREATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: file,
        message: 'File uploaded successfully'
      }, { status: 201 })
    } catch (error) {
      console.error('Error in POST /api/files:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
