import { createClient } from "../supabase/client"

export type KanbanTask = {
  id: string
  title: string
  description: string | null
  status: string // UI status (status_key da coluna)
  deadline: string | null // ISO date YYYY-MM-DD
  assignee: string // full_name
  assigneeId: string | null // profile id
  labels?: string[]
  createdAt: string // ISO date
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
}

export type TaskFilters = {
  projectId?: string
  status?: string
  assigneeId?: string
  dateStart?: string // YYYY-MM-DD
  dateEnd?: string // YYYY-MM-DD
  searchText?: string
}

export async function listTasks(params?: TaskFilters): Promise<KanbanTask[]> {
  const supabase = createClient()
  let query = supabase
    .from("tasks")
    .select(
      `id, title, description, status, deadline, labels, assigned_to, project_id, created_at,
       profiles:profiles!tasks_assigned_to_fkey(full_name),
       projects:project_id(id, name, code, color)`
    )

  if (params?.projectId) {
    query = query.eq("project_id", params.projectId)
  }
  if (params?.status) {
    query = query.eq("status", params.status)
  }
  if (params?.assigneeId) {
    query = query.eq("assigned_to", params.assigneeId)
  }
  if (params?.dateStart) {
    query = query.gte("deadline", params.dateStart)
  }
  if (params?.dateEnd) {
    query = query.lte("deadline", params.dateEnd)
  }
  if (params?.searchText) {
    query = query.or(`title.ilike.%${params.searchText}%,description.ilike.%${params.searchText}%`)
  }

  const { data, error } = await query
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false })

  if (error) throw error

  // Buscar todas as colunas para fazer o match com o status
  const { data: columnsData } = await supabase
    .from("kanban_columns")
    .select("id, name, color, status_key")

  const columnsMap = new Map(
    (columnsData ?? []).map((col: any) => [col.status_key, col])
  )

  return (data ?? []).map((t: any) => {
    const column = columnsMap.get(t.status)

    return {
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      status: t.status ?? "",
      deadline: t.deadline ?? null,
      assignee: t.profiles?.full_name ?? "",
      assigneeId: t.assigned_to ?? null,
      labels: t.labels ?? [],
      createdAt: t.created_at ?? "",
      project: t.projects
        ? {
            id: t.projects.id,
            name: t.projects.name,
            code: t.projects.code,
            color: t.projects.color,
          }
        : null,
      column: column
        ? {
            id: column.id,
            name: column.name,
            color: column.color ?? "#6B7280",
            statusKey: column.status_key,
          }
        : null,
    }
  })
}

export async function createTask(input: {
  title: string
  description?: string | null
  project_id?: string | null
  status?: string
  deadline?: string | null // YYYY-MM-DD
  assigned_to?: string | null // profile id
  labels?: string[]
}): Promise<string> {
  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id
  const payload: any = {
    title: input.title,
    description: input.description ?? null,
    project_id: input.project_id ?? null,
    status: input.status ?? "todo",
    deadline: input.deadline ?? null,
    assigned_to: input.assigned_to ?? null,
    labels: input.labels ?? [],
    created_by: userId ?? null,
  }
  const { data, error } = await supabase.from("tasks").insert(payload).select("id").single()
  if (error) throw error
  return data?.id as string
}

export async function updateTask(
  id: string,
  changes: Partial<{
    title: string
    description: string | null
    status: string
    deadline: string | null
    assigned_to: string | null
    labels: string[]
    project_id: string | null
  }>
): Promise<void> {
  const supabase = createClient()
  const payload: any = { ...changes }
  if (typeof changes.status === "string") payload.status = changes.status
  const { error } = await supabase.from("tasks").update(payload).eq("id", id)
  if (error) throw error
}

export async function moveTask(id: string, toStatus: string, toPosition?: number): Promise<void> {
  const supabase = createClient()
  const payload: any = { status: toStatus }
  if (typeof toPosition === "number") payload.position = toPosition
  const { error } = await supabase.from("tasks").update(payload).eq("id", id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("tasks").delete().eq("id", id)
  if (error) throw error
}

// Checklist helpers
export type ChecklistItem = { id: string; text: string; completed: boolean; position: number }

export async function listChecklist(taskId: string): Promise<ChecklistItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("task_checklist")
    .select("id, item, completed, position")
    .eq("task_id", taskId)
    .order("position", { ascending: true })
  if (error) throw error
  return (data ?? []).map((i: any) => ({
    id: i.id,
    text: i.item ?? "",
    completed: !!i.completed,
    position: i.position,
  }))
}

export async function addChecklistItem(taskId: string, text: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("task_checklist")
    .insert({ task_id: taskId, item: text })
    .select("id")
    .single()
  if (error) throw error
  return data?.id as string
}

export async function toggleChecklistItem(id: string, completed: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("task_checklist").update({ completed }).eq("id", id)
  if (error) throw error
}

export async function removeChecklistItem(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("task_checklist").delete().eq("id", id)
  if (error) throw error
}

// Profiles helpers
export type Profile = {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
}

export async function listProfiles(): Promise<Profile[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .order("full_name", { ascending: true })
  if (error) throw error
  return (data ?? []).map((p: any) => ({
    id: p.id,
    fullName: p.full_name ?? "",
    email: p.email ?? "",
    avatarUrl: p.avatar_url ?? null,
  }))
}
