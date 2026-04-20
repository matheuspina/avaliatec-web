-- Adicionar campos budget, priority, start_date e progress à RPC get_project_detail

CREATE OR REPLACE FUNCTION public.get_project_detail(p_project_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN p.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', p.id,
        'code', p.code,
        'name', p.name,
        'description', p.description,
        'status', p.status,
        'status_id', p.status_id,
        'end_date', p.end_date,
        'start_date', p.start_date,
        'budget', p.budget,
        'priority', p.priority,
        'progress', p.progress,
        'color', p.color,
        'team_members', COALESCE(to_jsonb(p.team_members), '[]'::jsonb),
        'created_by', p.created_by,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'clients', CASE
          WHEN c.id IS NULL THEN NULL
          ELSE jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'email', c.email,
            'phone', c.phone
          )
        END,
        'project_manager', CASE
          WHEN pm.id IS NULL THEN NULL
          ELSE jsonb_build_object(
            'id', pm.id,
            'full_name', pm.full_name,
            'avatar_url', pm.avatar_url
          )
        END,
        'created_by_user', CASE
          WHEN cb.id IS NULL THEN NULL
          ELSE jsonb_build_object(
            'id', cb.id,
            'full_name', cb.full_name
          )
        END,
        'status_ref', CASE
          WHEN ps.id IS NULL THEN NULL
          ELSE jsonb_build_object(
            'id', ps.id,
            'name', ps.name,
            'color', ps.color
          )
        END,
        'stats', jsonb_build_object(
          'total_tasks', (SELECT count(*)::int FROM public.tasks t WHERE t.project_id = p.id),
          'completed_tasks', (
            SELECT count(*)::int FROM public.tasks t
            WHERE t.project_id = p.id AND t.status = 'done'
          ),
          'total_files', (SELECT count(*)::int FROM public.files f WHERE f.project_id = p.id)
        )
      )
    END
  FROM public.projects p
  LEFT JOIN public.clients c ON c.id = p.client_id
  LEFT JOIN public.profiles pm ON pm.id = p.project_manager
  LEFT JOIN public.profiles cb ON cb.id = p.created_by
  LEFT JOIN public.project_statuses ps ON ps.id = p.status_id
  WHERE p.id = p_project_id;
$$;

COMMENT ON FUNCTION public.get_project_detail(uuid) IS 'Detalhe do projeto + cliente, gestor, criador, status, budget, priority e estatísticas (RLS do chamador).';
