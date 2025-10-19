# Arquitetura do Sistema AvaliaTec

## 📐 Estrutura de Arquivos

```
avaliatec-web/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Grupo de rotas de autenticação
│   │   └── login/                    # Página de login
│   │       └── page.tsx
│   ├── (app)/                        # Grupo de rotas da aplicação
│   │   ├── dashboard/                # Dashboard principal
│   │   │   └── page.tsx
│   │   ├── clientes/                 # Gestão de clientes
│   │   │   └── page.tsx
│   │   ├── projetos/                 # Gestão de projetos
│   │   │   └── page.tsx
│   │   ├── kanban/                   # Quadro Kanban
│   │   │   └── page.tsx
│   │   ├── agenda/                   # Calendário e eventos
│   │   │   └── page.tsx
│   │   ├── arquivos/                 # Gestão de arquivos
│   │   │   └── page.tsx
│   │   ├── configuracoes/            # Configurações
│   │   │   └── page.tsx
│   │   └── layout.tsx                # Layout com Sidebar
│   ├── layout.tsx                    # Root layout com ThemeProvider
│   ├── page.tsx                      # Redireciona para /login
│   └── globals.css                   # Estilos globais + tema dark
├── components/
│   ├── ui/                           # Componentes shadcn/ui
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── separator.tsx
│   │   ├── sidebar.tsx
│   │   ├── table.tsx
│   │   └── tabs.tsx
│   ├── app-sidebar.tsx               # Sidebar de navegação
│   └── theme-provider.tsx            # Provider next-themes
├── lib/
│   └── utils.ts                      # Utilitários (cn function)
├── .eslintrc.json                    # Configuração ESLint
├── .gitignore                        # Arquivos ignorados
├── next.config.ts                    # Configuração Next.js
├── package.json                      # Dependências
├── postcss.config.mjs                # Configuração PostCSS
├── tailwind.config.ts                # Configuração Tailwind
├── tsconfig.json                     # Configuração TypeScript
└── README.md                         # Documentação principal
```

## 🎯 Padrões de Desenvolvimento

### 1. Componentes UI (shadcn/ui)

Todos os componentes UI seguem o padrão shadcn/ui:
- Utilizam Radix UI como base
- Estilizados com Tailwind CSS
- Variantes com class-variance-authority
- Type-safe com TypeScript
- Suportam composição com Slot (Radix)

Exemplo:
```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", destructive: "..." },
      size: { default: "...", sm: "...", lg: "..." }
    }
  }
)
```

### 2. Páginas (App Router)

Todas as páginas são Server Components por padrão, exceto quando necessitam de interatividade:
- Use `"use client"` apenas quando necessário
- Server Components para páginas estáticas
- Client Components para interatividade (estado, eventos)

### 3. Layouts

Dois layouts principais:
- **Root Layout** (`app/layout.tsx`): ThemeProvider, fontes, metadata
- **App Layout** (`app/(app)/layout.tsx`): Sidebar + área principal

### 4. Roteamento por Grupos

Grupos de rotas organizados por contexto:
- `(auth)`: Rotas de autenticação sem layout da aplicação
- `(app)`: Rotas da aplicação com sidebar e layout completo

## 🎨 Sistema de Tema

### Cores (CSS Variables)

```css
:root {
  --primary: 145 73% 46%;          /* #25C961 */
  --primary-foreground: 0 0% 98%;
  /* ... outros tokens ... */
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... outros tokens ... */
}
```

### ThemeProvider

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

## 🔧 Componentes Principais

### AppSidebar

Sidebar de navegação com:
- Logo/Header
- Menu de navegação
- Indicador de rota ativa
- Ícones lucide-react
- Link do Next.js para navegação

### Páginas Principais

#### Dashboard
- Cards estatísticos
- Projetos recentes
- Atividades do sistema
- Layout responsivo em grid

#### Clientes
- Tabela com listagem
- Dialog para novo cliente
- Busca e filtros
- Ações de edição/exclusão

