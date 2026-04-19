import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import {
  driveDeleteFile,
  driveRenameFile,
} from '@/lib/services/googleDriveService'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET /api/files/[id] - Get file metadata
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  return withPermissionCheck(request, 'arquivos', async () => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: file, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !file) {
        return NextResponse.json(
          { error: 'File not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, data: file })
    } catch (error) {
      console.error('Error in GET /api/files/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/files/[id] - Rename a file (same folder only)
 *
 * Body: { name: string }
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return withPermissionCheck(request, 'arquivos', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      let body: { name?: string }
      try {
        body = await request.json()
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON body', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      const newName = body.name?.trim()
      if (!newName) {
        return NextResponse.json(
          { error: 'name is required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // Fetch file record
      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('uploaded_by, external_file_id')
        .eq('id', id)
        .single()

      if (fetchError || !file) {
        return NextResponse.json(
          { error: 'File not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      // Only uploader or admin may rename
      const { data: currentUser } = await supabase
        .from('users')
        .select('id, user_groups!inner(name)')
        .eq('id', userId)
        .single()

      const isAdmin = (currentUser as { user_groups?: { name?: string } } | null)?.user_groups?.name === 'Administrador'
      const isOwner = (file as { uploaded_by: string }).uploaded_by === userId

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: 'You can only rename your own files', code: 'PERMISSION_DENIED' },
          { status: 403 }
        )
      }

      // Rename in Drive
      if ((file as { external_file_id: string | null }).external_file_id) {
        await driveRenameFile((file as { external_file_id: string }).external_file_id, newName)
      }

      // Update Supabase record
      const { data: updated, error: updateError } = await supabase
        .from('files')
        .update({ name: newName, original_name: newName })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating file name in DB:', updateError)
        return NextResponse.json(
          { error: 'Failed to update file name', code: 'UPDATE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: updated })
    } catch (error) {
      console.error('Error in PATCH /api/files/[id]:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json(
        { error: message, code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/files/[id] - Delete file from Drive and Supabase
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return withPermissionCheck(request, 'arquivos', async (userId) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: file, error: fetchError } = await supabase
        .from('files')
        .select('uploaded_by, external_file_id')
        .eq('id', id)
        .single()

      if (fetchError || !file) {
        return NextResponse.json(
          { error: 'File not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      // Ownership / admin check
      const { data: currentUser } = await supabase
        .from('users')
        .select('id, user_groups!inner(name)')
        .eq('id', userId)
        .single()

      const isAdmin = (currentUser as { user_groups?: { name?: string } } | null)?.user_groups?.name === 'Administrador'
      const isOwner = (file as { uploaded_by: string }).uploaded_by === userId

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: 'You can only delete your own files', code: 'PERMISSION_DENIED' },
          { status: 403 }
        )
      }

      // 1. Delete from Google Drive (best-effort; if already gone that's fine)
      const externalId = (file as { external_file_id: string | null }).external_file_id
      if (externalId) {
        try {
          await driveDeleteFile(externalId)
        } catch (driveErr) {
          // Log but don't abort — still remove from DB to keep consistent
          console.warn('Could not delete file from Drive (may already be gone):', driveErr)
        }
      }

      // 2. Delete from Supabase
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting file from DB:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete file record', code: 'DELETE_ERROR' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: 'File deleted successfully' })
    } catch (error) {
      console.error('Error in DELETE /api/files/[id]:', error)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
