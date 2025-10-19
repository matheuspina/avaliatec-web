import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Briefcase, CheckCircle2, Clock, Calendar as CalendarIcon, MapPin } from "lucide-react"

export default function DashboardPage() {
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
      value: "48",
      icon: Users,
      description: "+12% em relação ao mês anterior",
      color: "text-blue-500",
    },
    {
      title: "Projetos Ativos",
      value: "23",
      icon: Briefcase,
      description: "8 em andamento, 5 em espera",
      color: "text-primary",
    },
    {
      title: "Projetos Concluídos",
      value: "142",
      icon: CheckCircle2,
      description: "Total acumulado",
      color: "text-green-500",
    },
    {
      title: "Tarefas Pendentes",
      value: "17",
      icon: Clock,
      description: "5 com prazo próximo",
      color: "text-orange-500",
    },
  ]

  const recentProjects = [
    {
      code: "AV-2024-001",
      title: "Avaliação Imóvel Comercial",
      client: "Empresa ABC Ltda",
      status: "Em andamento",
      deadline: "2024-11-15",
    },
    {
      code: "AV-2024-002",
      title: "Laudo Técnico Industrial",
      client: "Indústria XYZ S.A.",
      status: "Em espera",
      deadline: "2024-11-20",
    },
    {
      code: "AV-2024-003",
      title: "Avaliação Patrimonial",
      client: "Construtora Delta",
      status: "Planejamento",
      deadline: "2024-11-18",
    },
  ]

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
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Projeto concluído</p>
                  <p className="text-xs text-muted-foreground">
                    AV-2024-001 foi marcado como concluído
                  </p>
                  <p className="text-xs text-muted-foreground">Há 2 horas</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Novo cliente cadastrado</p>
                  <p className="text-xs text-muted-foreground">
                    Empresa ABC Ltda foi adicionada
                  </p>
                  <p className="text-xs text-muted-foreground">Há 5 horas</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Prazo próximo</p>
                  <p className="text-xs text-muted-foreground">
                    Projeto AV-2024-003 vence em 3 dias
                  </p>
                  <p className="text-xs text-muted-foreground">Ontem</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
