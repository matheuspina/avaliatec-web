-- RPCs para detalhe do projeto, arquivos e membros (evita embeds PostgREST quebrados e colunas renomeadas).

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_manager uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

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

CREATE OR REPLACE FUNCTION public.list_project_files_for_project(p_project_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(elem)
      FROM (
        SELECT jsonb_build_object(
          'id', f.id,
          'name', f.name,
          'mime_type', f.mime_type,
          'file_size', f.size_bytes,
          'file_path', f.storage_path,
          'uploaded_by', f.uploaded_by,
          'created_at', f.created_at,
          'uploader', CASE
            WHEN pr.id IS NULL THEN NULL
            ELSE jsonb_build_object('id', pr.id, 'full_name', pr.full_name)
          END
        ) AS elem
        FROM public.files f
        LEFT JOIN public.profiles pr ON pr.id = f.uploaded_by
        WHERE f.project_id = p_project_id
        ORDER BY f.created_at DESC
      ) ordered_files
    ),
    '[]'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION public.get_project_team_members(p_project_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pr.id,
          'name', pr.full_name,
          'role', pr.role,
          'avatar_url', pr.avatar_url,
          'email', COALESCE(u.email, '')
        )
        ORDER BY pr.full_name
      )
      FROM (
        SELECT DISTINCT x.uid
        FROM (
          SELECT pj.project_manager AS uid
          FROM public.projects pj
          WHERE pj.id = p_project_id AND pj.project_manager IS NOT NULL
          UNION
          SELECT t.assigned_to AS uid
          FROM public.tasks t
          WHERE t.project_id = p_project_id AND t.assigned_to IS NOT NULL
        ) x
        WHERE x.uid IS NOT NULL
      ) AS member_ids
      JOIN public.profiles pr ON pr.id = member_ids.uid
      LEFT JOIN public.users u ON u.auth_user_id = pr.id
    ),
    '[]'::jsonb
  );
$$;

COMMENT ON FUNCTION public.get_project_detail(uuid) IS 'Detalhe do projeto + cliente, gestor, criador, status e estatísticas (RLS do chamador).';
COMMENT ON FUNCTION public.list_project_files_for_project(uuid) IS 'Arquivos do projeto com uploader (RLS).';
COMMENT ON FUNCTION public.get_project_team_members(uuid) IS 'Membros derivados de project_manager e tarefas (RLS).';

REVOKE ALL ON FUNCTION public.get_project_detail(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_project_files_for_project(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_project_team_members(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_project_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_project_files_for_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_team_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_detail(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_project_files_for_project(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_project_team_members(uuid) TO service_role;
