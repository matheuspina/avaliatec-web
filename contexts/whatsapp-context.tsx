'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type {
  WhatsAppInstance,
  WhatsAppContact,
  WhatsAppMessage
} from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { showApiErrorToast, whatsappToasts, withToastFeedback } from '@/lib/utils/toast-helpers'
import { withRetry, retryConfigs, messageRetryManager } from '@/lib/utils/retry-mechanism'
import { ContactListCache, QuickMessagesCache } from '@/lib/utils/cache'

interface SendMessageData {
  instanceId: string
  contactId: string
  messageType: 'text' | 'audio'
  textContent?: string
  audioUrl?: string
  quotedMessageId?: string
}

interface WhatsAppContextValue {
  // State
  instances: WhatsAppInstance[]
  selectedInstanceId: string | null
  selectedContactId: string | null
  contacts: WhatsAppContact[]
  messages: WhatsAppMessage[]
  isLoading: boolean
  error: string | null

  // Actions
  selectInstance: (instanceId: string) => void
  selectContact: (contactId: string) => void
  sendMessage: (data: SendMessageData) => Promise<void>
  retryMessage: (messageId: string) => Promise<void>
  refreshInstances: () => Promise<void>
  refreshContacts: () => Promise<void>
  refreshMessages: () => Promise<void>
  loadMoreMessages: (cursor: string) => Promise<any>
  clearError: () => void

  // Retry queue info
  retryQueueSize: number
}

const WhatsAppContext = createContext<WhatsAppContextValue | undefined>(undefined)

interface WhatsAppProviderProps {
  children: React.ReactNode
}

