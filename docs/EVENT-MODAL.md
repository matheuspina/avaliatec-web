# Modal de Criação/Edição de Eventos - Documentação

## 📋 Visão Geral

Modal completa para criação e edição de eventos na página de Agenda, com funcionalidades avançadas de gerenciamento de usuários e vinculação a clientes.

## ✨ Funcionalidades Implementadas

### 1. Campos do Formulário

#### Campos Obrigatórios (*)
- **Título**: Nome do evento
- **Descrição**: Detalhes sobre o evento (textarea)
- **Tipo de Evento**: Dropdown com opções:
  - Reunião
  - Visita
  - Prazo
- **Data**: Seletor de data
- **Horário**: Seletor de horário (formato 24h)
- **Local**: Endereço ou localização do evento

#### Campos Opcionais
- **Usuários**: Múltiplos usuários podem ser adicionados
- **Cliente**: Cliente associado (como tag)

### 2. Adicionar Usuários

**Como funciona:**
1. Selecione um usuário no dropdown "Adicionar Usuários"
2. O usuário aparece como badge abaixo do campo
3. Múltiplos usuários podem ser adicionados
4. Cada badge tem um botão X para remover
5. Usuários já adicionados não aparecem mais no dropdown

**Usuários Disponíveis (Mock):**
- João Silva
- Maria Santos
- Pedro Costa
- Ana Lima
- Carlos Souza

**Visual:**
```
┌─────────────────────────────────────┐
│ Adicionar Usuários                  │
│ ┌─────────────────────────────────┐ │
│ │ Selecione usuários...        ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [João Silva ×] [Maria Santos ×]    │
└─────────────────────────────────────┘
```

### 3. Adicionar Cliente (Opcional)

**Como funciona:**
1. Selecione um cliente no dropdown "Cliente (Opcional)"
2. O cliente aparece como badge outline abaixo
3. Apenas um cliente pode ser vinculado
4. Badge tem botão X para remover

**Clientes Disponíveis (Mock):**
- Empresa ABC Ltda
- Indústria XYZ S.A.
- Construtora Delta

**Visual:**
```
┌─────────────────────────────────────┐
│ Cliente (Opcional)                  │
│ ┌─────────────────────────────────┐ │
│ │ Selecione um cliente...      ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Empresa ABC Ltda ×]                │
└─────────────────────────────────────┘
```

### 4. Edição de Eventos

**Funcionalidades:**
- Cada evento na lista tem botões de Editar e Excluir
- Ao clicar em Editar:
  - Modal abre com dados pré-preenchidos
  - Título muda para "Editar Evento"
  - Botão de salvar diz "Salvar Alterações"
  - Usuários e clientes já vinculados aparecem
- Ao salvar, evento é atualizado na lista

### 5. Exclusão de Eventos

**Funcionalidades:**
- Botão de lixeira em cada evento
- Confirmação antes de excluir
- Evento é removido da lista

## 🎨 Componentes Criados

### 1. `components/ui/select.tsx`
Select dropdown do shadcn/ui com:
- Trigger customizável
- Content com portal
- Items com indicador check
- Scroll buttons
- Separators
- Groups e labels

### 2. `components/ui/textarea.tsx`
Textarea do shadcn/ui com:
- Redimensionamento vertical
- Placeholder
- Estados focus/disabled
- Altura mínima configurável

### 3. `components/events/event-form-dialog.tsx`
Modal principal com:
- Props para modo create/edit
- Estado local do formulário
- Funções de adicionar/remover usuários
- Função de vincular/desvincular cliente
- Validação de campos obrigatórios
- Submit handler

## 📱 Interface da Página Agenda

### Mudanças Visuais

**Antes:**
```
┌─────────────────────────────────┐
│ Evento                          │
│ Descrição                       │
│ 10:00 • Local                   │
└─────────────────────────────────┘
```

**Depois:**
```
┌─────────────────────────────────────┐
│ Evento              [Badge] [E] [X] │
│ Descrição                           │
│ 10:00 • Local                       │
│ [João] [Maria]  [Cliente ABC]       │
└─────────────────────────────────────┘
```

### Novos Elementos
- **Botão Editar (E)**: Ícone de lápis para editar
- **Botão Excluir (X)**: Ícone de lixeira para deletar
- **Badges de Usuários**: Secondary badges com nomes
- **Badge de Cliente**: Outline badge com nome

## 🔧 Uso do Componente

### Criar Novo Evento

```tsx
<EventFormDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  onSave={handleSaveEvent}
  mode="create"
/>
```

### Editar Evento Existente

