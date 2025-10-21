'use client'

import React from 'react'
import { WhatsAppChatView } from './whatsapp-chat-view'
import { WhatsAppProvider } from '@/contexts/whatsapp-context'

export function WhatsAppChatViewDemo() {
  return (
    <div className="h-[600px] border rounded-lg overflow-hidden">
      <WhatsAppProvider>
        <WhatsAppChatView />
      </WhatsAppProvider>
    </div>
  )
}