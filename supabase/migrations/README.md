# Migrations do AvaliaTec

Este diretório contém todas as migrations SQL para o banco de dados do AvaliaTec no Supabase.

## Ordem de Execução

As migrations devem ser executadas na seguinte ordem:

1. **001_initial_schema.sql** - Schema inicial (tabelas, índices, funções, triggers, views)
2. **002_rls_policies.sql** - Row Level Security policies para todas as tabelas
3. **003_storage.sql** - Configuração do storage bucket e policies
4. **004_fix_events_schema.sql** - Correção do schema da tabela events (se necessário)

## Como Aplicar as Migrations

### Método 1: Via Supabase Dashboard (Manual)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para "SQL Editor" no menu lateral
4. Para cada migration:
   - Crie uma nova query
   - Copie e cole o conteúdo do arquivo SQL
   - Execute a query (clique em "Run")
   - Verifique se não há erros

### Método 2: Via Supabase CLI (Recomendado)

Se você ainda não tem o Supabase CLI instalado:

```bash
# Instalar CLI globalmente
npm install -g supabase

# Ou via npx (sem instalação global)
npx supabase --help
```

Para aplicar as migrations:

```bash
# 1. Fazer login no Supabase
supabase login

# 2. Link ao projeto (você precisará do project ref)
supabase link --project-ref seu-project-ref

# 3. Aplicar todas as migrations
supabase db push

# 4. Verificar status
supabase db remote status
```

### Método 3: Script Automatizado

Criamos um script helper que você pode executar:

```bash
npm run db:push
```

(Este comando está configurado no package.json se você tiver o Supabase CLI instalado)

## Descrição das Migrations

### 001_initial_schema.sql

Cria toda a estrutura inicial do banco de dados:

**Tabelas:**
- `profiles` - Perfis de usuários (extensão de auth.users)
- `clients` - Clientes (empresas/pessoas físicas)
- `projects` - Projetos de avaliação
- `tasks` - Tarefas dos projetos
- `task_checklist` - Checklist items das tarefas
- `task_members` - Membros atribuídos às tarefas
- `task_comments` - Comentários nas tarefas
- `events` - Eventos da agenda (reuniões, prazos, visitas)
- `event_participants` - Participantes dos eventos
- `files` - Arquivos anexados aos projetos
- `kanban_columns` - Colunas do kanban
- `activity_log` - Log de atividades do sistema

**Funções:**
- `update_updated_at_column()` - Atualiza updated_at automaticamente
- `create_profile_for_user()` - Cria perfil quando usuário é criado
- `log_activity()` - Registra atividades no log
- `set_project_completed_at()` - Define data de conclusão de projetos
- `reorder_task_positions()` - Reordena posições das tarefas

**Views:**
- `v_project_stats` - Estatísticas dos projetos
- `v_upcoming_deadlines` - Prazos próximos
- `v_user_workload` - Carga de trabalho dos usuários

**Triggers:**
- Triggers de updated_at em todas as tabelas relevantes
- Trigger de criação automática de perfil
- Triggers de log de atividades
- Trigger de completed_at em projetos
- Trigger de reordenação de tarefas

### 002_rls_policies.sql

Configura Row Level Security (RLS) para todas as tabelas:

- Habilita RLS em todas as tabelas
- Cria policies de SELECT, INSERT, UPDATE, DELETE
- Define permissões baseadas em roles (admin, manager, user)
- Garante que usuários só vejam/editem dados apropriados

### 003_storage.sql

Configura o bucket de storage para arquivos:

- Cria bucket `project-files`
- Configura policies para upload/download de arquivos
- Define estrutura de pastas recomendada
- Garante que usuários só acessem seus próprios arquivos

### 004_fix_events_schema.sql

Correção do schema da tabela events:

**Problema:** A tabela pode ter sido criada com colunas `start_time`/`end_time` ao invés de `event_date`/`event_time`.

**Solução:**
- Detecta automaticamente o schema atual
- Migra dados se necessário
- Garante que o schema final seja:
  - `event_date` (DATE NOT NULL)
  - `event_time` (TIME NOT NULL)

**Quando executar:** Só é necessário se você receber o erro:
```
null value in column "start_time" of relation "events" violates not-null constraint
```

## Verificação Pós-Migration

Após aplicar todas as migrations, você pode verificar se está tudo correto:

```sql
-- Verificar todas as tabelas
SELECT tablename
FROM pg_catalog.pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar schema da tabela events
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Verificar policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Troubleshooting

### Erro: "relation already exists"

Se você receber esse erro, significa que a tabela já existe. Você pode:
1. Dropar a tabela e recriar (CUIDADO: perderá dados)
2. Pular essa parte da migration
3. Usar `CREATE TABLE IF NOT EXISTS`

### Erro: "permission denied"

Certifique-se de que você está executando as migrations com permissões de administrador do banco.

### Erro: "function does not exist"

Algumas funções dependem de outras. Certifique-se de executar as migrations na ordem correta.

## Backup

Antes de executar migrations em produção, sempre faça backup:

```bash
# Via Supabase CLI
supabase db dump --file backup.sql

# Via pg_dump (se você tem acesso direto)
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

## Rollback

Se algo der errado, você pode fazer rollback:

1. Restaurar backup
2. Executar comandos SQL inversos (DROP TABLE, DROP POLICY, etc.)
3. Verificar logs do Supabase para identificar o problema

## Mais Informações

- [Documentação do Supabase CLI](https://supabase.com/docs/guides/cli)
- [Migrations no Supabase](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- Veja também: `/docs/FIX_EVENTS_SCHEMA.md` para detalhes sobre o problema da tabela events
