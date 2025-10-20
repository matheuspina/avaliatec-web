-- =====================================================
-- AVALIATEC - RLS POLICIES FOR WRITE OPERATIONS
-- Complete RLS policies with permission checks
-- =====================================================

-- =====================================================
-- 1. UPDATE PROJECTS WRITE POLICIES
-- =====================================================

-- Users can create projects if they have create permission
DROP POLICY IF EXISTS "Usuários podem criar projetos" ON projects;
CREATE POLICY "Users can create projects with permission"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR has_permission(auth.uid(), 'projetos', 'create')
  );

-- Users can update projects if they have edit permission and are assigned
DROP POLICY IF EXISTS "Permissão para atualizar projetos" ON projects;
CREATE POLICY "Users can update assigned projects with permission"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'projetos', 'edit')
      AND (
        auth.uid() = ANY(team_members)
        OR created_by = auth.uid()
        OR assigned_to = auth.uid()
      )
    )
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'projetos', 'edit')
      AND (
        auth.uid() = ANY(team_members)
        OR created_by = auth.uid()
        OR assigned_to = auth.uid()
      )
    )
  );

-- Users can delete projects if they have delete permission
DROP POLICY IF EXISTS "Apenas admins podem deletar projetos" ON projects;
CREATE POLICY "Users can delete projects with permission"
  ON projects FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'projetos', 'delete')
      AND (
        auth.uid() = ANY(team_members)
        OR created_by = auth.uid()
      )
    )
  );

-- =====================================================
-- 2. UPDATE TASKS WRITE POLICIES
-- =====================================================

-- Users can create tasks if they have create permission
DROP POLICY IF EXISTS "Usuários podem criar tarefas" ON tasks;
CREATE POLICY "Users can create tasks with permission"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR has_permission(auth.uid(), 'kanban', 'create')
  );

-- Users can update tasks if they have edit permission and are watching/assigned
DROP POLICY IF EXISTS "Permissão para atualizar tarefas" ON tasks;
CREATE POLICY "Users can update assigned tasks with permission"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'kanban', 'edit')
      AND (
        auth.uid() = ANY(watchers)
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM task_members tm
          WHERE tm.task_id = tasks.id
          AND tm.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'kanban', 'edit')
      AND (
        auth.uid() = ANY(watchers)
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM task_members tm
          WHERE tm.task_id = tasks.id
          AND tm.user_id = auth.uid()
        )
      )
    )
  );

-- Users can delete tasks if they have delete permission
DROP POLICY IF EXISTS "Permissão para deletar tarefas" ON tasks;
CREATE POLICY "Users can delete tasks with permission"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'kanban', 'delete')
      AND (
        created_by = auth.uid()
        OR auth.uid() = ANY(watchers)
      )
    )
  );

-- =====================================================
-- 3. UPDATE CLIENTS WRITE POLICIES
-- =====================================================

-- Users can create clients if they have create permission
DROP POLICY IF EXISTS "Usuários podem criar clientes" ON clients;
CREATE POLICY "Users can create clients with permission"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR has_permission(auth.uid(), 'clientes', 'create')
  );

-- Users can update clients if they have edit permission and are assigned
DROP POLICY IF EXISTS "Admins e criador podem atualizar clientes" ON clients;
CREATE POLICY "Users can update assigned clients with permission"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'clientes', 'edit')
      AND (
        auth.uid() = ANY(assigned_users)
        OR created_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'clientes', 'edit')
      AND (
        auth.uid() = ANY(assigned_users)
        OR created_by = auth.uid()
      )
    )
  );

-- Users can delete clients if they have delete permission
DROP POLICY IF EXISTS "Apenas admins podem deletar clientes" ON clients;
CREATE POLICY "Users can delete clients with permission"
  ON clients FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'clientes', 'delete')
      AND (
        auth.uid() = ANY(assigned_users)
        OR created_by = auth.uid()
      )
    )
  );

-- =====================================================
-- 4. UPDATE EVENTS WRITE POLICIES
-- =====================================================

-- Users can create events if they have create permission
DROP POLICY IF EXISTS "Usuários podem criar eventos" ON events;
CREATE POLICY "Users can create events with permission"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR has_permission(auth.uid(), 'agenda', 'create')
  );

-- Users can update events if they have edit permission and are participating
DROP POLICY IF EXISTS "Permissão para atualizar eventos" ON events;
CREATE POLICY "Users can update their events with permission"
  ON events FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'agenda', 'edit')
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_participants ep
          WHERE ep.event_id = events.id
          AND ep.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'agenda', 'edit')
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM event_participants ep
          WHERE ep.event_id = events.id
          AND ep.user_id = auth.uid()
        )
      )
    )
  );

