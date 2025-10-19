# 🚀 Guia Rápido de Configuração - AvaliaTec + Supabase

## Passo 1: Criar Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** `avaliatec` (ou o nome que preferir)
   - **Database Password:** Crie uma senha forte e **GUARDE-A!** ⚠️
   - **Region:** `South America (São Paulo)` para melhor performance
   - **Pricing Plan:** Free (suficiente para começar)
4. Clique em **"Create new project"**
5. ⏳ Aguarde 2-3 minutos enquanto o projeto é provisionado

---

## Passo 2: Obter Credenciais

### 2.1 - Project URL e API Keys

1. No dashboard do seu projeto, vá em **Settings** (⚙️) → **API**
2. Você verá três informações importantes:

**Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
📋 Copie este valor

**anon public (Chave Pública):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
```
📋 Copie este valor (começa com `eyJ`)

**service_role (Chave de Serviço):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
```
📋 Copie este valor (também começa com `eyJ`, mas é diferente)

### 2.2 - Database URL

1. Ainda em **Settings** → **Database**
2. Role até **Connection String**
3. Copie a **URI** (não a Postgres.js)
4. Substitua `[YOUR-PASSWORD]` pela senha que você criou no Passo 1

Exemplo:
```
postgresql://postgres:SUA_SENHA_AQUI@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

---

## Passo 3: Configurar `.env.local`

Abra o arquivo `.env.local` na raiz do projeto e substitua os placeholders pelos valores reais:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yyyyy...
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

⚠️ **IMPORTANTE:** Salve o arquivo após editar!

---

## Passo 4: Configurar Variáveis Globais para o MCP

Para que o MCP do Supabase funcione, precisamos configurar variáveis de ambiente globais:

### macOS/Linux:

Abra seu terminal e execute:

```bash
# Abrir arquivo de configuração do shell
nano ~/.zshrc
```

Adicione no final do arquivo:

```bash
# Supabase MCP Configuration
export SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yyyyy..."
```

Salve com `Ctrl+O`, depois `Enter`, e saia com `Ctrl+X`.

Recarregue as configurações:

```bash
source ~/.zshrc
```

---

## Passo 5: Reiniciar Claude Code

Feche completamente o Claude Code e abra novamente para que ele carregue as novas variáveis de ambiente.

---

## Passo 6: Avisar que está pronto

Depois de completar os passos acima, me avise que configurou tudo e eu vou:

1. ✅ Executar a migration completa do banco de dados
2. ✅ Criar todas as 12 tabelas
3. ✅ Configurar as RLS policies
4. ✅ Criar triggers e functions
5. ✅ Criar views
6. ✅ Inserir dados iniciais
7. ✅ Configurar o Storage bucket

---

## 📋 Checklist

- [ ] Projeto criado no Supabase
- [ ] Project URL copiada
- [ ] anon key copiada
- [ ] service_role key copiada
- [ ] Database URL copiada (com senha)
- [ ] Arquivo `.env.local` atualizado
- [ ] Variáveis globais configuradas em `~/.zshrc`
- [ ] Terminal recarregado com `source ~/.zshrc`
- [ ] Claude Code reiniciado

---

## ❓ Dúvidas Comuns

**Q: Esqueci a senha do banco de dados**
A: Vá em Settings → Database → Reset Database Password

**Q: Onde encontro o Project ID?**
A: Na URL do projeto: `https://app.supabase.com/project/SEU-PROJECT-ID`

**Q: Posso mudar de região depois?**
A: Não, a região é definida na criação. Escolha São Paulo para melhor latência no Brasil.

---

🎯 **Quando terminar, volte aqui e diga: "Pronto, configurei as credenciais!"**
