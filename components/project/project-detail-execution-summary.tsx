"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Activity, CheckSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { KanbanTask, ProjectChecklistSummary } from "@/lib/data/tasks"

interface ProjectDetailExecutionSummaryProps {
  checklist: ProjectChecklistSummary
  tasks: KanbanTask[]
}

export function ProjectDetailExecutionSummary({
  checklist,
  tasks,
}: ProjectDetailExecutionSummaryProps) {
  const recentTasks = [...tasks]
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.createdAt)
      const bTime = Date.parse(b.updatedAt || b.createdAt)
      return bTime - aTime
    })
    .slice(0, 6)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Subetapas concluídas
          </CardTitle>
          <CardDescription>Itens de checklist somados de todas as tarefas do projeto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-end justify-between gap-2">
            <p className="text-3xl font-bold">{checklist.completionPercentage}%</p>
            <p className="text-sm text-muted-foreground">
              {checklist.completedItems}/{checklist.totalItems} concluídos
            </p>
          </div>
          <Progress value={checklist.completionPercentage} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade recente
          </CardTitle>
          <CardDescription>Últimas tarefas atualizadas neste projeto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
          )}
          {recentTasks.map((task) => (
            <div key={task.id} className="rounded-lg border p-3">
              <p className="truncate text-sm font-medium">{task.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{task.column?.name || "Sem coluna"}</span>
                <span>•</span>
                <span>{formatRelative(task.updatedAt || task.createdAt)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function formatRelative(dateIso: string) {
  const parsed = new Date(dateIso)
  if (Number.isNaN(parsed.getTime())) return "sem data"

  return formatDistanceToNow(parsed, {
    locale: ptBR,
    addSuffix: true,
  })
}
