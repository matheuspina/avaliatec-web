-- =====================================================
-- AVALIATEC - RLS POLICIES
-- Row Level Security para todas as tabelas
-- =====================================================

-- =====================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. POLICIES PARA PROFILES
-- =====================================================

DROP POLICY IF EXISTS "Profiles são visíveis para usuários autenticados" ON profiles;
CREATE POLICY "Profiles são visíveis para usuários autenticados"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. POLICIES PARA CLIENTS
-- =====================================================

DROP POLICY IF EXISTS "Clientes visíveis para todos" ON clients;
CREATE POLICY "Clientes visíveis para todos"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários podem criar clientes" ON clients;
CREATE POLICY "Usuários podem criar clientes"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins e criador podem atualizar clientes" ON clients;
CREATE POLICY "Admins e criador podem atualizar clientes"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR clients.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Apenas admins podem deletar clientes" ON clients;
CREATE POLICY "Apenas admins podem deletar clientes"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 4. POLICIES PARA PROJECTS
-- =====================================================

DROP POLICY IF EXISTS "Projetos visíveis para todos" ON projects;
CREATE POLICY "Projetos visíveis para todos"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários podem criar projetos" ON projects;
CREATE POLICY "Usuários podem criar projetos"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permissão para atualizar projetos" ON projects;
CREATE POLICY "Permissão para atualizar projetos"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'manager')
        OR projects.assigned_to = auth.uid()
        OR projects.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Apenas admins podem deletar projetos" ON projects;
CREATE POLICY "Apenas admins podem deletar projetos"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 5. POLICIES PARA TASKS
-- =====================================================

DROP POLICY IF EXISTS "Tarefas visíveis para todos" ON tasks;
CREATE POLICY "Tarefas visíveis para todos"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários podem criar tarefas" ON tasks;
CREATE POLICY "Usuários podem criar tarefas"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permissão para atualizar tarefas" ON tasks;
CREATE POLICY "Permissão para atualizar tarefas"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    tasks.created_by = auth.uid()
    OR tasks.assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM task_members
      WHERE task_members.task_id = tasks.id
      AND task_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Permissão para deletar tarefas" ON tasks;
CREATE POLICY "Permissão para deletar tarefas"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    tasks.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- 6. POLICIES PARA TASK_CHECKLIST
-- =====================================================

DROP POLICY IF EXISTS "Checklists visíveis para todos" ON task_checklist;
CREATE POLICY "Checklists visíveis para todos"
  ON task_checklist FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários com acesso podem criar checklist" ON task_checklist;
CREATE POLICY "Usuários com acesso podem criar checklist"
  ON task_checklist FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_checklist.task_id
      AND (
        tasks.created_by = auth.uid()
        OR tasks.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM task_members
          WHERE task_members.task_id = tasks.id
          AND task_members.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Usuários com acesso podem atualizar checklist" ON task_checklist;
CREATE POLICY "Usuários com acesso podem atualizar checklist"
  ON task_checklist FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_checklist.task_id
      AND (
        tasks.created_by = auth.uid()
        OR tasks.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM task_members
          WHERE task_members.task_id = tasks.id
          AND task_members.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Usuários com acesso podem deletar checklist" ON task_checklist;
CREATE POLICY "Usuários com acesso podem deletar checklist"
  ON task_checklist FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_checklist.task_id
      AND (
        tasks.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
        )
      )
    )
  );

-- =====================================================
-- 7. POLICIES PARA TASK_MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "Membros de tarefas visíveis para todos" ON task_members;
CREATE POLICY "Membros de tarefas visíveis para todos"
  ON task_members FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários com acesso podem adicionar membros" ON task_members;
CREATE POLICY "Usuários com acesso podem adicionar membros"
  ON task_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_members.task_id
      AND (
        tasks.created_by = auth.uid()
        OR tasks.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Usuários com acesso podem remover membros" ON task_members;
CREATE POLICY "Usuários com acesso podem remover membros"
  ON task_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_members.task_id
      AND (
        tasks.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
        )
      )
    )
  );

-- =====================================================
-- 8. POLICIES PARA TASK_COMMENTS
-- =====================================================

DROP POLICY IF EXISTS "Comentários visíveis para todos" ON task_comments;
CREATE POLICY "Comentários visíveis para todos"
  ON task_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários podem criar comentários" ON task_comments;
CREATE POLICY "Usuários podem criar comentários"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários podem atualizar seus comentários" ON task_comments;
CREATE POLICY "Usuários podem atualizar seus comentários"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (task_comments.user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem deletar seus comentários" ON task_comments;
CREATE POLICY "Usuários podem deletar seus comentários"
  ON task_comments FOR DELETE
  TO authenticated
  USING (
    task_comments.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 9. POLICIES PARA EVENTS
-- =====================================================

DROP POLICY IF EXISTS "Eventos visíveis para todos" ON events;
CREATE POLICY "Eventos visíveis para todos"
  ON events FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários podem criar eventos" ON events;
CREATE POLICY "Usuários podem criar eventos"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permissão para atualizar eventos" ON events;
CREATE POLICY "Permissão para atualizar eventos"
  ON events FOR UPDATE
  TO authenticated
  USING (
    events.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM event_participants
      WHERE event_participants.event_id = events.id
      AND event_participants.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Permissão para deletar eventos" ON events;
CREATE POLICY "Permissão para deletar eventos"
  ON events FOR DELETE
  TO authenticated
  USING (
    events.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- 10. POLICIES PARA EVENT_PARTICIPANTS
-- =====================================================

DROP POLICY IF EXISTS "Participantes visíveis para todos" ON event_participants;
CREATE POLICY "Participantes visíveis para todos"
  ON event_participants FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Criadores podem adicionar participantes" ON event_participants;
CREATE POLICY "Criadores podem adicionar participantes"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND (
        events.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Criadores podem remover participantes" ON event_participants;
CREATE POLICY "Criadores podem remover participantes"
  ON event_participants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND (
        events.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'manager')
        )
      )
    )
  );

-- =====================================================
-- 11. POLICIES PARA FILES
-- =====================================================

DROP POLICY IF EXISTS "Arquivos visíveis para usuários autenticados" ON files;
CREATE POLICY "Arquivos visíveis para usuários autenticados"
  ON files FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários podem fazer upload de arquivos" ON files;
CREATE POLICY "Usuários podem fazer upload de arquivos"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permissão para deletar arquivos" ON files;
CREATE POLICY "Permissão para deletar arquivos"
  ON files FOR DELETE
  TO authenticated
  USING (
    files.uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 12. POLICIES PARA KANBAN_COLUMNS
-- =====================================================

DROP POLICY IF EXISTS "Colunas kanban visíveis para todos" ON kanban_columns;
CREATE POLICY "Colunas kanban visíveis para todos"
  ON kanban_columns FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Apenas admins gerenciam colunas" ON kanban_columns;
CREATE POLICY "Apenas admins gerenciam colunas"
  ON kanban_columns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 13. POLICIES PARA ACTIVITY_LOG
-- =====================================================

DROP POLICY IF EXISTS "Activity log visível para todos" ON activity_log;
CREATE POLICY "Activity log visível para todos"
  ON activity_log FOR SELECT
  TO authenticated
  USING (true);

-- Não permitir INSERT, UPDATE ou DELETE manual
-- Os logs são criados apenas pelos triggers

-- =====================================================
-- RLS POLICIES CONFIGURADAS! ✅
-- =====================================================
