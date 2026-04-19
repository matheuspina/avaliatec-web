"use client"

import { useEffect, useRef, useState } from "react"
import { renderAsync } from "docx-preview"
import * as XLSX from "xlsx"
import DOMPurify from "isomorphic-dompurify"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type OfficeMode =
  | "docx"
  | "sheet"
  | "ppt"
  | "doc-legacy"
  | "unsupported"

function getOfficeMode(mime: string, fileName: string): OfficeMode {
  const m = mime.toLowerCase()
  const ext = (fileName.split(".").pop() ?? "").toLowerCase()

  if (ext === "docx" || m.includes("wordprocessingml")) return "docx"
  if (ext === "doc" || m === "application/msword") return "doc-legacy"

  if (
    ext === "xlsx" ||
    ext === "xls" ||
    ext === "csv" ||
    m.includes("spreadsheetml") ||
    m === "application/vnd.ms-excel" ||
    m === "text/csv" ||
    m === "application/csv"
  ) {
    return "sheet"
  }

  if (
    ext === "pptx" ||
    ext === "ppt" ||
    m.includes("presentationml") ||
    m.includes("powerpoint")
  ) {
    return "ppt"
  }

  if (m === "application/octet-stream" && ext) {
    if (ext === "docx") return "docx"
    if (ext === "doc") return "doc-legacy"
    if (ext === "xlsx" || ext === "xls" || ext === "csv") return "sheet"
    if (ext === "pptx" || ext === "ppt") return "ppt"
  }

  return "unsupported"
}

function UnsupportedMessage({ mode }: { mode: OfficeMode }) {
  const text =
    mode === "doc-legacy"
      ? "A pré-visualização do formato .doc (Word antigo) não está disponível no navegador. Utilize Baixar."
      : mode === "ppt"
        ? "A pré-visualização de PowerPoint no navegador não está disponível. Utilize Baixar."
        : "Este formato não tem pré-visualização. Utilize Baixar para abrir no computador."

  return (
    <div className="flex min-h-[min(78vh,760px)] items-center justify-center px-6 py-12">
      <p className="max-w-md text-center text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

interface OfficePreviewProps {
  fileId: string
  fileName: string
  mimeType: string
}

export function OfficePreview({ fileId, fileName, mimeType }: OfficePreviewProps) {
  const docxBodyRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetHtmlByName, setSheetHtmlByName] = useState<Record<string, string>>(
    {}
  )
  const [sheetNames, setSheetNames] = useState<string[]>([])

  const mode = getOfficeMode(mimeType, fileName)

  useEffect(() => {
    if (mode !== "docx" && mode !== "sheet") {
      setLoading(false)
      return
    }

    let cancelled = false
    let raf = 0

    async function run(docxBody: HTMLDivElement | null) {
      setLoading(true)
      setError(null)
      setSheetHtmlByName({})
      setSheetNames([])
      if (mode === "docx" && !docxBody) {
        setError("Não foi possível preparar a pré-visualização.")
        setLoading(false)
        return
      }
      if (docxBody) docxBody.innerHTML = ""

      const res = await fetch(`/api/files/${fileId}/view`, {
        credentials: "include",
      })
      if (!res.ok) {
        if (!cancelled) {
          setError("Não foi possível carregar o ficheiro.")
          setLoading(false)
        }
        return
      }

      const ab = await res.arrayBuffer()
      if (cancelled) return

      try {
        if (mode === "docx" && docxBody) {
          await renderAsync(ab, docxBody, undefined, {
            className: "docx-preview",
          })
        } else if (mode === "sheet") {
          const wb = XLSX.read(ab, { type: "array" })
          const names = wb.SheetNames
          const map: Record<string, string> = {}
          for (const sn of names) {
            const ws = wb.Sheets[sn]
            if (!ws) continue
            const raw = XLSX.utils.sheet_to_html(ws)
            map[sn] = DOMPurify.sanitize(raw, {
              USE_PROFILES: { html: true },
            })
          }
          const ok = names.filter((n) => map[n])
          if (ok.length === 0) {
            if (!cancelled)
              setError("A folha de cálculo está vazia ou é inválida.")
          } else {
            setSheetNames(ok)
            setSheetHtmlByName(map)
          }
        }
      } catch {
        if (!cancelled) {
          setError("Não foi possível renderizar este documento. Utilize Baixar.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    function schedule(attempt = 0) {
      if (cancelled) return
      const docxBody = docxBodyRef.current
      if (mode === "docx" && !docxBody && attempt < 30) {
        raf = requestAnimationFrame(() => schedule(attempt + 1))
        return
      }
      void run(mode === "docx" ? docxBody : null)
    }

    schedule()

    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
    }
  }, [fileId, fileName, mimeType, mode])

  if (mode === "doc-legacy" || mode === "ppt" || mode === "unsupported") {
    return <UnsupportedMessage mode={mode} />
  }

  return (
    <div
      className={cn(
        "relative min-h-[min(78vh,760px)] w-full overflow-auto",
        loading && "min-h-[320px]"
      )}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && !loading && (
        <div className="flex min-h-[280px] items-center justify-center px-6">
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {error}
          </p>
        </div>
      )}

      {mode === "docx" && !error && (
        <div
          ref={docxBodyRef}
          className="docx-preview-root bg-background px-4 py-4 text-foreground [&_.docx-wrapper]:!font-sans"
        />
      )}

      {mode === "sheet" && sheetNames.length > 0 && !error && (
        <>
          {sheetNames.length === 1 ? (
            <div className="px-2 pb-4 pt-2">
              <div
                className="overflow-x-auto rounded-md border bg-card text-sm [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: sheetHtmlByName[sheetNames[0]!] ?? "",
                }}
              />
            </div>
          ) : (
            <Tabs defaultValue={sheetNames[0]} className="w-full">
              <div className="sticky top-0 z-[1] border-b bg-background/95 px-2 py-2 backdrop-blur">
                <TabsList className="flex h-auto max-w-full flex-wrap justify-start gap-1 overflow-x-auto">
                  {sheetNames.map((n) => (
                    <TabsTrigger key={n} value={n} className="text-xs">
                      {n}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {sheetNames.map((n) => (
                <TabsContent key={n} value={n} className="mt-0 px-2 pb-4 pt-2">
                  <div
                    className="overflow-x-auto rounded-md border bg-card text-sm [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: sheetHtmlByName[n] ?? "",
                    }}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}
