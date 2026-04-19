import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'
import { driveDownloadStream } from '@/lib/services/googleDriveService'
import { resolveDriveFileForStream } from '@/lib/server/resolveDriveFileForStream'
import { Readable } from 'stream'

/**
 * GET /api/files/[id]/view
 *
 * Same stream as download but Content-Disposition: inline for embedding / preview.
 * [id] may be Supabase UUID or Google Drive file id (see resolveDriveFileForStream).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'arquivos', async () => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const resolved = await resolveDriveFileForStream(supabase, id)
      if (!resolved.ok) {
        return NextResponse.json(resolved.json, { status: resolved.status })
      }

      let stream: Readable
      let mimeType: string
      let name: string

      try {
        const result = await driveDownloadStream(resolved.externalId)
        stream = result.stream
        mimeType = result.mimeType
        name = result.name
      } catch {
        return NextResponse.json(
          { error: 'File not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      const displayName = resolved.displayName || name

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
