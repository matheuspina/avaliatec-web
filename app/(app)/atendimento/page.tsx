'use client'

import { useState } from 'react'
import { Settings, MessageSquare, Plus, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import { WhatsAppProvider, useWhatsApp } from "@/contexts/whatsapp-context"
import { ErrorBoundary } from "@/components/error-boundary"
import {
  WhatsAppInstanceSelector,
  WhatsAppConnectionModal,
  WhatsAppContactList,
  WhatsAppChatView,
  WhatsAppContactInfoPanel,
  WhatsAppMessageInput,
  WhatsAppSettingsPanel,
  WhatsAppQuickMessagesManager,
  WhatsAppRetryStatus
} from "@/components/whatsapp"

function AtendimentoContent() {
  const { 
    instances, 
    selectedInstanceId, 
    selectedContactId, 
    isLoading, 
    error,
    retryQueueSize,
    refreshInstances,
    clearError
  } = useWhatsApp()
  
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showQuickMessagesManager, setShowQuickMessagesManager] = useState(false)

  // Show loading state while initial data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando WhatsApp...</p>
        </div>
      </div>
    )
  }

  // Show connect button when no instances exist
  if (instances.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Atendimento</h1>
          <p className="text-muted-foreground">
            Central de atendimento via WhatsApp
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <WhatsAppIcon className="h-16 w-16 text-green-500" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Conecte seu WhatsApp</h3>
                <p className="text-muted-foreground max-w-md">
                  Para começar a usar o atendimento via WhatsApp, você precisa conectar um número.
                  Escaneie o QR Code com seu WhatsApp para começar.
                </p>
              </div>
              <Button 
                onClick={() => setShowConnectionModal(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Conectar Número
              </Button>
            </div>
          </CardContent>
        </Card>

        <WhatsAppConnectionModal
          open={showConnectionModal}
          onOpenChange={setShowConnectionModal}
          onSuccess={(instance) => {
            refreshInstances()
            setShowConnectionModal(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atendimento</h1>
          <p className="text-muted-foreground">
            Central de atendimento via WhatsApp
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick Messages Manager */}
          <Sheet open={showQuickMessagesManager} onOpenChange={setShowQuickMessagesManager}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Mensagens Rápidas
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[600px] sm:w-[700px]">
              <SheetHeader>
                <SheetTitle>Mensagens Rápidas</SheetTitle>
                <SheetDescription>
                  Gerencie atalhos para mensagens frequentes
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 h-[calc(100vh-120px)]">
                <WhatsAppQuickMessagesManager 
                  onSave={() => {
                    // Optionally refresh something or show success message
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Settings Panel */}
          {selectedInstanceId && (
            <Sheet open={showSettingsPanel} onOpenChange={setShowSettingsPanel}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[500px] sm:w-[600px]">
                <SheetHeader>
                  <SheetTitle>Configurações da Instância</SheetTitle>
                  <SheetDescription>
                    Configure o comportamento do WhatsApp
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 h-[calc(100vh-120px)]">
                  <WhatsAppSettingsPanel instanceId={selectedInstanceId} />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Connect New Number */}
          <Button 
            onClick={() => setShowConnectionModal(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Conectar Número
          </Button>
        </div>
      </div>

      {/* Instance Selector and Retry Status */}
      <div className="flex items-center gap-4">
        <WhatsAppInstanceSelector className="max-w-sm" />
        {retryQueueSize > 0 && (
          <WhatsAppRetryStatus className="max-w-md" />
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-destructive rounded-full" />
                <p className="text-sm text-destructive font-medium">
                  {error}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="text-destructive hover:text-destructive"
              >
                Dispensar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Three-column layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-280px)]">
        {/* Left column - Contact List */}
        <div className="col-span-12 lg:col-span-3">
          <Card className="h-full">
            <WhatsAppContactList />
          </Card>
        </div>

        {/* Middle column - Chat View */}
        <div className="col-span-12 lg:col-span-6">
          <Card className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
              <WhatsAppChatView />
            </div>
            <WhatsAppMessageInput />
          </Card>
        </div>

        {/* Right column - Contact Info Panel */}
        <div className="col-span-12 lg:col-span-3">
          {selectedContactId ? (
            <Card className="h-full">
              <WhatsAppContactInfoPanel contactId={selectedContactId} />
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Selecione um contato para ver as informações</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Connection Modal */}
      <WhatsAppConnectionModal
        open={showConnectionModal}
        onOpenChange={setShowConnectionModal}
        onSuccess={(instance) => {
          refreshInstances()
          setShowConnectionModal(false)
        }}
      />
    </div>
  )
}

export default function AtendimentoPage() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error for debugging
        console.error('WhatsApp page error:', error, errorInfo)
      }}
    >
      <WhatsAppProvider>
        <AtendimentoContent />
      </WhatsAppProvider>
    </ErrorBoundary>
  )
}
