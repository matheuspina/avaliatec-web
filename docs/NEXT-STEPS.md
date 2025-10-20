# Próximos Passos - AvaliaTec

Este documento descreve as melhorias e funcionalidades que podem ser implementadas para evoluir o sistema.

## 🚀 Implementações Imediatas

### 1. Backend & API

#### Criar API REST
```typescript
// lib/api/client.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// lib/api/clients.ts
export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: ClientInput) => api.post('/clients', data),
  update: (id: string, data: ClientInput) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
}
```

#### Adicionar React Query
```bash
npm install @tanstack/react-query
```

```typescript
// app/providers.tsx
"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### 2. Autenticação Real

#### NextAuth.js
```bash
npm install next-auth
```

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implementar validação
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Adicionar role ao token
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Adicionar role à sessão
      session.user.role = token.role
      return session
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

#### Middleware de Proteção
```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Proteger rotas do (app)
      if (req.nextUrl.pathname.startsWith('/dashboard')) {
        return !!token
      }
      return true
    },
  },
})

export const config = {
  matcher: ['/(app)/:path*']
}
```

### 3. Validação de Formulários

#### React Hook Form + Zod
```bash
npm install react-hook-form @hookform/resolvers zod
```

```typescript
// components/forms/client-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const clientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  document: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  address: z.string().min(5, 'Endereço muito curto'),
})

type ClientFormData = z.infer<typeof clientSchema>

export function ClientForm() {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      document: '',
      email: '',
      phone: '',
      address: '',
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    try {
      await clientsAPI.create(data)
      toast.success('Cliente criado com sucesso!')
    } catch (error) {
      toast.error('Erro ao criar cliente')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Campos do formulário */}
    </form>
  )
}
```

### 4. Notificações (Toast)

```bash
npm install sonner
```

```typescript
// app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

// Uso
import { toast } from 'sonner'

toast.success('Operação realizada com sucesso!')
toast.error('Erro ao realizar operação')
toast.loading('Carregando...')
```

### 5. Upload Real de Arquivos

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: `uploads/${Date.now()}-${file.name}`,
    Body: buffer,
    ContentType: file.type,
  })

  try {
    await s3.send(command)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

### 6. Controle de Acesso por Papel

```typescript
// lib/auth/roles.ts
export enum Role {
  DIRETORIA = 'diretoria',
  TECNICO = 'tecnico',
  ATENDIMENTO = 'atendimento',
}

export const permissions = {
  [Role.DIRETORIA]: ['*'],
  [Role.TECNICO]: ['projects:*', 'reports:*', 'files:read'],
  [Role.ATENDIMENTO]: ['clients:*', 'calendar:*', 'files:read'],
}

export function hasPermission(role: Role, permission: string): boolean {
  const rolePermissions = permissions[role]
  return rolePermissions.includes('*') || rolePermissions.includes(permission)
}

// components/can.tsx
export function Can({
  permission,
  children
}: {
  permission: string
  children: React.ReactNode
}) {
  const { data: session } = useSession()

  if (!session || !hasPermission(session.user.role, permission)) {
    return null
  }

  return <>{children}</>
}

// Uso
<Can permission="clients:create">
  <Button>Novo Cliente</Button>
</Can>
```

## 📊 Melhorias de UX

### 1. Loading States

```typescript
// components/ui/skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  )
}

// Uso
{isLoading ? (
  <Skeleton className="h-10 w-full" />
) : (
  <ClientTable data={clients} />
)}
```

### 2. Empty States

```typescript
// components/empty-state.tsx
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <Icon className="h-16 w-16 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
```

### 3. Paginação

```typescript
// components/pagination.tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export function DataPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={() => onPageChange(page)}
              isActive={page === currentPage}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
```

### 4. Filtros Avançados

```typescript
// components/filters.tsx
export function ProjectFilters() {
  return (
    <div className="flex gap-4">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="in_progress">Em Progresso</SelectItem>
          <SelectItem value="completed">Concluído</SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          {clients.map(client => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Data
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar mode="range" />
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

## 🧪 Testes

### Unit Tests
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

```typescript
// __tests__/components/button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByText('Delete')
    expect(button).toHaveClass('bg-destructive')
  })
})
```

### E2E Tests
```bash
npm install --save-dev @playwright/test
```

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('http://localhost:3000/login')

  await page.fill('input[type="email"]', 'user@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button:has-text("Entrar")')

  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

## 📱 Responsividade Avançada

### Mobile Menu
```typescript
// components/mobile-menu.tsx
"use client"

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'

export function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <AppSidebar />
      </SheetContent>
    </Sheet>
  )
}
```

## 🔔 Notificações em Tempo Real

### WebSocket
```typescript
// lib/websocket.ts
import { io } from 'socket.io-client'

export const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
  autoConnect: false,
})

// hooks/use-notifications.ts
export function useNotifications() {
  useEffect(() => {
    socket.connect()

    socket.on('notification', (data) => {
      toast(data.message, {
        description: data.description,
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [])
}
```

## 📈 Analytics

### Vercel Analytics
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🔍 SEO

### Metadata por Página
```typescript
// app/(app)/clientes/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clientes - AvaliaTec',
  description: 'Gerencie seus clientes cadastrados',
}
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy de produção
vercel --prod
```

### Docker
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

## 🎯 Roadmap Sugerido

### Sprint 1 (2 semanas)
- [ ] Implementar backend básico (Node.js + Express/Fastify)
- [ ] Adicionar autenticação (NextAuth.js)
- [ ] Conectar API de clientes

### Sprint 2 (2 semanas)
- [ ] Conectar API de projetos
- [ ] Implementar upload real de arquivos (S3)
- [ ] Adicionar validação de formulários

### Sprint 3 (2 semanas)
- [ ] Implementar controle de acesso por papel
- [ ] Adicionar notificações toast
- [ ] Melhorar estados de loading

### Sprint 4 (2 semanas)
- [ ] Implementar testes (unit + E2E)
- [ ] Adicionar analytics
- [ ] Otimizar performance

### Sprint 5 (2 semanas)
- [ ] Notificações em tempo real
- [ ] Relatórios e dashboards avançados
- [ ] Deploy em produção

---

**AvaliaTec** - Pronto para evolução contínua
