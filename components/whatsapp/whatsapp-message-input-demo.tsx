'use client'

import React from 'react'
import { WhatsAppMessageInput } from './whatsapp-message-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function WhatsAppMessageInputDemo() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Message Input</CardTitle>
          <CardDescription>
            Componente de entrada de mensagens com suporte a texto, áudio, atalhos rápidos e substituição de variáveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Features list */}
          <div className="space-y-2">
            <h4 className="font-medium">Funcionalidades implementadas:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Input de texto</Badge>
              <Badge variant="outline">Botão de envio</Badge>
              <Badge variant="outline">Gravação de áudio</Badge>
              <Badge variant="outline">Atalhos rápidos (/)</Badge>
              <Badge variant="outline">Variáveis {'{nome_cliente}'}</Badge>
              <Badge variant="outline">Indicador de digitação</Badge>
              <Badge variant="outline">Enter para enviar</Badge>
              <Badge variant="outline">Shift+Enter nova linha</Badge>
              <Badge variant="outline">Desabilita quando desconectado</Badge>
            </div>
          </div>

          {/* Usage instructions */}
          <div className="space-y-2">
            <h4 className="font-medium">Como usar:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Digite uma mensagem e pressione Enter para enviar</li>
              <li>• Use Shift+Enter para quebrar linha</li>
              <li>• Digite / para ver atalhos de mensagens rápidas</li>
              <li>• Use {'{nome_cliente}'} para inserir o nome do contato</li>
              <li>• Mantenha pressionado o botão do microfone para gravar áudio</li>
              <li>• Use as setas ↑↓ para navegar entre sugestões</li>
              <li>• Pressione Esc para fechar sugestões</li>
            </ul>
          </div>

          {/* Demo component */}
          <div className="border rounded-lg">
            <div className="p-4 bg-muted/30 border-b">
              <p className="text-sm font-medium">Demo - WhatsApp Message Input</p>
              <p className="text-xs text-muted-foreground">
                Selecione um contato no contexto WhatsApp para testar
              </p>
            </div>
            
            <div className="h-64 flex flex-col">
              <div className="flex-1 p-4 bg-muted/10">
                <p className="text-sm text-muted-foreground text-center">
                  Área de mensagens (simulada)
                </p>
              </div>
              
              <WhatsAppMessageInput />
            </div>
          </div>

          {/* Requirements coverage */}
          <div className="space-y-2">
            <h4 className="font-medium">Requisitos atendidos:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="w-8 h-6 text-xs">4.1</Badge>
                <span>Enviar mensagens de texto</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="w-8 h-6 text-xs">4.2</Badge>
                <span>Enviar mensagens de áudio</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="w-8 h-6 text-xs">6.1</Badge>
                <span>Atalhos com &quot;/&quot; trigger</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="w-8 h-6 text-xs">6.2</Badge>
                <span>Substituir atalho por texto completo</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="w-8 h-6 text-xs">6.3</Badge>
                <span>Variáveis dinâmicas {'{nome_cliente}'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="w-8 h-6 text-xs">6.4</Badge>
                <span>Substituição de variáveis</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}