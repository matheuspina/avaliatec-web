import { createClient } from "../supabase/client";
import type { Project } from "../types";
import type { KanbanColumn } from "./kanban-columns";
import type { ProjectStatus } from "./project-statuses";
import type { KanbanTask, Profile, ProjectChecklistSummary } from "./tasks";

export type ProjectStatusUI = string;

type StatusMeta = { label: ProjectStatusUI; color: string };

/** Metadados por valor da coluna legada `projects.status` (CHECK: backlog, todo, in_progress, review, done). */
export const STATUS_META_MAP: Record<string, StatusMeta> = {
  backlog: { label: "Planejamento", color: "#3B82F6" },
  todo: { label: "A Fazer", color: "#6366F1" },
  in_progress: { label: "Em andamento", color: "#10B981" },
  review: { label: "Revisão", color: "#F59E0B" },
  done: { label: "Concluído", color: "#6B7280" },
  planning: { label: "Planejamento", color: "#3B82F6" },
  active: { label: "Em andamento", color: "#10B981" },
  on_hold: { label: "Em espera", color: "#F59E0B" },
  completed: { label: "Concluído", color: "#6B7280" },
  cancelled: { label: "Cancelado", color: "#EF4444" },
};

function getFallbackStatusMeta(status?: string): StatusMeta {
  if (status && STATUS_META_MAP[status]) {
    return STATUS_META_MAP[status];
  }
  return STATUS_META_MAP.backlog;
}

export function mapDbStatusToUI(status?: string): ProjectStatusUI {
  return getFallbackStatusMeta(status).label;
}

export function getFallbackStatusColor(status?: string): string {
  return getFallbackStatusMeta(status).color;
}

/** Mapeia rótulos da UI / project_statuses.name para slug em `projects.status` (constraint legada). */
function mapUIStatusToDb(status?: string): string | undefined {
  switch (status) {
    case "Planejamento":
    case "Orçamento":
      return "backlog";
    case "Em andamento":
      return "in_progress";
    case "Em espera":
      return "todo";
    case "Concluído":
      return "done";
    case "Cancelado":
      return "done";
    case "Revisão":
      return "review";
    default:
      return undefined;
  }
}

function isUUID(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

export type ProjectListItem = {
  id: string;
  code: string;
  name: string;
  clientName: string;
  status: ProjectStatusUI;
  endDate: string | null;
  statusId: string | null;
  statusColor: string | null;
  color: string | null;
};

/** Próximo código gerado no Supabase (RPC `next_project_code`), ex.: AV-2026-001 */
export async function fetchNextProjectCode(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("next_project_code");
  if (error) throw error;
  if (data == null || typeof data !== "string" || !data.trim()) {
    throw new Error("Não foi possível obter o código do projeto.");
  }
  return data.trim();
}

export async function listProjects(params?: { search?: string; status?: string; clientId?: string }): Promise<ProjectListItem[]> {
  const supabase = createClient();
  let query = supabase
    .from("projects")
    .select(`
      id,
      code,
      name,
      status,
      status_id,
      end_date,
      color,
      client_id,
      clients:clients(name),
      status_ref:project_statuses!projects_status_id_fkey(id, name, color)
    `);

  if (params?.clientId) {
    query = query.eq("client_id", params.clientId);
  }

  if (params?.status) {
    const dbStatus = mapUIStatusToDb(params.status);
    if (dbStatus) query = query.eq("status", dbStatus);
  }

  if (params?.search && params.search.trim().length > 0) {
    const s = `%${params.search.trim()}%`;
    query = query.or(`code.ilike.${s},name.ilike.${s},description.ilike.${s}`);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    id: p.id,
    code: p.code ?? "",
    name: p.name ?? "",
    clientName: p.clients?.name ?? "",
    status: p.status_ref?.name ?? mapDbStatusToUI(p.status ?? undefined),
    endDate: p.end_date ?? null,
    statusId: p.status_id ?? p.status_ref?.id ?? null,
    statusColor: p.status_ref?.color ?? getFallbackStatusColor(p.status ?? undefined),
    color: p.color ?? null,
  }));
}

