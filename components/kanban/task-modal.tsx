"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Plus,
  Calendar,
  User,
  Tag,
  CheckSquare,
  Users,
  MessageSquare,
  X,
  Trash2,
  Pencil,
  FolderKanban,
} from "lucide-react"
import {
  listChecklist,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
  type ChecklistItem,
  updateTask,
  listProfiles,
  type Profile,
} from "@/lib/data/tasks"
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  type TaskComment,
} from "@/lib/data/task-comments"
import { listProjects, type ProjectListItem } from "@/lib/data/projects"
import { ProjectTag } from "@/components/ui/project-tag"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/contexts/permission-context"

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  deadline: string | null
  assignee: string
  assigneeId?: string | null
  labels?: string[]
  project?: {
    id: string
    name: string
    code: string
    color: string | null
  } | null
  column?: {
    id: string
    name: string
    color: string
    statusKey: string
  } | null
  checklist?: { id: string; text: string; completed: boolean }[]
  members?: string[]
  comments?: { id: string; author: string; text: string; date: string }[]
}

interface TaskModalProps {
  task: Task | null
  isOpen?: boolean
  open?: boolean
  onClose?: () => void
  onOpenChange?: (open: boolean) => void
  onUpdate?: (task: Task) => void
  onDelete?: (taskId: string) => void
}

