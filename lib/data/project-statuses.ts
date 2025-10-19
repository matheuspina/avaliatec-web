import { createClient } from "../supabase/client"

export type ProjectStatus = {
  id: string
  name: string
  color: string
  description: string | null
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function listProjectStatuses(activeOnly = false): Promise<ProjectStatus[]> {
  const supabase = createClient()

  let query = supabase
    .from("project_statuses")
    .select("*")
    .order("position", { ascending: true })

  if (activeOnly) {
    query = query.eq("is_active", true)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    description: s.description ?? null,
    position: s.position,
    isActive: s.is_active ?? true,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }))
}

export async function getProjectStatus(id: string): Promise<ProjectStatus> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("project_statuses")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    color: data.color,
    description: data.description ?? null,
    position: data.position,
    isActive: data.is_active ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function createProjectStatus(input: {
  name: string
  color: string
  description?: string
}): Promise<string> {
  const supabase = createClient()

  // Buscar a próxima posição
  const { data: lastStatus } = await supabase
    .from("project_statuses")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .single()

  const nextPosition = lastStatus ? lastStatus.position + 1 : 0

  const { data, error } = await supabase
    .from("project_statuses")
    .insert({
      name: input.name,
      color: input.color,
      description: input.description ?? null,
      position: nextPosition,
      is_active: true,
    })
    .select("id")
    .single()

  if (error) throw error

  return data.id
}

export async function updateProjectStatus(
  id: string,
  changes: Partial<{
    name: string
    color: string
    description: string | null
    position: number
    isActive: boolean
  }>
): Promise<void> {
  const supabase = createClient()

  const payload: any = {}
  if (changes.name !== undefined) payload.name = changes.name
  if (changes.color !== undefined) payload.color = changes.color
  if (changes.description !== undefined) payload.description = changes.description
  if (changes.position !== undefined) payload.position = changes.position
  if (changes.isActive !== undefined) payload.is_active = changes.isActive

  const { error } = await supabase
    .from("project_statuses")
    .update(payload)
    .eq("id", id)

  if (error) throw error
}

export async function deleteProjectStatus(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("project_statuses")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function reorderProjectStatuses(
  statusId: string,
  newPosition: number
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("project_statuses")
    .update({ position: newPosition })
    .eq("id", statusId)

  if (error) throw error
}
