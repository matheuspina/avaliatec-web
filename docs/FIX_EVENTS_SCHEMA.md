# Correção do Schema da Tabela Events

## Problema Identificado

O erro que você está enfrentando:
```
{
  "code": "23502",
  "details": null,
  "hint": null,
  "message": "null value in column \"start_time\" of relation \"events\" violates not-null constraint"
}
```

Indica que a tabela `events` no seu Supabase tem uma coluna chamada `start_time`, mas o código da aplicação está tentando inserir dados usando as colunas `event_date` e `event_time`.

## Causa do Problema

Há uma inconsistência entre:
- **Schema nas migrations**: Define `event_date` (DATE) e `event_time` (TIME)
- **Schema real no Supabase**: Tem uma coluna `start_time` (possivelmente TIMESTAMP)

Isso acontece quando a tabela foi criada manualmente no Supabase antes das migrations serem executadas, ou quando o schema foi modificado diretamente no dashboard.

## Solução

### Opção 1: Corrigir via SQL Editor do Supabase (RECOMENDADO)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto AvaliaTec
3. Vá para "SQL Editor" no menu lateral
4. Crie uma nova query e cole o conteúdo do arquivo: `/supabase/migrations/004_fix_events_schema.sql`
5. Execute a query (clique em "Run")
6. Você verá uma mensagem de sucesso confirmando a correção

A migration faz o seguinte:
- ✅ Detecta se a coluna `start_time` existe
- ✅ Cria as colunas `event_date` e `event_time` se não existirem
- ✅ Migra os dados existentes de `start_time` para as novas colunas
- ✅ Remove a coluna `start_time`
- ✅ Remove a coluna `end_time` se existir
- ✅ Atualiza os índices

### Opção 2: Verificar o Schema Atual Primeiro

Se você quiser verificar o schema atual antes de fazer mudanças:

1. No SQL Editor do Supabase, execute:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

2. Você verá todas as colunas da tabela `events`. Anote quais colunas existem.

### Opção 3: Recriar a Tabela (Apenas se não houver dados importantes)

Se você não tem dados importantes na tabela events ainda:

1. No SQL Editor, execute:
```sql
-- Backup dos dados (se houver)
CREATE TABLE events_backup AS SELECT * FROM events;

-- Dropar a tabela
DROP TABLE IF EXISTS events CASCADE;

-- Recriar com o schema correto (copie do arquivo 001_initial_schema.sql)
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

-- Recriar índices
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_project_id ON events(project_id);

-- Recriar trigger
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Recriar policies (copie do arquivo 002_rls_policies.sql)
CREATE POLICY "Eventos visíveis para todos"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem criar eventos"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- Se você tinha dados no backup, migre-os
-- INSERT INTO events (...)
-- SELECT ... FROM events_backup;
```

## Verificação Pós-Correção

Depois de aplicar a correção, verifique se está funcionando:

1. Execute no SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

2. Você deve ver:
   - ✅ `event_date` (date, NOT NULL)
   - ✅ `event_time` (time without time zone, NOT NULL)
   - ❌ Não deve haver `start_time`
   - ❌ Não deve haver `end_time`

3. Teste criar um evento na aplicação
4. O erro deve desaparecer

## Prevenção de Problemas Futuros

### 1. Usar Supabase CLI para Migrations

Instale o Supabase CLI:
```bash
npm install -g supabase
```

Inicialize o projeto:
```bash
supabase init
```

Link ao projeto remoto:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Aplique migrations:
```bash
supabase db push
```

### 2. Nunca Modificar Schema Manualmente

Sempre que precisar modificar o schema:
1. Crie uma nova migration em `supabase/migrations/`
2. Teste localmente (se possível)
3. Aplique via CLI ou SQL Editor

### 3. Manter Schema Sincronizado

Se você fez mudanças no dashboard:
```bash
supabase db pull
```

Isso gera migrations baseadas no estado atual do banco.

## Estrutura Correta da Tabela Events

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,           -- ✅ Data do evento
  event_time TIME NOT NULL,            -- ✅ Horário do evento
  location TEXT,
  type TEXT NOT NULL CHECK (type IN ('meeting', 'deadline', 'visit')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Suporte

Se você continuar tendo problemas:

1. Verifique os logs do Supabase:
   - Dashboard → Logs → Postgres Logs

2. Verifique o código da aplicação:
   - `lib/data/events.ts` - Função `createEvent` (linha 54-88)
   - `components/events/event-form-dialog.tsx` - Formulário de eventos

3. Verifique se as variáveis de ambiente estão corretas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Resumo

O problema é simples: **mismatch entre schema e código**. A solução é executar a migration `004_fix_events_schema.sql` no SQL Editor do Supabase para alinhar o schema do banco com o que o código espera.
