'use client'

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Briefcase, CheckCircle2, Clock, Calendar as CalendarIcon, MapPin } from "lucide-react"
import { usePermissions } from "@/contexts/permission-context"
import { SECTIONS } from "@/lib/types"
import { AppMainBleed } from "@/components/app-main-bleed"
import { ActivityLogModal } from "@/components/activities/activity-log-modal"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardUser {
  id: string
  name: string
  avatar_url?: string | null
}

interface DashboardClient {
  id: string
  name: string
}

interface TodayEvent {
  id: string
  title: string
  description: string | null
  time: string
  location: string | null
  type: 'meeting' | 'deadline' | 'visit'
  client: DashboardClient | null
  users: DashboardUser[]
}

interface RecentProject {
  id: string
  code: string
  name: string
  status: string
  client: DashboardClient | null
}

interface RecentActivity {
  id: string
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown> | null
  created_at: string
  user: DashboardUser | null
}

interface DashboardData {
  total_clients: number
  active_projects: number
  completed_projects: number
  pending_tasks: number
  today_events: TodayEvent[]
  recent_projects: RecentProject[]
  recent_activities: RecentActivity[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'A fazer',
  in_progress: 'Em andamento',
  review: 'Em revisão',
  done: 'Concluído',
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  backlog: 'secondary',
  todo: 'secondary',
  in_progress: 'default',
  review: 'default',
  done: 'outline',
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  meeting: 'Reunião',
  deadline: 'Prazo',
  visit: 'Visita',
}

const EVENT_TYPE_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  meeting: 'default',
  deadline: 'destructive',
  visit: 'secondary',
}

// ─── Helpers para Atividades ──────────────────────────────────────────────────

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

function formatActivityMessage(activity: RecentActivity): string {
  const userName = activity.user?.name || 'Sistema'
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

export default function DashboardPage() {
  const router = useRouter()
  const { hasPermission, isLoading, permissions, currentUser } = usePermissions()

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)

  // Redirect to first available section if no access to dashboard
  useEffect(() => {
    if (!isLoading && !hasPermission('dashboard', 'view')) {
      const availableSections = Object.keys(SECTIONS).filter(
        (key) => hasPermission(key as any, 'view')
      )

      if (availableSections.length > 0) {
        const firstSection = SECTIONS[availableSections[0] as keyof typeof SECTIONS]
        router.push(firstSection.path)
      } else if (currentUser !== null) {
        // User is authenticated but has no permissions yet (e.g. new user pending group assignment)
        // Don't redirect to login — just stay and show empty state
      }
      // If currentUser is null, the middleware will handle the redirect to login
    }
  }, [isLoading, hasPermission, router, permissions, currentUser])

  const fetchDashboard = useCallback(async () => {
    setIsFetching(true)
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) return
      const json = await res.json()
      if (json.success) setDashboardData(json.data as DashboardData)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setIsFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && hasPermission('dashboard', 'view')) {
      fetchDashboard()
    }
  }, [isLoading, hasPermission, fetchDashboard])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading || isFetching) {
    return (
      <AppMainBleed className="items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AppMainBleed>
    )
  }

  if (!hasPermission('dashboard', 'view')) {
    return null
  }

  const d = dashboardData

  const stats = [
    {
      title: "Total de Clientes",
      value: d?.total_clients ?? 0,
      icon: Users,
      description: `${d?.total_clients ?? 0} ${(d?.total_clients ?? 0) === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}`,
      color: "text-blue-500",
    },
    {
      title: "Projetos Ativos",
      value: d?.active_projects ?? 0,
      icon: Briefcase,
      description: `${d?.active_projects ?? 0} ${(d?.active_projects ?? 0) === 1 ? 'projeto em andamento' : 'projetos em andamento'}`,
      color: "text-primary",
    },
    {
      title: "Projetos Concluídos",
      value: d?.completed_projects ?? 0,
      icon: CheckCircle2,
      description: "Total acumulado",
      color: "text-green-500",
    },
    {
      title: "Tarefas Pendentes",
      value: d?.pending_tasks ?? 0,
      icon: Clock,
      description: `${d?.pending_tasks ?? 0} ${(d?.pending_tasks ?? 0) === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`,
      color: "text-orange-500",
    },
  ]

  const todayEvents = d?.today_events ?? []
  const recentProjects = d?.recent_projects ?? []
  const recentActivities = d?.recent_activities ?? []

  return (
    <AppMainBleed className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main panels */}
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.7fr]">

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos Recentes</CardTitle>
            <CardDescription>
              Últimos projetos cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum projeto recente</p>
              ) : (
                recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.code}{project.client ? ` • ${project.client.name}` : ''}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[project.status] ?? 'default'}>
                      {STATUS_LABELS[project.status] ?? project.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Agenda de Hoje
            </CardTitle>
            <CardDescription>
              {todayEvents.length} {todayEvents.length === 1 ? "evento agendado" : "eventos agendados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento hoje</p>
              ) : (
                todayEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium">{event.title}</p>
                      <Badge variant={EVENT_TYPE_BADGE[event.type] ?? 'default'} className="text-xs">
                        {EVENT_TYPE_LABEL[event.type] ?? event.type}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    {event.users.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.users.map((user) => (
                          <Badge key={user.id} variant="secondary" className="text-xs py-0">
                            {user.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Alterações</CardTitle>
            <CardDescription>
              Últimas 5 atualizações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              ) : (
                <>
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="rounded-lg border p-3 space-y-1">
                      <p className="text-xs font-medium text-foreground">
                        {formatActivityMessage(activity)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setIsActivityModalOpen(true)}
                  >
                    Ver mais
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Activity Log Modal */}
      <ActivityLogModal
        open={isActivityModalOpen}
        onOpenChange={setIsActivityModalOpen}
      />
    </AppMainBleed>
  )
}
