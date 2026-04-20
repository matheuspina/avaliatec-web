'use client'

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Filter } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityUser {
  id: string
  full_name: string
  avatar_url?: string | null
}

interface Activity {
  id: string
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown> | null
  created_at: string
  user: ActivityUser | null
}

interface ActivityLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENTITY_TYPE_LABELS: Record<string, string> = {
  projects: 'Projeto',
  clients: 'Cliente',
  tasks: 'Tarefa',
  events: 'Evento',
  files: 'Arquivo',
  users: 'Usuário',
}

const ACTION_LABELS: Record<string, string> = {
  created: 'criou',
  updated: 'atualizou',
  deleted: 'excluiu',
}

// Artigos definidos para cada tipo de entidade
const ENTITY_ARTICLES: Record<string, string> = {
  projects: 'o',
  clients: 'o',
  tasks: 'a',
  events: 'o',
  files: 'o',
  users: 'o',
}

const ENTITY_TYPE_BADGE: Record<string, 'default' | 'secondary' | 'outline'> = {
  projects: 'default',
  clients: 'secondary',
  tasks: 'outline',
  events: 'default',
  files: 'secondary',
  users: 'outline',
}

function formatActivityMessage(activity: Activity): string {
  const userName = activity.user?.full_name || 'Sistema'
  const action = ACTION_LABELS[activity.action] || activity.action
  const entityType = ENTITY_TYPE_LABELS[activity.entity_type] || activity.entity_type
  const article = ENTITY_ARTICLES[activity.entity_type] || 'o'

  // Extrair nome da entidade dos detalhes
  let entityName = ''
  if (activity.details) {
    const newData = activity.details.new as Record<string, unknown> | null
    const oldData = activity.details.old as Record<string, unknown> | null
    const data = newData || oldData
    
    if (data) {
      entityName = (data.name as string) || (data.title as string) || (data.full_name as string) || ''
    }
  }

  if (entityName) {
    return `${userName} ${action} ${article} ${entityType.toLowerCase()} "${entityName}"`
  }
  
  return `${userName} ${action} um${article === 'a' ? 'a' : ''} ${entityType.toLowerCase()}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityLogModal({ open, onOpenChange }: ActivityLogModalProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')

  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (entityTypeFilter !== 'all') {
        params.append('entity_type', entityTypeFilter)
      }
      if (actionFilter !== 'all') {
        params.append('action', actionFilter)
      }

      const res = await fetch(`/api/activities?${params}`)
      if (!res.ok) return

      const json = await res.json()
      if (json.success) {
        setActivities(json.data.activities)
        setTotalPages(json.data.pagination.totalPages)
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchActivities()
    }
  }, [open, page, entityTypeFilter, actionFilter])

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1)
  }

  const handleEntityTypeChange = (value: string) => {
    setEntityTypeFilter(value)
    setPage(1)
  }

  const handleActionChange = (value: string) => {
    setActionFilter(value)
    setPage(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Registro de Alterações</DialogTitle>
          <DialogDescription>
            Histórico completo de atividades do sistema
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={entityTypeFilter} onValueChange={handleEntityTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="projects">Projetos</SelectItem>
              <SelectItem value="clients">Clientes</SelectItem>
              <SelectItem value="tasks">Tarefas</SelectItem>
              <SelectItem value="events">Eventos</SelectItem>
              <SelectItem value="files">Arquivos</SelectItem>
              <SelectItem value="users">Usuários</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={handleActionChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="created">Criação</SelectItem>
              <SelectItem value="updated">Atualização</SelectItem>
              <SelectItem value="deleted">Exclusão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma atividade encontrada
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">
                    {formatActivityMessage(activity)}
                  </p>
                  <Badge variant={ENTITY_TYPE_BADGE[activity.entity_type] || 'default'}>
                    {ENTITY_TYPE_LABELS[activity.entity_type] || activity.entity_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(activity.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {activity.user && (
                    <>
                      <span>•</span>
                      <span>{activity.user.full_name}</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page === totalPages || isLoading}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
