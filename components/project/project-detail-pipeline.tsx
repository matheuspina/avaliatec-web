"use client"

import { CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { KanbanColumn } from "@/lib/data/kanban-columns"
import type { KanbanTask } from "@/lib/data/tasks"

interface ProjectDetailPipelineProps {
  columns: KanbanColumn[]
  tasks: KanbanTask[]
}

export function ProjectDetailPipeline({ columns, tasks }: ProjectDetailPipelineProps) {
  const totalTasks = tasks.length
  const countsByStatus = new Map<string, number>()

  tasks.forEach((task) => {
    countsByStatus.set(task.status, (countsByStatus.get(task.status) ?? 0) + 1)
  })

  const doneColumn = columns.find((column) => column.statusKey === "done")
  const completedTasks = doneColumn ? countsByStatus.get(doneColumn.statusKey) ?? 0 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Etapas e andamento
        </CardTitle>
        <CardDescription>
          {completedTasks} de {totalTasks} tarefas chegaram à etapa final
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {columns.map((column, index) => {
          const count = countsByStatus.get(column.statusKey) ?? 0
          const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0

          return (
            <div key={column.id} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{index + 1}. {column.name}</p>
                  <p className="text-xs text-muted-foreground">{count} tarefa(s)</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{percentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: column.color || "hsl(var(--primary))",
                  }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
