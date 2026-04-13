-- Alinha nomes de colunas com o frontend (PostgREST): projects.name, projects.end_date, kanban_columns.name, kanban_columns.project_id
-- Corrige recursão infinita em RLS: policies de event_participants consultavam events, cujo SELECT consultava event_participants.

-- ---------------------------------------------------------------------------
-- 1) Projetos: title -> name, deadline -> end_date
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects RENAME COLUMN title TO name;
ALTER TABLE public.projects RENAME COLUMN deadline TO end_date;

-- ---------------------------------------------------------------------------
-- 2) Kanban: title -> name; coluna project_id (nullable = colunas globais)
-- ---------------------------------------------------------------------------
ALTER TABLE public.kanban_columns RENAME COLUMN title TO name;

ALTER TABLE public.kanban_columns
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kanban_columns_project_id ON public.kanban_columns(project_id);

-- ---------------------------------------------------------------------------
-- 3) Views que referenciam colunas antigas (mantém aliases title/deadline na saída)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_project_stats AS
SELECT
  p.id,
  p.code,
  p.name AS title,
  p.status,
  p.end_date AS deadline,
  c.name AS client_name,
  pr.full_name AS assigned_to_name,
  COUNT(DISTINCT t.id) AS task_count,
  COUNT(DISTINCT f.id) AS file_count,
  COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS completed_tasks,
  p.created_at,
  p.updated_at
FROM public.projects p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.profiles pr ON p.assigned_to = pr.id
LEFT JOIN public.tasks t ON t.project_id = p.id
LEFT JOIN public.files f ON f.project_id = p.id
GROUP BY p.id, c.name, pr.full_name;

CREATE OR REPLACE VIEW public.v_upcoming_deadlines AS
SELECT
  'project'::text AS type,
  p.id,
  p.code AS identifier,
  p.name AS title,
  p.end_date AS due_date,
  p.assigned_to AS user_id,
  pr.full_name AS user_name
FROM public.projects p
LEFT JOIN public.profiles pr ON p.assigned_to = pr.id
WHERE p.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND p.status != 'done'
UNION ALL
SELECT
  'task'::text AS type,
  t.id,
  COALESCE(pr.code, 'N/A'::text) AS identifier,
  t.title,
  t.deadline AS due_date,
  t.assigned_to AS user_id,
  pf.full_name AS user_name
FROM public.tasks t
LEFT JOIN public.projects pr ON t.project_id = pr.id
LEFT JOIN public.profiles pf ON t.assigned_to = pf.id
WHERE t.deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND t.status != 'done'
ORDER BY 5 ASC;

-- ---------------------------------------------------------------------------
-- 4) RLS: função SECURITY DEFINER para ler created_by sem reentrar nas policies de events
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.event_created_by(p_event_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT created_by FROM public.events WHERE id = p_event_id;
$$;

REVOKE ALL ON FUNCTION public.event_created_by(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_created_by(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_created_by(uuid) TO service_role;

DROP POLICY IF EXISTS "Users can view event participants" ON public.event_participants;
CREATE POLICY "Users can view event participants"
  ON public.event_participants FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR user_id = auth.uid()
    OR event_created_by(event_id) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can add participants to their events" ON public.event_participants;
CREATE POLICY "Users can add participants to their events"
  ON public.event_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    has_permission(auth.uid(), 'agenda', 'edit')
    AND event_created_by(event_id) = auth.uid()
  );

DROP POLICY IF EXISTS "Users can remove participants from their events" ON public.event_participants;
CREATE POLICY "Users can remove participants from their events"
  ON public.event_participants FOR DELETE
  TO authenticated
  USING (
    has_permission(auth.uid(), 'agenda', 'edit')
    AND event_created_by(event_id) = auth.uid()
  );
