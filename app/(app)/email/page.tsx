"use client"

import { useState, useEffect } from "react"
import { EmailProvider, useEmail } from "@/contexts/email-context"
import { FolderSidebar } from "@/components/email/folder-sidebar"
import { EmailListPanel } from "@/components/email/email-list-panel"
import { EmailViewer } from "@/components/email/email-viewer"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AlertCircle, RefreshCw, Mail, Menu, ArrowLeft } from "lucide-react"

function EmailContent() {
  const { loading, error, clearError, refreshFolders, folders, selectedEmail } = useEmail()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [showMobileViewer, setShowMobileViewer] = useState(false)

  // Reset mobile viewer when screen size changes to desktop or when selectedEmail changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileViewer(false)
      }
    }

    // Initial check
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Reset mobile viewer when email is deselected
  useEffect(() => {
    if (!selectedEmail) {
      setShowMobileViewer(false)
    }
  }, [selectedEmail])

  // Initial loading state
  if (loading && folders.length === 0) {
    return (
      <div className="-m-6 flex h-[calc(100vh-0rem)] overflow-hidden">
        {/* Folder Sidebar Skeleton */}
        <div className="w-full md:w-64 border-r bg-muted/10 p-4">
          <div className="mb-4 h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>

        {/* Email List Skeleton */}
        <div className="w-full md:w-96 border-r">
          <div className="border-b p-4">
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>

        {/* Email Viewer Skeleton */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Mail className="h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Loading emails...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && folders.length === 0) {
    return (
      <div className="-m-6 flex h-[calc(100vh-0rem)] items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Failed to load emails</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={clearError} variant="outline">
              Dismiss
            </Button>
            <Button onClick={refreshFolders}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state - no folders
  if (!loading && folders.length === 0) {
    return (
      <div className="-m-6 flex h-[calc(100vh-0rem)] items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <Mail className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h2 className="text-lg font-semibold">No folders found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t find any email folders in your mailbox. Please try refreshing or check your email account settings.
            </p>
          </div>
          <Button onClick={refreshFolders}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  // Mobile: Show full-screen email viewer when email is selected
  if (showMobileViewer && selectedEmail) {
    return (
      <div className="-m-6 flex h-[calc(100vh-0rem)] flex-col md:hidden">
        {/* Mobile Header */}
        <div className="flex items-center gap-2 border-b bg-background p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileViewer(false)}
            aria-label="Back to email list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-medium">Email</h2>
        </div>

        {/* Email Viewer */}
        <div className="flex-1 overflow-hidden">
          <EmailViewer />
        </div>
      </div>
    )
  }

  // Normal state with content (Desktop + Mobile list view)
  return (
    <div className="-m-6 flex h-[calc(100vh-0rem)] overflow-hidden">
      {/* Desktop: Left Sidebar - Folders */}
      <div className="hidden md:block">
        <FolderSidebar />
      </div>

      {/* Main Content - Email List and Viewer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Email List Panel */}
        <div className="w-full md:w-96 border-r">
          {/* Mobile Header with Menu Button */}
          <div className="flex items-center gap-2 border-b bg-background p-3 md:hidden">
            <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open folders menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <FolderSidebar
                  className="border-0"
                  onFolderSelect={() => setMobileDrawerOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">Email</h1>
          </div>

          <EmailListPanel onEmailSelect={() => {
            // Only show mobile viewer on mobile screens
            if (window.innerWidth < 768) {
              setShowMobileViewer(true)
            }
          }} />
        </div>

        {/* Desktop: Email Viewer */}
        <div className="hidden md:block flex-1 overflow-hidden">
          <EmailViewer className="h-full" />
        </div>
      </div>

      {/* Error Toast (for non-critical errors) */}
      {error && folders.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border bg-destructive/10 p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium">Error</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="shrink-0"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EmailPage() {
  return (
    <EmailProvider>
      <EmailContent />
    </EmailProvider>
  )
}
