"use client"

/**
 * EmailViewer Component
 * Displays full email content with metadata, body, and attachments
 */

import { useEmail } from "@/contexts/email-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar } from "@/components/ui/avatar"
import { 
  Mail, 
  Calendar, 
  Users, 
  Paperclip,
  Download,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import DOMPurify from "isomorphic-dompurify"

interface EmailViewerProps {
  className?: string
}

export function EmailViewer({ className }: EmailViewerProps) {
  const { selectedEmail, loadingEmailDetail } = useEmail()

  if (loadingEmailDetail) {
    return (
      <div className={cn("flex h-full items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading email...</p>
        </div>
      </div>
    )
  }

  if (!selectedEmail) {
    return (
      <div className={cn("flex h-full items-center justify-center", className)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Mail className="h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            Select an email to view its content
          </p>
        </div>
      </div>
    )
  }

  // Sanitize HTML content
  const sanitizedBody = DOMPurify.sanitize(
    selectedEmail.body.contentType === "html" 
      ? selectedEmail.body.content 
      : `<pre>${selectedEmail.body.content}</pre>`,
    {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td",
        "div", "span", "pre", "code", "blockquote"
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "style"],
    }
  )

  // Format date
  const formattedDate = format(
    new Date(selectedEmail.receivedDateTime),
    "EEEE, MMMM d, yyyy 'at' h:mm a"
  )

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Email Header */}
      <div className="border-b bg-background p-6">
        {/* Subject */}
        <h1 className="text-2xl font-semibold">
          {selectedEmail.subject || "(No subject)"}
        </h1>

        {/* Metadata */}
        <div className="mt-4 space-y-3">
          {/* From */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-medium text-primary">
                {selectedEmail.from.emailAddress.name.charAt(0).toUpperCase()}
              </div>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {selectedEmail.from.emailAddress.name}
                </span>
                {!selectedEmail.isRead && (
                  <Badge variant="secondary" className="text-xs">
                    Unread
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedEmail.from.emailAddress.address}
              </div>
            </div>
          </div>

          {/* To Recipients */}
          {selectedEmail.toRecipients && selectedEmail.toRecipients.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">To: </span>
                <span>
                  {selectedEmail.toRecipients
                    .map((r) => r.emailAddress.name || r.emailAddress.address)
                    .join(", ")}
                </span>
              </div>
            </div>
          )}

          {/* CC Recipients */}
          {selectedEmail.ccRecipients && selectedEmail.ccRecipients.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Cc: </span>
                <span>
                  {selectedEmail.ccRecipients
                    .map((r) => r.emailAddress.name || r.emailAddress.address)
                    .join(", ")}
                </span>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        </div>
      </div>

      {/* Attachments Section */}
      {selectedEmail.hasAttachments && (
        <>
          <Separator />
          <AttachmentList emailId={selectedEmail.id} />
        </>
      )}
    </div>
  )
}

/**
 * AttachmentList Component
 * Displays and handles email attachments
 */
interface AttachmentListProps {
  emailId: string
}

function AttachmentList({ emailId }: AttachmentListProps) {
  const { selectedEmail } = useEmail()
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())

  if (!selectedEmail?.attachments || selectedEmail.attachments.length === 0) {
    return null
  }

  const handleDownload = async (attachmentId: string, attachmentName: string) => {
    // Prevent multiple simultaneous downloads of the same attachment
    if (downloadingIds.has(attachmentId)) return

    setDownloadingIds(prev => new Set(prev).add(attachmentId))

    try {
      // Get the Graph client token from context
      const { getMicrosoftTokenWithRefresh } = await import("@/lib/microsoft/token-manager")
      const { MicrosoftGraphClient } = await import("@/lib/microsoft/graph-client")
      
      const result = await getMicrosoftTokenWithRefresh()
      
      if (result.error || !result.token) {
        throw new Error(result.error || "Failed to get access token")
      }

      const client = new MicrosoftGraphClient(result.token)
      const blob = await client.downloadAttachment(emailId, attachmentId)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = attachmentName
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download attachment:", error)
      // You could add a toast notification here
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(attachmentId)
        return newSet
      })
    }
  }

  // Get file icon based on content type
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return "🖼️"
    } else if (contentType.includes("pdf")) {
      return "📄"
    } else if (contentType.includes("word") || contentType.includes("document")) {
      return "📝"
    } else if (contentType.includes("excel") || contentType.includes("spreadsheet")) {
      return "📊"
    } else if (contentType.includes("zip") || contentType.includes("compressed")) {
      return "📦"
    }
    return "📎"
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="border-t bg-muted/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Attachments ({selectedEmail.attachments.length})
        </span>
      </div>
      
      <div className="space-y-2">
        {selectedEmail.attachments.map((attachment) => {
          const isDownloading = downloadingIds.has(attachment.id)
          
          return (
            <div
              key={attachment.id}
              className="flex items-center justify-between rounded-lg border bg-background p-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="text-2xl shrink-0">
                  {getFileIcon(attachment.contentType)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {attachment.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>•</span>
                    <span className="truncate">{attachment.contentType}</span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(attachment.id, attachment.name)}
                disabled={isDownloading}
                className="shrink-0 ml-2"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span className="ml-2">Download</span>
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