export function WhatsAppProvider({ children }: WhatsAppProviderProps) {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryQueueSize, setRetryQueueSize] = useState(0)

  const { toast } = useToast()

  // Load instances on mount
  const loadInstances = useCallback(async () => {
    return withRetry(async () => {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/whatsapp/instances')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load instances')
      }

      const data = await response.json()
      setInstances(data.data?.instances || [])

      // Auto-select first connected instance if none selected
      if (!selectedInstanceId && data.data?.instances?.length > 0) {
        const connectedInstance = data.data.instances.find((instance: WhatsAppInstance) =>
          instance.status === 'connected'
        )
        if (connectedInstance) {
          setSelectedInstanceId(connectedInstance.id)
        }
      }

      setIsLoading(false)
    }, {
      ...retryConfigs.apiCall,
      onRetry: (error, attempt) => {
        console.warn(`Retrying load instances (attempt ${attempt}):`, error)
      },
      onFinalFailure: (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load instances'
        setError(errorMessage)
        setIsLoading(false)
        showApiErrorToast(error, { title: 'Erro ao carregar instâncias' })
      }
    })
  }, [selectedInstanceId])

  // Load contacts for selected instance with caching
  const loadContacts = useCallback(async () => {
    if (!selectedInstanceId) {
      setContacts([])
      return
    }

    // Try to get from cache first
    const cachedContacts = ContactListCache.get(selectedInstanceId)
    if (cachedContacts) {
      setContacts(cachedContacts as WhatsAppContact[])
      return
    }

    return withRetry(async () => {
      setError(null)

      const response = await fetch(`/api/whatsapp/contacts?instanceId=${selectedInstanceId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load contacts')
      }

      const data = await response.json()
      const contactsData = data.data?.contacts || []

      // Cache the contacts
      ContactListCache.set(selectedInstanceId, contactsData)
      setContacts(contactsData)
    }, {
      ...retryConfigs.apiCall,
      onFinalFailure: (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load contacts'
        setError(errorMessage)
        showApiErrorToast(error, { title: 'Erro ao carregar contatos' })
      }
    })
  }, [selectedInstanceId])

  // Load messages for selected contact with pagination support
  const loadMessages = useCallback(async (cursor?: string) => {
    if (!selectedContactId) {
      setMessages([])
      return
    }

    return withRetry(async () => {
      setError(null)

      const url = new URL('/api/whatsapp/messages', window.location.origin)
      url.searchParams.set('contactId', selectedContactId)
      url.searchParams.set('limit', '50')
      if (cursor) {
        url.searchParams.set('before', cursor)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load messages')
      }

      const data = await response.json()
      const newMessages = data.data?.messages || []

      if (cursor) {
        // Append to existing messages for pagination
        setMessages(prev => [...newMessages, ...prev])
      } else {
        // Replace messages for initial load
        setMessages(newMessages)
      }

      return data.data?.pagination
    }, {
      ...retryConfigs.apiCall,
      onFinalFailure: (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load messages'
        setError(errorMessage)
        showApiErrorToast(error, { title: 'Erro ao carregar mensagens' })
      }
    })
  }, [selectedContactId])

  // Select instance action
  const selectInstance = useCallback((instanceId: string) => {
    setSelectedInstanceId(instanceId)
    setSelectedContactId(null) // Clear selected contact when switching instances
    setMessages([]) // Clear messages when switching instances
  }, [])

  // Select contact action
  const selectContact = useCallback((contactId: string) => {
    setSelectedContactId(contactId)
  }, [])

  // Send message action with optimistic updates and retry mechanism
  const sendMessage = useCallback(async (data: SendMessageData) => {
    if (!selectedContactId) {
      throw new Error('No contact selected')
    }

    // Create optimistic message
    const optimisticMessage: WhatsAppMessage = {
      id: `temp-${Date.now()}`,
      instance_id: data.instanceId,
      contact_id: data.contactId,
      message_id: `temp-${Date.now()}`,
      remote_jid: '',
      from_me: true,
      message_type: data.messageType,
      text_content: data.textContent || null,
      media_url: data.audioUrl || null,
      media_mime_type: data.messageType === 'audio' ? 'audio/ogg' : null,
      media_size: null,
      media_filename: null,
      quoted_message_id: data.quotedMessageId || null,
      status: 'pending',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    // Add optimistic message to state
    setMessages(prev => [...prev, optimisticMessage])

    // Create retry operation
    const sendOperation = async () => {
      const response = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(errorData.error || 'Failed to send message')
          ; (error as any).statusCode = response.status
          ; (error as any).response = errorData
        throw error
      }

      return response.json()
    }

    try {
      const result = await withRetry(sendOperation, {
        ...retryConfigs.messageSend,
        onRetry: (error, attempt) => {
          console.warn(`Retrying message send (attempt ${attempt}):`, error)
          // Update message status to show retry
          setMessages(prev =>
            prev.map(msg =>
              msg.id === optimisticMessage.id
                ? { ...msg, status: 'pending' }
                : msg
            )
          )
        }
      })

      // Replace optimistic message with real message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...optimisticMessage, ...result.data?.message, status: 'sent' }
            : msg
        )
      )

      whatsappToasts.messageSent()

    } catch (err) {
      // Mark message as failed
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...msg, status: 'failed' }
            : msg
        )
      )

      // Add to retry queue
      messageRetryManager.addToRetryQueue(optimisticMessage.id, sendOperation)
      setRetryQueueSize(messageRetryManager.getQueueSize())

      // Show error toast with retry option
      whatsappToasts.messageFailed(() => retryMessage(optimisticMessage.id))

      throw err
    }
  }, [selectedContactId])

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string) => {
    try {
      const success = await messageRetryManager.retryMessage(messageId)

      if (success) {
        // Update message status to sent
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, status: 'sent' }
              : msg
          )
        )
        whatsappToasts.messageSent()
      } else {
        // Keep as failed
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, status: 'failed' }
              : msg
          )
        )
        whatsappToasts.messageFailed(() => retryMessage(messageId))
      }

      setRetryQueueSize(messageRetryManager.getQueueSize())
    } catch (error) {
      showApiErrorToast(error, { title: 'Erro ao reenviar mensagem' })
    }
  }, [])

  // Refresh functions
  const refreshInstances = useCallback(async () => {
    await loadInstances()
  }, [loadInstances])

  const refreshContacts = useCallback(async () => {
    await loadContacts()
  }, [loadContacts])

  const refreshMessages = useCallback(async () => {
    await loadMessages()
  }, [loadMessages])

  const loadMoreMessages = useCallback(async (cursor: string) => {
    return await loadMessages(cursor)
  }, [loadMessages])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load initial data
  useEffect(() => {
    loadInstances()
  }, [loadInstances])

  // Load contacts when instance changes
  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  // Load messages when contact changes
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Set up real-time subscriptions for messages
  useEffect(() => {
    if (!selectedInstanceId || !selectedContactId) return

    const supabase = createClient()

    // Subscribe to new messages for the selected contact
    const messagesSubscription = supabase
      .channel('whatsapp_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `contact_id=eq.${selectedContactId}`
        },
        (payload) => {
          const newMessage = payload.new as WhatsAppMessage
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `contact_id=eq.${selectedContactId}`
        },
        (payload) => {
          const updatedMessage = payload.new as WhatsAppMessage
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          )
        }
      )
      .subscribe()

    return () => {
      messagesSubscription.unsubscribe()
    }
  }, [selectedInstanceId, selectedContactId])

  // Set up real-time subscriptions for contacts
  useEffect(() => {
    if (!selectedInstanceId) return

    const supabase = createClient()

    // Subscribe to contact updates for the selected instance
    const contactsSubscription = supabase
      .channel('whatsapp_contacts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_contacts',
          filter: `instance_id=eq.${selectedInstanceId}`
        },
        () => {
          // Clear cache and refresh contacts when any contact changes
          ContactListCache.clearInstance(selectedInstanceId)
          loadContacts()
        }
      )
      .subscribe()

    return () => {
      contactsSubscription.unsubscribe()
    }
  }, [selectedInstanceId, loadContacts])

  const value: WhatsAppContextValue = {
    instances,
    selectedInstanceId,
    selectedContactId,
    contacts,
    messages,
    isLoading,
    error,
    selectInstance,
    selectContact,
    sendMessage,
    retryMessage,
    refreshInstances,
    refreshContacts,
    refreshMessages,
    loadMoreMessages,
    clearError,
    retryQueueSize
  }

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  )
}

export function useWhatsApp(): WhatsAppContextValue {
  const context = useContext(WhatsAppContext)

  if (context === undefined) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider')
  }

  return context
}