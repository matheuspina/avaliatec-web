# 🎯 Integração Supabase - AvaliaTec

## 📁 Arquivos Criados

### Configuração do Cliente Supabase
- ✅ `/lib/supabase/client.ts` - Cliente para uso no navegador (Client Components)
- ✅ `/lib/supabase/server.ts` - Cliente para Server Components
- ✅ `/lib/supabase/middleware.ts` - Middleware para autenticação
- ✅ `/middleware.ts` - Middleware do Next.js configurado

### Componentes de UI
- ✅ `/components/ui/toast.tsx` - Componente de notificação toast
- ✅ `/components/ui/toaster.tsx` - Provider de toasts
- ✅ `/hooks/use-toast.ts` - Hook para usar toasts

### Autenticação
- ✅ `/app/(auth)/login/page.tsx` - Página de login integrada com Supabase
- ✅ `/app/auth/callback/route.ts` - Callback OAuth
- ✅ `/app/auth/auth-code-error/page.tsx` - Página de erro de autenticação

### Migrations SQL
- ✅ `/supabase/migrations/001_initial_schema.sql` - Schema completo (tabelas, índices, views, triggers)
- ✅ `/supabase/migrations/002_rls_policies.sql` - Políticas de segurança RLS
- ✅ `/supabase/migrations/003_storage.sql` - Configuração do Storage

### Documentação
- ✅ `/SUPABASE_SETUP.md` - Guia completo de setup
- ✅ `/SUPABASE_DATABASE_SCHEMA.md` - Documentação do schema
- ✅ `/PASSO_A_PASSO_SUPABASE.md` - Guia rápido
- ✅ `.env.example` - Template de variáveis de ambiente
- ✅ `.env.local` - Arquivo de configuração (você precisa preencher)

---

## 🚀 Próximos Passos - VOCÊ PRECISA FAZER

### 1️⃣ Criar Projeto no Supabase

Siga o guia: **`PASSO_A_PASSO_SUPABASE.md`**

Resumo:
1. Acesse https://supabase.com/dashboard
2. Crie um novo projeto
3. Guarde a senha do banco de dados
4. Copie as credenciais (URL, anon key, service_role key)

### 2️⃣ Configurar `.env.local`

Edite o arquivo `.env.local` e substitua:
```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yyyyy
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEU-PROJECT-ID.supabase.co:5432/postgres
```

### 3️⃣ Configurar Variáveis Globais (para MCP)

Abra o terminal e execute:

```bash
nano ~/.zshrc
```

Adicione no final:
```bash
export SUPABASE_URL="https://SEU-PROJECT-ID.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yyyyy..."
```

Salve e execute:
```bash
source ~/.zshrc
```

### 4️⃣ Executar Migrations

**Opção A: Via Dashboard do Supabase (Mais Fácil)**

1. Acesse seu projeto no Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **"New query"**
4. Copie o conteúdo de `/supabase/migrations/001_initial_schema.sql`
5. Cole no editor e clique em **"Run"**
6. Repita para `002_rls_policies.sql`
7. Repita para `003_storage.sql`

**Opção B: Via Supabase CLI**

```bash
# Instalar CLI
npm install -g supabase

# Fazer login
supabase login

# Vincular ao projeto (você vai precisar do project ID)
supabase link --project-ref SEU-PROJECT-ID

# Executar migrations
supabase db push
```

### 5️⃣ Verificar Tabelas Criadas

No Dashboard do Supabase:
1. Vá em **Database** → **Tables**
2. Verifique se as 12 tabelas foram criadas:
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

### 6️⃣ Criar Primeiro Usuário

1. No Dashboard, vá em **Authentication** → **Users**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha email e senha
4. O trigger automático criará um perfil na tabela `profiles`

**OU**

Use a página de login do app (depois de tudo configurado):
```
http://localhost:3000/login
```

### 7️⃣ Promover Primeiro Usuário a Admin

Após criar o primeiro usuário, você precisa torná-lo admin:

