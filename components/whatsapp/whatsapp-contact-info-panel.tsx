'use client'

import React, { useState, useEffect } from 'react'
import { 
  User, 
  Phone, 
  Link, 
  Plus, 
  ExternalLink, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useWhatsApp } from '@/contexts/whatsapp-context'
import type { WhatsAppContact, Client } from '@/lib/types'

interface WhatsAppContactInfoPanelProps {
  contactId: string
  className?: string
}

interface ClientSearchResult {
  id: string
  name: string
  phone: string
  email: string
  type: 'company' | 'individual'
}

export function WhatsAppContactInfoPanel({ 
  contactId, 
  className 
}: WhatsAppContactInfoPanelProps) {
  const { contacts, refreshContacts } = useWhatsApp()
  const { toast } = useToast()
  
  const [contact, setContact] = useState<WhatsAppContact | null>(null)
  const [associatedClient, setAssociatedClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false)
  const [availableClients, setAvailableClients] = useState<ClientSearchResult[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // New client form state
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    type: 'individual' as 'company' | 'individual'
  })

  // Contact type options
  const contactTypeOptions = [
    { value: 'cliente', label: 'Cliente', description: 'Cliente ativo da empresa' },
    { value: 'lead', label: 'Lead', description: 'Potencial cliente' },
    { value: 'profissional', label: 'Profissional', description: 'Usuário interno' },
    { value: 'prestador', label: 'Prestador', description: 'Fornecedor de serviços' },
    { value: 'unknown', label: 'Não classificado', description: 'Tipo não definido' }
  ]

  // Load contact details
  useEffect(() => {
    const loadContactDetails = async () => {
      setIsLoading(true)
      
      try {
        // Find contact in context
        const foundContact = contacts.find(c => c.id === contactId)
        if (!foundContact) {
          throw new Error('Contact not found')
        }
        
        setContact(foundContact)
        
        // Load associated client if exists
        if (foundContact.client_id) {
          const clientResponse = await fetch(`/api/clients/${foundContact.client_id}`)
          if (clientResponse.ok) {
            const clientData = await clientResponse.json()
            setAssociatedClient(clientData.client)
          }
        } else {
          setAssociatedClient(null)
        }
        
        // Pre-fill new client form with contact data
        setNewClientData(prev => ({
          ...prev,
          name: foundContact.name || '',
          phone: foundContact.phone_number
        }))
        
      } catch (error) {
        console.error('Error loading contact details:', error)
        toast({
          title: "Erro ao carregar contato",
          description: "Não foi possível carregar os detalhes do contato",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (contactId) {
      loadContactDetails()
    }
  }, [contactId, contacts, toast])

  // Load available clients for association
  const loadAvailableClients = async (query: string = '') => {
    try {
      const params = new URLSearchParams()
      if (query.trim()) {
        params.append('search', query.trim())
      }
      
      const response = await fetch(`/api/clients?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load clients')
      }
      
      const data = await response.json()
      setAvailableClients(data.clients || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes",
        variant: "destructive"
      })
    }
  }

  // Update contact type
  const updateContactType = async (newType: WhatsAppContact['contact_type']) => {
    if (!contact) return

    setSaving(true)
    
    try {
      const response = await fetch(`/api/whatsapp/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contactType: newType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update contact type')
      }

      setContact(prev => prev ? { ...prev, contact_type: newType } : null)
      await refreshContacts()
      
      toast({
        title: "Tipo atualizado",
        description: "O tipo do contato foi atualizado com sucesso"
      })
    } catch (error) {
      console.error('Error updating contact type:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o tipo do contato",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Associate with existing client
  const associateWithClient = async () => {
    if (!contact || !selectedClientId) return

    setSaving(true)
    
    try {
      const response = await fetch(`/api/whatsapp/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          contactType: 'cliente' // Auto-set to cliente when associating
        })
      })

      if (!response.ok) {
        throw new Error('Failed to associate contact with client')
      }

      // Reload contact details to get updated client info
      const clientResponse = await fetch(`/api/clients/${selectedClientId}`)
      if (clientResponse.ok) {
        const clientData = await clientResponse.json()
        setAssociatedClient(clientData.client)
      }

      setContact(prev => prev ? { 
        ...prev, 
        client_id: selectedClientId,
        contact_type: 'cliente'
      } : null)
      
      await refreshContacts()
      setShowClientDialog(false)
      setSelectedClientId('')
      
      toast({
        title: "Cliente associado",
        description: "O contato foi associado ao cliente com sucesso"
      })
    } catch (error) {
      console.error('Error associating contact with client:', error)
      toast({
        title: "Erro ao associar",
        description: "Não foi possível associar o contato ao cliente",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Create new client from contact
  const createNewClient = async () => {
    if (!contact) return

    setSaving(true)
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClientData)
      })

      if (!response.ok) {
        throw new Error('Failed to create client')
      }

      const result = await response.json()
      const newClient = result.client

      // Associate contact with new client
      const associateResponse = await fetch(`/api/whatsapp/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: newClient.id,
          contactType: 'cliente'
        })
      })

      if (!associateResponse.ok) {
        throw new Error('Failed to associate contact with new client')
      }

      setAssociatedClient(newClient)
      setContact(prev => prev ? { 
        ...prev, 
        client_id: newClient.id,
        contact_type: 'cliente'
      } : null)
      
      await refreshContacts()
      setShowCreateClientDialog(false)
      
      // Reset form
      setNewClientData({
        name: contact.name || '',
        email: '',
        phone: contact.phone_number,
        document: '',
        address: '',
        type: 'individual'
      })
      
      toast({
        title: "Cliente criado",
        description: "Novo cliente criado e associado com sucesso"
      })
    } catch (error) {
      console.error('Error creating client:', error)
      toast({
        title: "Erro ao criar cliente",
        description: "Não foi possível criar o novo cliente",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Remove client association
  const removeClientAssociation = async () => {
    if (!contact) return

    setSaving(true)
    
    try {
      const response = await fetch(`/api/whatsapp/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to remove client association')
      }

      setAssociatedClient(null)
      setContact(prev => prev ? { ...prev, client_id: null } : null)
      await refreshContacts()
      
      toast({
        title: "Associação removida",
        description: "A associação com o cliente foi removida"
      })
    } catch (error) {
      console.error('Error removing client association:', error)
      toast({
        title: "Erro ao remover associação",
        description: "Não foi possível remover a associação com o cliente",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Get contact initials for avatar
  const getContactInitials = (contact: WhatsAppContact) => {
    if (contact.name) {
      return contact.name
        .split(' ')
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join('')
    }
    
    const digits = contact.phone_number.replace(/\D/g, '')
    return digits.slice(-2)
  }

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      // Brazilian format: +55 (11) 99999-9999
      const ddd = cleaned.slice(2, 4)
      const number = cleaned.slice(4)
      if (number.length === 9) {
        return `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
      }
    }
    return phone
  }

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando informações...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Contato não encontrado</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-background border-l", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Informações do Contato</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Contact Profile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={contact.profile_picture_url || undefined} 
                  alt={contact.name || contact.phone_number}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                  {getContactInitials(contact)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg truncate">
                  {contact.name || 'Sem nome'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{formatPhoneNumber(contact.phone_number)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Classificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Select
                value={contact.contact_type}
                onValueChange={(value) => updateContactType(value as WhatsAppContact['contact_type'])}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {contactTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Salvando...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Association */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Associação com Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {associatedClient ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-900">
                      Associado ao cliente
                    </p>
                    <p className="text-sm text-green-700 truncate">
                      {associatedClient.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {associatedClient.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-green-700 hover:text-green-900"
                  >
                    <a href={`/clientes?id=${associatedClient.id}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeClientAssociation}
                  disabled={isSaving}
                  className="w-full"
                >
                  Remover Associação
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 border border-dashed rounded-lg">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Este contato não está associado a nenhum cliente
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowClientDialog(true)
                      loadAvailableClients()
                    }}
                    className="w-full"
                  >
                    <Link className="h-4 w-4" />
                    Associar a Cliente Existente
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowCreateClientDialog(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Novo Cliente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Primeira mensagem</p>
                <p className="font-medium">
                  {contact.created_at 
                    ? new Date(contact.created_at).toLocaleDateString('pt-BR')
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Última mensagem</p>
                <p className="font-medium">
                  {contact.last_message_at 
                    ? new Date(contact.last_message_at).toLocaleDateString('pt-BR')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Associate with Existing Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Associar a Cliente Existente</DialogTitle>
            <DialogDescription>
              Selecione um cliente existente para associar a este contato.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="client-search">Buscar cliente</Label>
              <Input
                id="client-search"
                placeholder="Digite o nome ou email do cliente..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  loadAvailableClients(e.target.value)
                }}
              />
            </div>
            
            <div>
              <Label htmlFor="client-select">Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex flex-col">
                        <span>{client.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {client.email} • {client.phone}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowClientDialog(false)
                setSelectedClientId('')
                setSearchQuery('')
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={associateWithClient}
              disabled={!selectedClientId || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Associar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Client Dialog */}
      <Dialog open={showCreateClientDialog} onOpenChange={setShowCreateClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Cliente</DialogTitle>
            <DialogDescription>
              Crie um novo cliente a partir das informações deste contato.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="client-name">Nome *</Label>
              <Input
                id="client-name"
                value={newClientData.name}
                onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do cliente"
              />
            </div>
            
            <div>
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="client-phone">Telefone</Label>
              <Input
                id="client-phone"
                value={newClientData.phone}
                onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div>
              <Label htmlFor="client-document">CPF/CNPJ</Label>
              <Input
                id="client-document"
                value={newClientData.document}
                onChange={(e) => setNewClientData(prev => ({ ...prev, document: e.target.value }))}
                placeholder="000.000.000-00"
              />
            </div>
            
            <div>
              <Label htmlFor="client-type">Tipo</Label>
              <Select
                value={newClientData.type}
                onValueChange={(value) => setNewClientData(prev => ({ 
                  ...prev, 
                  type: value as 'company' | 'individual' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Pessoa Física</SelectItem>
                  <SelectItem value="company">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateClientDialog(false)
                setNewClientData({
                  name: contact?.name || '',
                  email: '',
                  phone: contact?.phone_number || '',
                  document: '',
                  address: '',
                  type: 'individual'
                })
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={createNewClient}
              disabled={!newClientData.name.trim() || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}