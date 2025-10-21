'use client'

import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Phone, 
  Users, 
  Eye, 
  EyeOff, 
  Clock, 
  MessageSquare, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useWhatsApp } from '@/contexts/whatsapp-context'
import type { WhatsAppInstanceSettings, AvailabilitySchedule } from '@/lib/types'

interface WhatsAppSettingsPanelProps {
  instanceId: string
  className?: string
}

interface DaySchedule {
  enabled: boolean
  start: string
  end: string
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
] as const

export function WhatsAppSettingsPanel({ 
  instanceId, 
  className 
}: WhatsAppSettingsPanelProps) {
  const { instances } = useWhatsApp()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<WhatsAppInstanceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Find the current instance
  const currentInstance = instances.find(instance => instance.id === instanceId)

  // Load settings on mount and when instanceId changes
  useEffect(() => {
    const loadSettings = async () => {
      if (!instanceId) return

      setIsLoading(true)
      
      try {
        const response = await fetch(`/api/whatsapp/settings/${instanceId}`)
        
        if (!response.ok) {
          throw new Error('Failed to load settings')
        }
        
        const data = await response.json()
        setSettings(data.data.settings)
        setHasUnsavedChanges(false)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast({
          title: "Erro ao carregar configurações",
          description: "Não foi possível carregar as configurações da instância",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [instanceId, toast])

  // Update settings state and mark as unsaved
  const updateSettings = (updates: Partial<WhatsAppInstanceSettings>) => {
    setSettings(prev => prev ? { ...prev, ...updates } : null)
    setHasUnsavedChanges(true)
  }

  // Update availability schedule for a specific day
  const updateDaySchedule = (day: string, schedule: DaySchedule) => {
    if (!settings) return

    const newSchedule = {
      ...settings.availability_schedule,
      [day]: schedule
    }

    updateSettings({ availability_schedule: newSchedule })
  }

  // Save settings to API
  const saveSettings = async () => {
    if (!settings || !hasUnsavedChanges) return

    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/whatsapp/settings/${instanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reject_calls: settings.reject_calls,
          reject_call_message: settings.reject_call_message,
          ignore_groups: settings.ignore_groups,
          always_online: settings.always_online,
          read_messages: settings.read_messages,
          read_status: settings.read_status,
          auto_reply_enabled: settings.auto_reply_enabled,
          auto_reply_message: settings.auto_reply_message,
          availability_schedule: settings.availability_schedule
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const result = await response.json()
      setSettings(result.data.settings)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram salvas com sucesso"
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Validate time format (HH:mm)
  const isValidTime = (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  // Format time for display
  const formatTime = (time: string): string => {
    if (!isValidTime(time)) return time
    const [hours, minutes] = time.split(':')
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Configurações não encontradas</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <div>
              <h2 className="text-lg font-semibold">Configurações</h2>
              {currentInstance && (
                <p className="text-sm text-muted-foreground">
                  {currentInstance.display_name}
                  {currentInstance.phone_number && (
                    <span className="ml-2">• {currentInstance.phone_number}</span>
                  )}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                Alterações não salvas
              </Badge>
            )}
            
            <Button
              onClick={saveSettings}
              disabled={!hasUnsavedChanges || isSaving}
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>
        
        {lastSaved && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3" />
            <span>Última atualização: {lastSaved.toLocaleTimeString('pt-BR')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Call Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              Configurações de Chamadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reject-calls">Rejeitar chamadas automaticamente</Label>
                <p className="text-xs text-muted-foreground">
                  Rejeita automaticamente todas as chamadas recebidas
                </p>
              </div>
              <Switch
                id="reject-calls"
                checked={settings.reject_calls}
                onCheckedChange={(checked: boolean) => updateSettings({ reject_calls: checked })}
              />
            </div>
            
            {settings.reject_calls && (
              <div className="space-y-2">
                <Label htmlFor="reject-call-message">Mensagem de rejeição</Label>
                <Textarea
                  id="reject-call-message"
                  placeholder="Digite a mensagem que será enviada quando uma chamada for rejeitada..."
                  value={settings.reject_call_message || ''}
                  onChange={(e) => updateSettings({ reject_call_message: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Esta mensagem será enviada automaticamente quando uma chamada for rejeitada
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Configurações de Grupos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="ignore-groups">Ignorar mensagens de grupos</Label>
                <p className="text-xs text-muted-foreground">
                  Não processa mensagens recebidas em grupos do WhatsApp
                </p>
              </div>
              <Switch
                id="ignore-groups"
                checked={settings.ignore_groups}
                onCheckedChange={(checked: boolean) => updateSettings({ ignore_groups: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Configurações de Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="always-online">Sempre online</Label>
                <p className="text-xs text-muted-foreground">
                  Mantém o status como online permanentemente
                </p>
              </div>
              <Switch
                id="always-online"
                checked={settings.always_online}
                onCheckedChange={(checked: boolean) => updateSettings({ always_online: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="read-messages">Marcar mensagens como lidas automaticamente</Label>
                <p className="text-xs text-muted-foreground">
                  Marca automaticamente as mensagens recebidas como lidas
                </p>
              </div>
              <Switch
                id="read-messages"
                checked={settings.read_messages}
                onCheckedChange={(checked: boolean) => updateSettings({ read_messages: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="read-status">Enviar confirmação de leitura automaticamente</Label>
                <p className="text-xs text-muted-foreground">
                  Envia automaticamente a confirmação de leitura (tique azul)
                </p>
              </div>
              <Switch
                id="read-status"
                checked={settings.read_status}
                onCheckedChange={(checked: boolean) => updateSettings({ read_status: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto-Reply Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Resposta Automática
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-reply-enabled">Ativar resposta automática</Label>
                <p className="text-xs text-muted-foreground">
                  Envia mensagem automática quando fora do horário de atendimento
                </p>
              </div>
              <Switch
                id="auto-reply-enabled"
                checked={settings.auto_reply_enabled}
                onCheckedChange={(checked: boolean) => updateSettings({ auto_reply_enabled: checked })}
              />
            </div>
            
            {settings.auto_reply_enabled && (
              <div className="space-y-2">
                <Label htmlFor="auto-reply-message">Mensagem automática</Label>
                <Textarea
                  id="auto-reply-message"
                  placeholder="Digite a mensagem que será enviada automaticamente fora do horário de atendimento..."
                  value={settings.auto_reply_message || ''}
                  onChange={(e) => updateSettings({ auto_reply_message: e.target.value })}
                  rows={4}
                />
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Variáveis disponíveis:</p>
                    <p><code>{'{nome_cliente}'}</code> - Nome do contato</p>
                    <p>A mensagem será enviada apenas uma vez por conversa durante o período de indisponibilidade</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Horário de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure os horários em que você está disponível para atendimento. 
              Fora destes horários, a resposta automática será enviada (se ativada).
            </p>
            
            <div className="space-y-3">
              {DAYS_OF_WEEK.map(({ key, label }) => {
                const daySchedule = settings.availability_schedule[key] || {
                  enabled: false,
                  start: '08:00',
                  end: '18:00'
                }
                
                return (
                  <div key={key} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${key}-enabled`}
                        checked={daySchedule.enabled}
                        onCheckedChange={(checked: boolean) => 
                          updateDaySchedule(key, { ...daySchedule, enabled: checked })
                        }
                      />
                      <Label 
                        htmlFor={`${key}-enabled`}
                        className="min-w-[120px] text-sm font-medium"
                      >
                        {label}
                      </Label>
                    </div>
                    
                    {daySchedule.enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1">
                          <Label htmlFor={`${key}-start`} className="text-xs text-muted-foreground">
                            De:
                          </Label>
                          <Input
                            id={`${key}-start`}
                            type="time"
                            value={daySchedule.start}
                            onChange={(e) => 
                              updateDaySchedule(key, { ...daySchedule, start: e.target.value })
                            }
                            className="w-24 h-8 text-xs"
                          />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Label htmlFor={`${key}-end`} className="text-xs text-muted-foreground">
                            Até:
                          </Label>
                          <Input
                            id={`${key}-end`}
                            type="time"
                            value={daySchedule.end}
                            onChange={(e) => 
                              updateDaySchedule(key, { ...daySchedule, end: e.target.value })
                            }
                            className="w-24 h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-medium mb-1">Importante:</p>
                <p>Os horários são baseados no fuso horário local do servidor. Certifique-se de configurar corretamente para sua região.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}