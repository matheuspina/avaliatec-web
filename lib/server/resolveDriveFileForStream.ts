import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve which Drive file to stream for GET /view and /download.
 *
 * `paramId` may be:
 * - Supabase `files.id` (UUID)
 * - Google Drive `external_file_id` when the row exists
 * - Google Drive file id only (listing merges Drive items without a DB row — see GET /api/files)
 */
export async function resolveDriveFileForStream(
  supabase: SupabaseClient,
  paramId: string
): Promise<
  | { ok: true; externalId: string; displayName: string }
  | { ok: false; status: 422; json: Record<string, unknown> }
> {
  const { data: byId } = await supabase
    .from('files')
    .select('name, original_name, external_file_id')
    .eq('id', paramId)
    .maybeSingle()

  if (byId) {
    const ext = (byId as { external_file_id: string | null }).external_file_id
    if (!ext) {
      return {
        ok: false,
        status: 422,
        json: {
          error: 'File has no external storage reference',
          code: 'NO_EXTERNAL_REF',
        },
      }
    }
    const displayName =
      (byId as { original_name?: string | null }).original_name ||
      (byId as { name: string }).name
    return { ok: true, externalId: ext, displayName }
  }

  const { data: byExt } = await supabase
    .from('files')
    .select('name, original_name, external_file_id')
    .eq('external_provider', 'google_drive')
    .eq('external_file_id', paramId)
    .maybeSingle()

  if (byExt?.external_file_id) {
    const displayName =
      (byExt as { original_name?: string | null }).original_name ||
      (byExt as { name: string }).name
    return { ok: true, externalId: byExt.external_file_id, displayName }
  }

  // Sem linha no Supabase: o listador expõe o id do ficheiro no Drive (GET /api/files).
  return { ok: true, externalId: paramId, displayName: '' }
}
