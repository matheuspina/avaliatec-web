/**
 * Google Drive Service
 *
 * Uses a service account for all Drive operations.
 * Credentials are read from GOOGLE_SERVICE_ACCOUNT_KEY (serialized JSON string).
 * The folder hierarchy is:
 *   GOOGLE_DRIVE_ROOT_FOLDER_ID/
 *     {projectId}/          ← created on first upload for each project
 *       {file or folder}
 *
 * All operations that mutate state in Drive are also expected to be reflected in
 * the `files` Supabase table by the calling API route.
 */

import { google, drive_v3 } from 'googleapis'
import { Readable } from 'stream'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DriveFileMetadata {
  id: string
  name: string
  mimeType: string
  size: number | null
  webViewLink: string | null
  createdTime: string | null
  modifiedTime: string | null
  parents: string[]
  isFolder: boolean
}

export interface DriveUploadResult {
  id: string
  name: string
  mimeType: string
  size: number | null
  webViewLink: string | null
  createdTime: string | null
  parents: string[]
}

export interface DriveListResult {
  files: DriveFileMetadata[]
  nextPageToken?: string
}

// ---------------------------------------------------------------------------
// Config & client singleton
// ---------------------------------------------------------------------------

const FOLDER_MIME = 'application/vnd.google-apps.folder'
const SCOPES = ['https://www.googleapis.com/auth/drive']

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set. ' +
        'Serialize the service account JSON into this variable.'
    )
  }

  let credentials: object
  try {
    credentials = JSON.parse(raw)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.')
  }

  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES })
}

function getDriveClient(): drive_v3.Drive {
  return google.drive({ version: 'v3', auth: getAuth() })
}

function getRootFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  if (!id) {
    throw new Error(
      'GOOGLE_DRIVE_ROOT_FOLDER_ID environment variable is not set.'
    )
  }
  return id
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDriveFile(f: drive_v3.Schema$File): DriveFileMetadata {
  return {
    id: f.id ?? '',
    name: f.name ?? '',
    mimeType: f.mimeType ?? '',
    size: f.size ? parseInt(f.size, 10) : null,
    webViewLink: f.webViewLink ?? null,
    createdTime: f.createdTime ?? null,
    modifiedTime: f.modifiedTime ?? null,
    parents: f.parents ?? [],
    isFolder: f.mimeType === FOLDER_MIME,
  }
}

// ---------------------------------------------------------------------------
// Folder resolution with simple in-process cache
// ---------------------------------------------------------------------------

// Cache: "parentId:folderName" → folderId
const folderCache = new Map<string, string>()

/**
 * Finds a child folder by name inside a parent, or creates it if absent.
 */
async function getOrCreateFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId: string
): Promise<string> {
  const cacheKey = `${parentId}:${name}`
  const cached = folderCache.get(cacheKey)
  if (cached) return cached

  // Search for existing folder
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  })

  const existing = res.data.files?.[0]?.id
  if (existing) {
    folderCache.set(cacheKey, existing)
    return existing
  }

  // Create folder
  const created = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: 'id',
  })

  const newId = created.data.id!
  folderCache.set(cacheKey, newId)
  return newId
}

/**
 * Returns the Drive folder ID for a given projectId, creating it if needed.
 * Folder path: root → projectId
 */
export async function resolveProjectFolder(projectId: string): Promise<string> {
  const drive = getDriveClient()
  const rootId = getRootFolderId()
  return getOrCreateFolder(drive, projectId, rootId)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List files/folders inside a Drive folder.
 * @param folderId  Folder to list. Defaults to root.
 * @param pageToken Pagination token.
 */
export async function driveListFolder(
  folderId?: string,
  pageToken?: string
): Promise<DriveListResult> {
  const drive = getDriveClient()
  const rootId = getRootFolderId()
  const parentId = folderId ?? rootId
  const isRoot = !folderId || folderId === rootId || folderId === 'root'

  const FIELDS =
    'nextPageToken, files(id, name, mimeType, size, webViewLink, createdTime, modifiedTime, parents)'

  // At root level: only show items shared with this service account.
  // The service account has no own files — everything relevant is sharedWithMe.
  if (isRoot) {
    const sharedRes = await drive.files.list({
      q: 'sharedWithMe = true and trashed = false',
      fields: FIELDS,
      orderBy: 'folder, name',
      pageSize: 100,
      pageToken,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    })

    const files = (sharedRes.data.files ?? []).map(toDriveFile)
    files.sort((a, b) => {
      if (a.isFolder === b.isFolder) return a.name.localeCompare(b.name)
      return a.isFolder ? -1 : 1
    })

    return { files, nextPageToken: sharedRes.data.nextPageToken ?? undefined }
  }

  // Inside a sub-folder: normal query
  const res = await drive.files.list({
    q: `'${parentId}' in parents and trashed = false`,
    fields: FIELDS,
    orderBy: 'folder, name',
    pageSize: 100,
    pageToken,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  })

  return {
    files: (res.data.files ?? []).map(toDriveFile),
    nextPageToken: res.data.nextPageToken ?? undefined,
  }
}

/**
 * Upload a file buffer to Drive inside a specific folder.
 */
export async function driveUploadFile(params: {
  name: string
  mimeType: string
  buffer: Buffer
  folderId: string
}): Promise<DriveUploadResult> {
  const drive = getDriveClient()

  const readable = new Readable()
  readable.push(params.buffer)
  readable.push(null)

  const res = await drive.files.create({
    requestBody: {
      name: params.name,
      mimeType: params.mimeType,
      parents: [params.folderId],
    },
    media: { mimeType: params.mimeType, body: readable },
    fields: 'id, name, mimeType, size, webViewLink, createdTime, parents',
  })

  const f = res.data
  return {
    id: f.id ?? '',
    name: f.name ?? '',
    mimeType: f.mimeType ?? '',
    size: f.size ? parseInt(f.size, 10) : null,
    webViewLink: f.webViewLink ?? null,
    createdTime: f.createdTime ?? null,
    parents: f.parents ?? [],
  }
}

/**
 * Download a Drive file and return a readable stream (for HTTP streaming).
 */
export async function driveDownloadStream(
  fileId: string
): Promise<{ stream: Readable; mimeType: string; name: string }> {
  const drive = getDriveClient()

  // Fetch metadata first to get name and mimeType
  const meta = await drive.files.get({
    fileId,
    fields: 'name, mimeType',
  })

  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  )

  return {
    stream: res.data as unknown as Readable,
    mimeType: meta.data.mimeType ?? 'application/octet-stream',
    name: meta.data.name ?? fileId,
  }
}

/**
 * Get metadata for a single Drive file.
 */
export async function driveGetMetadata(
  fileId: string
): Promise<DriveFileMetadata> {
  const drive = getDriveClient()

  const res = await drive.files.get({
    fileId,
    fields:
      'id, name, mimeType, size, webViewLink, createdTime, modifiedTime, parents',
  })

  return toDriveFile(res.data)
}

/**
 * Rename a Drive file (name only — does not move between folders).
 */
export async function driveRenameFile(
  fileId: string,
  newName: string
): Promise<DriveFileMetadata> {
  const drive = getDriveClient()

  const res = await drive.files.update({
    fileId,
    requestBody: { name: newName },
    fields:
      'id, name, mimeType, size, webViewLink, createdTime, modifiedTime, parents',
  })

  return toDriveFile(res.data)
}

/**
 * Delete a Drive file permanently (moves to trash = false for immediate removal).
 */
export async function driveDeleteFile(fileId: string): Promise<void> {
  const drive = getDriveClient()
  await drive.files.delete({ fileId })
}
