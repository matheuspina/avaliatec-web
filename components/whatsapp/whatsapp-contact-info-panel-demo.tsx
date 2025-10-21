'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WhatsAppContactInfoPanel } from './whatsapp-contact-info-panel'
import type { WhatsAppContact, WhatsAppInstance } from '@/lib/types'

// Mock data for demonstration
const mockInstance: WhatsAppInstance = {
  id: 'demo-instance-1',
  instance_name: 'demo_instance',
  instance_token: 'demo-token',
  phone_number: '+5511999999999',
  display_name: 'Atendimento Demo',
  status: 'connected',
  qr_code: null,
  qr_code_updated_at: null,
  webhook_url: 'https://example.com/webhook',
  created_by: 'user-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  connected_at: new Date().toISOString(),
  last_seen_at: new Date().toISOString()
}

const mockContacts: WhatsAppContact[] = [
  {
    id: 'contact-1',
    instance_id: 'demo-instance-1',
    remote_jid: '5511888888888@s.whatsapp.net',
    phone_number: '+5511888888888',
    name: 'João Silva',
    profile_picture_url: null,
    contact_type: 'lead',
    client_id: null,
    last_message_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updated_at: new Date().toISOString()
  },
  {
    id: 'contact-2',
    instance_id: 'demo-instance-1',
    remote_jid: '5511777777777@s.whatsapp.net',
    phone_number: '+5511777777777',
    name: 'Maria Santos',
    profile_picture_url: null,
    contact_type: 'cliente',
    client_id: 'client-1',
    last_message_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updated_at: new Date().toISOString()
  },
  {
    id: 'contact-3',
    instance_id: 'demo-instance-1',
    remote_jid: '5511666666666@s.whatsapp.net',
    phone_number: '+5511666666666',
    name: null,
    profile_picture_url: null,
    contact_type: 'unknown',
    client_id: null,
    last_message_at: null,
    created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    updated_at: new Date().toISOString()
  }
]

// Mock WhatsApp context provider for demo
const MockWhatsAppProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>('contact-1')
  
  const mockContextValue = {
    instances: [mockInstance],
    selectedInstanceId: 'demo-instance-1',
    selectedContactId,
    contacts: mockContacts,
    messages: [],
    isLoading: false,
    error: null,
    selectInstance: () => {},
    selectContact: setSelectedContactId,
    sendMessage: async () => {},
    refreshInstances: async () => {},
    refreshContacts: async () => {},
    refreshMessages: async () => {},
    clearError: () => {}
  }

  // Mock the useWhatsApp hook
  React.useEffect(() => {
    // @ts-ignore - Mocking the context for demo purposes
    window.__mockWhatsAppContext = mockContextValue
  }, [selectedContactId])

  return <>{children}</>
}

export function WhatsAppContactInfoPanelDemo() {
  const [selectedContactId, setSelectedContactId] = useState<string>('contact-1')

  return (
    <MockWhatsAppProvider>
      <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">WhatsApp Contact Info Panel</h1>
          <p className="text-muted-foreground">
            Painel lateral com informações detalhadas do contato, classificação e associação com clientes
          </p>
        </div>

        {/* Contact Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Contato para Demonstração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockContacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant={selectedContactId === contact.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedContactId(contact.id)}
                >
                  {contact.name || contact.phone_number}
                  <span className="ml-2 text-xs opacity-70">
                    ({contact.contact_type})
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demo Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
          {/* Main Content Area (Placeholder) */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Área Principal do Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg mb-2">💬</p>
                  <p>Esta seria a área principal do chat</p>
                  <p className="text-sm">O painel de informações aparece ao lado</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info Panel */}
          <div className="lg:col-span-1">
            <div className="h-[600px] border rounded-lg overflow-hidden">
              <WhatsAppContactInfoPanel 
                contactId={selectedContactId}
                className="h-full"
              />
            </div>
          </div>
        </div>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades Implementadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">✅ Perfil do Contato</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Avatar com iniciais ou foto</li>
                  <li>• Nome e telefone formatado</li>
                  <li>• Informações básicas</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">✅ Classificação</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Seletor de tipo de contato</li>
                  <li>• Cliente, Lead, Profissional, Prestador</li>
                  <li>• Salvamento automático</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">✅ Associação com Cliente</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Status de associação</li>
                  <li>• Busca de clientes existentes</li>
                  <li>• Link para perfil do cliente</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">✅ Criação de Cliente</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Formulário pré-preenchido</li>
                  <li>• Associação automática</li>
                  <li>• Validação de campos</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">✅ Estatísticas</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Data da primeira mensagem</li>
                  <li>• Data da última mensagem</li>
                  <li>• Histórico de interações</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">✅ Interface</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Design responsivo</li>
                  <li>• Estados de loading</li>
                  <li>• Feedback visual</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Classificar Contato</h4>
              <p className="text-sm text-muted-foreground">
                Use o seletor de classificação para definir o tipo do contato (Cliente, Lead, etc.)
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Associar a Cliente</h4>
              <p className="text-sm text-muted-foreground">
                Clique em &quot;Associar a Cliente Existente&quot; para buscar e vincular a um cliente cadastrado
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Criar Novo Cliente</h4>
              <p className="text-sm text-muted-foreground">
                Use &quot;Criar Novo Cliente&quot; para cadastrar um novo cliente a partir das informações do contato
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">4. Gerenciar Associação</h4>
              <p className="text-sm text-muted-foreground">
                Quando associado, você pode acessar o perfil do cliente ou remover a associação
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requisitos de API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Endpoints Necessários:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <code>PUT /api/whatsapp/contacts/[id]</code> - Atualizar contato</li>
                  <li>• <code>GET /api/clients</code> - Listar clientes (com busca)</li>
                  <li>• <code>GET /api/clients/[id]</code> - Detalhes do cliente</li>
                  <li>• <code>POST /api/clients</code> - Criar novo cliente</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Funcionalidades Integradas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Context do WhatsApp para dados dos contatos</li>
                  <li>• Toast notifications para feedback</li>
                  <li>• Validação de formulários</li>
                  <li>• Estados de loading e erro</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MockWhatsAppProvider>
  )
}