# Supabase Database Schema - AvaliaTec

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tabelas](#tabelas)
3. [Relacionamentos](#relacionamentos)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Storage Buckets](#storage-buckets)
6. [Edge Functions](#edge-functions)
7. [Views](#views)
8. [Triggers e Functions](#triggers-e-functions)
9. [Índices](#índices)
10. [Migration Scripts](#migration-scripts)

---

## 🎯 Visão Geral

O sistema AvaliaTec é uma plataforma de gestão para empresas de avaliação patrimonial e perícia técnica. O banco de dados foi projetado para suportar:

- Gestão de clientes (empresas e pessoas físicas)
- Gerenciamento de projetos de avaliação
- Sistema Kanban para tarefas
- Agenda de compromissos e prazos
- Armazenamento de arquivos e documentos
- Controle de acesso baseado em permissões

---

## 📊 Tabelas

### 1. `profiles`

Extensão da tabela `auth.users` do Supabase para armazenar informações adicionais dos usuários.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos:**
- `id` - UUID do usuário (mesmo da auth.users)
- `full_name` - Nome completo do usuário
- `avatar_url` - URL da foto de perfil
- `role` - Papel do usuário (admin, manager, user)
- `created_at` - Data de criação
- `updated_at` - Data da última atualização

---

### 2. `clients`

Armazena informações dos clientes (empresas ou pessoas físicas).

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT NOT NULL UNIQUE, -- CNPJ ou CPF
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'company' CHECK (type IN ('company', 'individual')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos:**
- `id` - Identificador único
- `name` - Razão Social ou Nome Completo
- `document` - CNPJ ou CPF (único)
- `email` - Email de contato
- `phone` - Telefone
- `address` - Endereço completo
- `type` - Tipo de cliente (company/individual)
- `notes` - Observações adicionais
- `created_by` - Usuário que cadastrou
- `created_at/updated_at` - Timestamps

---

### 3. `projects`

Gerencia os projetos de avaliação e perícia.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- Ex: AV-2024-001
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE RESTRICT NOT NULL,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (
    status IN ('backlog', 'todo', 'in_progress', 'review', 'done')
  ),
  deadline DATE NOT NULL,
  estimated_value DECIMAL(12, 2),
  actual_value DECIMAL(12, 2),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Campos:**
- `id` - Identificador único
- `code` - Código do projeto (único, ex: AV-2024-001)
- `title` - Título do projeto
- `description` - Descrição detalhada
- `client_id` - Cliente relacionado
- `status` - Status do projeto (backlog, todo, in_progress, review, done)
- `deadline` - Prazo de entrega
- `estimated_value` - Valor estimado
- `actual_value` - Valor real cobrado
- `assigned_to` - Responsável principal
- `created_by` - Criador do projeto
- `completed_at` - Data de conclusão

---

### 4. `tasks`

Sistema Kanban para gestão de tarefas.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (
    status IN ('backlog', 'todo', 'in_progress', 'review', 'done')
  ),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  deadline DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  labels TEXT[] DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0, -- Para ordenação no Kanban
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos:**
- `id` - Identificador único
- `title` - Título da tarefa
- `description` - Descrição
- `project_id` - Projeto relacionado (opcional)
- `status` - Coluna do Kanban
- `priority` - Prioridade (low, medium, high, urgent)
- `deadline` - Prazo
- `assigned_to` - Responsável
- `labels` - Array de etiquetas
- `position` - Posição na coluna (para drag and drop)

---

### 5. `task_checklist`

Checklists dentro das tarefas.

```sql
CREATE TABLE task_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 6. `task_members`

Membros atribuídos a tarefas (many-to-many).

```sql
CREATE TABLE task_members (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);
```

---

### 7. `task_comments`

Comentários nas tarefas.

```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 8. `events`

Eventos da agenda (reuniões, vistorias, prazos).

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location TEXT,
  type TEXT NOT NULL CHECK (type IN ('meeting', 'deadline', 'visit')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos:**
- `id` - Identificador único
- `title` - Título do evento
- `description` - Descrição
- `event_date` - Data do evento
- `event_time` - Horário
- `location` - Local
- `type` - Tipo (meeting, deadline, visit)
- `client_id` - Cliente relacionado (opcional)
- `project_id` - Projeto relacionado (opcional)

---

### 9. `event_participants`

Participantes de eventos (many-to-many).

```sql
CREATE TABLE event_participants (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);
```

---

### 10. `files`

Metadados dos arquivos armazenados.

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- pdf, image, doc, other
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL, -- Caminho no Supabase Storage
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos:**
- `id` - Identificador único
- `name` - Nome exibido
- `original_name` - Nome original do arquivo
- `file_type` - Categoria (pdf, image, doc, other)
- `mime_type` - MIME type
- `size_bytes` - Tamanho em bytes
- `storage_path` - Caminho no bucket do Supabase Storage
- `project_id` - Projeto relacionado (opcional)
- `uploaded_by` - Quem fez upload

---

### 11. `kanban_columns`

Colunas customizáveis do Kanban.

```sql
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status_key TEXT NOT NULL UNIQUE, -- backlog, todo, in_progress, etc
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Dados Iniciais:**
```sql
INSERT INTO kanban_columns (title, status_key, position, color) VALUES
  ('Backlog', 'backlog', 0, '#6b7280'),
  ('A Fazer', 'todo', 1, '#3b82f6'),
  ('Em Progresso', 'in_progress', 2, '#f59e0b'),
  ('Revisão', 'review', 3, '#8b5cf6'),
  ('Concluído', 'done', 4, '#10b981');
```

---

### 12. `activity_log`

Log de atividades do sistema.

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- created, updated, deleted, etc
  entity_type TEXT NOT NULL, -- client, project, task, etc
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🔗 Relacionamentos

### Diagrama de Relacionamentos

```
profiles (users)
  ├── 1:N → clients (created_by)
  ├── 1:N → projects (created_by, assigned_to)
  ├── 1:N → tasks (created_by, assigned_to)
  ├── N:M → tasks (task_members)
  ├── 1:N → task_comments
  ├── 1:N → events (created_by)
  ├── N:M → events (event_participants)
  └── 1:N → files (uploaded_by)

clients
  ├── 1:N → projects
  └── 1:N → events

projects
  ├── 1:N → tasks
  ├── 1:N → events
  └── 1:N → files

tasks
  ├── 1:N → task_checklist
  ├── N:M → profiles (task_members)
  └── 1:N → task_comments
```

---

## 🔒 Row Level Security (RLS)

### Habilitando RLS

```sql
-- Habilitar RLS em todas as tabelas
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
```

### Policies

#### Profiles

```sql
-- Usuários podem ver todos os perfis
CREATE POLICY "Profiles são visíveis para usuários autenticados"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

#### Clients

```sql
-- Todos podem visualizar clientes
CREATE POLICY "Clientes visíveis para todos"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

-- Todos podem criar clientes
CREATE POLICY "Usuários podem criar clientes"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Apenas admins e criador podem atualizar
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

-- Apenas admins podem deletar
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
```

#### Projects

```sql
-- Todos podem visualizar projetos
CREATE POLICY "Projetos visíveis para todos"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

-- Todos podem criar projetos
CREATE POLICY "Usuários podem criar projetos"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins, managers e responsável podem atualizar
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

-- Apenas admins podem deletar
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
```

#### Tasks

```sql
-- Todos podem visualizar tarefas
CREATE POLICY "Tarefas visíveis para todos"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

-- Todos podem criar tarefas
CREATE POLICY "Usuários podem criar tarefas"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários podem atualizar tarefas que criaram ou estão atribuídas a eles
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

-- Criador, admin ou manager podem deletar
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
```

#### Task Checklist, Members, Comments

```sql
-- Visíveis para todos
CREATE POLICY "Checklists visíveis para todos"
  ON task_checklist FOR SELECT
  TO authenticated
  USING (true);

-- Podem criar se tiverem acesso à tarefa
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

-- Similar para UPDATE e DELETE...

-- Políticas similares para task_members e task_comments
```

#### Events

```sql
-- Todos podem visualizar eventos
CREATE POLICY "Eventos visíveis para todos"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Todos podem criar eventos
CREATE POLICY "Usuários podem criar eventos"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criador ou participantes podem atualizar
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
```

#### Files

```sql
-- Arquivos relacionados a projetos visíveis para todos
CREATE POLICY "Arquivos visíveis para usuários autenticados"
  ON files FOR SELECT
  TO authenticated
  USING (true);

-- Todos podem fazer upload
CREATE POLICY "Usuários podem fazer upload de arquivos"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Apenas quem fez upload ou admins podem deletar
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
```

#### Kanban Columns

```sql
-- Colunas visíveis para todos
CREATE POLICY "Colunas kanban visíveis para todos"
  ON kanban_columns FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem gerenciar colunas
CREATE POLICY "Apenas admins gerenciam colunas"
  ON kanban_columns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

---

## 📦 Storage Buckets

### Bucket: `project-files`

Armazena arquivos relacionados a projetos.

```sql
-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false);
```

### Políticas de Storage

```sql
-- Usuários autenticados podem ver arquivos
CREATE POLICY "Usuários podem visualizar arquivos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-files');

-- Usuários autenticados podem fazer upload
CREATE POLICY "Usuários podem fazer upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-files');

-- Usuários podem deletar seus próprios uploads
CREATE POLICY "Usuários podem deletar seus uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND owner = auth.uid()
  );
```

---

## ⚡ Edge Functions

### 1. `send-notification`

Envia notificações quando tarefas são atribuídas ou deadlines se aproximam.

```typescript
// supabase/functions/send-notification/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { type, userId, message } = await req.json()

  // Lógica para enviar notificação (email, push, etc)

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

### 2. `generate-project-code`

Gera código automático para novos projetos (AV-2024-XXX).

```typescript
// supabase/functions/generate-project-code/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Buscar o último projeto do ano
  const year = new Date().getFullYear()
  const { data } = await supabase
    .from('projects')
    .select('code')
    .like('code', `AV-${year}-%`)
    .order('code', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (data && data.length > 0) {
    const lastCode = data[0].code
    const lastNumber = parseInt(lastCode.split('-')[2])
    nextNumber = lastNumber + 1
  }

  const newCode = `AV-${year}-${String(nextNumber).padStart(3, '0')}`

  return new Response(
    JSON.stringify({ code: newCode }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

### 3. `export-project-report`

Gera relatório em PDF de um projeto.

```typescript
// supabase/functions/export-project-report/index.ts
// Utiliza biblioteca de geração de PDF para criar relatório completo
```

---

## 📊 Views

### `v_project_stats`

View com estatísticas dos projetos.

```sql
CREATE OR REPLACE VIEW v_project_stats AS
SELECT
  p.id,
  p.code,
  p.title,
  p.status,
  p.deadline,
  c.name as client_name,
  pr.full_name as assigned_to_name,
  COUNT(DISTINCT t.id) as task_count,
  COUNT(DISTINCT f.id) as file_count,
  COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN profiles pr ON p.assigned_to = pr.id
LEFT JOIN tasks t ON t.project_id = p.id
LEFT JOIN files f ON f.project_id = p.id
GROUP BY p.id, c.name, pr.full_name;
```

### `v_upcoming_deadlines`

View com prazos próximos (7 dias).

```sql
CREATE OR REPLACE VIEW v_upcoming_deadlines AS
SELECT
  'project' as type,
  p.id,
  p.code as identifier,
  p.title,
  p.deadline as due_date,
  p.assigned_to as user_id,
  pr.full_name as user_name
FROM projects p
LEFT JOIN profiles pr ON p.assigned_to = pr.id
WHERE p.deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND p.status != 'done'

UNION ALL

SELECT
  'task' as type,
  t.id,
  COALESCE(pr.code, 'N/A') as identifier,
  t.title,
  t.deadline as due_date,
  t.assigned_to as user_id,
  pf.full_name as user_name
FROM tasks t
LEFT JOIN projects pr ON t.project_id = pr.id
LEFT JOIN profiles pf ON t.assigned_to = pf.id
WHERE t.deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND t.status != 'done'

ORDER BY due_date ASC;
```

### `v_user_workload`

View com carga de trabalho dos usuários.

```sql
CREATE OR REPLACE VIEW v_user_workload AS
SELECT
  pr.id,
  pr.full_name,
  COUNT(DISTINCT p.id) as active_projects,
  COUNT(DISTINCT t.id) as active_tasks,
  COUNT(DISTINCT e.id) as upcoming_events
FROM profiles pr
LEFT JOIN projects p ON p.assigned_to = pr.id AND p.status IN ('in_progress', 'review')
LEFT JOIN tasks t ON t.assigned_to = pr.id AND t.status IN ('in_progress', 'review')
LEFT JOIN event_participants ep ON ep.user_id = pr.id
LEFT JOIN events e ON e.id = ep.event_id AND e.event_date >= CURRENT_DATE
GROUP BY pr.id, pr.full_name;
```

---

## 🔧 Triggers e Functions

### 1. Atualizar `updated_at` automaticamente

```sql
-- Function genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Criar perfil automaticamente ao criar usuário

```sql
-- Trigger para criar perfil quando novo usuário se registra
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();
```

### 3. Log de atividades

```sql
-- Function para registrar atividades
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  entity_type TEXT;
BEGIN
  -- Determinar tipo de ação
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
  END IF;

  -- Determinar tipo de entidade
  entity_type := TG_TABLE_NAME;

  -- Inserir log
  INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    action_type,
    entity_type,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar em tabelas importantes
CREATE TRIGGER log_projects_activity
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_tasks_activity
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_clients_activity
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();
```

### 4. Atualizar `completed_at` quando projeto é concluído

```sql
CREATE OR REPLACE FUNCTION set_project_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_completion_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_completed_at();
```

### 5. Reordenar posições no Kanban

```sql
CREATE OR REPLACE FUNCTION reorder_task_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando status muda, ajustar posições
  IF NEW.status != OLD.status THEN
    -- Colocar no final da nova coluna
    SELECT COALESCE(MAX(position), -1) + 1
    INTO NEW.position
    FROM tasks
    WHERE status = NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_position_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION reorder_task_positions();
```

---

## 📌 Índices

Índices para otimizar consultas frequentes:

```sql
-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);

-- Clients
CREATE INDEX idx_clients_document ON clients(document);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

-- Projects
CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_projects_assigned_to ON projects(assigned_to);

-- Tasks
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_position ON tasks(status, position);

-- Task Checklist
CREATE INDEX idx_task_checklist_task_id ON task_checklist(task_id);

-- Task Members
CREATE INDEX idx_task_members_task_id ON task_members(task_id);
CREATE INDEX idx_task_members_user_id ON task_members(user_id);

-- Task Comments
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at DESC);

-- Events
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_project_id ON events(project_id);

-- Event Participants
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);

-- Files
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_created_at ON files(created_at DESC);

-- Activity Log
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
```

---

## 🚀 Migration Scripts

### Script Completo de Criação

```sql
-- =====================================================
-- AVALIATEC - MIGRATION SCRIPT COMPLETO
-- =====================================================

-- 1. Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca fuzzy

-- 2. Criar tabelas (na ordem de dependências)

-- Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'company' CHECK (type IN ('company', 'individual')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE RESTRICT NOT NULL,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (
    status IN ('backlog', 'todo', 'in_progress', 'review', 'done')
  ),
  deadline DATE NOT NULL,
  estimated_value DECIMAL(12, 2),
  actual_value DECIMAL(12, 2),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (
    status IN ('backlog', 'todo', 'in_progress', 'review', 'done')
  ),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  deadline DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  labels TEXT[] DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task Checklist
CREATE TABLE task_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task Members
CREATE TABLE task_members (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- Task Comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location TEXT,
  type TEXT NOT NULL CHECK (type IN ('meeting', 'deadline', 'visit')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event Participants
CREATE TABLE event_participants (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kanban Columns
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status_key TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Inserir dados iniciais do Kanban
INSERT INTO kanban_columns (title, status_key, position, color) VALUES
  ('Backlog', 'backlog', 0, '#6b7280'),
  ('A Fazer', 'todo', 1, '#3b82f6'),
  ('Em Progresso', 'in_progress', 2, '#f59e0b'),
  ('Revisão', 'review', 3, '#8b5cf6'),
  ('Concluído', 'done', 4, '#10b981');

-- 4. Criar índices (ver seção de Índices acima)

-- 5. Criar functions e triggers (ver seção de Triggers acima)

-- 6. Habilitar RLS (ver seção de RLS acima)

-- 7. Criar views (ver seção de Views acima)

-- 8. Configurar Storage (via dashboard ou API)
```

---

## 📝 Notas Adicionais

### Boas Práticas

1. **Sempre usar RLS**: Nunca desabilitar Row Level Security em produção
2. **Validação no Cliente e Servidor**: Validar dados tanto no frontend quanto com constraints SQL
3. **Backup Regular**: Configurar backups automáticos no Supabase
4. **Monitoramento**: Usar Supabase Dashboard para monitorar queries lentas
5. **Versionamento**: Manter migrations versionadas e documentadas

### Performance

- Índices já estão otimizados para queries mais comuns
- Views materializa das podem ser criadas para reports pesados
- Usar paginação em todas as listagens
- Implementar caching quando apropriado

### Segurança

- RLS protege acesso aos dados
- Storage policies protegem arquivos
- Service Role Key nunca deve ser exposta no frontend
- Usar JWT para autenticação

---

## 📞 Próximos Passos

1. Executar migration no Supabase
2. Configurar Storage Buckets
3. Deploy das Edge Functions
4. Testar todas as RLS policies
5. Popular banco com dados de teste
6. Integrar com frontend Next.js
7. Configurar webhooks e notificações

---

**Documentação criada para: AvaliaTec - Sistema de Gestão de Avaliações Patrimoniais**
**Versão: 1.0.0**
**Data: 2025**
