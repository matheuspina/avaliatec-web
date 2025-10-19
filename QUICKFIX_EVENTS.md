# 🚨 SOLUÇÃO RÁPIDA - Erro ao Criar Eventos na Agenda

## O Problema

Você está recebendo este erro ao tentar criar um evento na agenda:
```json
{
  "code": "23502",
  "details": null,
  "hint": null,
  "message": "null value in column \"start_time\" of relation \"events\" violates not-null constraint"
}
```

## A Causa

O schema da tabela `events` no seu Supabase está desalinhado com o código da aplicação:
- **Supabase tem**: coluna `start_time`
- **Aplicação espera**: colunas `event_date` e `event_time`

## Solução em 3 Passos (5 minutos)

### Passo 1: Acesse o Supabase Dashboard

1. Abra [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login
3. Selecione o projeto **AvaliaTec**

### Passo 2: Abra o SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique no botão **"New Query"**

### Passo 3: Execute a Migration

1. Abra o arquivo: `/supabase/migrations/004_fix_events_schema.sql`
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione Ctrl/Cmd + Enter)

Você verá uma mensagem de sucesso! ✅

### Passo 4: Teste a Aplicação

1. Volte para a aplicação AvaliaTec
2. Vá para a página **Agenda**
3. Clique em **"Novo Evento"**
4. Preencha o formulário e clique em **"Criar Evento"**
5. O evento deve ser criado com sucesso! 🎉

## O Que a Migration Faz?

A migration `004_fix_events_schema.sql` faz o seguinte automaticamente:

✅ Detecta se a coluna `start_time` existe
✅ Cria as colunas `event_date` e `event_time` com os tipos corretos
✅ Migra todos os dados existentes (se houver) de `start_time` para as novas colunas
✅ Remove a coluna `start_time`
✅ Remove a coluna `end_time` (se existir)
✅ Atualiza os índices do banco de dados

**É seguro executar**: A migration preserva todos os seus dados existentes!

## Verificação

Após executar a migration, você pode verificar se está tudo correto:

```sql
-- Cole e execute no SQL Editor
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

Você deve ver:
- ✅ `event_date` com tipo `date`
- ✅ `event_time` com tipo `time without time zone`
- ❌ **NÃO** deve haver `start_time`

## Alternativa: Usar Supabase CLI

Se você preferir fazer via linha de comando:

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Fazer login
npx supabase login

# 3. Link ao projeto
npx supabase link --project-ref SEU_PROJECT_REF

# 4. Aplicar a migration
npx supabase db push
```

## Ainda Não Funcionou?

Se você ainda tiver problemas:

1. **Verifique se executou a migration corretamente**
   - Deve ter retornado sucesso, sem erros

2. **Limpe o cache do navegador**
   - Ctrl/Cmd + Shift + R para forçar reload

3. **Verifique o console do navegador**
   - F12 → Console → procure por erros

4. **Verifique os logs do Supabase**
   - Dashboard → Logs → Postgres Logs

5. **Leia a documentação completa**
   - Veja: `/docs/FIX_EVENTS_SCHEMA.md`

## Prevenção

Para evitar esse problema no futuro:

1. ✅ Sempre use migrations para modificar o schema
2. ✅ Não modifique tabelas manualmente no dashboard
3. ✅ Use `npm run db:push` para aplicar migrations
4. ✅ Use `npm run db:pull` para sincronizar mudanças

## Precisa de Ajuda?

- 📖 Documentação detalhada: `/docs/FIX_EVENTS_SCHEMA.md`
- 📝 README de migrations: `/supabase/migrations/README.md`
- 🗄️ Schema correto: `/supabase/migrations/001_initial_schema.sql`

---

**Tempo estimado**: 5 minutos
**Dificuldade**: Fácil
**Risco**: Baixo (a migration é segura e preserva dados)
