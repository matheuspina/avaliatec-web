"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { KanbanColumn } from "@/lib/data/kanban-columns"
import type { KanbanTask } from "@/lib/data/tasks"

interface ProjectDetailChartsProps {
  tasks: KanbanTask[]
  columns: KanbanColumn[]
  projectColor?: string | null
}

export function ProjectDetailCharts({ tasks, columns, projectColor }: ProjectDetailChartsProps) {
  const columnsChartData = useMemo(() => {
    const counts = new Map<string, number>()
    tasks.forEach((task) => {
      counts.set(task.status, (counts.get(task.status) ?? 0) + 1)
    })

    return columns.map((column) => ({
      name: column.name,
      value: counts.get(column.statusKey) ?? 0,
      color: column.color || projectColor || "hsl(var(--primary))",
    }))
  }, [columns, projectColor, tasks])

  const assigneeChartData = useMemo(() => {
    const counts = new Map<string, number>()
    tasks.forEach((task) => {
      const label = task.assignee?.trim() ? task.assignee : "Sem responsável"
      counts.set(label, (counts.get(label) ?? 0) + 1)
    })

    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [tasks])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tarefas por etapa</CardTitle>
          <CardDescription>Distribuição atual nas colunas do fluxo</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={columnsChartData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={96}
                paddingAngle={2}
                strokeWidth={0}
              >
                {columnsChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0)} tarefa(s)`, "Quantidade"]}
                contentStyle={{
                  borderRadius: 10,
                  borderColor: "hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carga por responsável</CardTitle>
          <CardDescription>Top 8 responsáveis por volume de tarefas</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assigneeChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${Number(value ?? 0)} tarefa(s)`, "Quantidade"]}
                contentStyle={{
                  borderRadius: 10,
                  borderColor: "hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} fill={projectColor || "hsl(var(--primary))"} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