export function TaskModal({ task, isOpen, open, onClose, onOpenChange, onUpdate, onDelete }: TaskModalProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [editedTask, setEditedTask] = useState<Task | null>(task)
  
  // Check permissions
  const canEdit = hasPermission('kanban', 'edit')
  const canDelete = hasPermission('kanban', 'delete')
  const canCreate = hasPermission('kanban', 'create')
  const isReadOnly = !canEdit && !canCreate

  // Suportar ambas as interfaces (isOpen/onClose e open/onOpenChange)
  const modalOpen = isOpen ?? open ?? false
  const handleModalOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose?.()
      setShowLabelsSection(false)
      setShowDateSection(false)
      setShowChecklistSection(false)
    }
    onOpenChange?.(newOpen)
  }
  const [newComment, setNewComment] = useState("")
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState("")
  const [showLabelsSection, setShowLabelsSection] = useState(false)
  const [showDateSection, setShowDateSection] = useState(false)
  const [showChecklistSection, setShowChecklistSection] = useState(false)
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const labelsInputRef = useRef<HTMLInputElement | null>(null)
  const checklistInputRef = useRef<HTMLInputElement | null>(null)
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false)
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false)
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false)
  const [membersPopoverOpen, setMembersPopoverOpen] = useState(false)

  // Sincronizar editedTask quando task mudar
  useEffect(() => {
    if (task && open) {
      setEditedTask(task)
      setShowLabelsSection(!!(task.labels && task.labels.length > 0))
      setShowDateSection(!!task.deadline || !!task.assignee)
    }
  }, [task, open])

  // Carregar projetos e usuários
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const [projectsData, profilesData] = await Promise.all([
            listProjects(),
            listProfiles()
          ])
          setProjects(projectsData)
          setProfiles(profilesData)
        } catch (err) {
          console.error("Erro ao carregar projetos e usuários:", err)
        }
      })()
    }
  }, [open])

  // Carregar checklist do backend
  useEffect(() => {
    if (task?.id && open) {
      (async () => {
        try {
          setLoadingChecklist(true)
          const items = await listChecklist(task.id)
          setChecklistItems(items)
          setShowChecklistSection(items.length > 0)
        } catch (err) {
          console.error("Erro ao carregar checklist:", err)
          toast({
            title: "Erro ao carregar checklist",
            description: "Não foi possível carregar os itens do checklist.",
            variant: "destructive",
          })
        } finally {
          setLoadingChecklist(false)
        }
      })()
    }
  }, [task?.id, open, toast])

  // Carregar comentários do backend
  useEffect(() => {
    if (task?.id && open) {
      (async () => {
        try {
          setLoadingComments(true)
          const data = await listComments(task.id)
          setComments(data)
        } catch (err) {
          console.error("Erro ao carregar comentários:", err)
          toast({
            title: "Erro ao carregar comentários",
            description: "Não foi possível carregar os comentários.",
            variant: "destructive",
          })
        } finally {
          setLoadingComments(false)
        }
      })()
    }
  }, [task?.id, open, toast])

  if (!task || !editedTask) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const handleUpdate = () => {
    if (onUpdate && editedTask) {
      onUpdate(editedTask)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return

    try {
      await createComment(task.id, newComment.trim())
      const data = await listComments(task.id)
      setComments(data)
      setNewComment("")
      toast({
        title: "Comentário adicionado",
        description: "Comentário adicionado com sucesso",
      })
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err)
      toast({
        title: "Erro ao adicionar comentário",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive",
      })
    }
  }

  const handleEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment.id)
    setEditingCommentText(comment.text)
  }

  const handleSaveCommentEdit = async () => {
    if (!editingCommentId || !editingCommentText.trim() || !task) return

    try {
      await updateComment(editingCommentId, editingCommentText.trim())
      const data = await listComments(task.id)
      setComments(data)
      setEditingCommentId(null)
      setEditingCommentText("")
      toast({
        title: "Comentário atualizado",
        description: "Comentário atualizado com sucesso",
      })
    } catch (err) {
      console.error("Erro ao atualizar comentário:", err)
      toast({
        title: "Erro ao atualizar comentário",
        description: "Não foi possível atualizar o comentário.",
        variant: "destructive",
      })
    }
  }

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null)
    setEditingCommentText("")
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return

    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast({
        title: "Comentário removido",
        description: "Comentário removido com sucesso",
      })
    } catch (err) {
      console.error("Erro ao remover comentário:", err)
      toast({
        title: "Erro ao remover comentário",
        description: "Não foi possível remover o comentário.",
        variant: "destructive",
      })
    }
  }

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim() || !task) return

    try {
      setShowChecklistSection(true)
      await addChecklistItem(task.id, newChecklistItem.trim())
      const items = await listChecklist(task.id)
      setChecklistItems(items)
      setNewChecklistItem("")
      toast({
        title: "Item adicionado",
        description: "Item adicionado ao checklist",
      })
    } catch (err) {
      console.error("Erro ao adicionar item:", err)
      toast({
        title: "Erro ao adicionar item",
        description: "Não foi possível adicionar o item ao checklist.",
        variant: "destructive",
      })
      if (checklistItems.length === 0) {
        setShowChecklistSection(false)
      }
    }
  }

  const handleToggleChecklistItem = async (id: string) => {
    if (!task) return

    try {
      const item = checklistItems.find((i) => i.id === id)
      if (!item) return

      // Atualizar UI otimisticamente
      setChecklistItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i))
      )

      await toggleChecklistItem(id, !item.completed)
    } catch (err) {
      console.error("Erro ao marcar item:", err)
      toast({
        title: "Erro ao atualizar item",
        description: "Não foi possível atualizar o item.",
        variant: "destructive",
      })
      // Recarregar em caso de erro
      const items = await listChecklist(task.id)
      setChecklistItems(items)
    }
  }

  const handleRemoveChecklistItem = async (id: string) => {
    if (!task) return

    try {
      // Remover da UI otimisticamente
      setChecklistItems((prev) => {
        const next = prev.filter((i) => i.id !== id)
        if (next.length === 0) {
          setShowChecklistSection(false)
        }
        return next
      })

      await removeChecklistItem(id)

      toast({
        title: "Item removido",
        description: "Item removido do checklist",
      })
    } catch (err) {
      console.error("Erro ao remover item:", err)
      toast({
        title: "Erro ao remover item",
        description: "Não foi possível remover o item.",
        variant: "destructive",
      })
      // Recarregar em caso de erro
      const items = await listChecklist(task.id)
      setChecklistItems(items)
    }
  }

  const handleAddLabel = () => {
    if (!newLabel.trim()) return

    setShowLabelsSection(true)
    setEditedTask({
      ...editedTask,
      labels: [...(editedTask.labels || []), newLabel],
    })
    setNewLabel("")
    handleUpdate()
  }

  const handleRemoveLabel = (label: string) => {
    const nextLabels = editedTask.labels?.filter((l) => l !== label) ?? []
    if (nextLabels.length === 0) {
      setShowLabelsSection(false)
    }
    setEditedTask({
      ...editedTask,
      labels: nextLabels,
    })
    handleUpdate()
  }

  const handleDelete = () => {
    if (onDelete && editedTask) {
      onDelete(editedTask.id)
      onOpenChange?.(false)
      onClose?.()
    }
  }

  if (!editedTask) return null

  return (
    <Dialog open={modalOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1">
            {isEditingTitle && canEdit ? (
              <Input
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                onBlur={() => {
                  setIsEditingTitle(false)
                  handleUpdate()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingTitle(false)
                    handleUpdate()
                  }
                  if (e.key === "Escape") {
                    setIsEditingTitle(false)
                  }
                }}
                className="text-2xl font-semibold"
                autoFocus
              />
            ) : (
              <DialogTitle
                className={`text-2xl ${canEdit ? 'cursor-pointer hover:text-primary' : ''} transition-colors`}
                onClick={() => canEdit && setIsEditingTitle(true)}
              >
                {editedTask.title}
              </DialogTitle>
            )}
          </div>
          {canDelete && (
            showDeleteConfirm ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            )
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Botões de ação */}
          {!isReadOnly && (
            <div className="flex flex-wrap gap-2">
              <Dialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLabelsDialogOpen(true)}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Etiquetas
                </Button>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Etiquetas</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {editedTask.labels?.map((label) => (
                        <Badge key={label} variant="secondary" className="gap-1">
                          {label}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveLabel(label)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddLabel()
                          }
                        }}
                        placeholder="Nova etiqueta"
                        className="flex-1"
                        ref={labelsInputRef}
                      />
                      <Button onClick={handleAddLabel}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Datas
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={editedTask.deadline ? new Date(editedTask.deadline) : undefined}
                    onSelect={async (date) => {
                      if (!editedTask.id) return
                      const dateString = date ? date.toISOString().split('T')[0] : null
                      
                      try {
                        await updateTask(editedTask.id, { deadline: dateString })
                        const updatedTask = {
                          ...editedTask,
                          deadline: dateString
                        }
                        setEditedTask(updatedTask)
                        if (onUpdate) {
                          onUpdate(updatedTask)
                        }
                        toast({
                          title: "Data atualizada",
                          description: date ? `Data de vencimento definida para ${date.toLocaleDateString("pt-BR")}` : "Data de vencimento removida",
                        })
                        setDatePopoverOpen(false)
                      } catch (err) {
                        console.error("Erro ao atualizar data:", err)
                        toast({
                          title: "Erro ao atualizar data",
                          description: "Não foi possível atualizar a data de vencimento",
                          variant: "destructive",
                        })
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    Responsável
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Responsável pela Tarefa</label>
                    <Select
                      value={editedTask.assigneeId || "unassigned"}
                      onValueChange={async (value) => {
                        if (!editedTask.id) return
                        const selectedProfile = profiles.find((p) => p.id === value)

                        try {
                          await updateTask(editedTask.id, { assigned_to: value === "unassigned" ? null : value })
                          const updatedTask = {
                            ...editedTask,
                            assigneeId: value === "unassigned" ? null : value,
                            assignee: selectedProfile?.fullName || ""
                          }
                          setEditedTask(updatedTask)
                          if (onUpdate) {
                            onUpdate(updatedTask)
                          }
                          toast({
                            title: "Responsável atualizado",
                            description: `Tarefa atribuída a ${selectedProfile?.fullName || "ninguém"}`,
                          })
                          setAssigneePopoverOpen(false)
                        } catch (err) {
                          console.error("Erro ao atribuir responsável:", err)
                          toast({
                            title: "Erro ao atribuir responsável",
                            description: "Não foi possível atribuir o responsável",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar responsável">
                          {editedTask.assignee || "Sem responsável"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-muted-foreground">Sem responsável</span>
                        </SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowChecklistSection(true)
                  requestAnimationFrame(() => checklistInputRef.current?.focus())
                }}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Checklist
              </Button>

              <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderKanban className="mr-2 h-4 w-4" />
                    Projeto
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Vincular a um Projeto</label>
                      {editedTask.project ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
                            <ProjectTag
                              projectName={editedTask.project.name}
                              projectCode={editedTask.project.code}
                              projectColor={editedTask.project.color}
                              size="sm"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={async () => {
                              if (!editedTask.id) return
                              try {
                                await updateTask(editedTask.id, { project_id: null })
                                const updatedTask = { ...editedTask, project: null }
                                setEditedTask(updatedTask)
                                if (onUpdate) {
                                  onUpdate(updatedTask)
                                }
                                toast({
                                  title: "Projeto removido",
                                  description: "Tarefa desvinculada do projeto",
                                })
                                setProjectPopoverOpen(false)
                              } catch (err) {
                                console.error("Erro ao remover projeto:", err)
                                toast({
                                  title: "Erro ao remover projeto",
                                  description: "Não foi possível desvincular a tarefa",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remover Projeto
                          </Button>
                        </div>
                      ) : (
                        <Select
                          onValueChange={async (value) => {
                            if (!editedTask.id || !value) return
                            const selectedProject = projects.find((p) => p.id === value)
                            if (!selectedProject) return

                            try {
                              await updateTask(editedTask.id, { project_id: value })
                              const newProject = {
                                id: selectedProject.id,
                                name: selectedProject.name,
                                code: selectedProject.code,
                                color: selectedProject.color,
                              }
                              const updatedTask = { ...editedTask, project: newProject }
                              setEditedTask(updatedTask)
                              if (onUpdate) {
                                onUpdate(updatedTask)
                              }
                              toast({
                                title: "Projeto vinculado",
                                description: `Tarefa vinculada ao projeto ${selectedProject.name}`,
                              })
                              setProjectPopoverOpen(false)
                            } catch (err) {
                              console.error("Erro ao vincular projeto:", err)
                              toast({
                                title: "Erro ao vincular projeto",
                                description: "Não foi possível vincular a tarefa",
                                variant: "destructive",
                              })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar projeto" />
                          </SelectTrigger>
                          <SelectContent>
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
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover open={membersPopoverOpen} onOpenChange={setMembersPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Membros
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Membros da Tarefa</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editedTask.members && editedTask.members.map((member) => (
                          <Badge key={member} variant="outline" className="gap-1">
                            {member}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => {
                                const nextMembers = editedTask.members?.filter((m) => m !== member) ?? []
                                setEditedTask({ ...editedTask, members: nextMembers })
                                toast({
                                  title: "Membro removido",
                                  description: `${member} foi removido da tarefa`,
                                })
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                      <Select
                        onValueChange={async (value) => {
                          if (!editedTask.id || !value) return
                          const selectedProfile = profiles.find((p) => p.id === value)
                          if (!selectedProfile) return

                          const newMembers = [...(editedTask.members || []), selectedProfile.fullName]
                          setEditedTask({ ...editedTask, members: newMembers })

                          toast({
                            title: "Membro adicionado",
                            description: `${selectedProfile.fullName} foi adicionado à tarefa`,
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Adicionar membro" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles
                            .filter((p) => !editedTask.members?.includes(p.fullName))
                            .map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.fullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-foreground/80 dark:text-foreground/80" />
                <h3 className="font-semibold">Descrição</h3>
              </div>
            <Textarea
              value={editedTask.description || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              onBlur={handleUpdate}
              placeholder={isReadOnly ? "" : "Adicione uma descrição mais detalhada..."}
              className="min-h-[100px]"
              disabled={isReadOnly}
            />
          </div>

          {(editedTask.labels && editedTask.labels.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-foreground/80 dark:text-foreground/80" />
              <h3 className="font-semibold">Etiquetas</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedTask.labels?.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
          )}

          {(!!editedTask.deadline || !!editedTask.assignee) && (
          <div className="grid grid-cols-2 gap-4">
            {editedTask.deadline && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-foreground/80 dark:text-foreground/80" />
                  <h3 className="font-semibold">Data</h3>
                </div>
                <p className="text-sm">
                  {new Date(editedTask.deadline).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
            {editedTask.assignee && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-foreground/80 dark:text-foreground/80" />
                  <h3 className="font-semibold">Responsável</h3>
                </div>
                <p className="text-sm">{editedTask.assignee}</p>
              </div>
            )}
          </div>
          )}

          {/* Projeto */}
          {!!editedTask.project && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-foreground/80 dark:text-foreground/80" />
              <h3 className="font-semibold">Projeto</h3>
            </div>
            <div className="flex items-center gap-2">
              <ProjectTag
                projectName={editedTask.project.name}
                projectCode={editedTask.project.code}
                projectColor={editedTask.project.color}
                size="sm"
              />
            </div>
          </div>
          )}

          {/* Membros */}
          {(editedTask.members && editedTask.members.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-foreground/80 dark:text-foreground/80" />
                <h3 className="font-semibold">Membros</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {editedTask.members.map((member) => (
                  <Badge key={member} variant="outline">
                    {member}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(showChecklistSection || checklistItems.length > 0 || loadingChecklist) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-foreground/80 dark:text-foreground/80" />
              <h3 className="font-semibold">Checklist</h3>
              {checklistItems.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {checklistItems.filter((i) => i.completed).length}/{checklistItems.length}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {loadingChecklist ? (
                <p className="text-sm text-muted-foreground py-1">Carregando checklist...</p>
              ) : (
                checklistItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 group py-1 hover:bg-accent/50 rounded px-1 -mx-1 transition-colors">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklistItem(item.id)}
                      className="h-4 w-4 mt-0.5 cursor-pointer"
                      disabled={isReadOnly}
                    />
                    <span
                      className={`flex-1 text-sm leading-relaxed ${
                        item.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.text}
                    </span>
                    {!isReadOnly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))
              )}
              {!isReadOnly && (
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddChecklistItem()
                    }}
                    placeholder="Adicionar item"
                    className="h-8 text-sm"
                    ref={checklistInputRef}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleAddChecklistItem}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          )}

          <Separator />

          {/* Comentários e atividade */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-foreground/80 dark:text-foreground/80" />
              <h3 className="font-semibold">Comentários e atividade</h3>
            </div>

            {/* Lista de comentários */}
            <div className="space-y-3">
              {loadingComments ? (
                <p className="text-sm text-muted-foreground">Carregando comentários...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {comment.author_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {comment.author_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        {!isReadOnly && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditComment(comment)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="min-h-[60px] text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveCommentEdit}>
                              Salvar
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelCommentEdit}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{comment.text}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Adicionar comentário */}
            {!isReadOnly && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  MP
                </div>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escrever um comentário..."
                    className="min-h-[80px]"
                  />
                  <Button onClick={handleAddComment}>Comentar</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
