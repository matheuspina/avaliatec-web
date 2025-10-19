# Gestão de Sessões - AvaliaTec

## Visão Geral

Este documento descreve as melhorias implementadas no sistema de autenticação e gestão de sessões do AvaliaTec.

## Componentes

### 1. Hook `useAuth` (hooks/use-auth.ts)

Hook personalizado que gerencia o estado de autenticação do usuário em toda a aplicação.

**Funcionalidades:**
- Monitora mudanças de estado de autenticação em tempo real
- Redireciona automaticamente quando o usuário faz logout
- Atualiza a sessão quando o token é renovado
- Fornece informações sobre o usuário atual

**Eventos monitorados:**
- `SIGNED_IN`: Usuário fez login com sucesso
- `SIGNED_OUT`: Usuário fez logout (redireciona para /login)
- `TOKEN_REFRESHED`: Token de acesso foi renovado automaticamente
- `USER_UPDATED`: Dados do usuário foram atualizados

**Uso:**
```typescript
import { useAuth } from "@/hooks/use-auth"

export function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) return <div>Carregando...</div>
  if (!isAuthenticated) return <div>Não autenticado</div>

  return <div>Olá, {user.email}</div>
}
```

### 2. AuthProvider (components/auth-provider.tsx)

Componente wrapper que utiliza o hook `useAuth` para fornecer gestão de autenticação em toda a aplicação.

**Funcionalidades:**
- Mostra tela de carregamento enquanto verifica autenticação
- Ativa o hook useAuth em todas as páginas protegidas

### 3. Middleware Melhorado (lib/supabase/middleware.ts)

Melhorias no middleware para gestão de sessões:

**Novas funcionalidades:**
- Log de erros de autenticação para debug
- Redirecionamento de usuários autenticados que tentam acessar /login
- Redirecionamento de usuários não autenticados para /login com parâmetro `redirectTo`
- Proteção de rotas públicas (/, /login, /auth/*, /_next/*, /api/*)

**Fluxo de autenticação:**
```
1. Usuário tenta acessar /clientes sem estar autenticado
2. Middleware detecta ausência de sessão
3. Redireciona para /login?redirectTo=/clientes
4. Após login bem-sucedido, redireciona de volta para /clientes
```

### 4. Botão de Logout no Sidebar

O componente `AppSidebar` agora possui um footer com botão de logout.

**Funcionalidades:**
- Botão "Sair" sempre visível no rodapé do sidebar
- Feedback visual durante o logout
- Toast de confirmação ao fazer logout
- Redirecionamento automático para /login

**Componentes adicionados ao sidebar:**
- `SidebarFooter`: Novo componente de UI para o rodapé do sidebar

## Fluxo de Autenticação

### Login
```
1. Usuário acessa /login
2. Preenche credenciais
3. supabase.auth.signInWithPassword()
4. Hook useAuth detecta evento SIGNED_IN
5. Redireciona para página solicitada ou /dashboard
6. Middleware valida sessão em cada requisição
```

### Logout
```
1. Usuário clica em "Sair" no sidebar
2. supabase.auth.signOut()
3. Hook useAuth detecta evento SIGNED_OUT
4. Limpa estado do usuário
5. Redireciona para /login
6. Middleware valida ausência de sessão
```

### Renovação Automática de Token
```
1. Token expira (após 1 hora por padrão)
2. Supabase automaticamente tenta renovar
3. Hook useAuth detecta evento TOKEN_REFRESHED
4. Atualiza estado do usuário
5. Sessão continua válida
```

### Expiração de Sessão
```
1. Sessão expira (não pode ser renovada)
2. Middleware detecta ausência de sessão válida
3. Redireciona para /login?redirectTo=/path
4. Hook useAuth limpa estado
5. Usuário pode fazer login novamente
```

## Configuração

### Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Configuração do Supabase

O tempo de expiração do token pode ser configurado no Supabase Dashboard:
- Authentication → Settings → JWT Expiry

## Troubleshooting

### Problema: Usuário é deslogado aleatoriamente

**Possíveis causas:**
1. Token expirou e não foi renovado
2. Cookies não estão sendo salvos corretamente
3. Erro no middleware

**Solução:**
1. Verificar logs do console do navegador
2. Verificar logs do servidor (middleware)
3. Verificar se os cookies estão sendo salvos no DevTools
4. Verificar configuração do Supabase

### Problema: Redirecionamento infinito entre /login e /dashboard

**Possíveis causas:**
1. Middleware não está detectando sessão corretamente
2. Hook useAuth está causando re-renders infinitos

**Solução:**
1. Verificar logs de autenticação
2. Verificar se o middleware está retornando supabaseResponse corretamente
3. Verificar se há loops no AuthProvider

## Boas Práticas

1. **Sempre use o hook useAuth**: Para componentes que precisam de informações do usuário, use o hook useAuth ao invés de chamar o Supabase diretamente.

2. **Não faça chamadas de autenticação em Server Components**: Use Server Components apenas para operações que não envolvem mudança de estado de autenticação.

3. **Confie no middleware**: O middleware é responsável por proteger as rotas. Não adicione lógica de autenticação redundante nas páginas.

4. **Use AuthProvider apenas em layouts protegidos**: O AuthProvider deve ser usado apenas em layouts que requerem autenticação (como app/(app)/layout.tsx).

## Melhorias Futuras

- [ ] Adicionar suporte a refresh token manual
- [ ] Implementar "Remember Me" para sessões mais longas
- [ ] Adicionar indicador de status de sessão no header
- [ ] Implementar logout de todas as sessões
- [ ] Adicionar log de atividades de autenticação
