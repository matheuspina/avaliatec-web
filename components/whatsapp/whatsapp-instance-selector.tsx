'use client'

import React from 'react'
import { Check, Phone, Smartphone, Wifi, WifiOff, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWhatsApp } from '@/contexts/whatsapp-context'
import type { WhatsAppInstance } from '@/lib/types'

interface WhatsAppInstanceSelectorProps {
  className?: string
}

export function WhatsAppInstanceSelector({ className }: WhatsAppInstanceSelectorProps) {
  const { instances, selectedInstanceId, selectInstance } = useWhatsApp()

  const selectedInstance = instances.find(instance => instance.id === selectedInstanceId)

  const getStatusIcon = (status: WhatsAppInstance['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-500" />
      case 'connecting':
        return <Clock className="h-3 w-3 text-yellow-500" />
      case 'qr_code':
        return <Smartphone className="h-3 w-3 text-blue-500" />
      case 'disconnected':
      default:
        return <WifiOff className="h-3 w-3 text-red-500" />
    }
  }

  const getStatusBadge = (status: WhatsAppInstance['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Conectado</Badge>
      case 'connecting':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Conectando</Badge>
      case 'qr_code':
        return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">QR Code</Badge>
      case 'disconnected':
      default:
        return <Badge variant="destructive">Desconectado</Badge>
    }
  }

  const getStatusText = (status: WhatsAppInstance['status']) => {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'connecting':
        return 'Conectando'
      case 'qr_code':
        return 'QR Code'
      case 'disconnected':
      default:
        return 'Desconectado'
    }
  }

  const formatPhoneNumber = (phoneNumber: string | null) => {
    if (!phoneNumber) return null
    
    // Format Brazilian phone number: +55 (11) 99999-9999
    const cleaned = phoneNumber.replace(/\D/g, '')
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const countryCode = cleaned.slice(0, 2)
      const areaCode = cleaned.slice(2, 4)
      const firstPart = cleaned.slice(4, 9)
      const secondPart = cleaned.slice(9)
      return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`
    }
    return phoneNumber
  }

  if (instances.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Smartphone className="h-4 w-4" />
        <span>Nenhuma instância disponível</span>
      </div>
    )
  }

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <Select
        value={selectedInstanceId || ''}
        onValueChange={selectInstance}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione uma instância">
            {selectedInstance && (
              <div className="flex items-center gap-2 w-full">
                {getStatusIcon(selectedInstance.status)}
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="font-medium truncate">
                    {selectedInstance.display_name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{getStatusText(selectedInstance.status)}</span>
                    {selectedInstance.phone_number && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{formatPhoneNumber(selectedInstance.phone_number)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {instances.map((instance) => (
            <SelectItem
              key={instance.id}
              value={instance.id}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                {getStatusIcon(instance.status)}
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium truncate">
                      {instance.display_name}
                    </span>
                    {selectedInstanceId === instance.id && (
                      <Check className="h-3 w-3 text-primary ml-auto" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {getStatusBadge(instance.status)}
                    {instance.phone_number && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{formatPhoneNumber(instance.phone_number)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}