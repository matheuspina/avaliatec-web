"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Users,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Download,
  Loader2,
  User,
  X,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getProjectSinglePageBundle,
  updateProjectColor,
  updateProjectName,
  updateProjectStatus,
  updateProjectBudget,
  addProjectMember,
  removeProjectMember,
  type ProjectDetails,
  type ProjectFile,
  type ProjectMember,
} from "@/lib/data/projects";
import {
  type KanbanTask,
  type Profile,
  type ProjectChecklistSummary,
  type TaskFilters,
} from "@/lib/data/tasks";
import { type ProjectStatus } from "@/lib/data/project-statuses";
import { ProjectColorPicker } from "@/components/project-color-picker";
import { TaskFilterDialog } from "@/components/project/task-filter-dialog";
import { useToast } from "@/hooks/use-toast";
import { AppMainBleed } from "@/components/app-main-bleed";
import { type KanbanColumn } from "@/lib/data/kanban-columns";
import { ProjectDetailHeader } from "@/components/project/project-detail-header";
import { ProjectDetailKpis } from "@/components/project/project-detail-kpis";
import { ProjectDetailCharts } from "@/components/project/project-detail-charts";
import { ProjectDetailPipeline } from "@/components/project/project-detail-pipeline";
import { ProjectDetailExecutionSummary } from "@/components/project/project-detail-execution-summary";

const TaskModal = dynamic(
  () => import("@/components/kanban/task-modal").then((m) => m.TaskModal),
  { ssr: false }
);

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
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [checklistSummary, setChecklistSummary] = useState<ProjectChecklistSummary>({
    totalItems: 0,
    completedItems: 0,
    completionPercentage: 0,
  });
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

  const loadProjectBundle = useCallback(async () => {
    const bundle = await getProjectSinglePageBundle(projectId);
    setProject(bundle.project);
    setFiles(bundle.files);
    setMembers(bundle.members);
    setTasks(bundle.tasks);
    setStatuses(bundle.statuses);
    setProfiles(bundle.profiles);
    setColumns(bundle.columns);
    setChecklistSummary(bundle.checklistSummary);
    setSelectedColor(bundle.project.color || "#3B82F6");
    setEditedName(bundle.project.name);
  }, [projectId]);

  useEffect(() => {
    async function loadProjectData() {
      try {
        setLoading(true);
        setError(null);

        await loadProjectBundle();
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
  }, [loadProjectBundle, projectId]);

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

  const handleBudgetUpdate = async (budget: string | null) => {
    try {
      await updateProjectBudget(projectId, budget);
      setProject((prev) => prev ? { ...prev, budget } : null);
      toast({
        title: "Sucesso",
        description: "Orçamento atualizado",
      });
    } catch (err) {
      console.error("Erro ao atualizar orçamento:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o orçamento",
        variant: "destructive",
      });
      throw err; // Re-throw para o componente tratar
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await addProjectMember(projectId, userId);
      await loadProjectBundle();
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
      await loadProjectBundle();
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
    try {
      await loadProjectBundle();
    } catch (err) {
      console.error("Erro ao recarregar tarefas:", err);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;

      if (filters.searchText) {
        const needle = filters.searchText.trim().toLowerCase();
        const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      if (filters.dateStart && task.deadline && task.deadline < filters.dateStart) return false;
      if (filters.dateStart && !task.deadline) return false;

      if (filters.dateEnd && task.deadline && task.deadline > filters.dateEnd) return false;
      if (filters.dateEnd && !task.deadline) return false;

      return true;
    });
  }, [filters, tasks]);

  const sortedTasks = useMemo(() => {
    const positionByStatus = new Map(
      columns.map((column, index) => [column.statusKey, index])
    );

    return [...filteredTasks].sort((a, b) => {
      const posA = positionByStatus.get(a.status) ?? Number.MAX_SAFE_INTEGER;
      const posB = positionByStatus.get(b.status) ?? Number.MAX_SAFE_INTEGER;

      if (posA !== posB) return posA - posB;
      return a.title.localeCompare(b.title);
    });
  }, [columns, filteredTasks]);

  const doneColumn = columns.find((column) => column.statusKey === "done");
  const completedTasks = doneColumn
    ? tasks.filter((task) => task.status === doneColumn.statusKey).length
    : project?.stats.completedTasks ?? 0;
  const totalTasks = tasks.length || project?.stats.totalTasks || 0;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <AppMainBleed className="items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </AppMainBleed>
    );
  }

  if (error || !project) {
    return (
      <AppMainBleed className="flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-semibold">Erro ao carregar projeto</h2>
        <p className="text-muted-foreground">{error || "Projeto não encontrado"}</p>
        <Button onClick={() => router.push("/projetos")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Projetos
        </Button>
      </AppMainBleed>
    );
  }

  return (
    <AppMainBleed className="space-y-6">
      <ProjectDetailHeader
        project={project}
        statuses={statuses}
        isEditingName={isEditingName}
        editedName={editedName}
        onEditedNameChange={setEditedName}
        onStartEditName={() => setIsEditingName(true)}
        onCancelEditName={() => {
          setIsEditingName(false);
          setEditedName(project.name);
        }}
        onSaveName={handleNameSave}
        onBack={() => router.push("/projetos")}
        onStatusChange={handleStatusChange}
        onOpenColorDialog={() => setIsColorDialogOpen(true)}
      />

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

      <ProjectDetailKpis
        project={project}
        completionPercentage={completionPercentage}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        onBudgetUpdate={handleBudgetUpdate}
      />
      <ProjectDetailCharts tasks={tasks} columns={columns} projectColor={project.color} />
      <ProjectDetailPipeline tasks={tasks} columns={columns} />
      <ProjectDetailExecutionSummary checklist={checklistSummary} tasks={tasks} />

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
                Tarefas do Projeto ({sortedTasks.length})
              </CardTitle>
              <CardDescription>Ordenadas por coluna</CardDescription>
            </div>
            <TaskFilterDialog
              filters={filters}
              onFiltersChange={setFilters}
              profiles={profiles}
              columns={columns}
            />
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
    </AppMainBleed>
  );
}
