"use client"

import { useState, useEffect, useCallback, useRef, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Protected } from "@/components/protected"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AppMainBleed } from "@/components/app-main-bleed"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Upload,
  Search,
  FileText,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  FileCode,
  Download,
  Trash2,
  Pencil,
  FolderOpen,
  Folder,
  ChevronRight,
  MoreVertical,
  Loader2,
  AlertCircle,
  HardDrive,
  ArrowLeft,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  FilePreviewModal,
  isFilePreviewable,
} from "@/components/arquivos/file-preview-modal"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriveFolder {
  item_type: "folder"
  id: string
  name: string
  drive_folder_id: string
  parent_folder_id: string | null
  created_at: string | null
}

interface DriveFile {
  item_type: "file"
  id: string
  name: string
  original_name: string
  file_type: string
  mime_type: string
  size_bytes: number
  project_id: string | null
  uploaded_by: string | null
  created_at: string | null
  updated_at: string | null
  external_file_id: string | null
  web_view_link: string | null
  drive_parent_id: string | null
}

type DriveItem = DriveFolder | DriveFile

interface BreadcrumbEntry {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "—"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function getFileIcon(mimeType: string, size = "h-5 w-5") {
  if (mimeType.startsWith("image/"))
    return <ImageIcon className={cn(size, "text-blue-400")} />
  if (mimeType === "application/pdf")
    return <FileText className={cn(size, "text-red-400")} />
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return <FileSpreadsheet className={cn(size, "text-emerald-400")} />
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className={cn(size, "text-blue-500")} />
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return <FileCode className={cn(size, "text-amber-400")} />
  return <File className={cn(size, "text-muted-foreground")} />
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ArquivosPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Navigation
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([])
  const currentFolderId = breadcrumbs.at(-1)?.id ?? null

  // File listing
  const [items, setItems] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search
  const [searchTerm, setSearchTerm] = useState("")

  // Upload
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DriveFile | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Rename
  const [renameTarget, setRenameTarget] = useState<DriveFile | null>(null)
  const [renameName, setRenameName] = useState("")
  const [, startRenameTransition] = useTransition()

