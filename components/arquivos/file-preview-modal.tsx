"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import "@cyntler/react-doc-viewer/dist/index.css"

const DocViewer = dynamic(
  () => import("@cyntler/react-doc-viewer").then((m) => m.default),
  { ssr: false, loading: () => <LoadingBlock /> }
)

// ---------------------------------------------------------------------------
// Types (aligned with page)
// ---------------------------------------------------------------------------

export interface PreviewDriveFile {
  id: string
  name: string
  mime_type: string
}

export type PreviewKind = "pdf" | "office" | "image" | "video"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getPreviewKind(mime: string): PreviewKind | null {
  const m = mime.toLowerCase()
  if (m === "application/pdf") return "pdf"
  if (m.startsWith("image/")) return "image"
  if (m.startsWith("video/")) return "video"
  if (
    m.includes("wordprocessingml") ||
    m === "application/msword" ||
    m.includes("spreadsheetml") ||
    m.includes("ms-excel") ||
    m.includes("presentationml") ||
    m.includes("powerpoint") ||
    m === "application/vnd.ms-powerpoint" ||
    m === "application/vnd.ms-excel"
  ) {
    return "office"
  }
  return null
}

export function isFilePreviewable(file: PreviewDriveFile): boolean {
  return getPreviewKind(file.mime_type) !== null
}

function viewUrl(fileId: string): string {
  return `/api/files/${fileId}/view`
}

function LoadingBlock() {
  return (
    <div className="flex min-h-[320px] items-center justify-center bg-muted/30">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FilePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFile: PreviewDriveFile | null
  directoryFiles: PreviewDriveFile[]
  onDownload: (file: PreviewDriveFile) => void
}

export function FilePreviewModal({
  open,
  onOpenChange,
  initialFile,
  directoryFiles,
  onDownload,
}: FilePreviewModalProps) {
  const [activeFile, setActiveFile] = useState<PreviewDriveFile | null>(null)

  useEffect(() => {
    if (open && initialFile) setActiveFile(initialFile)
    if (!open) setActiveFile(null)
  }, [open, initialFile])

  const kind = activeFile ? getPreviewKind(activeFile.mime_type) : null

  const imageGallery = useMemo(
    () =>
      directoryFiles.filter((f) => getPreviewKind(f.mime_type) === "image"),
    [directoryFiles]
  )

  const videoGallery = useMemo(
    () =>
      directoryFiles.filter((f) => getPreviewKind(f.mime_type) === "video"),
    [directoryFiles]
  )

  const galleryList = useMemo(() => {
    if (!activeFile || !kind) return []
    if (kind === "image") return imageGallery
    if (kind === "video") return videoGallery
    return []
  }, [activeFile, kind, imageGallery, videoGallery])

  const galleryIndex = useMemo(() => {
    if (!activeFile || galleryList.length === 0) return -1
    return galleryList.findIndex((f) => f.id === activeFile.id)
  }, [activeFile, galleryList])

  const goPrev = useCallback(() => {
    if (galleryIndex <= 0 || galleryList.length === 0) return
    setActiveFile(galleryList[galleryIndex - 1]!)
  }, [galleryIndex, galleryList])

  const goNext = useCallback(() => {
    if (galleryIndex < 0 || galleryIndex >= galleryList.length - 1) return
    setActiveFile(galleryList[galleryIndex + 1]!)
  }, [galleryIndex, galleryList])

  useEffect(() => {
    if (!open || galleryList.length <= 1) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, galleryList.length, goPrev, goNext])

  const showGalleryChrome = kind === "image" || kind === "video"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(92vh,900px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1100px)]",
          showGalleryChrome && "pb-0"
        )}
        aria-describedby={undefined}
      >
        {activeFile && (
          <>
            <DialogHeader className="flex-shrink-0 border-b px-4 py-3 pr-12 text-left sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DialogTitle className="truncate text-left text-base font-medium">
                  {activeFile.name}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {showGalleryChrome && galleryList.length > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {galleryIndex + 1} / {galleryList.length}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onDownload(activeFile)}
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/20">
              {kind === "pdf" && (
                <iframe
                  title={activeFile.name}
                  src={viewUrl(activeFile.id)}
                  className="h-[min(78vh,760px)] w-full border-0 bg-background"
                />
              )}

              {kind === "office" && (
                <div className="h-[min(78vh,760px)] w-full overflow-auto">
                  <DocViewer
                    documents={[
                      {
                        uri: viewUrl(activeFile.id),
                        fileName: activeFile.name,
                      },
                    ]}
                    config={{
                      header: {
                        disableHeader: true,
                      },
                    }}
                    theme={{
                      primary: "hsl(var(--primary))",
                      secondary: "hsl(var(--secondary))",
                      tertiary: "hsl(var(--muted))",
                      textPrimary: "hsl(var(--foreground))",
                      textSecondary: "hsl(var(--muted-foreground))",
                      textTertiary: "hsl(var(--muted-foreground))",
                    }}
                  />
                </div>
              )}

              {kind === "image" && (
                <div className="flex h-[min(70vh,680px)] flex-col">
                  <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pt-2">
                    {galleryList.length > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full shadow-md"
                        onClick={goPrev}
                        disabled={galleryIndex <= 0}
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={viewUrl(activeFile.id)}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                    {galleryList.length > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full shadow-md"
                        onClick={goNext}
                        disabled={galleryIndex >= galleryList.length - 1}
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  {galleryList.length > 1 && (
                    <div className="flex-shrink-0 border-t bg-background/95 px-2 py-2">
                      <div
                        className="flex max-w-full gap-1.5 overflow-x-auto pb-1 pt-0.5"
                        role="tablist"
                        aria-label="Miniaturas"
                      >
                        {galleryList.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            role="tab"
                            aria-selected={f.id === activeFile.id}
                            aria-current={
                              f.id === activeFile.id ? "true" : undefined
                            }
                            onClick={() => setActiveFile(f)}
                            className={cn(
                              "relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                              f.id === activeFile.id
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-transparent opacity-80 hover:opacity-100"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={viewUrl(f.id)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {kind === "video" && (
                <div className="flex h-[min(70vh,680px)] flex-col">
                  <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/90 px-2 pt-2">
                    {galleryList.length > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full shadow-md"
                        onClick={goPrev}
                        disabled={galleryIndex <= 0}
                        aria-label="Vídeo anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    )}
                    <video
                      key={activeFile.id}
                      src={viewUrl(activeFile.id)}
                      controls
                      playsInline
                      className="max-h-full max-w-full"
                    />
                    {galleryList.length > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full shadow-md"
                        onClick={goNext}
                        disabled={galleryIndex >= galleryList.length - 1}
                        aria-label="Próximo vídeo"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                  {galleryList.length > 1 && (
                    <div className="flex-shrink-0 border-t bg-background/95 px-2 py-2">
                      <div
                        className="flex max-w-full gap-1.5 overflow-x-auto pb-1 pt-0.5"
                        role="tablist"
                        aria-label="Clips do diretório"
                      >
                        {galleryList.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            role="tab"
                            aria-selected={f.id === activeFile.id}
                            aria-current={
                              f.id === activeFile.id ? "true" : undefined
                            }
                            onClick={() => setActiveFile(f)}
                            className={cn(
                              "relative flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border-2 bg-muted transition-colors",
                              f.id === activeFile.id
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-transparent opacity-80 hover:opacity-100"
                            )}
                          >
                            <video
                              src={viewUrl(f.id)}
                              muted
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
