'use client'

import React from 'react'
import { WhatsAppContactList } from './whatsapp-contact-list'
import { WhatsAppProvider } from '@/contexts/whatsapp-context'

export function WhatsAppContactListDemo() {
  return (
    <div className="h-[600px] w-[400px] border rounded-lg overflow-hidden">
      <WhatsAppProvider>
        <WhatsAppContactList />
      </WhatsAppProvider>
    </div>
  )
}