  // Preview modal
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null)

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const loadItems = useCallback(
    async (folderId?: string) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (folderId) params.set("folder_id", folderId)
        const res = await fetch(`/api/files${params.size ? `?${params}` : ""}`)
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? "Erro ao carregar arquivos")
        }
        const json = await res.json()
        setItems(json.data ?? [])
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao carregar arquivos"
        setError(msg)
        toast({ title: "Erro", description: msg, variant: "destructive" })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    loadItems()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function openFolder(folder: DriveFolder) {
    setBreadcrumbs((prev) => [
      ...prev,
      { id: folder.drive_folder_id, name: folder.name },
    ])
    loadItems(folder.drive_folder_id)
  }

  function navigateTo(index: number) {
    const next = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(next)
    const fid = next.at(-1)?.id
    loadItems(fid)
  }

  function navigateToRoot() {
    setBreadcrumbs([])
    loadItems()
  }

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    let succeeded = 0
    let failed = 0
    for (const file of Array.from(fileList)) {
      const fd = new FormData()
      fd.append("file", file)
      if (currentFolderId) fd.append("folder_id", currentFolderId)
      try {
        const res = await fetch("/api/files", { method: "POST", body: fd })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? "Upload falhou")
        }
        succeeded++
      } catch (err) {
        failed++
        console.error("Upload error:", err)
      }
    }
    setUploading(false)
    if (succeeded > 0)
      toast({
        title: `${succeeded} arquivo(s) enviado(s)`,
        description: "Arquivo(s) salvo(s) no Google Drive.",
      })
    if (failed > 0)
      toast({
        title: `${failed} arquivo(s) não enviado(s)`,
        description: "Verifique o tipo/tamanho do arquivo.",
        variant: "destructive",
      })
    await loadItems(currentFolderId ?? undefined)
  }

  // ---------------------------------------------------------------------------
  // Download
  // ---------------------------------------------------------------------------

  function downloadFile(file: { id: string }) {
    window.open(`/api/files/${file.id}/download`, "_blank")
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/files/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "Erro ao excluir")
      }
      toast({ title: "Arquivo excluído" })
      setDeleteTarget(null)
      await loadItems(currentFolderId ?? undefined)
    } catch (err) {
      toast({
        title: "Erro ao excluir",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Rename
  // ---------------------------------------------------------------------------

  function openRename(file: DriveFile) {
    setRenameTarget(file)
    setRenameName(file.name)
  }

  function submitRename() {
    if (!renameTarget || !renameName.trim()) return
    startRenameTransition(async () => {
      try {
        const res = await fetch(`/api/files/${renameTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: renameName.trim() }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? "Erro ao renomear")
        }
        toast({ title: "Arquivo renomeado" })
        setRenameTarget(null)
        await loadItems(currentFolderId ?? undefined)
      } catch (err) {
        toast({
          title: "Erro ao renomear",
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        })
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const folders = filteredItems.filter((i) => i.item_type === "folder") as DriveFolder[]
  const files = filteredItems.filter((i) => i.item_type === "file") as DriveFile[]

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <AppMainBleed className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-none">Arquivos</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">Google Drive</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadItems(currentFolderId ?? undefined)}
              disabled={loading}
              title="Atualizar"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>

            <Protected section="arquivos" action="create">
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => uploadFiles(e.target.files)}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  size="sm"
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? "Enviando…" : "Upload"}
                </Button>
              </>
            </Protected>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <button
            onClick={navigateToRoot}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Drive</span>
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              {i === breadcrumbs.length - 1 ? (
                <span className="rounded px-1.5 py-0.5 font-medium">{crumb.name}</span>
              ) : (
                <button
                  onClick={() => navigateTo(i)}
                  className="rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {crumb.name}
                </button>
              )}
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar nesta pasta…"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Drop zone + Content */}
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col transition-colors",
          isDragOver && "bg-primary/5"
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          uploadFiles(e.dataTransfer.files)
        }}
      >
        {isDragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-primary/50">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Upload className="h-10 w-10" />
              <span className="text-sm font-medium">Solte para fazer upload</span>
            </div>
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="flex flex-1 items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <EmptyState
            icon={<AlertCircle className="h-12 w-12 text-destructive" />}
            title="Erro ao carregar arquivos"
            description={error}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadItems(currentFolderId ?? undefined)}
              >
                Tentar novamente
              </Button>
            }
          />
        )}

        {!loading && !error && (
          <div className="flex flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
            {/* Back button when inside a sub-folder */}
            {breadcrumbs.length > 0 && (
              <button
                onClick={() => {
                  const prev = breadcrumbs.slice(0, -1)
                  setBreadcrumbs(prev)
                  loadItems(prev.at(-1)?.id)
                }}
                className="mb-3 flex w-max items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}

            {filteredItems.length === 0 ? (
              <EmptyState
                icon={<Folder className="h-12 w-12" />}
                title="Pasta vazia"
                description="Não há arquivos aqui ainda. Faça upload ou arraste arquivos."
              />
            ) : (
              <div className="rounded-lg border">
                {/* Folders section */}
                {folders.length > 0 && (
                  <div>
                    <div className="border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Pastas
                    </div>
                    <div className="divide-y">
                      {folders.map((folder) => (
                        <FolderRow
                          key={folder.id}
                          folder={folder}
                          onOpen={() => openFolder(folder)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Files section */}
                {files.length > 0 && (
                  <div>
                    <div
                      className={cn(
                        "px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
                        folders.length > 0 && "border-t"
                      )}
                    >
                      Arquivos
                    </div>
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                      <span>Nome</span>
                      <span className="w-20 text-right">Tamanho</span>
                      <span className="w-24 text-right">Data</span>
                      <span className="w-8" />
                    </div>
                    <div className="divide-y">
                      {files.map((file) => (
                        <FileRow
                          key={file.id}
                          file={file}
                          onDownload={() => downloadFile(file)}
                          onRename={() => openRename(file)}
                          onDelete={() => setDeleteTarget(file)}
                          onPreview={
                            isFilePreviewable(file)
                              ? () => setPreviewFile(file)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Excluir arquivo"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmText={deleting ? "Excluindo…" : "Excluir"}
        variant="destructive"
      />

      <FilePreviewModal
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        initialFile={previewFile}
        directoryFiles={files}
        onDownload={downloadFile}
      />

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear arquivo</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
            placeholder="Novo nome"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={submitRename} disabled={!renameName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppMainBleed>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="text-muted-foreground/40">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

function FolderRow({
  folder,
  onOpen,
}: {
  folder: DriveFolder
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
    >
      <Folder className="h-5 w-5 flex-shrink-0 text-amber-400" />
      <span className="truncate text-sm font-medium">{folder.name}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
    </button>
  )
}

function FileRow({
  file,
  onDownload,
  onRename,
  onDelete,
  onPreview,
}: {
  file: DriveFile
  onDownload: () => void
  onRename: () => void
  onDelete: () => void
  onPreview?: () => void
}) {
  const canPreview = Boolean(onPreview)

  const nameBlock = (
    <>
      <span className="flex-shrink-0">{getFileIcon(file.mime_type)}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight">{file.name}</p>
      </div>
    </>
  )

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/30">
      {/* Name + icon */}
      {canPreview ? (
        <button
          type="button"
          onClick={onPreview}
          className="flex min-w-0 items-center gap-2.5 rounded-md text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          {nameBlock}
        </button>
      ) : (
        <div className="flex min-w-0 items-center gap-2.5">{nameBlock}</div>
      )}

      {/* Size */}
      <span className="w-20 text-right text-xs text-muted-foreground">
        {formatBytes(file.size_bytes)}
      </span>

      {/* Date */}
      <span className="w-24 text-right text-xs text-muted-foreground">
        {formatDate(file.created_at)}
      </span>

      {/* Actions */}
      <div className="w-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </DropdownMenuItem>
            <Protected section="arquivos" action="edit">
              <DropdownMenuItem onClick={onRename}>
                <Pencil className="mr-2 h-4 w-4" />
                Renomear
              </DropdownMenuItem>
            </Protected>
            <DropdownMenuSeparator />
            <Protected section="arquivos" action="delete">
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </Protected>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
