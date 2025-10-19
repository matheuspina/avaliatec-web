"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, User, Trash2, Check, X, GripVertical, FolderKanban } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { TaskModal } from "@/components/kanban/task-modal"
import { listTasks, moveTask, updateTask, createTask, deleteTask } from "@/lib/data/tasks"
import {
  listKanbanColumns,
  createKanbanColumn,
  updateKanbanColumn,
  deleteKanbanColumn,
  type KanbanColumn,
} from "@/lib/data/kanban-columns"
import { listProjects, type ProjectListItem } from "@/lib/data/projects"
import { ProjectTag } from "@/components/ui/project-tag"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

type Task = {
  id: string
  title: string
  description: string
  status: string
  deadline: string
  assignee: string
  labels?: string[]
  project?: {
    id: string
    name: string
    code: string
    color: string | null
  } | null
  checklist?: { id: string; text: string; completed: boolean }[]
  members?: string[]
  comments?: { id: string; author: string; text: string; date: string }[]
}

type Column = {
  id: string
  title: string
  color?: string
  statusKey: string
}

function ColumnDropZone({ columnId, children }: { columnId: string; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] space-y-3 ${isOver ? "outline outline-2 outline-primary/40 rounded-md" : ""}`}
    >
      {children}
    </div>
  )
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const deadlineDisplay = task.deadline ? new Date(task.deadline).toLocaleDateString("pt-BR") : "Sem prazo"

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <Card
        className="hover:border-primary transition-colors cursor-pointer"
        onClick={onClick}
      >
        <CardHeader className="p-4">
          <div className="flex items-start gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing pt-0.5 hover:bg-accent rounded p-1 -ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {task.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 pl-11">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {deadlineDisplay}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assignee}
            </div>
          </div>
          {task.project && (
            <div className="mt-2">
              <ProjectTag
                projectName={task.project.name}
                projectCode={task.project.code}
                projectColor={task.project.color}
                size="sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TarefasPage() {
  const { toast } = useToast()
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingColumns, setLoadingColumns] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const columnRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  // Carregar colunas do Supabase
  useEffect(() => {
    (async () => {
      try {
        setLoadingColumns(true)
        const data = await listKanbanColumns()

        // Se não houver colunas, criar as padrões
        if (data.length === 0) {
          console.log("Nenhuma coluna encontrada, criando colunas padrão...")
          const defaultColumns = [
            { name: "Backlog", color: "#6B7280" },
            { name: "A Fazer", color: "#3B82F6" },
            { name: "Em Progresso", color: "#F59E0B" },
            { name: "Revisão", color: "#8B5CF6" },
            { name: "Concluído", color: "#10B981" },
          ]

          for (let i = 0; i < defaultColumns.length; i++) {
            await createKanbanColumn(defaultColumns[i])
          }

          // Recarregar colunas
          const newData = await listKanbanColumns()
          setColumns(
            newData.map((col) => ({
              id: col.id,
              title: col.name,
              color: col.color,
              statusKey: col.statusKey,
            }))
          )
        } else {
          setColumns(
            data.map((col) => ({
              id: col.id,
              title: col.name,
              color: col.color,
              statusKey: col.statusKey,
            }))
          )
        }
      } catch (err) {
        console.error("Erro ao carregar colunas:", err)
        toast({
          title: "Erro ao carregar colunas",
          description: "Não foi possível carregar as colunas do Kanban.",
          variant: "destructive",
        })
      } finally {
        setLoadingColumns(false)
      }
    })()
  }, [toast])

  // Carregar projetos
  useEffect(() => {
    (async () => {
      try {
        const data = await listProjects()
        setProjects(data)

        // Restaurar filtro do localStorage
        const savedFilter = localStorage.getItem("kanban-project-filter")
        if (savedFilter && savedFilter !== "all") {
          setSelectedProjectId(savedFilter)
        }
      } catch (err) {
        console.error("Erro ao carregar projetos:", err)
      }
    })()
  }, [])

  // Carregar tarefas do Supabase
  useEffect(() => {
    (async () => {
      try {
        setLoadingTasks(true)
        const data = await listTasks(selectedProjectId ? { projectId: selectedProjectId } : undefined)
        setTasks(
          data.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description ?? "",
            status: t.status,
            deadline: t.deadline ?? "",
            assignee: t.assignee,
            labels: t.labels ?? [],
            project: t.project,
          }))
        )
      } catch (err) {
        console.error("Erro ao carregar tarefas:", err)
        toast({
          title: "Erro ao carregar tarefas",
          description: "Não foi possível carregar as tarefas.",
          variant: "destructive",
        })
      } finally {
        setLoadingTasks(false)
      }
    })()
  }, [toast, selectedProjectId])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingColumnTitle, setEditingColumnTitle] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [addingTaskToColumn, setAddingTaskToColumn] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    let destinationColumnId =
      (over.data?.current?.sortable?.containerId as string | undefined) ??
      (typeof over.id === "string" ? over.id : undefined)

    const translatedRect = event.active.rect.current?.translated ?? event.active.rect.current
    const translated =
      translatedRect && "left" in translatedRect && "top" in translatedRect && "width" in translatedRect && "height" in translatedRect
        ? translatedRect
        : null
    let fallbackColumnId: string | undefined
    if (translated) {
      const centerX = translated.left + translated.width / 2
      const centerY = translated.top + translated.height / 2

      for (const [columnId, node] of columnRefs.current) {
        if (!node) continue
        const rect = node.getBoundingClientRect()
        if (centerX >= rect.left && centerX <= rect.right && centerY >= rect.top && centerY <= rect.bottom) {
          fallbackColumnId = columnId
          break
        }
      }
    }

    if (!destinationColumnId && fallbackColumnId) {
      destinationColumnId = fallbackColumnId
    } else if (fallbackColumnId && fallbackColumnId !== destinationColumnId) {
      destinationColumnId = fallbackColumnId
    }

    if (!destinationColumnId) {
      setActiveId(null)
      return
    }

    const activeTask = tasks.find((task) => task.id === active.id)
    const targetColumn = columns.find((col) => col.id === destinationColumnId)

    if (!activeTask || !targetColumn) {
      setActiveId(null)
      return
    }

    const newStatus = targetColumn.statusKey

    if (activeTask && activeTask.status !== newStatus) {
      // Atualizar UI otimisticamente
      setTasks((prev) =>
        prev.map((task) =>
          task.id === active.id ? { ...task, status: newStatus } : task
        )
      )

      try {
        await moveTask(active.id as string, newStatus)
        toast({
          title: "Tarefa movida",
          description: `Tarefa movida para ${targetColumn.title}`,
        })
      } catch (err) {
        console.error("Erro ao mover tarefa:", err)
        toast({
          title: "Erro ao mover tarefa",
          description: "Não foi possível mover a tarefa. Recarregue a página.",
          variant: "destructive",
        })
        // Reverter mudança em caso de erro
        setTasks((prev) =>
          prev.map((task) =>
            task.id === active.id ? { ...task, status: activeTask.status } : task
          )
        )
      }
    }

    setActiveId(null)
  }

  const getTasksByColumn = (column: Column) => {
    return tasks.filter((task) => task.status === column.statusKey)
  }

  const handleAddColumn = async () => {
    try {
      await createKanbanColumn({
        name: "Nova Coluna",
        color: "#6B7280",
      })

      // Recarregar colunas do banco de dados
      const data = await listKanbanColumns()
      setColumns(
        data.map((col) => ({
          id: col.id,
          title: col.name,
          color: col.color,
          statusKey: col.statusKey,
        }))
      )

      toast({
        title: "Coluna criada",
        description: "Nova coluna adicionada com sucesso",
      })
    } catch (err) {
      console.error("Erro ao criar coluna:", err)
      toast({
        title: "Erro ao criar coluna",
        description: "Não foi possível criar a coluna.",
        variant: "destructive",
      })
    }
  }

  const handleEditColumn = (columnId: string, currentTitle: string) => {
    setEditingColumnId(columnId)
    setEditingColumnTitle(currentTitle)
  }

  const handleSaveColumnTitle = async (columnId: string) => {
    if (!editingColumnTitle.trim()) {
      setEditingColumnId(null)
      setEditingColumnTitle("")
      return
    }

    try {
      // Atualizar UI otimisticamente
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, title: editingColumnTitle.trim() } : col
        )
      )

      await updateKanbanColumn(columnId, {
        name: editingColumnTitle.trim(),
      })

      toast({
        title: "Coluna atualizada",
        description: "Nome da coluna alterado com sucesso",
      })
    } catch (err) {
      console.error("Erro ao atualizar coluna:", err)
      toast({
        title: "Erro ao atualizar coluna",
        description: "Não foi possível alterar o nome da coluna.",
        variant: "destructive",
      })
      // Recarregar colunas em caso de erro
      const data = await listKanbanColumns()
      setColumns(
        data.map((col) => ({
          id: col.id,
          title: col.name,
          color: col.color,
          statusKey: col.statusKey,
        }))
      )
    } finally {
      setEditingColumnId(null)
      setEditingColumnTitle("")
    }
  }

  const handleCancelEdit = () => {
    setEditingColumnId(null)
    setEditingColumnTitle("")
  }

  const handleDeleteColumn = (columnId: string) => {
    setColumnToDelete(columnId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) {
      setDeleteConfirmOpen(false)
      return
    }

    try {
      const columnBeingDeleted = columns.find((col) => col.id === columnToDelete)

      if (!columnBeingDeleted) {
        throw new Error("Coluna não encontrada")
      }

      const tasksInColumn = tasks.filter((task) => task.status === columnBeingDeleted.statusKey)

      if (tasksInColumn.length > 0) {
        toast({
          title: "Não é possível excluir a coluna",
          description: `Mova ou exclua as ${tasksInColumn.length} tarefa(s) antes de remover "${columnBeingDeleted.title}".`,
          variant: "destructive",
        })
        return
      }

      // Deletar a coluna do backend
      await deleteKanbanColumn(columnToDelete)

      // Recarregar colunas
      const columnsData = await listKanbanColumns()

      setColumns(
        columnsData.map((col) => ({
          id: col.id,
          title: col.name,
          color: col.color,
          statusKey: col.statusKey,
        }))
      )

      toast({
        title: "Coluna excluída",
        description: `"${columnBeingDeleted.title}" foi removida.`,
      })
    } catch (err) {
      console.error("Erro ao deletar coluna:", err)
      toast({
        title: "Erro ao deletar coluna",
        description: "Não foi possível excluir a coluna.",
        variant: "destructive",
      })
    } finally {
      setColumnToDelete(null)
      setDeleteConfirmOpen(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setTaskModalOpen(true)
  }

  const handleTaskUpdate = async (updatedTask: Task) => {
    // Atualizar UI otimisticamente
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    )
    setSelectedTask(updatedTask)

    try {
      await updateTask(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        deadline: updatedTask.deadline || undefined,
      })
    } catch (err) {
      console.error("Erro ao atualizar tarefa:", err)
      toast({
        title: "Erro ao atualizar tarefa",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      })
      // Recarregar tarefas em caso de erro
      try {
        const data = await listTasks(selectedProjectId ? { projectId: selectedProjectId } : undefined)
        setTasks(
          data.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description ?? "",
            status: t.status,
            deadline: t.deadline ?? "",
            assignee: t.assignee,
            labels: t.labels ?? [],
            project: t.project,
          }))
        )
      } catch (reloadErr) {
        console.error("Erro ao recarregar tarefas:", reloadErr)
      }
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      // Remover da UI otimisticamente
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      setTaskModalOpen(false)
      setSelectedTask(null)

      await deleteTask(taskId)

      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi removida com sucesso",
      })
    } catch (err) {
      console.error("Erro ao deletar tarefa:", err)
      toast({
        title: "Erro ao deletar tarefa",
        description: "Não foi possível excluir a tarefa.",
        variant: "destructive",
      })
      // Recarregar tarefas em caso de erro
      try {
        const data = await listTasks(selectedProjectId ? { projectId: selectedProjectId } : undefined)
        setTasks(
          data.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description ?? "",
            status: t.status,
            deadline: t.deadline ?? "",
            assignee: t.assignee,
            labels: t.labels ?? [],
            project: t.project,
          }))
        )
      } catch (reloadErr) {
        console.error("Erro ao recarregar tarefas:", reloadErr)
      }
    }
  }

  const handleStartAddTask = (columnId: string) => {
    setAddingTaskToColumn(columnId)
    setNewTaskTitle("")
  }

  const handleCancelAddTask = () => {
    setAddingTaskToColumn(null)
    setNewTaskTitle("")
  }

  const handleSaveNewTask = async (columnId: string) => {
    if (!newTaskTitle.trim()) {
      handleCancelAddTask()
      return
    }

    const column = columns.find((col) => col.id === columnId)
    if (!column) return

    const statusKey = column.statusKey

    try {
      await createTask({
        title: newTaskTitle.trim(),
        status: statusKey,
        project_id: selectedProjectId,
      })

      const data = await listTasks(selectedProjectId ? { projectId: selectedProjectId } : undefined)
      setTasks(
        data.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description ?? "",
          status: t.status,
          deadline: t.deadline ?? "",
          assignee: t.assignee,
          labels: t.labels ?? [],
          project: t.project,
        }))
      )

      handleCancelAddTask()

      toast({
        title: "Tarefa criada",
        description: "Nova tarefa adicionada à coluna",
      })
    } catch (err) {
      console.error("Erro ao criar tarefa:", err)
      toast({
        title: "Erro ao criar tarefa",
        description: "Não foi possível criar a tarefa.",
        variant: "destructive",
      })
    }
  }

  const activeTask = tasks.find((task) => task.id === activeId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie tarefas com quadro de tarefas
          </p>
        </div>
        <Button variant="outline" onClick={handleAddColumn}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Coluna
        </Button>
      </div>

      {/* Filtro de Projeto */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedProjectId || "all"}
          onValueChange={(v) => {
            const newValue = v === "all" ? null : v
            setSelectedProjectId(newValue)
            localStorage.setItem("kanban-project-filter", v)
          }}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue>
              {selectedProjectId ? (
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  {projects.find((p) => p.id === selectedProjectId)?.name || "Selecionar projeto"}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Todos os projetos
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted" />
                Todos os projetos
              </div>
            </SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || "#6B7280" }}
                  />
                  <span className="truncate">{project.code} - {project.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProjectId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProjectId(null)
              localStorage.setItem("kanban-project-filter", "all")
            }}
          >
            Limpar filtro
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDeleteColumn}
        title="Excluir Coluna"
        description="Tem certeza que deseja excluir esta coluna? Mova ou exclua as tarefas desta coluna antes de confirmar."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={rectIntersection}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {loadingColumns ? (
            <div className="flex items-center justify-center w-full h-[400px]">
              <p className="text-muted-foreground">Carregando colunas...</p>
            </div>
          ) : (
            columns.map((column) => {
              const columnTasks = getTasksByColumn(column)
              return (
              <div
                key={column.id}
                className="flex-shrink-0 w-[300px]"
                ref={(node) => {
                  if (node) {
                    columnRefs.current.set(column.id, node)
                  } else {
                    columnRefs.current.delete(column.id)
                  }
                }}
              >
                <Card className="flex-1">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      {editingColumnId === column.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingColumnTitle}
                            onChange={(e) => setEditingColumnTitle(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveColumnTitle(column.id)
                              } else if (e.key === "Escape") {
                                handleCancelEdit()
                              }
                            }}
                            onBlur={() => handleSaveColumnTitle(column.id)}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleSaveColumnTitle(column.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <CardTitle
                            className="text-sm font-semibold flex-1 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleEditColumn(column.id, column.title)}
                          >
                            {column.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{columnTasks.length}</Badge>
                            {columns.length > 1 && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleDeleteColumn(column.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <SortableContext
                      items={columnTasks.map((task) => task.id)}
                      strategy={verticalListSortingStrategy}
                      id={column.id}
                    >
                      <ColumnDropZone columnId={column.id}>
                        {columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onClick={() => handleTaskClick(task)}
                          />
                        ))}

                        {addingTaskToColumn === column.id ? (
                          <Card className="border-2 border-primary">
                            <CardContent className="p-3">
                              <Input
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Digite o nome da tarefa..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleSaveNewTask(column.id)
                                  } else if (e.key === "Escape") {
                                    handleCancelAddTask()
                                  }
                                }}
                                className="mb-2"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNewTask(column.id)}
                                >
                                  Adicionar Cartão
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelAddTask}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                            onClick={() => handleStartAddTask(column.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar um cartão
                          </Button>
                        )}
                      </ColumnDropZone>
                    </SortableContext>
                  </CardContent>
                </Card>
              </div>
              )
            })
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        task={selectedTask}
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onUpdate={handleTaskUpdate}
        onDelete={handleDeleteTask}
      />
    </div>
  )
}
