# 🚀 Guia de Configuração do Supabase - AvaliaTec

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Node.js instalado
- Git configurado

---

## 1️⃣ Criar Projeto no Supabase

### Passo 1: Criar novo projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** AvaliaTec
   - **Database Password:** (escolha uma senha forte e **salve-a!**)
   - **Region:** South America (São Paulo) - para melhor performance
   - **Pricing Plan:** Free (ou Pro se preferir)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos para o projeto ser provisionado

---

## 2️⃣ Obter Credenciais

### Passo 2: Copiar credenciais do projeto

1. No dashboard do seu projeto, vá em **Settings** (⚙️) → **API**
2. Copie as seguintes informações:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public (Chave Pública):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **service_role (Chave de Serviço):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Passo 3: Copiar Database URL

1. Ainda em **Settings** → **Database**
2. Na seção **Connection String**, copie a **Connection string**
3. Substitua `[YOUR-PASSWORD]` pela senha que você criou no Passo 1

---

## 3️⃣ Configurar Variáveis de Ambiente

### Passo 4: Criar arquivo .env.local

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Abra `.env.local` e preencha com suas credenciais:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

3. **NUNCA** commite o arquivo `.env.local`! Ele já está no `.gitignore`

---

## 4️⃣ Executar Migration do Banco de Dados

### Passo 5: Criar estrutura do banco

#### Opção A: Via SQL Editor (Dashboard)

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **"New query"**
3. Abra o arquivo `SUPABASE_DATABASE_SCHEMA.md` do projeto
4. Copie o **Migration Script Completo** (seção final do arquivo)
5. Cole no SQL Editor
6. Clique em **"Run"**
7. Verifique se todas as tabelas foram criadas em **Database** → **Tables**

#### Opção B: Via CLI do Supabase (Recomendado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Vincular ao projeto
supabase link --project-ref xxxxxxxxxxxxx

# Executar migration (após criar os arquivos de migration)
supabase db push
```

### Passo 6: Verificar tabelas criadas

No dashboard, vá em **Database** → **Tables** e confirme que as seguintes tabelas foram criadas:

- ✅ profiles
- ✅ clients
- ✅ projects
- ✅ tasks
- ✅ task_checklist
- ✅ task_members
- ✅ task_comments
- ✅ events
- ✅ event_participants
- ✅ files
- ✅ kanban_columns
- ✅ activity_log

---

## 5️⃣ Configurar Storage

### Passo 7: Criar bucket de arquivos

1. No dashboard, vá em **Storage**
2. Clique em **"New bucket"**
3. Preencha:
   - **Name:** `project-files`
   - **Public bucket:** ❌ (deixe desmarcado para segurança)
4. Clique em **"Create bucket"**

### Passo 8: Configurar políticas de Storage

1. Clique no bucket `project-files`
2. Vá na aba **Policies**
3. Adicione as políticas conforme documentado em `SUPABASE_DATABASE_SCHEMA.md` (seção Storage Buckets)

---

## 6️⃣ Configurar Autenticação

### Passo 9: Habilitar provedores de autenticação

1. Vá em **Authentication** → **Providers**
2. Habilite os provedores desejados:
   - ✅ **Email** (habilitado por padrão)
   - ⚪ **Google** (opcional)
   - ⚪ **GitHub** (opcional)

### Passo 10: Configurar templates de email

1. Vá em **Authentication** → **Email Templates**
2. Personalize os templates:
   - Confirmation email
   - Magic Link
   - Reset Password

---

## 7️⃣ Testar Conexão

### Passo 11: Instalar cliente Supabase

```bash
npm install @supabase/supabase-js
```

### Passo 12: Criar cliente Supabase

Crie o arquivo `/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Passo 13: Testar conexão

Crie um arquivo de teste `test-supabase.ts`:

```typescript
import { supabase } from './lib/supabase'

async function testConnection() {
  const { data, error } = await supabase
    .from('kanban_columns')
    .select('*')

  if (error) {
    console.error('❌ Erro:', error)
  } else {
    console.log('✅ Conexão OK! Colunas:', data)
  }
}

testConnection()
```

