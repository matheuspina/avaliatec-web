'use client'

import React, { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  Hash,
  FileText,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import type { WhatsAppQuickMessage } from '@/lib/types'

interface WhatsAppQuickMessagesManagerProps {
  onSave?: () => void
  className?: string
}

interface QuickMessageForm {
  shortcut: string
  message_text: string
  description: string
}

const INITIAL_FORM: QuickMessageForm = {
  shortcut: '',
  message_text: '',
  description: ''
}

export function WhatsAppQuickMessagesManager({ 
  onSave,
  className 
}: WhatsAppQuickMessagesManagerProps) {
  const { toast } = useToast()
  
  const [quickMessages, setQuickMessages] = useState<WhatsAppQuickMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form state
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<QuickMessageForm>(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState<Partial<QuickMessageForm>>({})
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    message: WhatsAppQuickMessage | null
  }>({
    isOpen: false,
    message: null
  })

  // Load quick messages on mount
  useEffect(() => {
    loadQuickMessages()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuickMessages = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/whatsapp/quick-messages')
      
      if (!response.ok) {
        throw new Error('Failed to load quick messages')
      }
      
      const data = await response.json()
      setQuickMessages(data.data.quickMessages || [])
    } catch (error) {
      console.error('Error loading quick messages:', error)
      toast({
        title: "Erro ao carregar mensagens rápidas",
        description: "Não foi possível carregar as mensagens rápidas",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Validate form data
  const validateForm = (data: QuickMessageForm): Partial<QuickMessageForm> => {
    const errors: Partial<QuickMessageForm> = {}

    // Validate shortcut
    if (!data.shortcut.trim()) {
      errors.shortcut = 'Atalho é obrigatório'
    } else if (!data.shortcut.startsWith('/')) {
      errors.shortcut = 'Atalho deve começar com "/"'
    } else if (data.shortcut.length < 2) {
      errors.shortcut = 'Atalho deve ter pelo menos 2 caracteres'
    } else if (!/^\/[a-zA-Z0-9_]+$/.test(data.shortcut)) {
      errors.shortcut = 'Atalho pode conter apenas letras, números e underscore após "/"'
    }

    // Validate message text
    if (!data.message_text.trim()) {
      errors.message_text = 'Texto da mensagem é obrigatório'
    } else if (data.message_text.length > 4096) {
      errors.message_text = 'Texto da mensagem não pode exceder 4096 caracteres'
    }

    return errors
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm(formData)
    setFormErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSaving(true)
    
    try {
      const url = editingId 
        ? `/api/whatsapp/quick-messages/${editingId}`
        : '/api/whatsapp/quick-messages'
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shortcut: formData.shortcut.toLowerCase(),
          message_text: formData.message_text.trim(),
          description: formData.description.trim() || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.code === 'SHORTCUT_EXISTS') {
          setFormErrors({ shortcut: 'Este atalho já existe' })
          return
        }
        throw new Error(result.error || 'Failed to save quick message')
      }

      // Update local state
      if (editingId) {
        setQuickMessages(prev => 
          prev.map(msg => 
            msg.id === editingId ? result.data.quickMessage : msg
          )
        )
        toast({
          title: "Mensagem rápida atualizada",
          description: "A mensagem rápida foi atualizada com sucesso"
        })
      } else {
        setQuickMessages(prev => [...prev, result.data.quickMessage])
        toast({
          title: "Mensagem rápida criada",
          description: "A mensagem rápida foi criada com sucesso"
        })
      }

      // Reset form
      setFormData(INITIAL_FORM)
      setFormErrors({})
      setIsCreating(false)
      setEditingId(null)
      
      // Call onSave callback if provided
      onSave?.()
      
    } catch (error) {
      console.error('Error saving quick message:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a mensagem rápida",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle edit
  const handleEdit = (message: WhatsAppQuickMessage) => {
    setFormData({
      shortcut: message.shortcut,
      message_text: message.message_text,
      description: message.description || ''
    })
    setFormErrors({})
    setEditingId(message.id)
    setIsCreating(true)
  }

  // Handle delete
  const handleDelete = async (message: WhatsAppQuickMessage) => {
    try {
      const response = await fetch(`/api/whatsapp/quick-messages/${message.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete quick message')
      }

      // Update local state
      setQuickMessages(prev => prev.filter(msg => msg.id !== message.id))
      
      toast({
        title: "Mensagem rápida excluída",
        description: "A mensagem rápida foi excluída com sucesso"
      })
      
      // Call onSave callback if provided
      onSave?.()
      
    } catch (error) {
      console.error('Error deleting quick message:', error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a mensagem rápida",
        variant: "destructive"
      })
    }
  }

  // Cancel form
  const handleCancel = () => {
    setFormData(INITIAL_FORM)
    setFormErrors({})
    setIsCreating(false)
    setEditingId(null)
  }

  // Filter messages based on search query
  const filteredMessages = quickMessages.filter(message => 
    message.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.message_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (message.description && message.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando mensagens rápidas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5" />
            <div>
              <h2 className="text-lg font-semibold">Mensagens Rápidas</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie atalhos para mensagens frequentes
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Mensagem
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar mensagens rápidas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">
                {editingId ? 'Editar Mensagem Rápida' : 'Nova Mensagem Rápida'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shortcut */}
                  <div className="space-y-2">
                    <Label htmlFor="shortcut">
                      Atalho <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="shortcut"
                        placeholder="/exemplo"
                        value={formData.shortcut}
                        onChange={(e) => {
                          let value = e.target.value
                          if (value && !value.startsWith('/')) {
                            value = '/' + value
                          }
                          setFormData(prev => ({ ...prev, shortcut: value }))
                          if (formErrors.shortcut) {
                            setFormErrors(prev => ({ ...prev, shortcut: undefined }))
                          }
                        }}
                        className={cn(
                          "pl-10",
                          formErrors.shortcut && "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                    </div>
                    {formErrors.shortcut && (
                      <p className="text-xs text-destructive">{formErrors.shortcut}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Deve começar com &quot;/&quot; e conter apenas letras, números e underscore
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="description"
                        placeholder="Descrição opcional..."
                        value={formData.description}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, description: e.target.value }))
                        }}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Descrição para documentar o uso da mensagem
                    </p>
                  </div>
                </div>

                {/* Message Text */}
                <div className="space-y-2">
                  <Label htmlFor="message_text">
                    Texto da Mensagem <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message_text"
                    placeholder="Digite o texto da mensagem rápida..."
                    value={formData.message_text}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, message_text: e.target.value }))
                      if (formErrors.message_text) {
                        setFormErrors(prev => ({ ...prev, message_text: undefined }))
                      }
                    }}
                    className={cn(
                      "min-h-[100px]",
                      formErrors.message_text && "border-destructive focus-visible:ring-destructive"
                    )}
                    rows={4}
                  />
                  {formErrors.message_text && (
                    <p className="text-xs text-destructive">{formErrors.message_text}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Variáveis disponíveis: {'{nome_cliente}'}</span>
                    <span>{formData.message_text.length}/4096</span>
                  </div>
                </div>

                {/* Info Box */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Como usar:</p>
                    <p>Digite o atalho (ex: /exemplo) no campo de mensagem e ele será substituído automaticamente pelo texto completo.</p>
                    <p className="mt-1">Use <code>{'{nome_cliente}'}</code> para inserir o nome do contato automaticamente.</p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    size="sm"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {editingId ? 'Atualizar' : 'Criar'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {searchQuery ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem rápida'}
              </p>
              <p className="text-sm">
                {searchQuery 
                  ? 'Tente ajustar os termos de busca'
                  : 'Crie sua primeira mensagem rápida para começar'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <Card key={message.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {message.shortcut}
                        </Badge>
                        {message.description && (
                          <span className="text-sm text-muted-foreground truncate">
                            {message.description}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {message.message_text}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>
                          Criado em {new Date(message.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {message.updated_at !== message.created_at && (
                          <span>
                            Atualizado em {new Date(message.updated_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(message)}
                        disabled={isCreating}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm({ isOpen: true, message })}
                        disabled={isCreating}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteConfirm.isOpen} 
        onOpenChange={(open) => setDeleteConfirm({ isOpen: open, message: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mensagem rápida</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a mensagem rápida &quot;{deleteConfirm.message?.shortcut}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm.message) {
                  handleDelete(deleteConfirm.message)
                }
                setDeleteConfirm({ isOpen: false, message: null })
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}