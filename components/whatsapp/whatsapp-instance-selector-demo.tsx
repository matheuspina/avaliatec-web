'use client'

import React from 'react'
import { WhatsAppInstanceSelector } from './whatsapp-instance-selector'
import { WhatsAppProvider } from '@/contexts/whatsapp-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function WhatsAppInstanceSelectorDemo() {
  return (
    <WhatsAppProvider>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>WhatsApp Instance Selector</CardTitle>
          <CardDescription>
            Selecione uma instância do WhatsApp para gerenciar conversas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WhatsAppInstanceSelector />
        </CardContent>
      </Card>
    </WhatsAppProvider>
  )
}