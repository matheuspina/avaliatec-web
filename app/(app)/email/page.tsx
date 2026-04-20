"use client"

import { useState, useEffect } from "react"
import { EmailProvider, useEmail } from "@/contexts/email-context"
import { FolderSidebar } from "@/components/email/folder-sidebar"
import { EmailListPanel } from "@/components/email/email-list-panel"
import { EmailViewer } from "@/components/email/email-viewer"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AlertCircle, RefreshCw, Mail, Menu, ArrowLeft } from "lucide-react"
import { AppMainBleed } from "@/components/app-main-bleed"

function EmailPageHeader() {
  return (
    <div className="shrink-0 border-b border-border bg-background px-4 py-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Email</h1>
      <p className="text-muted-foreground">
        Leia e gerencie as mensagens da sua conta
      </p>
    </div>
  )
}

function EmailContent() {
  const { loading, error, clearError, refreshFolders, folders, selectedEmail, selectedFolder } =
    useEmail()
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
      <AppMainBleed fillHeight padContent={false} className="flex-col overflow-hidden">
        <EmailPageHeader />
        <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
          <div className="w-full border-r bg-muted/10 p-4 md:w-64">
            <div className="mb-4 h-6 w-24 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          </div>

          <div className="w-full border-r md:w-96">
            <div className="border-b p-4">
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex flex-col items-center gap-3">
              <Mail className="h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Carregando mensagens…</p>
            </div>
          </div>
        </div>
      </AppMainBleed>
    )
  }

  // Error state
  if (error && folders.length === 0) {
    return (
      <AppMainBleed fillHeight padContent={false} className="flex-col overflow-hidden">
        <EmailPageHeader />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Não foi possível carregar o email</h2>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={clearError} variant="outline">
                Fechar
              </Button>
              <Button onClick={refreshFolders}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </AppMainBleed>
    )
  }

  // Empty state - no folders
  if (!loading && folders.length === 0) {
    return (
      <AppMainBleed fillHeight padContent={false} className="flex-col overflow-hidden">
        <EmailPageHeader />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <Mail className="h-12 w-12 text-muted-foreground opacity-50" />
            <div>
              <h2 className="text-lg font-semibold">Nenhuma pasta encontrada</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Não encontramos pastas na sua caixa de correio. Atualize a página ou verifique as
                configurações da conta.
              </p>
            </div>
            <Button onClick={refreshFolders}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>
      </AppMainBleed>
    )
  }

  // Mobile: Show full-screen email viewer when email is selected
  if (showMobileViewer && selectedEmail) {
    return (
      <AppMainBleed fillHeight padContent={false} className="flex-col md:hidden">
        {/* Mobile Header */}
        <div className="flex items-center gap-2 border-b bg-background p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileViewer(false)}
            aria-label="Voltar para a lista de mensagens"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-medium">Mensagem</h2>
        </div>

        {/* Email Viewer */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <EmailViewer className="h-full w-full" />
        </div>
      </AppMainBleed>
    )
  }

  // Normal state with content (Desktop + Mobile list view)
  return (
    <AppMainBleed fillHeight padContent={false} className="flex-col overflow-hidden">
      <EmailPageHeader />

      <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
        <div className="hidden md:block">
          <FolderSidebar />
        </div>

        <div className="flex min-w-0 flex-1 overflow-hidden">
          <div className="w-full border-r md:w-96">
            <div className="flex items-center gap-2 border-b bg-background p-3 md:hidden">
              <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir pastas">
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
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
                {selectedFolder?.displayName ?? "Mensagens"}
              </span>
            </div>

            <EmailListPanel
              onEmailSelect={() => {
                if (window.innerWidth < 768) {
                  setShowMobileViewer(true)
                }
              }}
            />
          </div>

          <div className="hidden min-w-0 flex-1 overflow-hidden md:block">
            <EmailViewer className="h-full w-full" />
          </div>
        </div>
      </div>

      {error && folders.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border bg-destructive/10 p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium">Erro</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError} className="shrink-0">
              Fechar
            </Button>
          </div>
        </div>
      )}
    </AppMainBleed>
  )
}

export default function EmailPage() {
  return (
    <EmailProvider>
      <EmailContent />
    </EmailProvider>
  )
}
