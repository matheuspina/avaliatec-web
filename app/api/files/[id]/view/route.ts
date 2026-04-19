import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { driveDownloadStream } from '@/lib/services/googleDriveService'
import { Readable } from 'stream'

/**
 * GET /api/files/[id]/view
 *
 * Same stream as download but Content-Disposition: inline for embedding / preview.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'arquivos', async () => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: file, error } = await supabase
        .from('files')
        .select('name, original_name, mime_type, external_file_id')
        .eq('id', id)
        .single()

      if (error || !file) {
        return NextResponse.json(
          { error: 'File not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      const externalId = (file as { external_file_id: string | null }).external_file_id
      if (!externalId) {
        return NextResponse.json(
          { error: 'File has no external storage reference', code: 'NO_EXTERNAL_REF' },
          { status: 422 }
        )
      }

      const { stream, mimeType, name } = await driveDownloadStream(externalId)

      const displayName =
        (file as { original_name?: string }).original_name ||
        (file as { name: string }).name ||
        name

      const safeFilename = displayName.replace(/[^\w.\-_ ]/g, '_')

      const webStream = Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>

      return new NextResponse(webStream, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${safeFilename}"`,
          'Cache-Control': 'no-store',
        },
      })
    } catch (error) {
      console.error('Error in GET /api/files/[id]/view:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json(
        { error: message, code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  })
}
