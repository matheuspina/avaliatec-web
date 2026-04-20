"use client"

import { ArrowLeft, Check, Palette, Pencil, X } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProjectTag } from "@/components/ui/project-tag"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProjectDetails } from "@/lib/data/projects"
import type { ProjectStatus } from "@/lib/data/project-statuses"

interface ProjectDetailHeaderProps {
  project: ProjectDetails
  statuses: ProjectStatus[]
  isEditingName: boolean
  editedName: string
  onEditedNameChange: (value: string) => void
  onStartEditName: () => void
  onCancelEditName: () => void
  onSaveName: () => void
  onBack: () => void
  onStatusChange: (statusId: string) => void
  onOpenColorDialog: () => void
}

function getHeroBackground(color?: string | null) {
  const baseColor = color && color.trim().length > 0 ? color : "#3B82F6"
  return {
    backgroundImage: `linear-gradient(135deg, ${baseColor}22 0%, hsl(var(--card)) 50%, hsl(var(--card)) 100%)`,
  }
}

export function ProjectDetailHeader({
  project,
  statuses,
  isEditingName,
  editedName,
  onEditedNameChange,
  onStartEditName,
  onCancelEditName,
  onSaveName,
  onBack,
  onStatusChange,
  onOpenColorDialog,
}: ProjectDetailHeaderProps) {
  const currentStatusId =
    project.statusId ?? statuses.find((status) => status.name === project.status)?.id ?? ""

  return (
    <CardLikeHero style={getHeroBackground(project.color)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mt-1 shrink-0"
            aria-label="Voltar para a lista de projetos"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0 space-y-2">
            {isEditingName ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(event) => onEditedNameChange(event.target.value)}
                  className="h-11 max-w-xl text-2xl font-bold"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onSaveName()
                    if (event.key === "Escape") onCancelEditName()
                  }}
                  autoFocus
                />
                {project.code ? (
                  <ProjectTag
                    projectName={project.name}
                    projectCode={project.code}
                    projectColor={project.color}
                    size="xs"
                    className="shrink-0"
                  />
                ) : null}
                <Button type="button" size="icon" variant="ghost" onClick={onSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={onCancelEditName}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="group flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="min-w-0 truncate text-3xl font-bold tracking-tight">{project.name}</h1>
                {project.code ? (
                  <ProjectTag
                    projectName={project.name}
                    projectCode={project.code}
                    projectColor={project.color}
                    size="xs"
                    className="shrink-0"
                  />
                ) : null}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={onStartEditName}
                  aria-label="Editar nome do projeto"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                style={
                  project.statusColor
                    ? { borderColor: project.statusColor, color: project.statusColor }
                    : undefined
                }
              >
                {project.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {project.client?.name || "Sem cliente"}
              </span>
            </div>

            {statuses.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </span>
                <Select value={currentStatusId} onValueChange={onStatusChange}>
                  <SelectTrigger className="h-9 w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenColorDialog}
          className="shrink-0 gap-2"
        >
          <Palette className="h-4 w-4" />
          Editar cor
        </Button>
      </div>
    </CardLikeHero>
  )
}

function CardLikeHero({
  children,
  style,
}: {
  children: ReactNode
  style: CSSProperties
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" style={style}>
      {children}
    </div>
  )
}
