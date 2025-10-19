import { createClient } from "../supabase/client"

export type KanbanColumn = {
  id: string
  name: string
  color: string
  position: number
  project_id: string | null
  statusKey: string
}

const slugify = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const randomSuffix = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().split("-")[0]
  }
  return Math.random().toString(36).slice(2, 10)
}

const buildStatusKey = (name: string): string => {
  const base = slugify(name)
  return `${base || "coluna"}_${randomSuffix()}`
}

/**
 * Lista todas as colunas do Kanban
 * Se project_id for fornecido, retorna apenas colunas daquele projeto
 * Caso contrário, retorna colunas globais (project_id = null)
 */
export async function listKanbanColumns(projectId?: string | null): Promise<KanbanColumn[]> {
  const supabase = createClient()

  let query = supabase
    .from("kanban_columns")
    .select("id, name, color, position, project_id, status_key")
    .order("position", { ascending: true })

  // Se projectId for fornecido, busca colunas desse projeto
  // Se for null explicitamente, busca colunas globais
  // Se não for fornecido, busca colunas globais por padrão
  if (projectId !== undefined) {
    query = query.eq("project_id", projectId)
  } else {
    query = query.is("project_id", null)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map((col) => ({
    id: col.id,
    name: col.name,
    color: col.color ?? "#6B7280",
    position: col.position,
    project_id: col.project_id,
    statusKey: col.status_key,
  }))
}

/**
 * Cria uma nova coluna do Kanban
 */
export async function createKanbanColumn(input: {
  name: string
  color?: string
  project_id?: string | null
}): Promise<string> {
  const supabase = createClient()

  // Buscar a próxima posição disponível
  const { data: existingColumns } = await supabase
    .from("kanban_columns")
    .select("position")
    .is("project_id", input.project_id ?? null)
    .order("position", { ascending: false })
    .limit(1)

  const nextPosition = existingColumns && existingColumns.length > 0
    ? existingColumns[0].position + 1
    : 0

  const payload = {
    name: input.name,
    color: input.color ?? "#6B7280",
    position: nextPosition,
    project_id: input.project_id ?? null,
    status_key: buildStatusKey(input.name),
  }

  const { data, error } = await supabase
    .from("kanban_columns")
    .insert(payload)
    .select("id")
    .single()

  if (error) throw error

  return data?.id as string
}

/**
 * Atualiza uma coluna do Kanban
 */
export async function updateKanbanColumn(
  id: string,
  changes: Partial<{
    name: string
    color: string
    position: number
  }>
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("kanban_columns")
    .update(changes)
    .eq("id", id)

  if (error) throw error
}

/**
 * Deleta uma coluna do Kanban
 * IMPORTANTE: Antes de deletar, mova todas as tarefas para outra coluna!
 */
export async function deleteKanbanColumn(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("kanban_columns")
    .delete()
    .eq("id", id)

  if (error) throw error
}

/**
 * Reordena as colunas do Kanban
 */
export async function reorderKanbanColumns(
  columnId: string,
  newPosition: number
): Promise<void> {
  const supabase = createClient()

  // Atualizar a posição da coluna movida
  const { error } = await supabase
    .from("kanban_columns")
    .update({ position: newPosition })
    .eq("id", columnId)

  if (error) throw error

  // TODO: Reordenar outras colunas se necessário
  // Por agora, simplesmente atualiza a posição da coluna movida
}
