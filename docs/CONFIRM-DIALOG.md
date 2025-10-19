# Modal de Confirmação - Documentação

## 📋 Visão Geral

Sistema de modal de confirmação personalizado para substituir os diálogos nativos do Windows (`window.confirm()`) por uma interface consistente com o design system da aplicação.

## ✨ Componentes Criados

### 1. `components/ui/alert-dialog.tsx`
Componente base do shadcn/ui usando Radix UI Alert Dialog. Fornece os primitivos para criar diálogos de alerta acessíveis.

**Primitivos exportados:**
- `AlertDialog` - Container principal
- `AlertDialogTrigger` - Botão que abre o dialog
- `AlertDialogContent` - Conteúdo do dialog
- `AlertDialogHeader` - Cabeçalho
- `AlertDialogFooter` - Rodapé com ações
- `AlertDialogTitle` - Título
- `AlertDialogDescription` - Descrição
- `AlertDialogAction` - Botão de ação principal
- `AlertDialogCancel` - Botão de cancelar

### 2. `components/ui/confirm-dialog.tsx`
Componente reutilizável de alto nível para confirmações.

**Props:**
```typescript
interface ConfirmDialogProps {
  open: boolean                    // Controla visibilidade
  onOpenChange: (open: boolean) => void  // Callback quando fecha
  onConfirm: () => void           // Callback quando confirma
  title: string                   // Título do modal
  description: string             // Descrição/mensagem
  confirmText?: string            // Texto do botão confirmar (padrão: "Confirmar")
  cancelText?: string             // Texto do botão cancelar (padrão: "Cancelar")
  variant?: "default" | "destructive"  // Estilo do botão (padrão: "default")
}
```

## 🎨 Variantes de Estilo

### Default
Botão de confirmação com cor primária (#25C961).
```tsx
<ConfirmDialog
  variant="default"
  confirmText="Confirmar"
  // ...
/>
```

### Destructive
Botão de confirmação vermelho para ações destrutivas (exclusões).
```tsx
<ConfirmDialog
  variant="destructive"
  confirmText="Excluir"
  // ...
/>
```

## 🔧 Implementações

### 1. Agenda - Exclusão de Eventos

**Antes (window.confirm):**
```typescript
const handleDeleteEvent = (eventId: string) => {
  if (confirm("Tem certeza que deseja excluir este evento?")) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }
}
```

**Depois (ConfirmDialog):**
```typescript
// Estado
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
const [eventToDelete, setEventToDelete] = useState<string | null>(null)

// Handlers
const handleDeleteEvent = (eventId: string) => {
  setEventToDelete(eventId)
  setDeleteConfirmOpen(true)
}

const confirmDeleteEvent = () => {
  if (eventToDelete) {
    setEvents((prev) => prev.filter((e) => e.id !== eventToDelete))
    setEventToDelete(null)
  }
  setDeleteConfirmOpen(false)
}

// JSX
<ConfirmDialog
  open={deleteConfirmOpen}
  onOpenChange={setDeleteConfirmOpen}
  onConfirm={confirmDeleteEvent}
  title="Excluir Evento"
  description="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
  confirmText="Excluir"
  cancelText="Cancelar"
  variant="destructive"
/>
```

### 2. Kanban - Exclusão de Colunas

**Implementação:**
```typescript
// Estado
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
const [columnToDelete, setColumnToDelete] = useState<string | null>(null)

// Handlers
const handleDeleteColumn = (columnId: string) => {
  setColumnToDelete(columnId)
  setDeleteConfirmOpen(true)
}

const confirmDeleteColumn = () => {
  if (columnToDelete) {
    const firstColumnId = columns[0].id
    setTasks((prev) =>
      prev.map((task) =>
        task.status === columnToDelete ? { ...task, status: firstColumnId } : task
      )
    )
    setColumns((prev) => prev.filter((col) => col.id !== columnToDelete))
    setColumnToDelete(null)
  }
  setDeleteConfirmOpen(false)
}

// JSX
<ConfirmDialog
  open={deleteConfirmOpen}
  onOpenChange={setDeleteConfirmOpen}
  onConfirm={confirmDeleteColumn}
  title="Excluir Coluna"
  description="Tem certeza que deseja excluir esta coluna? As tarefas serão movidas para a primeira coluna."
  confirmText="Excluir"
  cancelText="Cancelar"
  variant="destructive"
/>
```

## 📱 Experiência do Usuário

### Antes (window.confirm)
- ❌ Dialog nativo do sistema operacional
- ❌ Estilo inconsistente com a aplicação
- ❌ Não customizável
- ❌ Bloqueante e pode ser confuso

### Depois (ConfirmDialog)
- ✅ Modal personalizado com design system
- ✅ Consistente em todo o app
- ✅ Animações suaves
- ✅ Acessível (WAI-ARIA)
- ✅ Dark mode compatível
- ✅ Responsivo

## 🎯 Padrão de Uso

Para implementar confirmação em novas features:

### 1. Importar o componente
```typescript
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
```

### 2. Adicionar estados
```typescript
const [confirmOpen, setConfirmOpen] = useState(false)
const [itemToDelete, setItemToDelete] = useState<string | null>(null)
```

### 3. Criar handlers
```typescript
const handleDelete = (id: string) => {
  setItemToDelete(id)
  setConfirmOpen(true)
}

const confirmDelete = () => {
  if (itemToDelete) {
    // Lógica de exclusão
    setItemToDelete(null)
  }
  setConfirmOpen(false)
}
```

### 4. Adicionar o modal no JSX
```typescript
<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  onConfirm={confirmDelete}
  title="Título da Confirmação"
  description="Descrição detalhada da ação."
  confirmText="Confirmar"
  cancelText="Cancelar"
  variant="destructive" // ou "default"
/>
```

## 🔐 Acessibilidade

O componente é totalmente acessível graças ao Radix UI:

- ✅ **Foco automático**: Gerenciamento de foco ao abrir/fechar
- ✅ **Escape key**: Fecha o modal
- ✅ **Screen readers**: Atributos ARIA corretos
- ✅ **Tab navigation**: Navegação por teclado
- ✅ **Focus trap**: Foco contido dentro do modal

## 📦 Dependências

```json
{
  "@radix-ui/react-alert-dialog": "^1.0.5"
}
```

## 🚀 Arquivos Modificados

1. **Criados:**
   - `components/ui/alert-dialog.tsx`
   - `components/ui/confirm-dialog.tsx`
   - `docs/CONFIRM-DIALOG.md`

2. **Modificados:**
   - `app/(app)/agenda/page.tsx` - Substituído `confirm()` por `ConfirmDialog`
   - `app/(app)/kanban/page.tsx` - Substituído `confirm()` por `ConfirmDialog`

## ✅ Checklist de Implementação

- [x] Componente AlertDialog base (shadcn/ui)
- [x] Componente ConfirmDialog reutilizável
- [x] Implementado na página Agenda
- [x] Implementado na página Kanban
- [x] Suporte a variantes (default/destructive)
- [x] Documentação completa
- [x] Acessibilidade garantida
- [x] Dark mode compatível

---

**Data de Implementação:** 17 de outubro de 2024
**Versão:** 0.3.0
**Status:** ✅ Implementado e testado