1. No Dashboard, vá em **SQL Editor**
2. Execute:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'seu@email.com');
```

---

## 🔐 Configuração de Autenticação (Opcional)

### Habilitar Microsoft OAuth

Se quiser usar login com Microsoft:

1. No Dashboard, vá em **Authentication** → **Providers**
2. Encontre **Azure (Microsoft)**
3. Clique em **"Enable"**
4. Siga as instruções para criar um app no Azure AD
5. Configure as credenciais

---

## 📦 Configurar Storage Bucket

O script `003_storage.sql` já cria o bucket, mas você pode verificar:

1. No Dashboard, vá em **Storage**
2. Confirme que o bucket `project-files` existe
3. Verifique as policies na aba **Policies**

---

## ✅ Checklist de Configuração

- [ ] Projeto criado no Supabase
- [ ] `.env.local` preenchido com credenciais reais
- [ ] Variáveis globais configuradas (`~/.zshrc`)
- [ ] Terminal recarregado (`source ~/.zshrc`)
- [ ] Migration `001_initial_schema.sql` executada
- [ ] Migration `002_rls_policies.sql` executada
- [ ] Migration `003_storage.sql` executada
- [ ] 12 tabelas verificadas no Dashboard
- [ ] Primeiro usuário criado
- [ ] Primeiro usuário promovido a admin
- [ ] Storage bucket verificado
- [ ] Claude Code reiniciado

---

## 🧪 Testar Integração

Depois de tudo configurado:

### Teste 1: Autenticação

```bash
# Acesse o login
http://localhost:3000/login

# Tente fazer login com o usuário que você criou
```

### Teste 2: Verificar Conexão com o Banco

Crie um arquivo de teste temporário:

```typescript
// test-db.ts
import { createClient } from '@/lib/supabase/client'

async function testConnection() {
  const supabase = createClient()

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
npx ts-node test-db.ts
```

### Teste 3: Verificar RLS

Tente acessar dados sem autenticação - deve falhar.
Com autenticação - deve funcionar.

---

## 📊 Estrutura do Banco

### 12 Tabelas Principais

1. **profiles** - Perfis de usuários (extensão de auth.users)
2. **clients** - Clientes (empresas e pessoas físicas)
3. **projects** - Projetos de avaliação
4. **tasks** - Tarefas do Kanban
5. **task_checklist** - Checklists das tarefas
6. **task_members** - Membros atribuídos às tarefas
7. **task_comments** - Comentários nas tarefas
8. **events** - Eventos da agenda
9. **event_participants** - Participantes dos eventos
10. **files** - Metadados de arquivos
11. **kanban_columns** - Colunas customizáveis do Kanban
12. **activity_log** - Log de atividades

### 3 Views

- `v_project_stats` - Estatísticas de projetos
- `v_upcoming_deadlines` - Prazos próximos (7 dias)
- `v_user_workload` - Carga de trabalho dos usuários

### 5 Functions/Triggers

- `update_updated_at_column()` - Atualiza timestamp automaticamente
- `create_profile_for_user()` - Cria perfil ao criar usuário
- `log_activity()` - Registra atividades
- `set_project_completed_at()` - Define data de conclusão
- `reorder_task_positions()` - Reordena posições no Kanban

---

## 🔒 Segurança

### ✅ Implementado

- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Políticas baseadas em roles (admin, manager, user)
- ✅ Storage policies para proteção de arquivos
- ✅ Autenticação via Supabase Auth
- ✅ Middleware para proteger rotas
- ✅ Service Role Key protegida (nunca exposta no frontend)

### ⚠️ NUNCA FAÇA

- ❌ Commitar `.env.local` no Git
- ❌ Expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
- ❌ Desabilitar RLS em produção
- ❌ Usar queries diretas sem RLS

---

## 📞 Quando Tudo Estiver Pronto

Depois de completar todos os passos, volte ao Claude Code e diga:

**"Pronto! Configurei o Supabase. As credenciais estão no .env.local e executei todas as migrations."**

Eu vou então:
1. Verificar se tudo está funcionando
2. Testar a integração
3. Criar dados de exemplo para você começar a usar
4. Configurar o resto das funcionalidades

---

## 🆘 Problemas Comuns

### Erro: "Invalid API key"
**Solução:** Verifique se copiou as chaves corretas do dashboard

### Erro: "Could not connect to database"
**Solução:** Verifique se a senha no DATABASE_URL está correta

### Erro: "Row-level security policy violation"
**Solução:** Certifique-se de que executou o script `002_rls_policies.sql`

### MCP não funciona
**Solução:**
1. Verifique se as variáveis estão em `~/.zshrc`
2. Execute `source ~/.zshrc`
3. Reinicie o Claude Code completamente

---

## 📚 Recursos Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

**🎉 Boa sorte com a configuração! Quando terminar, me avise que vamos ao próximo passo!**
