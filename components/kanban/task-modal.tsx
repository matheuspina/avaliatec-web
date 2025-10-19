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
  const [editedTask, setEditedTask] = useState<Task | null>(task)

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
  const [showProjectSection, setShowProjectSection] = useState(false)
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const labelsInputRef = useRef<HTMLInputElement | null>(null)
  const checklistInputRef = useRef<HTMLInputElement | null>(null)

  // Sincronizar editedTask quando task mudar
  useEffect(() => {
    if (task && open) {
      setEditedTask(task)
      setShowLabelsSection(!!(task.labels && task.labels.length > 0))
      setShowDateSection(!!task.deadline || !!task.assignee)
      setShowProjectSection(!!task.project)
    }
  }, [task, open])

  // Carregar projetos
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const data = await listProjects()
          setProjects(data)
        } catch (err) {
          console.error("Erro ao carregar projetos:", err)
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
            {isEditingTitle ? (
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
                className="text-2xl cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                {editedTask.title}
              </DialogTitle>
            )}
          </div>
          {showDeleteConfirm ? (
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
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowLabelsSection(true)
                requestAnimationFrame(() => labelsInputRef.current?.focus())
              }}
            >
              <Tag className="mr-2 h-4 w-4" />
              Etiquetas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDateSection(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Datas
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProjectSection(true)}
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              Projeto
            </Button>
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Membros
            </Button>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-semibold">Descrição</h3>
            </div>
            <Textarea
              value={editedTask.description || ""}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              onBlur={handleUpdate}
              placeholder="Adicione uma descrição mais detalhada..."
              className="min-h-[100px]"
            />
          </div>

          {(showLabelsSection || (editedTask.labels && editedTask.labels.length > 0)) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <h3 className="font-semibold">Etiquetas</h3>
            </div>
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
              <div className="flex gap-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddLabel()
                  }}
                  placeholder="Nova etiqueta"
                  className="h-7 w-32 text-sm"
                  ref={labelsInputRef}
                />
                <Button size="sm" variant="ghost" onClick={handleAddLabel}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          )}

          {(showDateSection || !!editedTask.deadline || !!editedTask.assignee) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <h3 className="font-semibold">Data</h3>
              </div>
              <Input
                type="date"
                value={editedTask.deadline || ""}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, deadline: e.target.value })
                }
                onBlur={handleUpdate}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <h3 className="font-semibold">Responsável</h3>
              </div>
              <Input
                value={editedTask.assignee}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, assignee: e.target.value })
                }
                onBlur={handleUpdate}
              />
            </div>
          </div>
          )}

          {/* Projeto */}
          {(showProjectSection || !!editedTask.project) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              <h3 className="font-semibold">Projeto</h3>
            </div>
            {editedTask.project ? (
              <div className="flex items-center gap-2">
                <ProjectTag
                  projectName={editedTask.project.name}
                  projectCode={editedTask.project.code}
                  projectColor={editedTask.project.color}
                  size="sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!editedTask.id) return
                    try {
                      await updateTask(editedTask.id, { project_id: null })
                      setEditedTask({ ...editedTask, project: null })
                      setShowProjectSection(false)
                      if (onUpdate) {
                        onUpdate({ ...editedTask, project: null })
                      }
                      toast({
                        title: "Projeto removido",
                        description: "Tarefa desvinculada do projeto",
                      })
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
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Select
                value={editedTask.project?.id || ""}
                onValueChange={async (value) => {
                  if (!editedTask.id || !value) return
                  const selectedProject: ProjectListItem | undefined = projects.find((p) => p.id === value)
                  if (!selectedProject) return

                  try {
                    await updateTask(editedTask.id, { project_id: value })
                    const newProject = {
                      id: selectedProject.id,
                      name: selectedProject.name,
                      code: selectedProject.code,
                      color: selectedProject.color,
                    }
                    setEditedTask({ ...editedTask, project: newProject })
                    if (onUpdate) {
                      onUpdate({ ...editedTask, project: newProject })
                    }
                    toast({
                      title: "Projeto vinculado",
                      description: `Tarefa vinculada ao projeto ${selectedProject.name}`,
                    })
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
          )}

          {(showChecklistSection || checklistItems.length > 0 || loadingChecklist) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              <h3 className="font-semibold">Checklist</h3>
              {checklistItems.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {checklistItems.filter((i) => i.completed).length}/{checklistItems.length}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {loadingChecklist ? (
                <p className="text-sm text-muted-foreground">Carregando checklist...</p>
              ) : (
                checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklistItem(item.id)}
                      className="h-4 w-4"
                    />
                    <span
                      className={`flex-1 ${
                        item.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.text}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
              <div className="flex gap-2">
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
                  size="sm"
                  variant="ghost"
                  onClick={handleAddChecklistItem}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          )}

          {/* Membros */}
          {editedTask.members && editedTask.members.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
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

          <Separator />

          {/* Comentários e atividade */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