-- Users can delete events if they have delete permission
DROP POLICY IF EXISTS "Permissão para deletar eventos" ON events;
CREATE POLICY "Users can delete events with permission"
  ON events FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'agenda', 'delete')
      AND created_by = auth.uid()
    )
  );

-- =====================================================
-- 5. UPDATE FILES WRITE POLICIES
-- =====================================================

-- Users can upload files if they have create permission on arquivos
DROP POLICY IF EXISTS "Usuários podem fazer upload de arquivos" ON files;
CREATE POLICY "Users can upload files with permission"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'arquivos', 'create')
      AND EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = files.project_id
        AND (
          auth.uid() = ANY(p.team_members)
          OR p.created_by = auth.uid()
          OR p.assigned_to = auth.uid()
        )
      )
    )
  );

-- Users can delete files if they have delete permission
DROP POLICY IF EXISTS "Permissão para deletar arquivos" ON files;
CREATE POLICY "Users can delete files with permission"
  ON files FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'arquivos', 'delete')
      AND (
        uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = files.project_id
          AND (
            auth.uid() = ANY(p.team_members)
            OR p.created_by = auth.uid()
          )
        )
      )
    )
  );

-- =====================================================
-- 6. UPDATE RELATED TABLES POLICIES
-- =====================================================

-- Task Checklist: Respect task permissions
DROP POLICY IF EXISTS "Usuários com acesso podem criar checklist" ON task_checklist;
CREATE POLICY "Users can create checklist with task access"
  ON task_checklist FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'kanban', 'edit')
      AND EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_checklist.task_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR auth.uid() = ANY(t.watchers)
          OR EXISTS (
            SELECT 1 FROM task_members tm
            WHERE tm.task_id = t.id
            AND tm.user_id = auth.uid()
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Usuários com acesso podem atualizar checklist" ON task_checklist;
CREATE POLICY "Users can update checklist with task access"
  ON task_checklist FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'kanban', 'edit')
      AND EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_checklist.task_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR auth.uid() = ANY(t.watchers)
          OR EXISTS (
            SELECT 1 FROM task_members tm
            WHERE tm.task_id = t.id
            AND tm.user_id = auth.uid()
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Usuários com acesso podem deletar checklist" ON task_checklist;
CREATE POLICY "Users can delete checklist with task access"
  ON task_checklist FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'kanban', 'delete')
      AND EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_checklist.task_id
        AND t.created_by = auth.uid()
      )
    )
  );

-- Task Members: Respect task permissions
DROP POLICY IF EXISTS "Usuários com acesso podem adicionar membros" ON task_members;
CREATE POLICY "Users can add members with task access"
  ON task_members FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'kanban', 'edit')
      AND EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_members.task_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR auth.uid() = ANY(t.watchers)
        )
      )
    )
  );

DROP POLICY IF EXISTS "Usuários com acesso podem remover membros" ON task_members;
CREATE POLICY "Users can remove members with task access"
  ON task_members FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'kanban', 'edit')
      AND EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_members.task_id
        AND (
          t.created_by = auth.uid()
          OR auth.uid() = ANY(t.watchers)
        )
      )
    )
  );

-- Task Comments: Respect task permissions
DROP POLICY IF EXISTS "Usuários podem criar comentários" ON task_comments;
CREATE POLICY "Users can create comments with task access"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'kanban', 'view')
      AND EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.id = task_comments.task_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR auth.uid() = ANY(t.watchers)
          OR EXISTS (
            SELECT 1 FROM task_members tm
            WHERE tm.task_id = t.id
            AND tm.user_id = auth.uid()
          )
        )
      )
    )
  );

-- Event Participants: Respect event permissions
DROP POLICY IF EXISTS "Criadores podem adicionar participantes" ON event_participants;
CREATE POLICY "Users can add participants with event access"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'agenda', 'edit')
      AND EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_participants.event_id
        AND e.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Criadores podem remover participantes" ON event_participants;
CREATE POLICY "Users can remove participants with event access"
  ON event_participants FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR (
      has_permission(auth.uid(), 'agenda', 'edit')
      AND EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_participants.event_id
        AND e.created_by = auth.uid()
      )
    )
  );

-- =====================================================
-- WRITE OPERATIONS RLS POLICIES COMPLETE! ✅
-- =====================================================
-- 
-- Summary:
-- - Updated INSERT policies for projects, tasks, clients, events, files
-- - Updated UPDATE policies with permission checks
-- - Updated DELETE policies with permission checks
-- - Updated related tables (task_checklist, task_members, task_comments, event_participants)
-- - All policies now use has_permission() and is_admin() helper functions
-- - Content filtering ensures users only modify data they have access to
-- 
-- =====================================================
