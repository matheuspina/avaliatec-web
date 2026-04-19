-- CRM Metrics RPCs for client management.
-- Two functions:
--   1. get_clients_list_metrics()  — light summary for all accessible clients (list view columns)
--   2. get_client_crm_detail(uuid) — full CRM data + embedded project list for single client detail page
--
-- "Sale" definition: project with status = 'done' AND actual_value IS NOT NULL.
-- Projects concluded without actual_value are excluded from revenue/average metrics.
-- RLS is enforced via SECURITY INVOKER (queries inherit caller's row policies).

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Light metrics for all accessible clients (one round-trip for list view)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_clients_list_metrics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_object_agg(
      sub.client_id::text,
      sub.metrics
    ),
    '{}'::jsonb
  )
  FROM (
    SELECT
      c.id AS client_id,
      jsonb_build_object(
        'client_since', c.created_at,
        'total_completed_revenue',
          COALESCE(
            SUM(p.actual_value) FILTER (
              WHERE p.status = 'done' AND p.actual_value IS NOT NULL
            ),
            0
          ),
        'last_sale_date',
          MAX(COALESCE(p.completed_at, p.updated_at)) FILTER (
            WHERE p.status = 'done' AND p.actual_value IS NOT NULL
          ),
        'total_projects',   COUNT(DISTINCT p.id),
        'completed_projects',
          COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'done'),
        'active_projects',
          COUNT(DISTINCT p.id) FILTER (
            WHERE p.status IN ('backlog', 'todo', 'in_progress', 'review')
          )
      ) AS metrics
    FROM public.clients c
    LEFT JOIN public.projects p ON p.client_id = c.id
    GROUP BY c.id, c.created_at
  ) sub
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Full CRM detail for a single client (includes embedded project list)
--    Period filtering is done client-side from the returned projects array.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_client_crm_detail(p_client_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN c.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'client_since', c.created_at,

        -- All-time revenue (only concluded projects with actual_value)
        'total_revenue_all_time',
          COALESCE((
            SELECT SUM(actual_value)
            FROM public.projects
            WHERE client_id = p_client_id
              AND status = 'done'
              AND actual_value IS NOT NULL
          ), 0),

        -- Most recent sale date (completed_at preferred, falls back to updated_at)
        'last_sale_date', (
          SELECT MAX(COALESCE(completed_at, updated_at))
          FROM public.projects
          WHERE client_id = p_client_id
            AND status = 'done'
            AND actual_value IS NOT NULL
        ),

        -- Earliest sale date
        'first_sale_date', (
          SELECT MIN(COALESCE(completed_at, updated_at))
          FROM public.projects
          WHERE client_id = p_client_id
            AND status = 'done'
            AND actual_value IS NOT NULL
        ),

        -- Project counts
        'total_projects',
          (SELECT COUNT(*) FROM public.projects WHERE client_id = p_client_id),
        'completed_projects',
          (SELECT COUNT(*) FROM public.projects WHERE client_id = p_client_id AND status = 'done'),
        'active_projects',
          (SELECT COUNT(*) FROM public.projects WHERE client_id = p_client_id
            AND status IN ('backlog', 'todo', 'in_progress', 'review')),

        -- Nearest upcoming deadline among non-completed projects
        'next_deadline',
          (SELECT MIN(end_date) FROM public.projects
            WHERE client_id = p_client_id AND status != 'done'),

        -- Full project list (all statuses, newest first, with financial data)
        'projects', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id',              p.id,
              'code',            p.code,
              'name',            p.name,
              'status',          p.status,
              'status_name',     COALESCE(ps.name, p.status),
              'status_color',    ps.color,
              'end_date',        p.end_date,
              'actual_value',    p.actual_value,
              'estimated_value', p.estimated_value,
              'completed_at',    p.completed_at,
              'created_at',      p.created_at
            ) ORDER BY p.created_at DESC
          )
          FROM public.projects p
          LEFT JOIN public.project_statuses ps ON ps.id = p.status_id
          WHERE p.client_id = p_client_id
        ), '[]'::jsonb)
      )
    END
  FROM public.clients c
  WHERE c.id = p_client_id;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Grants (same pattern as migration 019)
-- ────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.get_clients_list_metrics() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_client_crm_detail(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_clients_list_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_crm_detail(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_clients_list_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_client_crm_detail(uuid)  TO service_role;

COMMENT ON FUNCTION public.get_clients_list_metrics()
  IS 'Light CRM metrics (revenue, last sale, project counts) for all accessible clients. RLS applied via SECURITY INVOKER.';
COMMENT ON FUNCTION public.get_client_crm_detail(uuid)
  IS 'Full CRM detail for a single client: revenue totals, dates, project counts, and embedded project list. Period filtering done client-side. RLS applied via SECURITY INVOKER.';
