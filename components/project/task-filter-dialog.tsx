"use client"

import { useState, useEffect } from "react"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type TaskFilters, type Profile, listProfiles } from "@/lib/data/tasks"
import { type KanbanColumn, listKanbanColumns } from "@/lib/data/kanban-columns"
import { usePermissions } from "@/contexts/permission-context"

interface TaskFilterDialogProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
}

export function TaskFilterDialog({ filters, onFiltersChange }: TaskFilterDialogProps) {
  const { hasPermission } = usePermissions()
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [columns, setColumns] = useState<KanbanColumn[]>([])

  // Note: Content filtering is enforced by RLS policies at the database level.
  // Users will only see tasks they have access to based on their permissions.
  // This filter dialog allows further refinement of the already-filtered results.

  useEffect(() => {
    async function loadOptions() {
      try {
        const [profilesData, columnsData] = await Promise.all([
          listProfiles(),
          listKanbanColumns(),
        ])
        setProfiles(profilesData)
        setColumns(columnsData)
      } catch (error) {
        console.error("Erro ao carregar opções de filtro:", error)
      }
    }

    if (isOpen) {
      loadOptions()
    }
  }, [isOpen])

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: TaskFilters = {
      projectId: filters.projectId, // Manter o projectId
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    setIsOpen(false)
  }

  const hasActiveFilters = !!(
    localFilters.assigneeId ||
    localFilters.status ||
    localFilters.dateStart ||
    localFilters.dateEnd ||
    localFilters.searchText
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              •
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filtrar Tarefas</DialogTitle>
          <DialogDescription>
            Combine múltiplos filtros para refinar a lista de tarefas. Você visualiza apenas as tarefas às quais tem acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pesquisa por Texto */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar por texto</Label>
            <Input
              id="search"
              placeholder="Pesquisar título ou descrição..."
              value={localFilters.searchText || ""}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, searchText: e.target.value || undefined })
              }
            />
          </div>

          {/* Usuário Atribuído */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Atribuído a</Label>
            <Select
              value={localFilters.assigneeId || "all"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  assigneeId: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coluna */}
          <div className="space-y-2">
            <Label htmlFor="column">Coluna</Label>
            <Select
              value={localFilters.status || "all"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  status: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger id="column">
                <SelectValue placeholder="Todas as colunas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as colunas</SelectItem>
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.statusKey}>
                    {column.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de Início */}
          <div className="space-y-2">
            <Label htmlFor="dateStart">Data de início (a partir de)</Label>
            <Input
              id="dateStart"
              type="date"
              value={localFilters.dateStart || ""}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, dateStart: e.target.value || undefined })
              }
            />
          </div>

          {/* Data de Conclusão */}
          <div className="space-y-2">
            <Label htmlFor="dateEnd">Data de conclusão (até)</Label>
            <Input
              id="dateEnd"
              type="date"
              value={localFilters.dateEnd || ""}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, dateEnd: e.target.value || undefined })
              }
            />
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyFilters}>Aplicar Filtros</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
