import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, CheckCircle2, Clock, Calendar as CalendarIcon, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Buscar estatísticas
  const { data: clients } = await supabase.from('clients').select('*', { count: 'exact' })
  const { data: projects } = await supabase.from('projects').select('*')
  const { data: tasks } = await supabase.from('tasks').select('*')
  const { data: activityLog } = await supabase
    .from('activity_log')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(3)

  // Buscar eventos de hoje
  const today = new Date().toISOString().split('T')[0]
  const { data: eventsData } = await supabase
    .from('events')
    .select('*, clients(name), profiles(full_name)')
    .eq('event_date', today)
    .order('event_time', { ascending: true })

  // Buscar projetos recentes
  const { data: recentProjectsData } = await supabase
    .from('projects')
    .select('*, clients(name), project_statuses(name, color)')
    .order('created_at', { ascending: false })
    .limit(3)

  // Calcular estatísticas
  const totalClients = clients?.length || 0
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0
  const completedProjects = projects?.filter(p => p.status === 'completed').length || 0
  const pendingTasks = tasks?.filter(t => t.status !== 'done' && t.status !== 'in_progress').length || 0

  const todayEvents = eventsData?.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description || '',
    time: event.event_time?.substring(0, 5) || '',
    location: event.location || '',
    type: event.type,
    client: event.clients ? { id: event.clients.id, name: event.clients.name } : null,
    users: event.profiles ? [{ id: event.profiles.id, name: event.profiles.full_name }] : [],
  })) || [
    {
      id: "1",
      title: "Reunião com Cliente ABC",
      description: "Apresentação do projeto de avaliação",
      time: "10:00",
      location: "Escritório Central",
      type: "meeting" as const,
      users: [
        { id: "1", name: "João Silva" },
        { id: "2", name: "Maria Santos" },
      ],
      client: { id: "1", name: "Empresa ABC Ltda" },
    },
    {
      id: "2",
      title: "Vistoria Imóvel Comercial",
      description: "Vistoria para elaboração de laudo",
      time: "14:30",
      location: "Av. Paulista, 1000",
      type: "visit" as const,
      users: [{ id: "3", name: "Pedro Costa" }],
      client: { id: "2", name: "Indústria XYZ S.A." },
    },
    {
      id: "3",
      title: "Prazo Projeto AV-2024-001",
      description: "Entrega do relatório final",
      time: "18:00",
      location: "Online",
      type: "deadline" as const,
      users: [{ id: "1", name: "João Silva" }],
    },
  ]

  const getEventTypeColor = (type: string) => {
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

  const getEventTypeLabel = (type: string) => {
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

  const stats = [
    {
      title: "Total de Clientes",
      value: totalClients.toString(),
      icon: Users,
      description: `${totalClients} ${totalClients === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}`,
      color: "text-blue-500",
    },
    {
      title: "Projetos Ativos",
      value: activeProjects.toString(),
      icon: Briefcase,
      description: `${activeProjects} ${activeProjects === 1 ? 'projeto em andamento' : 'projetos em andamento'}`,
      color: "text-primary",
    },
    {
      title: "Projetos Concluídos",
      value: completedProjects.toString(),
      icon: CheckCircle2,
      description: "Total acumulado",
      color: "text-green-500",
    },
    {
      title: "Tarefas Pendentes",
      value: pendingTasks.toString(),
      icon: Clock,
      description: `${pendingTasks} ${pendingTasks === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`,
      color: "text-orange-500",
    },
  ]

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'planning': 'Planejamento',
      'active': 'Em andamento',
      'on_hold': 'Em espera',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
    }
    return statusMap[status] || status
  }

  const recentProjects = recentProjectsData?.map(project => ({
    code: project.code || '',
    title: project.name,
    client: project.clients?.name || 'Sem cliente',
    status: getStatusLabel(project.status),
    deadline: project.end_date || '',
  })) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em andamento":
        return "default"
      case "Em espera":
        return "secondary"
      case "Planejamento":
        return "secondary"
      case "Concluído":
        return "outline"
      case "Cancelado":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão
        </p>
      </div>

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

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Projetos Recentes</CardTitle>
            <CardDescription>
              Últimos projetos cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.code}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.code} • {project.client}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    <Badge variant={getEventTypeColor(event.type)} className="text-xs">
                      {getEventTypeLabel(event.type)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  </div>
                  {event.users && event.users.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.users.map((user) => (
                        <Badge key={user.id} variant="secondary" className="text-xs py-0">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avaliatec - Inteligencia Patrimonial</CardTitle>
            <CardDescription>
              Últimas atualizações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLog && activityLog.length > 0 ? (
                activityLog.map((activity) => {
                  const getActivityIcon = (action: string) => {
                    if (action.includes('completed') || action.includes('updated')) return CheckCircle2
                    if (action.includes('created')) return Users
                    return Clock
                  }
                  
                  const getActivityColor = (action: string) => {
                    if (action.includes('completed') || action.includes('updated')) return 'primary'
                    if (action.includes('created')) return 'blue-500'
                    return 'orange-500'
                  }

                  const getActivityLabel = (action: string) => {
                    const actionMap: Record<string, string> = {
                      'task_created': 'Tarefa criada',
                      'task_updated': 'Tarefa atualizada',
                      'project_created': 'Projeto criado',
                      'project_updated': 'Projeto atualizado',
                      'client_created': 'Cliente cadastrado',
                      'client_updated': 'Cliente atualizado',
                    }
                    return actionMap[action] || action
                  }

                  const getTimeAgo = (date: string) => {
                    const now = new Date()
                    const activityDate = new Date(date)
                    const diffMs = now.getTime() - activityDate.getTime()
                    const diffMins = Math.floor(diffMs / 60000)
                    const diffHours = Math.floor(diffMs / 3600000)
                    const diffDays = Math.floor(diffMs / 86400000)

                    if (diffMins < 60) return `Há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
                    if (diffHours < 24) return `Há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
                    return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
                  }

                  const Icon = getActivityIcon(activity.action)
                  const color = getActivityColor(activity.action)

                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-${color}/10`}>
                        <Icon className={`h-4 w-4 text-${color}`} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{getActivityLabel(activity.action)}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.profiles?.full_name || 'Sistema'}
                        </p>
                        <p className="text-xs text-muted-foreground">{getTimeAgo(activity.created_at)}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