#### Projetos
- Duas visualizações: lista/grid
- Tabs para alternância
- Badges de status
- Filtros e busca

#### Kanban
- Implementado com @dnd-kit
- 5 colunas fixas
- Drag & drop de cards
- Overlay durante arraste

#### Agenda
- Calendário react-day-picker
- Lista de eventos do dia
- Badges por tipo de evento
- Cards com detalhes

#### Arquivos
- Interface de upload (mock)
- Tabela de listagem
- Estatísticas por tipo
- Ícones por formato

## 🚀 Performance

### Otimizações

1. **Static Site Generation (SSG)**
   - Todas as páginas são pré-renderizadas
   - Build time: ~2-3s
   - First Load JS: ~102-131kB

2. **Code Splitting**
   - Chunks automáticos por rota
   - Shared chunks otimizados
   - Dynamic imports quando necessário

3. **Font Optimization**
   - Google Fonts (Inter) com next/font
   - Subset automático
   - Display swap

## 🔒 Segurança

### Práticas Implementadas

- TypeScript strict mode
- ESLint rules
- No inline styles
- Sanitização de inputs (UI)
- HTTPS obrigatório (produção)

### Não Implementado (Frontend Only)

- Autenticação real
- Autorização por papel
- Rate limiting
- CSRF protection
- Session management

## 📦 Build & Deploy

### Build de Produção

```bash
npm run build
```

Gera:
- Static pages
- Optimized bundles
- Type checking
- Linting

### Deploy Sugerido

- **Vercel** (recomendado para Next.js)
- **Netlify** (com adaptador)
- **AWS Amplify**
- **Docker** (self-hosted)

### Variáveis de Ambiente

Nenhuma necessária (frontend only), mas sugestões para futuro:
```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=
DATABASE_URL=
AUTH_SECRET=
```

## 🧪 Testing (Não Implementado)

Sugestões para testes futuros:
- **Unit Tests**: Jest + Testing Library
- **E2E Tests**: Playwright ou Cypress
- **Component Tests**: Storybook
- **Visual Regression**: Chromatic

## 📊 Métricas

### Bundle Size
- First Load JS: ~102kB (shared)
- Maior página: /kanban (~128kB)
- Menor página: / e /dashboard (~102kB)

### Performance
- Build time: ~2-3s
- Dev server ready: ~1.4s
- Static generation: 12 páginas

## 🔄 Fluxo de Navegação

```
/ (Home)
  ↓
/login
  ↓
/dashboard ──→ Sidebar sempre visível
  ├──→ /clientes
  ├──→ /projetos
  ├──→ /kanban
  ├──→ /agenda
  ├──→ /arquivos
  └──→ /configuracoes
```

## 🎓 Convenções de Código

### Nomenclatura
- Componentes: PascalCase
- Funções/variáveis: camelCase
- Arquivos componentes: kebab-case.tsx
- Constantes: UPPER_SNAKE_CASE

### Imports
```tsx
// 1. React
import { useState } from "react"

// 2. Next.js
import Link from "next/link"

// 3. Libraries
import { cn } from "@/lib/utils"

// 4. Components
import { Button } from "@/components/ui/button"

// 5. Types
type Props = { ... }
```

### Componentes
```tsx
// Client Component
"use client"

// Server Component (padrão)
export default function Page() {
  return <div>...</div>
}
```

## 📝 Notas de Desenvolvimento

### Mock Data
Todos os dados são mockados (hardcoded) nas páginas. Para integração com backend:
1. Criar serviço de API (`lib/api.ts`)
2. Implementar fetch/axios
3. Adicionar React Query ou SWR
4. Tratar loading/error states

### Estado Global
Atualmente não necessário. Para futuro:
- Context API (pequeno)
- Zustand (médio)
- Redux Toolkit (grande)

### Formulários
Implementação básica com inputs. Para produção:
- React Hook Form
- Zod para validação
- Mensagens de erro
- Toast notifications

---

**AvaliaTec** - Arquitetura escalável e moderna para gestão empresarial
