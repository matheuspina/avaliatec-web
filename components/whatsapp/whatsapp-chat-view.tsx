'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { 
  MessageCircle, 
  Clock, 
  Check, 
  CheckCheck, 
  Play, 
  Pause, 
  Volume2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWhatsApp } from '@/contexts/whatsapp-context'
import type { WhatsAppMessage, WhatsAppContact } from '@/lib/types'

interface WhatsAppChatViewProps {
  className?: string
}

interface AudioPlayerProps {
  audioUrl: string
  className?: string
}

function AudioPlayer({ audioUrl, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      setError(true)
      setIsLoading(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [audioUrl])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 p-2 bg-muted rounded-lg", className)}>
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm text-muted-foreground">Erro ao carregar áudio</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 bg-muted rounded-lg min-w-[200px]", className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        disabled={isLoading}
        className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Volume2 className="h-3 w-3 text-muted-foreground" />
          <div className="flex-1 bg-background rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}

export function WhatsAppChatView({ className }: WhatsAppChatViewProps) {
  const { 
    messages, 
    selectedContactId, 
    selectedInstanceId,
    contacts,
    isLoading 
  } = useWhatsApp()
  
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Find selected contact
  const selectedContact = contacts.find(contact => contact.id === selectedContactId)

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [shouldAutoScroll])

  // Scroll to bottom when messages change or component mounts
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle scroll to detect if user is at bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setShouldAutoScroll(isAtBottom)
  }, [])

  // Load more messages when scrolling to top (infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedContactId || isLoadingMore || !hasMoreMessages) return

    setIsLoadingMore(true)
    
    try {
      // Get the oldest message timestamp for cursor-based pagination
      const oldestMessage = messages[0]
      const cursor = oldestMessage?.timestamp

      const response = await fetch(
        `/api/whatsapp/messages?contactId=${selectedContactId}&limit=20${cursor ? `&before=${cursor}` : ''}`
      )

      if (!response.ok) {
        throw new Error('Failed to load more messages')
      }

      const data = await response.json()
      
      // In a real implementation, you would prepend these messages to the existing ones
      // and update the hasMoreMessages state based on the response
      setHasMoreMessages(data.hasMore || false)
      
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [selectedContactId, messages, isLoadingMore, hasMoreMessages])

  // Handle scroll events for infinite scroll
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScrollEvent = (e: Event) => {
      handleScroll()
      
      // Check if scrolled to top for infinite scroll
      const target = e.target as HTMLDivElement
      if (target.scrollTop === 0 && hasMoreMessages) {
        loadMoreMessages()
      }
    }

    container.addEventListener('scroll', handleScrollEvent)
    return () => container.removeEventListener('scroll', handleScrollEvent)
  }, [handleScroll, loadMoreMessages, hasMoreMessages])

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      // Today - show time only
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInDays === 1) {
      // Yesterday
      return `Ontem ${date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    } else if (diffInDays < 7) {
      // This week - show day and time
      return date.toLocaleDateString('pt-BR', { 
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      // Older - show date and time
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Get message status icon
  const getStatusIcon = (status: WhatsAppMessage['status'], fromMe: boolean) => {
    if (!fromMe) return null

    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-muted-foreground" />
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />
      default:
        return null
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

  // Group messages by date
  const groupMessagesByDate = (messages: WhatsAppMessage[]) => {
    const groups: { [key: string]: WhatsAppMessage[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.timestamp)
      const dateKey = date.toDateString()
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  if (!selectedContactId || !selectedInstanceId) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um contato para ver as mensagens</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando mensagens...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Chat header */}
      {selectedContact && (
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={selectedContact.profile_picture_url || undefined} 
                alt={selectedContact.name || selectedContact.phone_number}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getContactInitials(selectedContact)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">
                {selectedContact.name || selectedContact.phone_number}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {selectedContact.name ? selectedContact.phone_number : 'WhatsApp'}
              </p>
            </div>

            <Badge variant="outline" className="text-xs">
              {selectedContact.contact_type === 'cliente' && 'Cliente'}
              {selectedContact.contact_type === 'lead' && 'Lead'}
              {selectedContact.contact_type === 'profissional' && 'Profissional'}
              {selectedContact.contact_type === 'prestador' && 'Prestador'}
              {selectedContact.contact_type === 'unknown' && 'Não classificado'}
            </Badge>
          </div>
        </div>
      )}

      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Messages */}
        {Object.keys(messageGroups).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs">Envie uma mensagem para começar a conversa</p>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([dateKey, dayMessages]) => {
            const date = new Date(dateKey)
            const isToday = date.toDateString() === new Date().toDateString()
            const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString()
            
            let dateLabel = date.toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })
            
            if (isToday) dateLabel = 'Hoje'
            else if (isYesterday) dateLabel = 'Ontem'

            return (
              <div key={dateKey} className="space-y-4">
                {/* Date separator */}
                <div className="flex justify-center">
                  <Badge variant="secondary" className="text-xs">
                    {dateLabel}
                  </Badge>
                </div>

                {/* Messages for this date */}
                {dayMessages.map((message, index) => {
                  const isFromMe = message.from_me
                  const showAvatar = !isFromMe && (
                    index === 0 || 
                    dayMessages[index - 1]?.from_me !== message.from_me
                  )

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2 max-w-[80%]",
                        isFromMe ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      {/* Avatar for received messages */}
                      {showAvatar && selectedContact && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage 
                            src={selectedContact.profile_picture_url || undefined} 
                            alt={selectedContact.name || selectedContact.phone_number}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                            {getContactInitials(selectedContact)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {/* Spacer when no avatar */}
                      {!isFromMe && !showAvatar && (
                        <div className="w-8 flex-shrink-0" />
                      )}

                      {/* Message bubble */}
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 max-w-full break-words",
                          isFromMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {/* Message content */}
                        {message.message_type === 'text' && message.text_content && (
                          <p className="text-sm whitespace-pre-wrap">
                            {message.text_content}
                          </p>
                        )}

                        {message.message_type === 'audio' && message.media_url && (
                          <AudioPlayer 
                            audioUrl={message.media_url}
                            className={cn(
                              isFromMe 
                                ? "bg-primary-foreground/10" 
                                : "bg-background"
                            )}
                          />
                        )}

                        {message.message_type === 'image' && message.media_url && (
                          <div className="space-y-2">
                            <div className="relative max-w-full">
                              <Image 
                                src={message.media_url} 
                                alt="Imagem enviada"
                                width={300}
                                height={200}
                                className="rounded max-w-full h-auto"
                                loading="lazy"
                              />
                            </div>
                            {message.text_content && (
                              <p className="text-sm whitespace-pre-wrap">
                                {message.text_content}
                              </p>
                            )}
                          </div>
                        )}

                        {!['text', 'audio', 'image'].includes(message.message_type) && (
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>Tipo de mensagem não suportado: {message.message_type}</span>
                          </div>
                        )}

                        {/* Message footer with time and status */}
                        <div className={cn(
                          "flex items-center gap-1 mt-1 text-xs",
                          isFromMe 
                            ? "text-primary-foreground/70 justify-end" 
                            : "text-muted-foreground"
                        )}>
                          <span>{formatMessageTime(message.timestamp)}</span>
                          {getStatusIcon(message.status, isFromMe)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}