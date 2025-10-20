-- =====================================================
-- AVALIATEC - DATA MIGRATION FOR USER ASSIGNMENTS
-- Migration: Populate user assignments in existing data
-- Version: 1.0.0
-- Date: 2025-01-20
-- =====================================================

-- =====================================================
-- 1. MIGRATE EXISTING PROFILES TO USERS TABLE
-- =====================================================

-- Migrate all profiles that don't exist in users table yet
-- Assign them to Administrador group by default
INSERT INTO users (auth_user_id, email, full_name, avatar_url, group_id, status, created_at)
SELECT 
  p.id,
  COALESCE(au.email, 'user_' || p.id || '@avaliatec.local'),
  COALESCE(p.full_name, 'User'),
  p.avatar_url,
  (SELECT id FROM user_groups WHERE name = 'Administrador' LIMIT 1),
  'active',
  COALESCE(p.created_at, NOW())
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.auth_user_id = p.id
)
ON CONFLICT (auth_user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();

-- =====================================================
-- 2. UPDATE PROJECTS WITH TEAM MEMBERS
-- =====================================================

-- Assign project creators as team members
UPDATE projects
SET team_members = ARRAY[created_by]
WHERE created_by IS NOT NULL
AND created_by IN (SELECT id FROM profiles)
AND (team_members IS NULL OR team_members = '{}' OR NOT (created_by = ANY(team_members)));

-- Also add project_manager to team_members if different from creator
UPDATE projects
SET team_members = array_append(team_members, project_manager)
WHERE project_manager IS NOT NULL
AND project_manager IN (SELECT id FROM profiles)
AND project_manager != created_by
AND NOT (project_manager = ANY(team_members));

-- =====================================================
-- 3. UPDATE TASKS WITH WATCHERS
-- =====================================================

-- Assign task creators as watchers
UPDATE tasks
SET watchers = ARRAY[created_by]
WHERE created_by IS NOT NULL
AND created_by IN (SELECT id FROM profiles)
AND (watchers IS NULL OR watchers = '{}' OR NOT (created_by = ANY(watchers)));

-- Add assigned_to user to watchers if different from creator
UPDATE tasks
SET watchers = 
  CASE 
    WHEN assigned_to IS NOT NULL 
      AND assigned_to IN (SELECT id FROM profiles)
      AND assigned_to != created_by
      AND NOT (assigned_to = ANY(watchers))
    THEN array_append(watchers, assigned_to)
    ELSE watchers
  END
WHERE assigned_to IS NOT NULL
AND assigned_to IN (SELECT id FROM profiles);

-- Add task_members to watchers array
UPDATE tasks t
SET watchers = (
  SELECT array_agg(DISTINCT user_id)
  FROM (
    SELECT unnest(t.watchers) as user_id
    UNION
    SELECT tm.user_id
    FROM task_members tm
    WHERE tm.task_id = t.id
    AND tm.user_id IN (SELECT id FROM profiles)
  ) combined
)
WHERE EXISTS (
  SELECT 1 FROM task_members tm
  WHERE tm.task_id = t.id
  AND tm.user_id IN (SELECT id FROM profiles)
);

-- =====================================================
-- 4. UPDATE CLIENTS WITH ASSIGNED USERS
-- =====================================================

-- Assign client creators as assigned users
UPDATE clients
SET assigned_users = ARRAY[created_by]
WHERE created_by IS NOT NULL
AND created_by IN (SELECT id FROM profiles)
AND (assigned_users IS NULL OR assigned_users = '{}' OR NOT (created_by = ANY(assigned_users)));

-- =====================================================
-- 5. ENSURE EVENT PARTICIPANTS ARE POPULATED
-- =====================================================

-- Add event creators as participants if not already added
INSERT INTO event_participants (event_id, user_id)
SELECT e.id, e.created_by
FROM events e
WHERE e.created_by IS NOT NULL
AND e.created_by IN (SELECT id FROM profiles)
AND NOT EXISTS (
  SELECT 1 FROM event_participants ep
  WHERE ep.event_id = e.id
  AND ep.user_id = e.created_by
)
ON CONFLICT (event_id, user_id) DO NOTHING;

-- =====================================================
-- 6. DATA VALIDATION AND CLEANUP
-- =====================================================

-- Remove NULL values from arrays
UPDATE projects
SET team_members = array_remove(team_members, NULL)
WHERE team_members IS NOT NULL;

UPDATE tasks
SET watchers = array_remove(watchers, NULL)
WHERE watchers IS NOT NULL;

UPDATE clients
SET assigned_users = array_remove(assigned_users, NULL)
WHERE assigned_users IS NOT NULL;

-- Remove duplicate values from arrays
UPDATE projects
SET team_members = (
  SELECT array_agg(DISTINCT user_id ORDER BY user_id)
  FROM unnest(team_members) as user_id
)
WHERE team_members IS NOT NULL
AND array_length(team_members, 1) > 0;

UPDATE tasks
SET watchers = (
  SELECT array_agg(DISTINCT user_id ORDER BY user_id)
  FROM unnest(watchers) as user_id
)
WHERE watchers IS NOT NULL
AND array_length(watchers, 1) > 0;

UPDATE clients
SET assigned_users = (
  SELECT array_agg(DISTINCT user_id ORDER BY user_id)
  FROM unnest(assigned_users) as user_id
)
WHERE assigned_users IS NOT NULL
AND array_length(assigned_users, 1) > 0;

-- =====================================================
-- 7. CREATE SUMMARY REPORT
-- =====================================================

-- Create a temporary view to show migration results
CREATE OR REPLACE VIEW v_migration_summary AS
SELECT
  'Users Migrated' as metric,
  COUNT(*) as count
FROM users
UNION ALL
SELECT
  'Projects with Team Members' as metric,
  COUNT(*) as count
FROM projects
WHERE team_members IS NOT NULL AND array_length(team_members, 1) > 0
UNION ALL
SELECT
  'Tasks with Watchers' as metric,
  COUNT(*) as count
FROM tasks
WHERE watchers IS NOT NULL AND array_length(watchers, 1) > 0
UNION ALL
SELECT
  'Clients with Assigned Users' as metric,
  COUNT(*) as count
FROM clients
WHERE assigned_users IS NOT NULL AND array_length(assigned_users, 1) > 0
UNION ALL
SELECT
  'Event Participants' as metric,
  COUNT(*) as count
FROM event_participants;

-- Display migration summary
-- SELECT * FROM v_migration_summary;

-- =====================================================
-- MIGRATION COMPLETE! ✅
-- =====================================================
-- 
-- Summary:
-- - Migrated existing profiles to users table
-- - Assigned all existing users to Administrador group
-- - Populated team_members in projects table
-- - Populated watchers in tasks table
-- - Populated assigned_users in clients table
-- - Ensured event_participants are populated
-- - Cleaned up NULL and duplicate values in arrays
-- 
-- To view migration results, run:
-- SELECT * FROM v_migration_summary;
-- 
-- =====================================================
