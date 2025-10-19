import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'
import { getFallbackStatusColor, mapDbStatusToUI } from '@/lib/data/projects'

async function getCurrentUserId(): Promise<string | null> {
  const supabase = createSupabaseClient()
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function listClients(search?: string): Promise<{ data: Client[]; error: string | null }> {
  const supabase = createSupabaseClient()
  let query = supabase.from('clients').select('*').order('created_at', { ascending: false })

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`
    query = query.or(`name.ilike.${term},document.ilike.${term},email.ilike.${term}`)
  }

  const { data, error } = await query
  return { data: (data as Client[]) ?? [], error: error?.message ?? null }
}

export async function createClientRecord(payload: { name: string; document: string; email: string; phone: string; address: string; type?: Client['type'] }): Promise<{ data: Client | null; error: string | null }> {
  const supabase = createSupabaseClient()
  const uid = await getCurrentUserId()
  const insertData = {
    name: payload.name,
    document: payload.document,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    type: payload.type ?? 'company',
    created_by: uid,
  }
  const { data, error } = await supabase.from('clients').insert(insertData).select('*').single()
  return { data: (data as Client) ?? null, error: error?.message ?? null }
}

export async function updateClientRecord(id: string, payload: Partial<{ name: string; document: string; email: string; phone: string; address: string; type: Client['type']; notes: string | null }>): Promise<{ data: Client | null; error: string | null }> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select('*').single()
  return { data: (data as Client) ?? null, error: error?.message ?? null }
}

export async function deleteClientRecord(id: string): Promise<{ error: string | null }> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export type ClientSummaryProject = {
  id: string
  title: string
  status: string | null
  deadline: string | null
  code: string | null
  statusColor: string | null
}

export type ClientSummaryTask = {
  id: string
  title: string
  status: string | null
  statusKey?: string | null
  deadline: string | null
  project_id: string | null
  project_title: string | null
}

export type ClientSummary = {
  client: Client
  projects: ClientSummaryProject[]
  tasks: ClientSummaryTask[]
}

export async function getClientSummary(clientId: string): Promise<{ data: ClientSummary | null; error: string | null }> {
  const supabase = createSupabaseClient()

  const clientPromise = supabase.from("clients").select("*").eq("id", clientId).single()
  const projectsPromise = supabase
    .from("projects")
    .select("id, name, status, end_date, code")
    .eq("client_id", clientId)
    .order("end_date", { ascending: true })

  const tasksPromise = supabase
    .from("tasks")
    .select("id, title, status, deadline, project_id, projects:projects!inner(id, name, client_id)")
    .eq("projects.client_id", clientId)
    .order("updated_at", { ascending: false })

  const [{ data: clientData, error: clientError }, { data: projectsData, error: projectsError }, { data: tasksData, error: tasksError }] =
    await Promise.all([clientPromise, projectsPromise, tasksPromise])

  if (clientError) {
    return { data: null, error: clientError.message }
  }

  if (!clientData) {
    return { data: null, error: "Cliente não encontrado." }
  }

  if (projectsError) {
    return { data: null, error: projectsError.message }
  }

  if (tasksError) {
    return { data: null, error: tasksError.message }
  }

  const projects = (projectsData ?? []).map((project: any) => ({
    id: project.id,
    title: project.name ?? "",
    status: project.status ? mapDbStatusToUI(project.status) : null,
    deadline: project.end_date ?? null,
    code: project.code ?? null,
    statusColor: project.status ? getFallbackStatusColor(project.status) : null,
  }))

  const TASK_STATUS_LABELS: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'A Fazer',
    in_progress: 'Em andamento',
    review: 'Revisão',
    done: 'Concluído',
    cancelled: 'Cancelado',
  }

  const mapTaskStatusToUI = (status?: string | null) => {
    if (!status) return null
    return TASK_STATUS_LABELS[status] ?? status
  }

  const tasks = (tasksData ?? []).map((task: any) => ({
    id: task.id,
    title: task.title,
    status: mapTaskStatusToUI(task.status),
    statusKey: task.status ?? null,
    deadline: task.deadline ?? null,
    project_id: task.project_id ?? null,
    project_title: task.projects?.name ?? null,
  }))

  return {
    data: {
      client: clientData as Client,
      projects,
      tasks,
    },
    error: null,
  }
}
