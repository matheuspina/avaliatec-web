"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Clock, MapPin, Trash2 } from "lucide-react"
import { EventFormDialog } from "@/components/events/event-form-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { listEventsByDate, createEvent, updateEvent, deleteEvent } from "@/lib/data/events"
import { Protected } from "@/components/protected"
import { usePermissions } from "@/contexts/permission-context"

type User = {
  id: string
  name: string
}

type Client = {
  id: string
  name: string
}

type Event = {
  id: string
  title: string
  description: string
  date: Date
  time: string
  location: string
  type: "meeting" | "deadline" | "visit"
  users?: User[]
  client?: Client
}

export default function AgendaPage() {
  const { hasPermission } = usePermissions()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)

  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    async function load() {
      try {
        const current = date ?? new Date()
        const data = await listEventsByDate(current)
        setEvents(data as Event[])
      } catch (err) {
        console.error("Erro ao carregar eventos:", err)
      }
    }
    load()
  }, [date])

  const getEventTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "meeting":
        return "default"
      case "deadline":
        return "destructive"
      case "visit":
        return "secondary"
      default:
        return "default"
    }
  }

  const getEventTypeLabel = (type: Event["type"]) => {
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

  // Eventos já vêm filtrados pela data do Supabase, não precisa filtrar novamente
  const todayEvents = events

  const handleSaveEvent = async (data: {
    title: string
    description: string
    date: string
    time: string
    location: string
    type: "meeting" | "deadline" | "visit"
    users: User[]
    client?: Client
  }) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          title: data.title,
          description: data.description,
          date: data.date,
          time: data.time,
          location: data.location,
          type: data.type,
          client_id: data.client?.id ?? null,
        })
        setEditingEvent(null)
      } else {
        await createEvent({
          title: data.title,
          description: data.description,
          date: data.date,
          time: data.time,
          location: data.location,
          type: data.type,
          client_id: data.client?.id ?? null,
        })
      }
      // Reload events
      const current = date ?? new Date()
      const refreshed = await listEventsByDate(current)
      setEvents(refreshed as Event[])
    } catch (err) {
      console.error("Erro ao salvar evento:", err)
      alert("Falha ao salvar evento. Verifique se está autenticado e tente novamente.")
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setIsDialogOpen(true)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteEvent = async () => {
    try {
      if (eventToDelete) {
        await deleteEvent(eventToDelete)
        setEventToDelete(null)
        const current = date ?? new Date()
        const refreshed = await listEventsByDate(current)
        setEvents(refreshed as Event[])
      }
    } catch (err) {
      console.error("Erro ao excluir evento:", err)
      alert("Falha ao excluir evento.")
    }
    setDeleteConfirmOpen(false)
  }

  const handleNewEvent = () => {
    setEditingEvent(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus compromissos e prazos
          </p>
        </div>
        <Protected section="agenda" action="create">
          <Button onClick={handleNewEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
        </Protected>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDeleteEvent}
        title="Excluir Evento"
        description="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />

      <EventFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingEvent(null)
        }}
        onSave={handleSaveEvent}
        initialData={
          editingEvent
            ? {
                title: editingEvent.title,
                description: editingEvent.description,
                date: editingEvent.date.toISOString().split("T")[0],
                time: editingEvent.time,
                location: editingEvent.location,
                type: editingEvent.type,
                users: editingEvent.users ?? [],
                client: editingEvent.client,
              }
            : date
            ? {
                date: date.toISOString().split("T")[0],
                time: "10:00",
              }
            : undefined
        }
        mode={editingEvent ? "edit" : "create"}
      />

      <div className="grid gap-6 md:grid-cols-[350px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
            <CardDescription>Selecione uma data</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Eventos do Dia
              {date && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {date.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {todayEvents.length} eventos agendados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum evento para este dia
                  </p>
                  <Button variant="link" className="mt-2" onClick={handleNewEvent}>
                    Adicionar evento
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {todayEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer transition-colors hover:bg-accent/50"
                    onClick={() => handleEditEvent(event)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <CardTitle className="text-base">
                            {event.title}
                          </CardTitle>
                          <CardDescription>{event.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getEventTypeColor(event.type)}>
                            {getEventTypeLabel(event.type)}
                          </Badge>
                          <Protected section="agenda" action="delete">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteEvent(event.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </Protected>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        </div>
                        {event.users && event.users.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.users.map((user) => (
                              <Badge key={user.id} variant="secondary" className="text-xs">
                                {user.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {event.client && (
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {event.client.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
