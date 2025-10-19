import { createClient } from "../supabase/client"

export type TaskComment = {
  id: string
  task_id: string
  user_id: string | null
  text: string
  created_at: string
  updated_at: string
  author_name: string
  author_avatar?: string | null
}

/**
 * Lista todos os comentários de uma tarefa
 */
export async function listComments(taskId: string): Promise<TaskComment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("task_comments")
    .select("id, task_id, user_id, content, created_at, updated_at, profiles:profiles!task_comments_user_id_fkey(full_name, avatar_url)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data ?? []).map((c: any) => ({
    id: c.id,
    task_id: c.task_id,
    user_id: c.user_id,
    text: c.content,
    created_at: c.created_at,
    updated_at: c.updated_at,
    author_name: c.profiles?.full_name ?? "Usuário Desconhecido",
    author_avatar: c.profiles?.avatar_url ?? null,
  }))
}

/**
 * Cria um novo comentário
 */
export async function createComment(taskId: string, text: string): Promise<string> {
  const supabase = createClient()

  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id

  if (!userId) throw new Error("Usuário não autenticado")

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      user_id: userId,
      content: text.trim(),
    })
    .select("id")
    .single()

  if (error) throw error

  return data?.id as string
}

/**
 * Atualiza um comentário existente
 */
export async function updateComment(id: string, text: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("task_comments")
    .update({
      content: text.trim(),
    })
    .eq("id", id)

  if (error) throw error
}

/**
 * Deleta um comentário
 */
export async function deleteComment(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", id)

  if (error) throw error
}