export async function createProject(input: {
  code: string;
  name: string;
  description?: string | null;
  clientId: string;
  status?: string;
  endDate: string | null; // ISO date string
  teamMembers?: string[]; // Array of user IDs
}): Promise<Project> {
  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Usuário não autenticado");

  // Include creator in team_members by default
  const teamMembers = input.teamMembers ?? [];
  if (!teamMembers.includes(userId)) {
    teamMembers.push(userId);
  }

  const { data: defaultStatusRow } = await supabase
    .from("project_statuses")
    .select("id")
    .eq("name", "Planejamento")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const payload: any = {
    code: input.code,
    name: input.name,
    description: input.description ?? null,
    client_id: input.clientId,
    status: mapUIStatusToDb(input.status) ?? "backlog",
    status_id: defaultStatusRow?.id ?? null,
    end_date: input.endDate ?? null,
    created_by: userId,
    team_members: teamMembers,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, changes: Partial<Project & { team_members?: string[] }>): Promise<Project> {
  const supabase = createClient();
  const payload: any = { ...changes };
  if (typeof changes.status === "string") {
    payload.status = mapUIStatusToDb(changes.status) ?? changes.status;
  }
  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export type ProjectDetails = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatusUI;
  statusId: string | null;
  statusColor: string | null;
  priority: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  progress: number | null;
  color: string | null;
  teamMembers: string[]; // Array of user IDs
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  projectManager: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string;
  } | null;
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    totalFiles: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type ProjectFile = {
  id: string;
  name: string;
  mimeType: string | null;
  fileSize: number | null;
  filePath: string;
  uploadedBy: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
};

export type ProjectMember = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  avatarUrl: string | null;
};

export type ProjectSinglePageBundle = {
  project: ProjectDetails;
  files: ProjectFile[];
  members: ProjectMember[];
  tasks: KanbanTask[];
  columns: KanbanColumn[];
  statuses: ProjectStatus[];
  profiles: Profile[];
  checklistSummary: ProjectChecklistSummary;
};

export async function getProjectDetails(projectId: string): Promise<ProjectDetails> {
  const supabase = createClient();

  const { data: raw, error } = await supabase.rpc("get_project_detail", { p_project_id: projectId });
  if (error) throw error;
  if (raw == null || typeof raw !== "object") throw new Error("Projeto não encontrado");

  const project = raw as Record<string, unknown>;
  const stats = project.stats as Record<string, number> | null | undefined;
  const totalTasks = stats?.total_tasks ?? 0;
  const completedTasks = stats?.completed_tasks ?? 0;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFiles = stats?.total_files ?? 0;

  const statusSlug = project.status as string | undefined;
  const statusRef = project.status_ref as { id?: string; name?: string; color?: string } | null | undefined;
  const statusName = statusRef?.name ?? mapDbStatusToUI(statusSlug);
  const statusColor = statusRef?.color ?? getFallbackStatusColor(statusSlug);
  const statusId = (project.status_id as string | null | undefined) ?? statusRef?.id ?? null;

  const clients = project.clients as {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null | undefined;
  const pm = project.project_manager as {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null | undefined;
  const createdByUser = project.created_by_user as { id: string; full_name: string } | null | undefined;
  const teamMembersRaw = project.team_members;

  return {
    id: project.id as string,
    code: project.code as string,
    name: project.name as string,
    description: (project.description as string | null) ?? null,
    status: statusName,
    statusId,
    statusColor,
    priority: (project.priority as string | null) ?? null,
    startDate: (project.start_date as string | null) ?? null,
    endDate: (project.end_date as string | null) ?? null,
    budget: (project.budget as string | null) ?? null,
    progress: (project.progress as number | null) ?? null,
    color: (project.color as string | null) ?? null,
    teamMembers: Array.isArray(teamMembersRaw) ? (teamMembersRaw as string[]) : [],
    client: clients
      ? {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          phone: clients.phone,
        }
      : null,
    projectManager: pm
      ? {
          id: pm.id,
          name: pm.full_name,
          avatar_url: pm.avatar_url,
        }
      : null,
    createdBy: createdByUser
      ? {
          id: createdByUser.id,
          name: createdByUser.full_name,
        }
      : null,
    stats: {
      totalTasks,
      completedTasks,
      completionPercentage,
      totalFiles,
    },
    createdAt: project.created_at as string,
    updatedAt: project.updated_at as string,
  };
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("list_project_files_for_project", { p_project_id: projectId });
  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  return rows.map((file: any) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mime_type,
    fileSize: file.file_size,
    filePath: file.file_path ?? "",
    uploadedBy: file.uploader
      ? {
          id: file.uploader.id,
          name: file.uploader.full_name,
        }
      : null,
    createdAt: file.created_at,
  }));
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_project_team_members", { p_project_id: projectId });
  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  return rows.map((m: { id: string; name: string; email?: string; role: string | null; avatar_url: string | null }) => ({
    id: m.id,
    name: m.name,
    email: m.email ?? "",
    role: m.role,
    avatarUrl: m.avatar_url,
  }));
}

