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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_RE.test(value)
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

  // Colunas globais: use sempre `.is(null)` — nunca `.eq(..., null)` (vira "null" na URL e quebra uuid).
  const useGlobalColumns =
    projectId === undefined ||
    projectId === null ||
    (typeof projectId === "string" &&
      (projectId === "" || projectId === "null" || !isUuid(projectId)))

  if (useGlobalColumns) {
    query = query.is("project_id", null)
  } else {
    query = query.eq("project_id", projectId)
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

export async function listKanbanColumnsWithFallback(projectId: string): Promise<KanbanColumn[]> {
  const projectColumns = await listKanbanColumns(projectId)
  if (projectColumns.length > 0) return projectColumns
  return listKanbanColumns(null)
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
