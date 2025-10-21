'use client'

import React from 'react'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWhatsApp } from '@/contexts/whatsapp-context'
import { messageRetryManager } from '@/lib/utils/retry-mechanism'

interface WhatsAppRetryStatusProps {
  className?: string
}

/**
 * WhatsApp Retry Status Component
 * 
 * Shows failed messages and provides retry functionality
 * 
 * Requirements covered:
 * - 4.6: Add retry mechanism for failed message sends
 * - 12.8: Show user-friendly error messages for API failures
 */
export function WhatsAppRetryStatus({ className }: WhatsAppRetryStatusProps) {
  const { messages, retryMessage, retryQueueSize } = useWhatsApp()
  
  // Get failed messages
  const failedMessages = messages.filter(msg => msg.status === 'failed')
  
  if (retryQueueSize === 0 && failedMessages.length === 0) {
    return null
  }

  const handleRetryAll = async () => {
    const { succeeded, failed } = await messageRetryManager.retryAllMessages()
    
    if (succeeded.length > 0) {
      console.log(`Successfully retried ${succeeded.length} messages`)
    }
    
    if (failed.length > 0) {
      console.warn(`Failed to retry ${failed.length} messages`)
    }
  }

  const handleRetryMessage = async (messageId: string) => {
    await retryMessage(messageId)
  }

  const handleRemoveFromQueue = (messageId: string) => {
    messageRetryManager.removeFromQueue(messageId)
    // Force re-render by triggering a state update in context
    // This is a bit of a hack, but works for now
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm">Mensagens com falha</CardTitle>
            <Badge variant="destructive" className="text-xs">
              {failedMessages.length}
            </Badge>
          </div>
          {retryQueueSize > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryAll}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Tentar todas
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          Clique para tentar reenviar as mensagens que falharam
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {failedMessages.map((message) => (
            <div
              key={message.id}
              className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {message.message_type === 'text' 
                    ? message.text_content 
                    : `Áudio (${message.message_type})`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRetryMessage(message.id)}
                  className="h-6 w-6 p-0"
                  title="Tentar reenviar"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFromQueue(message.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  title="Remover da fila"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}