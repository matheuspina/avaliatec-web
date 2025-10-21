'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { whatsappToasts, showApiErrorToast, withToastFeedback } from '@/lib/utils/toast-helpers'
import { withRetry, retryConfigs } from '@/lib/utils/retry-mechanism'
import { Loader2, Smartphone, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react'
import type { WhatsAppInstance } from '@/lib/types'

interface WhatsAppConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (instance: WhatsAppInstance) => void
}

type ConnectionStatus = 'idle' | 'creating' | 'connecting' | 'qr_code' | 'connected' | 'error'

export function WhatsAppConnectionModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: WhatsAppConnectionModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  
  const { toast } = useToast()

  // Clear state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setDisplayName('')
      setStatus('idle')
      setQrCode(null)
      setError(null)
      setInstanceId(null)
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
  }, [open, pollingInterval])

  // Poll for QR code and connection status updates
  const pollInstanceStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/whatsapp/instances/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch instance status')
      }
      
      const data = await response.json()
      const instance = data.data?.instance || data.instance as WhatsAppInstance
      
      // Update QR code if available
      if (instance.qr_code && instance.qr_code !== qrCode) {
        setQrCode(instance.qr_code)
      }
      
      // Update status based on instance status
      switch (instance.status) {
        case 'qr_code':
          setStatus('qr_code')
          break
        case 'connecting':
          setStatus('connecting')
          break
        case 'connected':
          setStatus('connected')
          // Stop polling and close modal on successful connection
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
          
          whatsappToasts.instanceConnected()
          
          onSuccess(instance)
          onOpenChange(false)
          break
        case 'disconnected':
          // Only show error if we were previously in a connected state
          // Don't show error if we're still waiting for QR code scan
          if (status === 'connected' || status === 'connecting') {
            setStatus('error')
            setError('Connection failed. The QR code may have expired.')
          }
          // If we're in qr_code status, keep showing the QR code
          break
      }
    } catch (err) {
      console.error('Error polling instance status:', err)
      // Don't set error state for polling failures to avoid interrupting the flow
      // Just log the error and continue polling
    }
  }, [qrCode, pollingInterval, onSuccess, onOpenChange])

  // Start connection process
  const handleConnect = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name')
      return
    }

    const result = await withToastFeedback(
      async () => {
        setStatus('creating')
        setError(null)

        // Create new instance with retry logic
        const createOperation = async () => {
          const response = await fetch('/api/whatsapp/instances', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              displayName: displayName.trim()
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const error = new Error(errorData.error || 'Failed to create instance')
            ;(error as any).statusCode = response.status
            throw error
          }

          return response.json()
        }

        const createData = await withRetry(createOperation, retryConfigs.apiCall)
        const newInstance = createData.data?.instance || createData.instance as WhatsAppInstance
        setInstanceId(newInstance.id)

        setStatus('connecting')

        // Start connection process with retry logic
        const connectOperation = async () => {
          const response = await fetch(`/api/whatsapp/instances/${newInstance.id}/connect`, {
            method: 'POST'
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const error = new Error(errorData.error || 'Failed to start connection')
            ;(error as any).statusCode = response.status
            throw error
          }

          return response.json()
        }

        const connectData = await withRetry(connectOperation, retryConfigs.connection)
        
        if (connectData.data?.qrCode || connectData.qrCode) {
          setQrCode(connectData.data?.qrCode || connectData.qrCode)
          setStatus('qr_code')
        }

        // Start polling for status updates every 2 seconds
        const interval = setInterval(() => {
          pollInstanceStatus(newInstance.id)
        }, 2000)
        
        setPollingInterval(interval)

        return newInstance
      },
      {
        loadingMessage: 'Connecting WhatsApp...',
        successMessage: 'WhatsApp connection initiated. Please scan the QR code.',
        showSuccessToast: false, // We'll show success when actually connected
        onError: (error) => {
          setStatus('error')
          setError(error instanceof Error ? error.message : 'Failed to connect WhatsApp')
        }
      }
    )

    if (!result) {
      setStatus('error')
    }
  }

  // Retry connection
  const handleRetry = () => {
    setStatus('idle')
    setError(null)
    setQrCode(null)
    setInstanceId(null)
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  // Cancel connection
  const handleCancel = async () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }

    // If we have an instance ID, try to delete it
    if (instanceId && status !== 'connected') {
      try {
        await fetch(`/api/whatsapp/instances/${instanceId}`, {
          method: 'DELETE'
        })
      } catch (err) {
        console.error('Error deleting instance:', err)
      }
    }

    onOpenChange(false)
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'creating':
      case 'connecting':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case 'qr_code':
        return <Smartphone className="h-8 w-8 text-green-500" />
      case 'connected':
        return <Wifi className="h-8 w-8 text-green-500" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />
      default:
        return <WifiOff className="h-8 w-8 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'creating':
        return 'Creating WhatsApp instance...'
      case 'connecting':
        return 'Initializing connection...'
      case 'qr_code':
        return 'Scan the QR code with your WhatsApp'
      case 'connected':
        return 'Successfully connected!'
      case 'error':
        return error || 'Connection failed'
      default:
        return 'Ready to connect your WhatsApp number'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect WhatsApp Number</DialogTitle>
          <DialogDescription>
            Connect a WhatsApp number to start receiving and sending messages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Display Name Input - Only show when idle or error */}
          {(status === 'idle' || status === 'error') && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g., Customer Support"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={status !== 'idle' && status !== 'error'}
              />
              <p className="text-sm text-muted-foreground">
                This name will help you identify this WhatsApp connection
              </p>
            </div>
          )}

          {/* Status Display */}
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            <p className="text-center text-sm font-medium">
              {getStatusText()}
            </p>
          </div>

          {/* QR Code Display */}
          {status === 'qr_code' && qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  1. Open WhatsApp on your phone
                </p>
                <p className="text-sm text-muted-foreground">
                  2. Go to Settings → Linked Devices
                </p>
                <p className="text-sm text-muted-foreground">
                  3. Tap &quot;Link a Device&quot; and scan this QR code
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>QR code will refresh automatically if needed</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {status === 'error' && error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            {status === 'idle' && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConnect} disabled={!displayName.trim()}>
                  Connect
                </Button>
              </>
            )}

            {status === 'qr_code' && (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => instanceId && pollInstanceStatus(instanceId)}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh QR Code
                </Button>
              </>
            )}

            {(status === 'creating' || status === 'connecting') && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}

            {status === 'error' && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={handleRetry}>
                  Try Again
                </Button>
              </>
            )}

            {status === 'connected' && (
              <Button onClick={() => onOpenChange(false)}>
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}