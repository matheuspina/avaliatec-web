"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Users,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Download,
  Loader2,
  Palette,
  User,
  Pencil,
  Check,
  X,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getProjectDetails,
  getProjectFiles,
  getProjectMembers,
  updateProjectColor,
  updateProjectName,
  updateProjectStatus,
  addProjectMember,
  removeProjectMember,
  type ProjectDetails,
  type ProjectFile,
  type ProjectMember
} from "@/lib/data/projects";
import { listTasks, listProfiles, type KanbanTask, type TaskFilters, type Profile } from "@/lib/data/tasks";
import { listProjectStatuses, type ProjectStatus } from "@/lib/data/project-statuses";
import { ProjectTag } from "@/components/ui/project-tag";
import { ProjectColorPicker } from "@/components/project-color-picker";
import { TaskFilterDialog } from "@/components/project/task-filter-dialog";
import { TaskModal } from "@/components/kanban/task-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isUUID(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { toast } = useToast();

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("#3B82F6");
  const [filters, setFilters] = useState<TaskFilters>({});
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Estados para edição
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

  useEffect(() => {
    async function loadProjectData() {
      try {
        setLoading(true);
        setError(null);

        const [projectData, filesData, membersData, statusesData, profilesData] = await Promise.all([
          getProjectDetails(projectId),
          getProjectFiles(projectId),
          getProjectMembers(projectId),
          listProjectStatuses(true),
          listProfiles(),
        ]);

        setProject(projectData);
        setFiles(filesData);
        setMembers(membersData);
        setStatuses(statusesData);
        setProfiles(profilesData);
        setSelectedColor(projectData.color || "#3B82F6");
        setEditedName(projectData.name);
      } catch (err) {
        console.error("Erro ao carregar projeto:", err);
        setError(err instanceof Error ? err.message : "Erro ao carregar projeto");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  useEffect(() => {
    async function loadTasks() {
      try {
        const tasksData = await listTasks({ ...filters, projectId });
        setTasks(tasksData);
      } catch (err) {
        console.error("Erro ao carregar tarefas:", err);
      }
    }

    if (projectId) {
      loadTasks();
    }
  }, [projectId, filters]);

  const handleColorSave = async (newColor: string) => {
    try {
      await updateProjectColor(projectId, newColor);
      setProject((prev) => prev ? { ...prev, color: newColor } : null);
      setSelectedColor(newColor);
      setIsColorDialogOpen(false);
    } catch (err) {
      console.error("Erro ao atualizar cor:", err);
    }
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do projeto não pode estar vazio",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProjectName(projectId, editedName);
      setProject((prev) => prev ? { ...prev, name: editedName } : null);
      setIsEditingName(false);
      toast({
        title: "Sucesso",
        description: "Nome do projeto atualizado",
      });
    } catch (err) {
      console.error("Erro ao atualizar nome:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (statusValue: string) => {
    try {
      const newStatus =
        statuses.find((s) => s.id === statusValue) ??
        statuses.find((s) => s.name === statusValue);
      await updateProjectStatus(projectId, statusValue, newStatus?.name ?? statusValue);
      setProject((prev) => {
        if (!prev) return prev;
        const nextStatusId =
          newStatus && isUUID(newStatus.id)
            ? newStatus.id
            : isUUID(statusValue)
              ? statusValue
              : prev.statusId;
        return {
          ...prev,
          status: newStatus?.name ?? prev.status,
          statusId: nextStatusId,
          statusColor: newStatus?.color ?? prev.statusColor,
        };
      });
      toast({
        title: "Sucesso",
        description: "Status atualizado",
      });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await addProjectMember(projectId, userId);
      const membersData = await getProjectMembers(projectId);
      setMembers(membersData);
      toast({
        title: "Sucesso",
        description: "Membro adicionado ao projeto",
      });
    } catch (err) {
      console.error("Erro ao adicionar membro:", err);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o membro",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeProjectMember(projectId, userId);
      setMembers((prev) => prev.filter(m => m.id !== userId));
      toast({
        title: "Sucesso",
        description: "Membro removido do projeto",
      });
    } catch (err) {
      console.error("Erro ao remover membro:", err);
      toast({
        title: "Erro",
        description: "Não foi possível remover o membro",
        variant: "destructive",
      });
    }
  };

  const handleTaskClick = (task: KanbanTask) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskModalClose = async () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    // Recarregar tarefas após fechar o modal
    try {
      const tasksData = await listTasks({ ...filters, projectId });
      setTasks(tasksData);
    } catch (err) {
      console.error("Erro ao recarregar tarefas:", err);
    }
  };

  // Ordenar tarefas por nome da coluna
  const sortedTasks = [...tasks].sort((a, b) => {
    const columnA = a.column?.name || "";
    const columnB = b.column?.name || "";
    return columnA.localeCompare(columnB);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-semibold">Erro ao carregar projeto</h2>
        <p className="text-muted-foreground">{error || "Projeto não encontrado"}</p>
        <Button onClick={() => router.push("/projetos")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Projetos
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/projetos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-3xl font-bold h-12 max-w-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleNameSave();
                      if (e.key === "Escape") {
                        setIsEditingName(false);
                        setEditedName(project.name);
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleNameSave}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditedName(project.name);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-3xl font-bold">{project.name}</h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <ProjectTag
                projectName={project.name}
                projectCode={project.code}
                projectColor={project.color}
                size="lg"
              />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted-foreground">
                {project.code} • {project.client?.name || "Sem cliente"}
              </p>
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
              {statuses.length > 0 && (
                <Select
                  value={project.statusId ?? statuses.find((s) => s.name === project.status)?.id ?? ""}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsColorDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Palette className="h-4 w-4" />
          Editar Cor
        </Button>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Progresso de Conclusão */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progresso</CardDescription>
            <CardTitle className="text-4xl">{project.stats.completionPercentage}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={project.stats.completionPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {project.stats.completedTasks} de {project.stats.totalTasks} tarefas concluídas
            </p>
          </CardContent>
        </Card>

        {/* Prazo */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Prazo de Conclusão</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="h-5 w-5" />
              {project.endDate
                ? format(new Date(project.endDate), "dd/MM/yyyy", { locale: ptBR })
                : "Não definido"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.endDate && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(project.endDate), "EEEE", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Orçamento */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orçamento</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <DollarSign className="h-5 w-5" />
              {project.budget ? `R$ ${parseFloat(project.budget).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não definido"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Valor estimado do projeto</p>
          </CardContent>
        </Card>

        {/* Arquivos */}
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.client ? (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold">{project.client.name}</p>
                </div>
                {project.client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {project.client.email}
                  </div>
                )}
                {project.client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {project.client.phone}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum cliente atribuído</p>
            )}
          </CardContent>
        </Card>

        {/* Equipe */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipe ({members.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMemberDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {member.role && (
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum membro atribuído</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tarefas do Projeto */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Tarefas do Projeto ({tasks.length})
              </CardTitle>
              <CardDescription>Ordenadas por coluna</CardDescription>
            </div>
            <TaskFilterDialog filters={filters} onFiltersChange={setFilters} />
          </div>
        </CardHeader>
        <CardContent>
          {sortedTasks.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <p className="font-medium text-sm mb-2">{task.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.assignee && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{task.assignee}</span>
                      </div>
                    )}
                    {task.column && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: task.column.color,
                          color: task.column.color,
                        }}
                      >
                        {task.column.name}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {filters.searchText || filters.assigneeId || filters.status || filters.dateStart || filters.dateEnd
                ? "Nenhuma tarefa encontrada com os filtros aplicados"
                : "Nenhuma tarefa vinculada a este projeto"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Arquivos do Projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Arquivos do Projeto ({files.length})
          </CardTitle>
          <CardDescription>Documentos e arquivos anexados ao projeto</CardDescription>
        </CardHeader>
        <CardContent>
          {files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(file.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {file.uploadedBy && (
                          <>
                            <span>•</span>
                            <span>{file.uploadedBy.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum arquivo anexado ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gerente do Projeto</p>
            {project.projectManager ? (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={project.projectManager.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(project.projectManager.name)}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{project.projectManager.name}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">Não atribuído</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Criado por</p>
            {project.createdBy ? (
              <p className="font-medium mt-2">{project.createdBy.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">Desconhecido</p>
            )}
          </div>
          {project.startDate && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
              <p className="font-medium mt-2">
                {format(new Date(project.startDate), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
          {project.priority && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prioridade</p>
              <Badge variant="outline" className="mt-2">
                {project.priority}
              </Badge>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Criado em</p>
            <p className="font-medium mt-2">
              {format(new Date(project.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Última atualização</p>
            <p className="font-medium mt-2">
              {format(new Date(project.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição de Cor */}
      <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cor do Projeto</DialogTitle>
            <DialogDescription>
              Escolha uma cor para identificar visualmente o projeto {project.name}
            </DialogDescription>
          </DialogHeader>
          <ProjectColorPicker
            projectName={project.name}
            projectCode={project.code}
            currentColor={selectedColor}
            onColorChange={setSelectedColor}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsColorDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => handleColorSave(selectedColor)}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gestão de Membros */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Projeto</DialogTitle>
            <DialogDescription>
              Selecione um usuário para adicionar à equipe do projeto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {profiles
              .filter(profile => !members.some(m => m.id === profile.id))
              .map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(profile.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{profile.fullName}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleAddMember(profile.id);
                      setIsMemberDialogOpen(false);
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
              ))}
            {profiles.filter(profile => !members.some(m => m.id === profile.id)).length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Todos os usuários já estão no projeto
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={handleTaskModalClose}
        />
      )}
    </div>
  );
}
