import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import {
  driveListFolder,
  resolveProjectFolder,
  driveUploadFile,
} from '@/lib/services/googleDriveService'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
])

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB
const BLOCKED_EXTENSIONS = new Set(['exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'js', 'msi'])

/**
 * GET /api/files
 *
 * Query params:
 *   project_id   – required: filters files to a project folder in Drive
 *   folder_id    – optional: Drive folder ID to navigate into a sub-folder
 *   page_token   – optional: Drive pagination token
 *
 * Returns Drive contents merged with Supabase metadata.
 */
export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'arquivos', async (userId) => {
    try {
      const supabase = await createClient()
      const { searchParams } = new URL(request.url)
      const projectId = searchParams.get('project_id')
      const folderId = searchParams.get('folder_id')
      const pageToken = searchParams.get('page_token') ?? undefined

      // Determine which Drive folder to list:
      // 1. explicit folder_id (sub-folder navigation)
      // 2. project_id → resolve project sub-folder
      // 3. neither → list Drive root
      let targetFolderId: string
      if (folderId) {
        targetFolderId = folderId
      } else if (projectId) {
        targetFolderId = await resolveProjectFolder(projectId)
      } else {
        targetFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? 'root'
      }

      // List Drive contents
      const driveResult = await driveListFolder(targetFolderId, pageToken)

      // Fetch Supabase metadata for files that are tracked
      const externalIds = driveResult.files
        .filter((f) => !f.isFolder)
        .map((f) => f.id)

      const dbRows = externalIds.length > 0
        ? await supabase
            .from('files')
            .select('*')
            .eq('external_provider', 'google_drive')
            .in('external_file_id', externalIds)
            .then(({ data }) => data ?? [])
        : []

      const dbByExternalId = new Map(
        dbRows.map((row: Record<string, unknown>) => [row.external_file_id as string, row])
      )

      // Merge Drive items with DB rows
      const items = driveResult.files.map((f) => {
        if (f.isFolder) {
          return {
            item_type: 'folder' as const,
            id: f.id,
            name: f.name,
            drive_folder_id: f.id,
            parent_folder_id: f.parents[0] ?? null,
            created_at: f.createdTime,
          }
        }

        const db = dbByExternalId.get(f.id)
        return {
          item_type: 'file' as const,
          // DB fields take precedence; fall back to Drive metadata
          id: db ? (db as Record<string, unknown>).id : f.id,
          name: f.name,
          original_name: db ? (db as Record<string, unknown>).original_name : f.name,
          file_type: f.mimeType.split('/')[1] ?? 'other',
          mime_type: f.mimeType,
          size_bytes: f.size ?? 0,
          storage_path: '',
          project_id: db ? (db as Record<string, unknown>).project_id : projectId,
          uploaded_by: db ? (db as Record<string, unknown>).uploaded_by : null,
          created_at: db ? (db as Record<string, unknown>).created_at : f.createdTime,
          updated_at: db ? (db as Record<string, unknown>).updated_at : f.modifiedTime,
          external_provider: 'google_drive' as const,
          external_file_id: f.id,
          web_view_link: f.webViewLink,
          drive_parent_id: f.parents[0] ?? null,
        }
      })

      return NextResponse.json({
        success: true,
        data: items,
        next_page_token: driveResult.nextPageToken ?? null,
        current_folder_id: targetFolderId,
      })
    } catch (error) {
      console.error('Error in GET /api/files:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json(
        { error: message, code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/files  (multipart/form-data)
 *
 * Form fields:
 *   file        – File blob (required)
 *   project_id  – UUID of the project (optional)
 *   folder_id   – Drive folder ID to upload into; defaults to root
 */
export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'arquivos', async (userId) => {
    try {
      const supabase = await createClient()

      let formData: FormData
      try {
        formData = await request.formData()
      } catch {
        return NextResponse.json(
          { error: 'Expected multipart/form-data', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      const fileBlob = formData.get('file') as File | null
      const projectId = formData.get('project_id') as string | null
      const folderId = formData.get('folder_id') as string | null

      if (!fileBlob) {
        return NextResponse.json(
          { error: 'file is required', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.has(fileBlob.type)) {
        return NextResponse.json(
          { error: `File type "${fileBlob.type}" is not allowed`, code: 'INVALID_FILE_TYPE' },
          { status: 422 }
        )
      }

      // Validate extension
      const ext = fileBlob.name.split('.').pop()?.toLowerCase() ?? ''
      if (BLOCKED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `File extension .${ext} is not allowed`, code: 'INVALID_FILE_TYPE' },
          { status: 422 }
        )
      }

      // Validate size
      if (fileBlob.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
            code: 'FILE_TOO_LARGE',
          },
          { status: 422 }
        )
      }

      // Resolve target folder
      let targetFolderId: string
      if (folderId) {
        targetFolderId = folderId
      } else if (projectId) {
        targetFolderId = await resolveProjectFolder(projectId)
      } else {
        targetFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? 'root'
      }

      // Upload to Google Drive
      const buffer = Buffer.from(await fileBlob.arrayBuffer())
      const driveFile = await driveUploadFile({
        name: fileBlob.name,
        mimeType: fileBlob.type,
        buffer,
        folderId: targetFolderId,
      })

      // Persist metadata in Supabase
      const { data: fileRecord, error: insertError } = await supabase
        .from('files')
        .insert({
          name: fileBlob.name,
          original_name: fileBlob.name,
          file_type: fileBlob.type.split('/')[1] ?? ext,
          mime_type: fileBlob.type,
          size_bytes: fileBlob.size,
          storage_path: '',
          project_id: projectId,
          uploaded_by: userId,
          external_provider: 'google_drive',
          external_file_id: driveFile.id,
          web_view_link: driveFile.webViewLink,
          drive_parent_id: targetFolderId,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error saving file metadata to Supabase:', insertError)
        // Drive file was uploaded but DB insert failed — log and return the Drive data at minimum
        return NextResponse.json(
          {
            error: 'File uploaded to Drive but metadata save failed. Contact support.',
            code: 'METADATA_SAVE_ERROR',
            drive_file_id: driveFile.id,
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { success: true, data: fileRecord, message: 'File uploaded successfully' },
        { status: 201 }
      )
    } catch (error) {
      console.error('Error in POST /api/files:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json(
        { error: message, code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
