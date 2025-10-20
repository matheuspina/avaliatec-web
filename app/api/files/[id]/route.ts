import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

/**
 * API Route for Individual File Operations
 * 
 * GET /api/files/[id] - Get file details
 * DELETE /api/files/[id] - Delete file
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'arquivos', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: file, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching file:', error)
        return NextResponse.json(
          { error: 'File not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: file
      })
    } catch (error) {
      console.error('Error in GET /api/files/[id]:', error)
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
  return withPermissionCheck(request, 'arquivos', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      // Get file to check ownership or admin status
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('uploaded_by')
        .eq('id', id)
        .single()

      if (fetchError || !file) {
        return NextResponse.json(
          { error: 'File not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      // Check if user is the uploader or admin
      const { data: currentUser } = await supabase
        .from('users')
        .select(`
          id,
          user_groups!inner(name)
        `)
        .eq('id', userId)
        .single()

      const isAdmin = (currentUser as any)?.user_groups?.name === 'Administrador'
      const isOwner = file.uploaded_by === userId

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: 'You can only delete your own files', code: 'PERMISSION_DENIED' },
          { status: 403 }
        )
      }

      // Delete file record
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json(
          { error: 'Failed to delete file', code: 'DELETE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      })
    } catch (error) {
      console.error('Error in DELETE /api/files/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
