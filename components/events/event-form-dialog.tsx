"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Trash2 } from "lucide-react"
import { listClients } from "@/lib/data/clients"
import type { Client as ClientType } from "@/lib/types"
import { usePermissions } from "@/contexts/permission-context"

type EventType = "meeting" | "deadline" | "visit"

type User = {
  id: string
  name: string
}

type Client = {
  id: string
  name: string
}

type EventFormData = {
  title: string
  description: string
  date: string
  time: string
  location: string
  type: EventType
  users: User[]
  client?: Client
}

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: EventFormData) => void
  onDelete?: () => void
  initialData?: Partial<EventFormData>
  mode?: "create" | "edit"
}

// Mock data for users only (profiles integration pode ser adicionada depois)
const availableUsers: User[] = [
  { id: "1", name: "João Silva" },
  { id: "2", name: "Maria Santos" },
  { id: "3", name: "Pedro Costa" },
  { id: "4", name: "Ana Lima" },
  { id: "5", name: "Carlos Souza" },
]

export function EventFormDialog({
  open,
  onOpenChange,
  onSave,
  onDelete,
  initialData,
  mode = "create",
}: EventFormDialogProps) {
  const { hasPermission } = usePermissions()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Check permissions
  const canEdit = hasPermission('agenda', 'edit')
  const canDelete = hasPermission('agenda', 'delete')
  const isReadOnly = mode === "edit" && !canEdit
  
  const initialFormState = useMemo<EventFormData>(
    () => ({
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      date: initialData?.date ?? new Date().toISOString().split("T")[0],
      time: initialData?.time ?? "10:00",
      location: initialData?.location ?? "",
      type: initialData?.type ?? "meeting",
      users: initialData?.users ? [...initialData.users] : [],
      client: initialData?.client
        ? { id: initialData.client.id, name: initialData.client.name }
        : undefined,
    }),
    [initialData]
  )

  const [formData, setFormData] = useState<EventFormData>(initialFormState)

  useEffect(() => {
    if (open) {
      setFormData(initialFormState)
    }
  }, [open, initialFormState])

  const [clientOptions, setClientOptions] = useState<ClientType[]>([])
  useEffect(() => {
    async function loadClients() {
      try {
        const { data } = await listClients()
        setClientOptions(data)
      } catch (err) {
        console.error("Erro ao carregar clientes:", err)
      }
    }
    if (open) loadClients()
  }, [open])

  const handleAddUser = (userId: string) => {
    const user = availableUsers.find((u) => u.id === userId)
    if (user && !formData.users.find((u) => u.id === userId)) {
      setFormData((prev) => ({
        ...prev,
        users: [...prev.users, user],
      }))
    }
  }

  const handleRemoveUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }))
  }

  const handleSetClient = (clientId: string) => {
    const client = clientOptions.find((c) => c.id === clientId)
    setFormData((prev) => ({
      ...prev,
      client: client ? { id: client.id, name: client.name } : undefined,
    }))
  }

  const handleRemoveClient = () => {
    setFormData((prev) => ({
      ...prev,
      client: undefined,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isReadOnly) {
      onSave(formData)
      onOpenChange(false)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
      onOpenChange(false)
      setShowDeleteConfirm(false)
    }
  }

  const getEventTypeLabel = (type: EventType) => {
    switch (type) {
      case "meeting":
        return "Reunião"
      case "deadline":
        return "Prazo"
      case "visit":
        return "Visita"
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle>
                {mode === "create" ? "Criar Novo Evento" : isReadOnly ? "Visualizar Evento" : "Editar Evento"}
              </DialogTitle>
              <DialogDescription>
                {mode === "create"
                  ? "Preencha as informações do novo evento"
                  : isReadOnly
                  ? "Visualização do evento"
                  : "Atualize as informações do evento"}
              </DialogDescription>
            </div>
            {mode === "edit" && canDelete && onDelete && (
              showDeleteConfirm ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </Button>
              )
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Título */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Título {!isReadOnly && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="title"
                placeholder="Ex: Reunião com Cliente"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required={!isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            {/* Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="description">
                Descrição {!isReadOnly && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="description"
                placeholder={isReadOnly ? "" : "Descreva o evento..."}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                required={!isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            {/* Tipo de Evento */}
            <div className="grid gap-2">
              <Label htmlFor="type">
                Tipo de Evento {!isReadOnly && <span className="text-destructive">*</span>}
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: EventType) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                disabled={isReadOnly}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="visit">Visita</SelectItem>
                  <SelectItem value="deadline">Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">
                  Data {!isReadOnly && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required={!isReadOnly}
                  disabled={isReadOnly}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">
                  Horário {!isReadOnly && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, time: e.target.value }))
                  }
                  required={!isReadOnly}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Local */}
            <div className="grid gap-2">
              <Label htmlFor="location">
                Local {!isReadOnly && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="location"
                placeholder="Ex: Escritório Central, Rua X, 123"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                required={!isReadOnly}
                disabled={isReadOnly}
              />
            </div>

            {/* Usuários */}
            <div className="grid gap-2">
              <Label htmlFor="users">Adicionar Usuários</Label>
              {!isReadOnly && (
                <Select onValueChange={handleAddUser}>
                  <SelectTrigger id="users">
                    <SelectValue placeholder="Selecione usuários..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers
                      .filter((u) => !formData.users.find((fu) => fu.id === u.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
              {formData.users.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.users.map((user) => (
                    <Badge key={user.id} variant="secondary" className="gap-1">
                      {user.name}
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Cliente (Opcional) */}
            <div className="grid gap-2">
              <Label htmlFor="client">Cliente (Opcional)</Label>
              {!isReadOnly && (
                <Select
                  value={formData.client?.id}
                  onValueChange={handleSetClient}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {formData.client && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="gap-1">
                    {formData.client.name}
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleRemoveClient}
                        className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isReadOnly ? "Fechar" : "Cancelar"}
            </Button>
            {!isReadOnly && (
              <Button type="submit">
                {mode === "create" ? "Criar Evento" : "Salvar Alterações"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
