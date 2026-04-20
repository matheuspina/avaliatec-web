-- Inclui usuários de projects.team_members no agregado `members` (além de gestor e responsáveis por tarefa).

CREATE OR REPLACE FUNCTION public.get_project_single_page_bundle(p_project_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
WITH project_base AS (
  SELECT p.*
  FROM public.projects p
  WHERE p.id = p_project_id
),
has_project_columns AS (
  SELECT EXISTS (
    SELECT 1
    FROM public.kanban_columns kc
    WHERE kc.project_id = p_project_id
  ) AS value
),
effective_columns AS (
  SELECT
    kc.id,
    kc.name,
    kc.color,
    kc.position,
    kc.project_id,
    kc.status_key
  FROM public.kanban_columns kc, has_project_columns hpc
  WHERE
    (hpc.value = TRUE AND kc.project_id = p_project_id)
    OR (hpc.value = FALSE AND kc.project_id IS NULL)
  ORDER BY kc.position ASC
),
checklist_stats AS (
  SELECT
    COUNT(tc.id)::int AS total_items,
    COUNT(tc.id) FILTER (WHERE tc.completed IS TRUE)::int AS completed_items
  FROM public.task_checklist tc
  JOIN public.tasks t ON t.id = tc.task_id
  WHERE t.project_id = p_project_id
)
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM project_base) THEN NULL
    ELSE jsonb_build_object(
      'project',
      (
        SELECT jsonb_build_object(
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
            'total_tasks', (
              SELECT COUNT(*)::int
              FROM public.tasks t
              WHERE t.project_id = p.id
            ),
            'completed_tasks', (
              SELECT COUNT(*)::int
              FROM public.tasks t
              WHERE t.project_id = p.id
                AND t.status = 'done'
            ),
            'total_files', (
              SELECT COUNT(*)::int
              FROM public.files f
              WHERE f.project_id = p.id
            )
          )
        )
        FROM project_base p
        LEFT JOIN public.clients c ON c.id = p.client_id
        LEFT JOIN public.profiles pm ON pm.id = p.project_manager
        LEFT JOIN public.profiles cb ON cb.id = p.created_by
        LEFT JOIN public.project_statuses ps ON ps.id = p.status_id
      ),
      'columns',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', col.id,
              'name', col.name,
              'color', col.color,
              'position', col.position,
              'project_id', col.project_id,
              'status_key', col.status_key
            )
            ORDER BY col.position
          )
          FROM effective_columns col
        ),
        '[]'::jsonb
      ),
      'tasks',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', t.id,
              'title', t.title,
              'description', t.description,
              'status', t.status,
              'deadline', t.deadline,
              'labels', COALESCE(to_jsonb(t.labels), '[]'::jsonb),
              'assigned_to', t.assigned_to,
              'assignee_name', COALESCE(pr.full_name, ''),
              'watchers', COALESCE(to_jsonb(t.watchers), '[]'::jsonb),
              'created_at', t.created_at,
              'updated_at', t.updated_at
            )
            ORDER BY t.position ASC, t.updated_at DESC
          )
          FROM public.tasks t
          LEFT JOIN public.profiles pr ON pr.id = t.assigned_to
          WHERE t.project_id = p_project_id
        ),
        '[]'::jsonb
      ),
      'files',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', f.id,
              'name', f.name,
              'mime_type', f.mime_type,
              'file_size', f.size_bytes,
              'file_path', f.storage_path,
              'uploaded_by', f.uploaded_by,
              'created_at', f.created_at,
              'uploader', CASE
                WHEN pr.id IS NULL THEN NULL
                ELSE jsonb_build_object(
                  'id', pr.id,
                  'full_name', pr.full_name
                )
              END
            )
            ORDER BY f.created_at DESC
          )
          FROM public.files f
          LEFT JOIN public.profiles pr ON pr.id = f.uploaded_by
          WHERE f.project_id = p_project_id
        ),
        '[]'::jsonb
      ),
      'members',
      COALESCE(
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
              UNION
              SELECT unnest(pj2.team_members) AS uid
              FROM public.projects pj2
              WHERE pj2.id = p_project_id
                AND pj2.team_members IS NOT NULL
                AND cardinality(pj2.team_members) > 0
            ) x
            WHERE x.uid IS NOT NULL
          ) member_ids
          JOIN public.profiles pr ON pr.id = member_ids.uid
          LEFT JOIN public.users u ON u.auth_user_id = pr.id
        ),
        '[]'::jsonb
      ),
      'statuses',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', s.id,
              'name', s.name,
              'color', s.color,
              'description', s.description,
              'position', s.position,
              'is_active', s.is_active,
              'created_at', s.created_at,
              'updated_at', s.updated_at
            )
            ORDER BY s.position ASC
          )
          FROM public.project_statuses s
          WHERE s.is_active IS TRUE
        ),
        '[]'::jsonb
      ),
      'profiles',
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', u.auth_user_id,
              'full_name', u.full_name,
              'email', u.email,
              'avatar_url', u.avatar_url
            )
            ORDER BY u.full_name ASC
          )
          FROM public.users u
        ),
        '[]'::jsonb
      ),
      'checklist_summary',
      (
        SELECT jsonb_build_object(
          'total_items', cs.total_items,
          'completed_items', cs.completed_items,
          'completion_percentage',
          CASE
            WHEN cs.total_items > 0 THEN ROUND((cs.completed_items::numeric / cs.total_items::numeric) * 100)::int
            ELSE 0
          END
        )
        FROM checklist_stats cs
      )
    )
  END;
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
          UNION
          SELECT unnest(pj2.team_members) AS uid
          FROM public.projects pj2
          WHERE pj2.id = p_project_id
            AND pj2.team_members IS NOT NULL
            AND cardinality(pj2.team_members) > 0
        ) x
        WHERE x.uid IS NOT NULL
      ) AS member_ids
      JOIN public.profiles pr ON pr.id = member_ids.uid
      LEFT JOIN public.users u ON u.auth_user_id = pr.id
    ),
    '[]'::jsonb
  );
$$;

COMMENT ON FUNCTION public.get_project_team_members(uuid) IS 'Membros: gestor, responsáveis em tarefas e projects.team_members (RLS).';