```tsx
<EventFormDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  onSave={handleSaveEvent}
  mode="edit"
  initialData={{
    title: "Reunião",
    description: "Descrição...",
    date: "2024-11-15",
    time: "10:00",
    location: "Escritório",
    type: "meeting",
    users: [{ id: "1", name: "João" }],
    client: { id: "1", name: "Cliente ABC" },
  }}
/>
```

## 📊 Estrutura de Dados

### Event Type

```typescript
type Event = {
  id: string
  title: string
  description: string
  date: Date
  time: string
  location: string
  type: "meeting" | "deadline" | "visit"
  users?: User[]
  client?: Client
}
```

### User Type

```typescript
type User = {
  id: string
  name: string
}
```

### Client Type

```typescript
type Client = {
  id: string
  name: string
}
```

### EventFormData Type

```typescript
type EventFormData = {
  title: string
  description: string
  date: string
  time: string
  location: string
  type: EventType
  users: User[]
  client?: Client
}
```

## 🎯 Fluxo de Uso

### Criar Evento

1. Usuário clica em "Novo Evento"
2. Modal abre vazia
3. Preenche campos obrigatórios
4. (Opcional) Adiciona usuários clicando no dropdown
5. (Opcional) Adiciona cliente clicando no dropdown
6. Clica em "Criar Evento"
7. Evento aparece na lista do dia selecionado

### Editar Evento

1. Usuário clica no ícone de edição (lápis)
2. Modal abre com dados preenchidos
3. Modifica campos desejados
4. Adiciona/remove usuários
5. Adiciona/remove cliente
6. Clica em "Salvar Alterações"
7. Evento é atualizado na lista

### Excluir Evento

1. Usuário clica no ícone de exclusão (lixeira)
2. Confirmação aparece
3. Usuário confirma
4. Evento é removido da lista

## 🎨 Estilo e Design

### Cores e Badges

**Usuários:**
- Variant: `secondary`
- Cor: Cinza escuro no dark mode
- Tamanho: `text-xs`
- Remove com X

**Cliente:**
- Variant: `outline`
- Cor: Borda com texto
- Tamanho: `text-xs`
- Remove com X

**Tipo de Evento:**
- Reunião: `default` (verde primário)
- Prazo: `destructive` (vermelho)
- Visita: `secondary` (cinza)

### Layout da Modal

- **Max Width**: `max-w-2xl` (grande)
- **Max Height**: `max-h-[90vh]` (scroll quando necessário)
- **Overflow**: `overflow-y-auto`
- **Espaçamento**: `space-y-4` entre campos
- **Grid**: 2 colunas para data/hora

## 🔄 Estado e Lógica

### Estado do Formulário

```typescript
const [formData, setFormData] = useState<EventFormData>({
  title: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  time: "10:00",
  location: "",
  type: "meeting",
  users: [],
  client: undefined,
})
```

### Adicionar Usuário

```typescript
const handleAddUser = (userId: string) => {
  const user = availableUsers.find((u) => u.id === userId)
  if (user && !formData.users.find((u) => u.id === userId)) {
    setFormData((prev) => ({
      ...prev,
      users: [...prev.users, user],
    }))
  }
}
```

### Remover Usuário

```typescript
const handleRemoveUser = (userId: string) => {
  setFormData((prev) => ({
    ...prev,
    users: prev.users.filter((u) => u.id !== userId),
  }))
}
```

## ✅ Validação

### Campos Obrigatórios
- Validação HTML5 com `required`
- Asterisco vermelho (*) ao lado do label
- Form não submete se campos vazios

### Validação de Duplicatas
- Usuários não podem ser adicionados duas vezes
- Dropdown filtra usuários já adicionados

## 🚀 Melhorias Futuras

### Sugeridas
- [ ] Validação customizada com Zod
- [ ] Toast notifications ao salvar/editar/excluir
- [ ] Drag & drop para reordenar usuários
- [ ] Upload de arquivos anexos
- [ ] Notificações push para participantes
- [ ] Integração com Google Calendar
- [ ] Eventos recorrentes
- [ ] Lembretes configuráveis
- [ ] Cores customizadas por tipo

## 📈 Performance

### Bundle Size
- Página Agenda: **41.9 kB** (antes: 21.6 kB)
- Componentes novos: ~20 kB
- First Load JS: **163 kB**

### Otimizações Aplicadas
- Componentes client-side apenas quando necessário
- Estado local (sem context desnecessário)
- Filtros eficientes para usuários disponíveis

---

**Data de Implementação:** 17 de outubro de 2024
**Versão:** 0.2.0
**Status:** ✅ Implementado e testado
