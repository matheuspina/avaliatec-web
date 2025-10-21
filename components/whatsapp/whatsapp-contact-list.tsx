'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Search, User, MessageCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LazyAvatar, useAvatarFallback } from '@/components/ui/lazy-avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWhatsApp } from '@/contexts/whatsapp-context'
import type { WhatsAppContact } from '@/lib/types'

interface WhatsAppContactListProps {
  className?: string
}

export function WhatsAppContactList({ className }: WhatsAppContactListProps) {
  const { 
    contacts, 
    selectedContactId, 
    selectContact, 
    selectedInstanceId,
    isLoading 
  } = useWhatsApp()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Debounce search input to avoid excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms debounce delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Contact type options for filter
  const contactTypeOptions = [
    { value: 'all', label: 'Todos os contatos' },
    { value: 'cliente', label: 'Clientes' },
    { value: 'lead', label: 'Leads' },
    { value: 'profissional', label: 'Profissionais' },
    { value: 'prestador', label: 'Prestadores' },
    { value: 'unknown', label: 'Não classificados' }
  ]

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    let filtered = contacts

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(contact => contact.contact_type === selectedType)
    }

    // Filter by debounced search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim()
      filtered = filtered.filter(contact => 
        contact.name?.toLowerCase().includes(query) ||
        contact.phone_number.includes(query)
      )
    }

    // Sort by last message date (most recent first)
    return filtered.sort((a, b) => {
      const aDate = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const bDate = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return bDate - aDate
    })
  }, [contacts, selectedType, debouncedSearchQuery])

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return null

    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Agora'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}min`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d`
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  // Get contact type badge
  const getContactTypeBadge = (type: WhatsAppContact['contact_type']) => {
    const variants = {
      cliente: { variant: 'default' as const, label: 'Cliente' },
      lead: { variant: 'secondary' as const, label: 'Lead' },
      profissional: { variant: 'outline' as const, label: 'Profissional' },
      prestador: { variant: 'outline' as const, label: 'Prestador' },
      unknown: { variant: 'secondary' as const, label: 'Não classificado' }
    }

    const config = variants[type] || variants.unknown
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  // Memoized search input handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  // Mock unread count (this would come from API in real implementation)
  const getUnreadCount = (contactId: string) => {
    // This is a placeholder - in real implementation, this would come from the API
    // or be calculated based on message status
    return Math.floor(Math.random() * 5) // Random for demo
  }

  if (!selectedInstanceId) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione uma instância para ver os contatos</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header with search and filter */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            {contactTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Carregando contatos...</div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {debouncedSearchQuery || selectedType !== 'all' 
                  ? 'Nenhum contato encontrado' 
                  : 'Nenhum contato disponível'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {filteredContacts.map((contact) => {
              const isSelected = selectedContactId === contact.id
              const unreadCount = getUnreadCount(contact.id)
              const relativeTime = formatRelativeTime(contact.last_message_at)
              
              return (
                <ContactListItem
                  key={contact.id}
                  contact={contact}
                  isSelected={isSelected}
                  unreadCount={unreadCount}
                  relativeTime={relativeTime}
                  onSelect={() => selectContact(contact.id)}
                />
              )
            })}


          </div>
        )}
      </div>

      {/* Footer with contact count */}
      {filteredContacts.length > 0 && (
        <div className="p-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {filteredContacts.length} contato{filteredContacts.length !== 1 ? 's' : ''}
            {selectedType !== 'all' && ` • ${contactTypeOptions.find(opt => opt.value === selectedType)?.label}`}
          </p>
        </div>
      )}
    </div>
  )
}
/**
 * 
Memoized contact list item component for better performance
 * Only re-renders when props actually change
 */
interface ContactListItemProps {
  contact: WhatsAppContact
  isSelected: boolean
  unreadCount: number
  relativeTime: string | null
  onSelect: () => void
}

const ContactListItem = React.memo(({ 
  contact, 
  isSelected, 
  unreadCount, 
  relativeTime, 
  onSelect 
}: ContactListItemProps) => {
  const fallback = useAvatarFallback(contact.name, contact.phone_number)

  // Get contact type badge
  const getContactTypeBadge = (type: WhatsAppContact['contact_type']) => {
    const variants = {
      cliente: { variant: 'default' as const, label: 'Cliente' },
      lead: { variant: 'secondary' as const, label: 'Lead' },
      profissional: { variant: 'outline' as const, label: 'Profissional' },
      prestador: { variant: 'outline' as const, label: 'Prestador' },
      unknown: { variant: 'secondary' as const, label: 'Não classificado' }
    }

    const config = variants[type] || variants.unknown
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-muted border-r-2 border-r-primary"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Lazy-loaded Avatar */}
        <LazyAvatar
          src={contact.profile_picture_url}
          alt={contact.name || contact.phone_number}
          fallback={fallback}
          size="md"
          className="flex-shrink-0"
        />

        {/* Contact info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-medium truncate",
                isSelected && "text-primary"
              )}>
                {contact.name || contact.phone_number}
              </h3>
              {contact.name && (
                <p className="text-xs text-muted-foreground truncate">
                  {contact.phone_number}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {unreadCount > 0 && (
                <Badge 
                  variant="default" 
                  className="bg-green-500 hover:bg-green-600 text-white min-w-[20px] h-5 text-xs px-1.5"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              {relativeTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{relativeTime}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {getContactTypeBadge(contact.contact_type)}
            
            {/* Last message preview placeholder */}
            <div className="text-xs text-muted-foreground truncate flex-1 text-right">
              {contact.last_message_at ? (
                <span>Última mensagem...</span>
              ) : (
                <span>Sem mensagens</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

ContactListItem.displayName = 'ContactListItem'