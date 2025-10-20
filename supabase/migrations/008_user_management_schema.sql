-- =====================================================
-- AVALIATEC - USER MANAGEMENT SYSTEM
-- Migration: User Groups, Permissions, and Invites
-- Version: 1.0.0
-- Date: 2025-01-20
-- =====================================================

-- =====================================================
-- 1. CREATE NEW TABLES
-- =====================================================

-- User Groups Table
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group Permissions Table
CREATE TABLE IF NOT EXISTS group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES user_groups(id) ON DELETE CASCADE NOT NULL,
  section_key TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, section_key)
);

-- Users Table (extends profiles with group assignment)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  group_id UUID REFERENCES user_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_access TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Invites Table
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  group_id UUID REFERENCES user_groups(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. ADD COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add team_members array to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS team_members UUID[] DEFAULT '{}';

-- Add watchers array to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS watchers UUID[] DEFAULT '{}';

-- Add assigned_users array to clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS assigned_users UUID[] DEFAULT '{}';

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- User Groups indexes
CREATE INDEX IF NOT EXISTS idx_user_groups_name ON user_groups(name);
CREATE INDEX IF NOT EXISTS idx_user_groups_is_default ON user_groups(is_default);

-- Group Permissions indexes
CREATE INDEX IF NOT EXISTS idx_group_permissions_group_id ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_section ON group_permissions(section_key);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- User Invites indexes
CREATE INDEX IF NOT EXISTS idx_user_invites_token ON user_invites(token);
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_status ON user_invites(status);
CREATE INDEX IF NOT EXISTS idx_user_invites_expires_at ON user_invites(expires_at);

-- Array column indexes for filtering
CREATE INDEX IF NOT EXISTS idx_projects_team_members ON projects USING GIN(team_members);
CREATE INDEX IF NOT EXISTS idx_tasks_watchers ON tasks USING GIN(watchers);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_users ON clients USING GIN(assigned_users);

-- =====================================================
-- 4. INSERT DEFAULT GROUPS WITH PERMISSIONS
-- =====================================================

-- Insert Administrador group
INSERT INTO user_groups (name, description, is_default)
VALUES ('Administrador', 'Acesso completo ao sistema', false)
ON CONFLICT (name) DO NOTHING;

-- Insert Atendimento group
INSERT INTO user_groups (name, description, is_default)
VALUES ('Atendimento', 'Acesso a atendimento e visualização de projetos', true)
ON CONFLICT (name) DO NOTHING;

-- Insert permissions for Administrador group
INSERT INTO group_permissions (group_id, section_key, can_view, can_create, can_edit, can_delete)
SELECT 
  (SELECT id FROM user_groups WHERE name = 'Administrador'),
  section_key,
  true,
  true,
  true,
  true
FROM (
  VALUES 
    ('dashboard'),
    ('clientes'),
    ('projetos'),
    ('kanban'),
    ('agenda'),
    ('atendimento'),
    ('arquivos'),
    ('email'),
    ('configuracoes')
) AS sections(section_key)
ON CONFLICT (group_id, section_key) DO NOTHING;

-- Insert permissions for Atendimento group
INSERT INTO group_permissions (group_id, section_key, can_view, can_create, can_edit, can_delete)
SELECT 
  (SELECT id FROM user_groups WHERE name = 'Atendimento'),
  section_key,
  can_view,
  can_create,
  can_edit,
  can_delete
FROM (
  VALUES 
    ('dashboard', true, false, false, false),
    ('clientes', true, false, false, false),
    ('projetos', true, false, false, false),
    ('kanban', true, false, false, false),
    ('agenda', true, true, true, false),
    ('atendimento', true, true, true, false),
    ('arquivos', true, false, false, false),
    ('email', true, true, false, false),
    ('configuracoes', false, false, false, false)
) AS sections(section_key, can_view, can_create, can_edit, can_delete)
ON CONFLICT (group_id, section_key) DO NOTHING;

-- =====================================================
-- 5. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for user_groups
DROP TRIGGER IF EXISTS update_user_groups_updated_at ON user_groups;
CREATE TRIGGER update_user_groups_updated_at
  BEFORE UPDATE ON user_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    JOIN user_groups ug ON u.group_id = ug.id
    WHERE u.auth_user_id = user_auth_id
    AND ug.name = 'Administrador'
    AND u.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_auth_id UUID)
