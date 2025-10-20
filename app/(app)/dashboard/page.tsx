'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, CheckCircle2, Clock, Calendar as CalendarIcon, MapPin } from "lucide-react"
import { usePermissions } from "@/contexts/permission-context"
import { SECTIONS } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const { hasPermission, isLoading, permissions } = usePermissions()

  // Mock data for now - in production, this would be fetched client-side
  // Using variables instead of constants to avoid TypeScript comparison errors
  const [totalClients] = useState(0)
  const [activeProjects] = useState(0)
  const [completedProjects] = useState(0)
  const [pendingTasks] = useState(0)

  // Redirect to first available section if no access to dashboard
  useEffect(() => {
    if (!isLoading && !hasPermission('dashboard', 'view')) {
      // Find first section user has access to
      const availableSections = Object.keys(SECTIONS).filter(
        (key) => hasPermission(key as any, 'view')
      )
      
      if (availableSections.length > 0) {
        const firstSection = SECTIONS[availableSections[0] as keyof typeof SECTIONS]
        router.push(firstSection.path)
      } else {
        // No sections available, redirect to access denied or logout
        router.push('/login')
      }
    }
  }, [isLoading, hasPermission, router, permissions])

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Don't render if no permission (will redirect)
  if (!hasPermission('dashboard', 'view')) {
    return null
  }

  const todayEvents = [
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

  const recentProjects: any[] = []

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
              {recentProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum projeto recente</p>
              ) : (
                recentProjects.map((project) => (
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
                ))
              )}
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
              <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
