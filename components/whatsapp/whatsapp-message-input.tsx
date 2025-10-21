'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Send, 
  Mic, 
  MicOff, 
  Square, 
  Loader2, 
  Smile,
  Paperclip,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useWhatsApp } from '@/contexts/whatsapp-context'
import { whatsappToasts, showApiErrorToast } from '@/lib/utils/toast-helpers'
import type { WhatsAppQuickMessage, WhatsAppContact } from '@/lib/types'

interface WhatsAppMessageInputProps {
  className?: string
  disabled?: boolean
}

interface QuickMessageSuggestion {
  shortcut: string
  messageText: string
  description?: string
}

export function WhatsAppMessageInput({ className, disabled }: WhatsAppMessageInputProps) {
  const { 
    selectedInstanceId, 
    selectedContactId, 
    sendMessage, 
    contacts,
    instances 
  } = useWhatsApp()
  
  const { toast } = useToast()
  
  // State
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [quickMessages, setQuickMessages] = useState<WhatsAppQuickMessage[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<QuickMessageSuggestion[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [recordingTime, setRecordingTime] = useState(0)
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get selected contact and instance
  const selectedContact = contacts.find(contact => contact.id === selectedContactId)
  const selectedInstance = instances.find(instance => instance.id === selectedInstanceId)
  
  // Check if input should be disabled
  const isInputDisabled = disabled || 
    !selectedInstanceId || 
    !selectedContactId || 
    selectedInstance?.status !== 'connected' ||
    isSending

  // Load quick messages on mount
  useEffect(() => {
    const loadQuickMessages = async () => {
      try {
        const response = await fetch('/api/whatsapp/quick-messages')
        if (response.ok) {
          const data = await response.json()
          setQuickMessages(data.data?.quickMessages || [])
        }
      } catch (error) {
        console.error('Error loading quick messages:', error)
      }
    }
    
    loadQuickMessages()
  }, [])

  // Handle quick message suggestions
  useEffect(() => {
    const text = message.toLowerCase()
    const cursorPosition = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = message.slice(0, cursorPosition)
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/')
    
    if (lastSlashIndex !== -1) {
      const searchTerm = textBeforeCursor.slice(lastSlashIndex)
      
      if (searchTerm.length > 0) {
        const suggestions = quickMessages
          .filter(qm => qm.shortcut.toLowerCase().startsWith(searchTerm.toLowerCase()))
          .map(qm => ({
            shortcut: qm.shortcut,
            messageText: qm.message_text,
            description: qm.description || undefined
          }))
          .slice(0, 5) // Limit to 5 suggestions
        
        setFilteredSuggestions(suggestions)
        setShowSuggestions(suggestions.length > 0)
        setSelectedSuggestionIndex(-1)
      } else {
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }
  }, [message, quickMessages])

  // Replace message variables
  const replaceMessageVariables = useCallback((text: string): string => {
    if (!selectedContact) return text
    
    let processedText = text
    
    // Replace {nome_cliente} with contact name or phone number
    const clientName = selectedContact.name || selectedContact.phone_number
    processedText = processedText.replace(/\{nome_cliente\}/g, clientName)
    
    // Add more variable replacements here as needed
    // processedText = processedText.replace(/\{telefone\}/g, selectedContact.phone_number)
    
    return processedText
  }, [selectedContact])

  // Handle typing indicator
  const handleTypingStart = useCallback(() => {
    if (!isTyping && selectedInstanceId && selectedContactId) {
      setIsTyping(true)
      // In a real implementation, you would send typing indicator to WhatsApp
      // via Evolution API endpoint for typing status
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 3000) // Stop typing indicator after 3 seconds of inactivity
  }, [isTyping, selectedInstanceId, selectedContactId])

  // Handle message change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value
    setMessage(newMessage)
    
    // Trigger typing indicator
    if (newMessage.trim() && !isInputDisabled) {
      handleTypingStart()
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter for new line - let default behavior happen
        return
      } else {
        // Enter to send message
        e.preventDefault()
        
        if (showSuggestions && selectedSuggestionIndex >= 0) {
          // Apply selected suggestion
          applySuggestion(filteredSuggestions[selectedSuggestionIndex])
        } else {
          // Send message
          handleSendMessage()
        }
      }
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev <= 0 ? filteredSuggestions.length - 1 : prev - 1
      )
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev >= filteredSuggestions.length - 1 ? 0 : prev + 1
      )
    } else if (e.key === 'Escape' && showSuggestions) {
      e.preventDefault()
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  // Apply quick message suggestion
  const applySuggestion = (suggestion: QuickMessageSuggestion) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = message.slice(0, cursorPosition)
    const textAfterCursor = message.slice(cursorPosition)
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/')
    
    if (lastSlashIndex !== -1) {
      const beforeSlash = textBeforeCursor.slice(0, lastSlashIndex)
      const processedMessage = replaceMessageVariables(suggestion.messageText)
      const newMessage = beforeSlash + processedMessage + textAfterCursor
      
      setMessage(newMessage)
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
      
      // Focus textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPosition = beforeSlash.length + processedMessage.length
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        }
      }, 0)
    }
  }

  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() || isInputDisabled) return
    
    try {
      setIsSending(true)
      
      const processedMessage = replaceMessageVariables(message.trim())
      
      await sendMessage({
        instanceId: selectedInstanceId!,
        contactId: selectedContactId!,
        messageType: 'text',
        textContent: processedMessage
      })
      
      // Clear message and stop typing indicator
      setMessage('')
      setIsTyping(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Focus textarea
      textareaRef.current?.focus()
      
    } catch (error) {
      console.error('Error sending message:', error)
      // Error handling is now done in the context with retry mechanism
    } finally {
      setIsSending(false)
    }
  }

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
        await handleSendAudio(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      whatsappToasts.audioRecordingFailed()
    }
  }

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  // Handle send audio
  const handleSendAudio = async (audioBlob: Blob) => {
    if (isInputDisabled) return
    
    try {
      setIsSending(true)
      
      // Convert blob to base64 or upload to storage
      // For now, we'll create a temporary URL
      const audioUrl = URL.createObjectURL(audioBlob)
      
      await sendMessage({
        instanceId: selectedInstanceId!,
        contactId: selectedContactId!,
        messageType: 'audio',
        audioUrl: audioUrl
      })
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(audioUrl), 1000)
      
    } catch (error) {
      console.error('Error sending audio:', error)
      // Error handling is now done in the context with retry mechanism
    } finally {
      setIsSending(false)
    }
  }

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  if (!selectedInstanceId || !selectedContactId) {
    return (
      <div className={cn("p-4 border-t bg-muted/30", className)}>
        <div className="flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">Selecione um contato para enviar mensagens</span>
        </div>
      </div>
    )
  }

  if (selectedInstance?.status !== 'connected') {
    return (
      <div className={cn("p-4 border-t bg-muted/30", className)}>
        <div className="flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">
            Instância desconectada. Conecte a instância para enviar mensagens.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Quick message suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.shortcut}
              onClick={() => applySuggestion(suggestion)}
              className={cn(
                "p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0",
                index === selectedSuggestionIndex && "bg-muted"
              )}
            >
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs font-mono">
                  {suggestion.shortcut}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {replaceMessageVariables(suggestion.messageText)}
                  </p>
                  {suggestion.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recording overlay */}
      {isRecording && (
        <div className="absolute inset-0 bg-red-500/10 border border-red-500 rounded-lg flex items-center justify-center z-40">
          <div className="flex items-center gap-3 text-red-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">Gravando</span>
            </div>
            <span className="font-mono text-sm">
              {formatRecordingTime(recordingTime)}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="ml-2"
            >
              <Square className="h-3 w-3 mr-1" />
              Parar
            </Button>
          </div>
        </div>
      )}

      {/* Main input area */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-end gap-2">
          {/* Audio recording button */}
          <Button
            variant="outline"
            size="icon"
            disabled={isInputDisabled || isRecording}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className="flex-shrink-0"
            title="Manter pressionado para gravar áudio"
          >
            {isRecording ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* Text input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyPress}
              placeholder={
                isInputDisabled 
                  ? "Conecte uma instância para enviar mensagens..."
                  : "Digite sua mensagem... (/ para atalhos)"
              }
              disabled={isInputDisabled}
              className="min-h-[40px] max-h-[120px] resize-none pr-12"
              rows={1}
            />
            
            {/* Variable preview */}
            {message.includes('{nome_cliente}') && selectedContact && (
              <div className="absolute -top-8 left-0 right-0">
                <Badge variant="outline" className="text-xs">
                  {selectedContact.name || selectedContact.phone_number}
                </Badge>
              </div>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={isInputDisabled || !message.trim()}
            size="icon"
            className="flex-shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Typing indicator */}
        {isTyping && !isInputDisabled && (
          <div className="mt-2 text-xs text-muted-foreground">
            Digitando...
          </div>
        )}

        {/* Help text */}
        <div className="mt-2 text-xs text-muted-foreground">
          <span>Enter para enviar • Shift+Enter para nova linha</span>
          {quickMessages.length > 0 && (
            <span> • Digite / para atalhos</span>
          )}
        </div>
      </div>
    </div>
  )
}