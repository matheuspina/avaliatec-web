"use client"

import { useState } from "react"
import { Calendar, CheckCircle2, DollarSign, FileText, Pencil, Check, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ProjectDetails } from "@/lib/data/projects"

interface ProjectDetailKpisProps {
  project: ProjectDetails
  completionPercentage: number
  completedTasks: number
  totalTasks: number
  onBudgetUpdate?: (budget: string | null) => Promise<void>
}

export function ProjectDetailKpis({
  project,
  completionPercentage,
  completedTasks,
  totalTasks,
  onBudgetUpdate,
}: ProjectDetailKpisProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [editedBudget, setEditedBudget] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const deadlineText = project.endDate
    ? format(new Date(project.endDate), "dd/MM/yyyy", { locale: ptBR })
    : "Não definido"

  const budgetText = project.budget
    ? `R$ ${parseFloat(project.budget).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "Não definido"

  const deadlineStatus = getDeadlineStatus(project.endDate)

  const handleStartEditBudget = () => {
    setEditedBudget(project.budget || "")
    setIsEditingBudget(true)
  }

  const handleSaveBudget = async () => {
    if (!onBudgetUpdate) return

    try {
      setIsSaving(true)
      const budgetValue = editedBudget.trim() === "" ? null : editedBudget.trim()
      await onBudgetUpdate(budgetValue)
      setIsEditingBudget(false)
    } catch (err) {
      console.error("Erro ao salvar orçamento:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEditBudget = () => {
    setIsEditingBudget(false)
    setEditedBudget("")
  }

  const handleBudgetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveBudget()
    } else if (e.key === "Escape") {
      handleCancelEditBudget()
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Progresso real</CardDescription>
          <CardTitle className="text-4xl">{completionPercentage}%</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {completedTasks} de {totalTasks} tarefas na etapa concluída
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Prazo</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="h-5 w-5" />
            {deadlineText}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{deadlineStatus}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Orçamento</CardDescription>
          {isEditingBudget ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                value={editedBudget}
                onChange={(e) => setEditedBudget(e.target.value)}
                onKeyDown={handleBudgetKeyDown}
                placeholder="0.00"
                className="h-9 text-lg"
                autoFocus
                disabled={isSaving}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleSaveBudget}
                disabled={isSaving}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleCancelEditBudget}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <CardTitle
              className="flex items-center gap-2 text-2xl cursor-pointer hover:text-primary transition-colors group"
              onClick={onBudgetUpdate ? handleStartEditBudget : undefined}
            >
              <DollarSign className="h-5 w-5" />
              <span className="flex-1">{budgetText}</span>
              {onBudgetUpdate && (
                <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Valor estimado do projeto</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Arquivos</CardDescription>
          <CardTitle className="flex items-center gap-2 text-4xl">
            <FileText className="h-5 w-5" />
            {project.stats.totalFiles}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Documentos anexados</p>
        </CardContent>
      </Card>
    </div>
  )
}

function getDeadlineStatus(endDate: string | null) {
  if (!endDate) return "Sem prazo definido"

  const today = new Date()
  const dueDate = new Date(`${endDate}T00:00:00`)
  today.setHours(0, 0, 0, 0)

  const diffMs = dueDate.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / 86400000)

  if (diffDays < 0) return `Atrasado em ${Math.abs(diffDays)} dia(s)`
  if (diffDays === 0) return "Vence hoje"
  return `${diffDays} dia(s) restantes`
}
