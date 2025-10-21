'use client'

import React, { useState } from 'react'
import { WhatsAppQuickMessagesManager } from './whatsapp-quick-messages-manager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, RefreshCw } from 'lucide-react'

/**
 * Demo component for WhatsAppQuickMessagesManager
 * 
 * This component demonstrates the quick messages management functionality
 * with mock data and simulated API responses for development and testing.
 */
export function WhatsAppQuickMessagesManagerDemo() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSave = () => {
    console.log('Quick message saved - demo callback')
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Demo Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">WhatsApp Quick Messages Manager</h1>
              <p className="text-sm text-muted-foreground">
                Demo do gerenciador de mensagens rápidas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Demo Mode</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Main Component */}
        <div className="flex-1">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <WhatsAppQuickMessagesManager 
                key={refreshKey}
                onSave={handleSave}
                className="h-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Demo Info Panel */}
        <div className="w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">✅ Implementado:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Lista de mensagens rápidas existentes</li>
                  <li>• Formulário para criar nova mensagem</li>
                  <li>• Edição de mensagens existentes</li>
                  <li>• Exclusão com confirmação</li>
                  <li>• Busca por atalho/texto/descrição</li>
                  <li>• Validação de formato do atalho</li>
                  <li>• Campo de descrição para documentação</li>
                  <li>• Suporte a variáveis ({`{nome_cliente}`})</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Atalho:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Deve começar com &quot;/&quot;</li>
                  <li>• Mínimo 2 caracteres</li>
                  <li>• Apenas letras, números e underscore</li>
                  <li>• Deve ser único</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Mensagem:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Texto obrigatório</li>
                  <li>• Máximo 4096 caracteres</li>
                  <li>• Suporte a variáveis</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exemplos de Atalhos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-xs">/ola</code>
                <p className="text-muted-foreground text-xs">Olá {`{nome_cliente}`}, como posso ajudar?</p>
              </div>
              
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-xs">/horario</code>
                <p className="text-muted-foreground text-xs">Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.</p>
              </div>
              
              <div className="space-y-1">
                <code className="bg-muted px-2 py-1 rounded text-xs">/obrigado</code>
                <p className="text-muted-foreground text-xs">Obrigado pelo contato, {`{nome_cliente}`}! Tenha um ótimo dia!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}