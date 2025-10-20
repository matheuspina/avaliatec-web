import { createClient } from "../supabase/client";
import type { Project } from "../types";

export type ProjectStatusUI = string;

type StatusMeta = { label: ProjectStatusUI; color: string };

export const STATUS_META_MAP: Record<string, StatusMeta> = {
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
  return STATUS_META_MAP.planning;
}

export function mapDbStatusToUI(status?: string): ProjectStatusUI {
  return getFallbackStatusMeta(status).label;
}

export function getFallbackStatusColor(status?: string): string {
  return getFallbackStatusMeta(status).color;
}

function mapUIStatusToDb(status?: string): string | undefined {
  switch (status) {
    case "Planejamento":
      return "planning";
    case "Em andamento":
      return "active";
    case "Em espera":
      return "on_hold";
    case "Concluído":
      return "completed";
    case "Cancelado":
      return "cancelled";
    case "Orçamento":
      return "planning";
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

  const payload: any = {
    code: input.code,
    name: input.name,
    description: input.description ?? null,
    client_id: input.clientId,
    status: mapUIStatusToDb(input.status) ?? "planning",
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

export async function getProjectDetails(projectId: string): Promise<ProjectDetails> {
  const supabase = createClient();

  // Buscar dados do projeto com relacionamentos
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`
      *,
      clients:client_id(id, name, email, phone),
      project_manager:project_manager(id, full_name, avatar_url),
      created_by_user:created_by(id, full_name),
      status_ref:project_statuses!projects_status_id_fkey(id, name, color)
    `)
    .eq("id", projectId)
    .single();

  if (projectError) throw projectError;
  if (!project) throw new Error("Projeto não encontrado");

  // Buscar estatísticas de tarefas
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("project_id", projectId);

  if (tasksError) throw tasksError;

  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === "done").length ?? 0;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Buscar contagem de arquivos
  const { count: filesCount, error: filesError } = await supabase
    .from("files")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (filesError) throw filesError;

  const statusName = project.status_ref?.name ?? mapDbStatusToUI(project.status);
  const statusColor = project.status_ref?.color ?? getFallbackStatusColor(project.status);
  const statusId = project.status_id ?? project.status_ref?.id ?? null;

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    description: project.description,
    status: statusName,
    statusId,
    statusColor,
    priority: project.priority,
    startDate: project.start_date,
    endDate: project.end_date,
    budget: project.budget,
    progress: project.progress,
    color: project.color,
    teamMembers: project.team_members ?? [],
    client: project.clients
      ? {
          id: project.clients.id,
          name: project.clients.name,
          email: project.clients.email,
          phone: project.clients.phone,
        }
      : null,
    projectManager: project.project_manager
      ? {
          id: project.project_manager.id,
          name: project.project_manager.full_name,
          avatar_url: project.project_manager.avatar_url,
        }
      : null,
    createdBy: project.created_by_user
      ? {
          id: project.created_by_user.id,
          name: project.created_by_user.full_name,
        }
      : null,
    stats: {
      totalTasks,
      completedTasks,
      completionPercentage,
      totalFiles: filesCount ?? 0,
    },
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("files")
    .select(`
      id,
      name,
      mime_type,
      file_size,
      file_path,
      uploaded_by,
      created_at,
      uploader:uploaded_by(id, full_name)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((file: any) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mime_type,
    fileSize: file.file_size,
    filePath: file.file_path,
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

  // Buscar membros únicos do projeto (através do project_manager e tasks)
  const { data: project } = await supabase
    .from("projects")
    .select("project_manager")
    .eq("id", projectId)
    .single();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("assigned_to")
    .eq("project_id", projectId);

  // Coletar IDs únicos
  const memberIds = new Set<string>();
  if (project?.project_manager) memberIds.add(project.project_manager);
  tasks?.forEach((task) => {
    if (task.assigned_to) memberIds.add(task.assigned_to);
  });

  if (memberIds.size === 0) return [];

  // Buscar perfis dos membros
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .in("id", Array.from(memberIds));

  if (error) throw error;

  return (profiles ?? []).map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    avatarUrl: profile.avatar_url,
  }));
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

export async function addProjectMember(projectId: string, userId: string, role?: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role: role || null,
  });
  if (error) throw error;
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function updateProjectMemberRole(projectId: string, userId: string, role: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("project_members")
    .update({ role })
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) throw error;
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