RETURNS TABLE (
  section_key TEXT,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gp.section_key,
    gp.can_view,
    gp.can_create,
    gp.can_edit,
    gp.can_delete
  FROM users u
  JOIN group_permissions gp ON u.group_id = gp.group_id
  WHERE u.auth_user_id = user_auth_id
  AND u.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check specific permission
CREATE OR REPLACE FUNCTION has_permission(
  user_auth_id UUID,
  section TEXT,
  action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT 
    CASE action
      WHEN 'view' THEN gp.can_view
      WHEN 'create' THEN gp.can_create
      WHEN 'edit' THEN gp.can_edit
      WHEN 'delete' THEN gp.can_delete
      ELSE false
    END INTO has_perm
  FROM users u
  JOIN group_permissions gp ON u.group_id = gp.group_id
  WHERE u.auth_user_id = user_auth_id
  AND u.status = 'active'
  AND gp.section_key = section;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old invites
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE user_invites
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- User Groups Policies
DROP POLICY IF EXISTS "Anyone can view user groups" ON user_groups;
CREATE POLICY "Anyone can view user groups"
  ON user_groups FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage groups" ON user_groups;
CREATE POLICY "Only admins can manage groups"
  ON user_groups FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Group Permissions Policies
DROP POLICY IF EXISTS "Anyone can view group permissions" ON group_permissions;
CREATE POLICY "Anyone can view group permissions"
  ON group_permissions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage permissions" ON group_permissions;
CREATE POLICY "Only admins can manage permissions"
  ON group_permissions FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Users Policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Admins can manage all users" ON users;
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- User Invites Policies
DROP POLICY IF EXISTS "Only admins can view invites" ON user_invites;
CREATE POLICY "Only admins can view invites"
  ON user_invites FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can manage invites" ON user_invites;
CREATE POLICY "Only admins can manage invites"
  ON user_invites FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- =====================================================
-- 9. UPDATE EXISTING RLS POLICIES FOR CONTENT FILTERING
-- =====================================================

-- Projects: Users see only projects they're assigned to or all if admin
DROP POLICY IF EXISTS "Projetos visíveis para todos" ON projects;
CREATE POLICY "Users see assigned projects or all if admin"
  ON projects FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR auth.uid() = ANY(team_members)
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
  );

-- Tasks: Users see only tasks they're watching or assigned to, or all if admin
DROP POLICY IF EXISTS "Tarefas visíveis para todos" ON tasks;
CREATE POLICY "Users see assigned tasks or all if admin"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR auth.uid() = ANY(watchers)
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM task_members tm
      WHERE tm.task_id = tasks.id
      AND tm.user_id = auth.uid()
    )
  );

-- Clients: Users see only clients they're assigned to or all if admin
DROP POLICY IF EXISTS "Clientes visíveis para todos" ON clients;
CREATE POLICY "Users see assigned clients or all if admin"
  ON clients FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR auth.uid() = ANY(assigned_users)
    OR created_by = auth.uid()
  );

-- Events: Users see only events they're participating in or all if admin
DROP POLICY IF EXISTS "Eventos visíveis para todos" ON events;
CREATE POLICY "Users see their events or all if admin"
  ON events FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM event_participants ep
      WHERE ep.event_id = events.id
      AND ep.user_id = auth.uid()
    )
  );

-- Files: Users see files from projects they have access to
DROP POLICY IF EXISTS "Arquivos visíveis para todos" ON files;
CREATE POLICY "Users see files from accessible projects"
  ON files FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = files.project_id
      AND (
        auth.uid() = ANY(p.team_members)
        OR p.created_by = auth.uid()
        OR p.assigned_to = auth.uid()
      )
    )
  );

-- =====================================================
-- 10. MIGRATE EXISTING DATA
-- =====================================================

-- Migrate existing profiles to users table
INSERT INTO users (auth_user_id, email, full_name, avatar_url, group_id, status, created_at)
SELECT 
  p.id,
  COALESCE(au.email, 'unknown@example.com'),
  p.full_name,
  p.avatar_url,
  (SELECT id FROM user_groups WHERE name = 'Administrador' LIMIT 1),
  'active',
  p.created_at
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.auth_user_id = p.id
)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Assign existing projects to their creators as team members
UPDATE projects
SET team_members = ARRAY[created_by]
WHERE created_by IS NOT NULL
AND (team_members IS NULL OR team_members = '{}')
AND created_by IN (SELECT id FROM profiles);

-- Assign existing tasks to their assigned users as watchers
UPDATE tasks
SET watchers = ARRAY[assigned_to]
WHERE assigned_to IS NOT NULL
AND (watchers IS NULL OR watchers = '{}')
AND assigned_to IN (SELECT id FROM profiles);

-- Assign existing clients to their creators
UPDATE clients
SET assigned_users = ARRAY[created_by]
WHERE created_by IS NOT NULL
AND (assigned_users IS NULL OR assigned_users = '{}')
AND created_by IN (SELECT id FROM profiles);

-- =====================================================
-- 11. CREATE VIEWS FOR EASY ACCESS
-- =====================================================

-- View to see users with their group information
CREATE OR REPLACE VIEW v_users_with_groups AS
SELECT 
  u.id,
  u.auth_user_id,
  u.email,
  u.full_name,
  u.avatar_url,
  u.status,
  u.last_access,
  u.created_at,
  ug.id as group_id,
  ug.name as group_name,
  ug.description as group_description
FROM users u
LEFT JOIN user_groups ug ON u.group_id = ug.id;

-- View to see pending invites with group information
CREATE OR REPLACE VIEW v_pending_invites AS
SELECT 
  ui.id,
  ui.email,
  ui.token,
  ui.expires_at,
  ui.status,
  ui.created_at,
  ug.name as group_name,
  u.full_name as invited_by_name
FROM user_invites ui
JOIN user_groups ug ON ui.group_id = ug.id
LEFT JOIN users u ON ui.invited_by = u.id
WHERE ui.status = 'pending'
AND ui.expires_at > NOW();

-- =====================================================
-- MIGRATION COMPLETE! ✅
-- =====================================================
-- 
-- Summary:
-- - Created 4 new tables: user_groups, group_permissions, users, user_invites
-- - Added team_members, watchers, assigned_users columns to existing tables
-- - Created 11 indexes for performance optimization
-- - Inserted 2 default groups (Administrador, Atendimento) with permissions
-- - Created helper functions for permission checks
-- - Enabled RLS and created policies for all new tables
-- - Updated existing RLS policies for content filtering
-- - Migrated existing data from profiles to users
-- - Created views for easy data access
-- 
-- =====================================================