export async function getProjectSinglePageBundle(projectId: string): Promise<ProjectSinglePageBundle> {
  const supabase = createClient();
  const { data: raw, error } = await supabase.rpc("get_project_single_page_bundle", {
    p_project_id: projectId,
  });

  if (error) throw error;
  if (raw == null || typeof raw !== "object") throw new Error("Projeto não encontrado");

  const bundle = raw as Record<string, any>;
  const projectRaw = (bundle.project ?? null) as Record<string, any> | null;

  if (!projectRaw) throw new Error("Projeto não encontrado");

  const stats = projectRaw.stats as Record<string, number> | null | undefined;
  const totalTasks = stats?.total_tasks ?? 0;
  const completedTasks = stats?.completed_tasks ?? 0;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFiles = stats?.total_files ?? 0;

  const statusSlug = projectRaw.status as string | undefined;
  const statusRef = projectRaw.status_ref as { id?: string; name?: string; color?: string } | null | undefined;
  const statusName = statusRef?.name ?? mapDbStatusToUI(statusSlug);
  const statusColor = statusRef?.color ?? getFallbackStatusColor(statusSlug);
  const statusId =
    (projectRaw.status_id as string | null | undefined) ?? statusRef?.id ?? null;

  const clientRaw = projectRaw.clients as
    | {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
      }
    | null
    | undefined;

  const projectManagerRaw = projectRaw.project_manager as
    | {
        id: string;
        full_name: string;
        avatar_url: string | null;
      }
    | null
    | undefined;

  const createdByRaw = projectRaw.created_by_user as
    | { id: string; full_name: string }
    | null
    | undefined;

  const project: ProjectDetails = {
    id: projectRaw.id as string,
    code: projectRaw.code as string,
    name: projectRaw.name as string,
    description: (projectRaw.description as string | null) ?? null,
    status: statusName,
    statusId,
    statusColor,
    priority: null,
    startDate: null,
    endDate: (projectRaw.end_date as string | null) ?? null,
    budget: null,
    progress: null,
    color: (projectRaw.color as string | null) ?? null,
    teamMembers: Array.isArray(projectRaw.team_members) ? (projectRaw.team_members as string[]) : [],
    client: clientRaw
      ? {
          id: clientRaw.id,
          name: clientRaw.name,
          email: clientRaw.email,
          phone: clientRaw.phone,
        }
      : null,
    projectManager: projectManagerRaw
      ? {
          id: projectManagerRaw.id,
          name: projectManagerRaw.full_name,
          avatar_url: projectManagerRaw.avatar_url,
        }
      : null,
    createdBy: createdByRaw
      ? {
          id: createdByRaw.id,
          name: createdByRaw.full_name,
        }
      : null,
    stats: {
      totalTasks,
      completedTasks,
      completionPercentage,
      totalFiles,
    },
    createdAt: projectRaw.created_at as string,
    updatedAt: projectRaw.updated_at as string,
  };

  const columns = (Array.isArray(bundle.columns) ? bundle.columns : []).map((column: any) => ({
    id: column.id,
    name: column.name,
    color: column.color ?? "#6B7280",
    position: column.position ?? 0,
    project_id: column.project_id ?? null,
    statusKey: column.status_key ?? "",
  })) as KanbanColumn[];

  const columnsByStatus = new Map(columns.map((column) => [column.statusKey, column]));

  const tasks = (Array.isArray(bundle.tasks) ? bundle.tasks : []).map((task: any) => {
    const matchedColumn = columnsByStatus.get(task.status ?? "");
    return {
      id: task.id,
      title: task.title ?? "",
      description: task.description ?? null,
      status: task.status ?? "",
      deadline: task.deadline ?? null,
      assignee: task.assignee_name ?? "",
      assigneeId: task.assigned_to ?? null,
      watchers: Array.isArray(task.watchers) ? task.watchers : [],
      labels: Array.isArray(task.labels) ? task.labels : [],
      createdAt: task.created_at ?? "",
      updatedAt: task.updated_at ?? "",
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        color: project.color,
      },
      column: matchedColumn
        ? {
            id: matchedColumn.id,
            name: matchedColumn.name,
            color: matchedColumn.color,
            statusKey: matchedColumn.statusKey,
          }
        : null,
    };
  }) as KanbanTask[];

  const files = (Array.isArray(bundle.files) ? bundle.files : []).map((file: any) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mime_type ?? null,
    fileSize: file.file_size ?? null,
    filePath: file.file_path ?? "",
    uploadedBy: file.uploader
      ? {
          id: file.uploader.id,
          name: file.uploader.full_name,
        }
      : null,
    createdAt: file.created_at,
  })) as ProjectFile[];

  const members = (Array.isArray(bundle.members) ? bundle.members : []).map((member: any) => ({
    id: member.id,
    name: member.name,
    email: member.email ?? "",
    role: member.role ?? null,
    avatarUrl: member.avatar_url ?? null,
  })) as ProjectMember[];

  const statuses = (Array.isArray(bundle.statuses) ? bundle.statuses : []).map((status: any) => ({
    id: status.id,
    name: status.name,
    color: status.color,
    description: status.description ?? null,
    position: status.position ?? 0,
    isActive: status.is_active ?? true,
    createdAt: status.created_at,
    updatedAt: status.updated_at,
  })) as ProjectStatus[];

  const profiles = (Array.isArray(bundle.profiles) ? bundle.profiles : []).map((profile: any) => ({
    id: profile.id,
    fullName: profile.full_name ?? "",
    email: profile.email ?? "",
    avatarUrl: profile.avatar_url ?? null,
  })) as Profile[];

  const checklistRaw = (bundle.checklist_summary ?? {}) as Record<string, any>;
  const checklistSummary: ProjectChecklistSummary = {
    totalItems: checklistRaw.total_items ?? 0,
    completedItems: checklistRaw.completed_items ?? 0,
    completionPercentage: checklistRaw.completion_percentage ?? 0,
  };

  return {
    project,
    files,
    members,
    tasks,
    columns,
    statuses,
    profiles,
    checklistSummary,
  };
}

