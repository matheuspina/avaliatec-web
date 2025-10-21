'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { WhatsAppConnectionModal } from './whatsapp-connection-modal'
import type { WhatsAppInstance } from '@/lib/types'

/**
 * Demo component to test WhatsAppConnectionModal functionality
 * This can be used for testing and development purposes
 */
export function WhatsAppConnectionDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [connectedInstance, setConnectedInstance] = useState<WhatsAppInstance | null>(null)

  const handleSuccess = (instance: WhatsAppInstance) => {
    setConnectedInstance(instance)
    console.log('WhatsApp instance connected:', instance)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">WhatsApp Connection Test</h3>
      
      {connectedInstance ? (
        <div className="space-y-2">
          <p className="text-green-600 font-medium">✓ Connected Successfully!</p>
          <div className="text-sm text-muted-foreground">
            <p>Instance: {connectedInstance.display_name}</p>
            <p>Status: {connectedInstance.status}</p>
            {connectedInstance.phone_number && (
              <p>Phone: {connectedInstance.phone_number}</p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setConnectedInstance(null)
              setIsModalOpen(true)
            }}
          >
            Connect Another
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground">No WhatsApp instance connected</p>
          <Button onClick={() => setIsModalOpen(true)}>
            Connect WhatsApp
          </Button>
        </div>
      )}

      <WhatsAppConnectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}