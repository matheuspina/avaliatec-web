'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon'
import { WhatsAppConnectionModal } from './whatsapp-connection-modal'
import { useWhatsApp } from '@/contexts/whatsapp-context'
import { Plus } from 'lucide-react'

/**
 * Example integration showing how WhatsAppConnectionModal 
 * would be used in the actual atendimento page
 */
export function WhatsAppIntegrationExample() {
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
  const { instances, refreshInstances } = useWhatsApp()

  const handleConnectionSuccess = async () => {
    // Refresh instances list after successful connection
    await refreshInstances()
  }

  const hasConnectedInstances = instances.some(instance => instance.status === 'connected')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atendimento</h1>
          <p className="text-muted-foreground">
            Central de atendimento via WhatsApp
          </p>
        </div>
        
        <Button 
          onClick={() => setIsConnectionModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Connect Number
        </Button>
      </div>

      {!hasConnectedInstances ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WhatsAppIcon className="h-5 w-5 text-green-500" />
              WhatsApp Business
            </CardTitle>
            <CardDescription>
              Connect your WhatsApp number to start receiving messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <WhatsAppIcon className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No WhatsApp Connected</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Connect a WhatsApp number to start receiving and sending messages to your customers.
              </p>
              <Button 
                onClick={() => setIsConnectionModalOpen(true)}
                className="flex items-center gap-2"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Connect WhatsApp Number
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WhatsAppIcon className="h-5 w-5 text-green-500" />
                  {instance.display_name}
                </CardTitle>
                <CardDescription>
                  Status: {instance.status} 
                  {instance.phone_number && ` • ${instance.phone_number}`}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <WhatsAppConnectionModal
        open={isConnectionModalOpen}
        onOpenChange={setIsConnectionModalOpen}
        onSuccess={handleConnectionSuccess}
      />
    </div>
  )
}