export async function updateProjectColor(projectId: string, color: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ color }).eq("id", projectId);
  if (error) throw error;
}

export async function updateProjectName(projectId: string, name: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ name }).eq("id", projectId);
  if (error) throw error;
}

export async function updateProjectStatus(projectId: string, statusId: string, statusName?: string): Promise<void> {
  const supabase = createClient();
  const payload: Record<string, any> = {};
  if (isUUID(statusId)) {
    payload.status_id = statusId;
  }
  const statusKey = mapUIStatusToDb(statusName);
  if (statusKey) {
    payload.status = statusKey;
  }
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from("projects").update(payload).eq("id", projectId);
  if (error) throw error;
}

export async function updateProjectBudget(projectId: string, budget: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ budget }).eq("id", projectId);
  if (error) throw error;
}

export async function updateProjectPriority(projectId: string, priority: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ priority }).eq("id", projectId);
  if (error) throw error;
}

export async function updateProjectStartDate(projectId: string, startDate: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ start_date: startDate }).eq("id", projectId);
  if (error) throw error;
}

/** Membros ficam em `projects.team_members` (UUID[]); não existe tabela `project_members`. */
export async function addProjectMember(projectId: string, userId: string, _role?: string): Promise<void> {
  await addTeamMember(projectId, userId);
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await removeTeamMember(projectId, userId);
}

/** Reservado: não há papel por projeto na base (apenas `profiles.role` global). */
export async function updateProjectMemberRole(
  _projectId: string,
  _userId: string,
  _role: string
): Promise<void> {
  return;
}

export async function updateProjectTeamMembers(projectId: string, teamMembers: string[]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({ team_members: teamMembers })
    .eq("id", projectId);
  if (error) throw error;
}

export async function addTeamMember(projectId: string, userId: string): Promise<void> {
  const supabase = createClient();
  
  // Get current team members
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("team_members")
    .eq("id", projectId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const currentMembers = project.team_members || [];
  if (!currentMembers.includes(userId)) {
    const updatedMembers = [...currentMembers, userId];
    const { error } = await supabase
      .from("projects")
      .update({ team_members: updatedMembers })
      .eq("id", projectId);
    
    if (error) throw error;
  }
}

export async function removeTeamMember(projectId: string, userId: string): Promise<void> {
  const supabase = createClient();
  
  // Get current team members
  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("team_members")
    .eq("id", projectId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const currentMembers = project.team_members || [];
  const updatedMembers = currentMembers.filter((id: string) => id !== userId);
  
  const { error } = await supabase
    .from("projects")
    .update({ team_members: updatedMembers })
    .eq("id", projectId);
  
  if (error) throw error;
}
