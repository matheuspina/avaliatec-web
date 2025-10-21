'use client'

import React from 'react'
import { WhatsAppSettingsPanel } from './whatsapp-settings-panel'

export function WhatsAppSettingsPanelDemo() {
  // Mock instance ID for demo
  const mockInstanceId = 'demo-instance-id'

  return (
    <div className="h-[600px] w-full max-w-2xl border rounded-lg overflow-hidden">
      <WhatsAppSettingsPanel instanceId={mockInstanceId} />
    </div>
  )
}