Execute:
```bash
npx ts-node test-supabase.ts
```

---

## 8️⃣ Configurar MCP do Supabase

### Passo 14: Configurar credenciais no MCP

O MCP do Supabase já foi adicionado, mas precisa das credenciais. Há duas formas:

#### Opção A: Via variáveis de ambiente globais (macOS/Linux)

Adicione ao seu `~/.zshrc` ou `~/.bashrc`:

```bash
export SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Depois execute:
```bash
source ~/.zshrc  # ou source ~/.bashrc
```

#### Opção B: Via arquivo de configuração do Claude

O MCP pode ler do arquivo `.env.local` se estiver no projeto ativo.

### Passo 15: Reiniciar Claude Code

Feche e reabra o Claude Code para carregar as novas variáveis de ambiente.

### Passo 16: Testar MCP

Após reiniciar, teste pedindo:
```
Liste todas as tabelas do meu projeto Supabase
```

---

## 9️⃣ Dados de Teste (Opcional)

### Passo 17: Popular banco com dados de exemplo

Para facilitar o desenvolvimento, você pode adicionar dados de teste:

```sql
-- Inserir um usuário de teste (após criar conta via Supabase Auth)
-- O ID será o mesmo do auth.users

-- Inserir clientes de teste
INSERT INTO clients (name, document, email, phone, address, type) VALUES
  ('Empresa ABC Ltda', '12.345.678/0001-90', 'contato@empresaabc.com', '(11) 98765-4321', 'Rua A, 123 - São Paulo/SP', 'company'),
  ('Indústria XYZ S.A.', '98.765.432/0001-10', 'contato@industriaxyz.com', '(11) 91234-5678', 'Av. B, 456 - São Paulo/SP', 'company');

-- Inserir projeto de teste
INSERT INTO projects (code, title, description, client_id, status, deadline)
SELECT
  'AV-2024-001',
  'Avaliação Imóvel Comercial',
  'Avaliação completa de imóvel comercial para fins de financiamento',
  id,
  'in_progress',
  CURRENT_DATE + INTERVAL '30 days'
FROM clients
WHERE document = '12.345.678/0001-90'
LIMIT 1;
```

---

## 🔒 Segurança

### ⚠️ IMPORTANTE - Nunca exponha:

- ❌ `SUPABASE_SERVICE_ROLE_KEY` no frontend
- ❌ `DATABASE_URL` em código client-side
- ❌ Arquivo `.env.local` no git

### ✅ Boas Práticas:

- ✅ Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` no frontend
- ✅ Use `SUPABASE_SERVICE_ROLE_KEY` apenas em Server Components ou Edge Functions
- ✅ Sempre habilite RLS (Row Level Security)
- ✅ Teste as políticas RLS antes de ir para produção

---

## 📚 Recursos Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## 🆘 Troubleshooting

### Problema: "Invalid API key"
**Solução:** Verifique se copiou as chaves corretas do dashboard

### Problema: "Could not connect to database"
**Solução:** Verifique se a senha no DATABASE_URL está correta

### Problema: "Row-level security policy violation"
**Solução:** Revise as políticas RLS, pode ser necessário ajustá-las

### Problema: MCP não conecta
**Solução:** Certifique-se de que as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas

---

## ✅ Checklist de Configuração

- [ ] Projeto criado no Supabase
- [ ] Credenciais copiadas
- [ ] Arquivo `.env.local` configurado
- [ ] Migration executada
- [ ] Tabelas criadas
- [ ] Storage bucket criado
- [ ] Políticas de Storage configuradas
- [ ] Autenticação configurada
- [ ] Cliente Supabase instalado
- [ ] Conexão testada
- [ ] MCP configurado
- [ ] Dados de teste inseridos (opcional)

---

**Pronto! 🎉 Seu projeto AvaliaTec está configurado com Supabase!**
