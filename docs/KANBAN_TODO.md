# 📋 TODO LIST COMPLETA - KANBAN END-TO-END

## Status Geral
- **Total de Tarefas**: 30
- **Completadas**: 0
- **Em Progresso**: 0
- **Pendentes**: 30

---

## 🛠️ FASE EXTRA: CORREÇÕES PRIORITÁRIAS (Tasks C1-C4)

### ⚠️ C1. Impedir exclusão de coluna com cards
**Status**: Concluído
**Descrição**: Bloquear `confirmDeleteColumn()` quando a coluna ainda possui tarefas, orientando o usuário a mover ou excluir os cards primeiro.
**Checklist**:
- [x] Identificar a contagem de tarefas vinculadas à coluna alvo antes de chamar `deleteKanbanColumn`
- [x] Exibir feedback claro (toast/modal) informando o motivo do bloqueio
- [x] Adicionar testes manuais cobrindo colunas vazias vs. colunas com cards

### ⚠️ C2. Permitir drag and drop em colunas vazias
**Status**: Concluído
**Descrição**: Ajustar integração com dnd-kit para que colunas sem items possam receber cards arrastados.
**Checklist**:
- [x] Garantir que colunas vazias forneçam uma área droppable visível
- [x] Corrigir `SortableContext`/`DndContext` para aceitar drops onde `over.data?.current?.sortable?.containerId` não existe
- [x] Validar comportamento arrastando de/para colunas com e sem cards

### ⚠️ C3. Corrigir carregamento de comentários no modal
**Status**: Concluído
**Descrição**: Eliminar erro “não foi possível carregar os comentários” exibido ao abrir o modal.
**Checklist**:
- [x] Revisar consulta em `listComments()` e tipos retornados pelo RPC/REST
- [x] Conferir mapeamento de campos (`text` vs. `content`) e ajustar as colunas corretas
- [x] Tratar estados de loading/empty para não exibir erro quando não houver comentários

### ⚠️ C4. Habilitar criação de comentários
**Status**: Concluído
**Descrição**: Permitir que o usuário adicione comentários às tarefas diretamente pelo modal.
**Checklist**:
- [x] Implementar chamada `createComment()` no handler de submit
- [x] Atualizar a lista local de comentários após salvar (sem reload completo do modal)
- [x] Tratar erros com toast e limpar o input quando bem-sucedido

---

## 🏗️ FASE 1: GERENCIAMENTO DE COLUNAS (Tasks 1-5)

### ✅ 1. Carregar colunas do Supabase
**Status**: Pendente
**Descrição**: Implementar função para carregar colunas dinamicamente do backend
**Arquivos**:
- `lib/data/kanban-columns.ts` (criar)
- `app/(app)/kanban/page.tsx` (atualizar)

**Checklist**:
- [ ] Criar `lib/data/kanban-columns.ts`
- [ ] Implementar `listKanbanColumns()`
- [ ] Integrar com a página do Kanban
- [ ] Substituir colunas hardcoded por dados do backend

---

### ✅ 2. Criar nova coluna no backend
**Status**: Pendente
**Descrição**: Conectar botão "Nova Coluna" ao Supabase
**Arquivos**: `lib/data/kanban-columns.ts`, `app/(app)/kanban/page.tsx`

**Checklist**:
- [ ] Implementar `createKanbanColumn(name, project_id?)`
- [ ] Atualizar `handleAddColumn()` para usar a função
- [ ] Atualizar lista de colunas após criar
- [ ] Adicionar feedback visual

---

### ✅ 3. Editar nome da coluna no backend
**Status**: Pendente
**Descrição**: Salvar alterações no nome da coluna no Supabase
**Arquivos**: `lib/data/kanban-columns.ts`, `app/(app)/kanban/page.tsx`

**Checklist**:
- [ ] Implementar `updateKanbanColumn(id, changes)`
- [ ] Atualizar `handleSaveColumnTitle()` para persistir no backend
- [ ] Adicionar validação
- [ ] Adicionar feedback visual

---

### ✅ 4. Deletar coluna do backend
**Status**: Pendente
**Descrição**: Remover coluna do Supabase e mover tarefas
**Arquivos**: `lib/data/kanban-columns.ts`, `app/(app)/kanban/page.tsx`

**Checklist**:
- [ ] Implementar `deleteKanbanColumn(id)`
- [ ] Atualizar `confirmDeleteColumn()` para deletar no backend
- [ ] Mover tarefas para primeira coluna antes de deletar
- [ ] Adicionar confirmação

---

### ✅ 5. Reordenar colunas (drag and drop)
**Status**: Pendente
**Descrição**: Permitir arrastar colunas para reorganizar
**Arquivos**: `lib/data/kanban-columns.ts`, `app/(app)/kanban/page.tsx`

**Checklist**:
- [ ] Adicionar drag and drop para colunas
- [ ] Implementar `reorderKanbanColumns(columnId, newPosition)`
- [ ] Atualizar positions no backend
- [ ] Salvar ordem no Supabase

---

## 📝 FASE 2: MELHORIAS EM TAREFAS (Tasks 6-9)

### ✅ 6. Atualizar título da tarefa no backend
**Status**: Pendente
**Descrição**: Permitir editar título diretamente no modal
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/tasks.ts`

**Checklist**:
- [ ] Adicionar input editável para título no modal
- [ ] Atualizar `updateTask()` ao alterar título
- [ ] Sincronizar com lista de tarefas
- [ ] Adicionar debounce para evitar muitas requests

---

### ✅ 7. Deletar tarefa do backend
**Status**: Pendente
**Descrição**: Adicionar botão para deletar tarefa
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/tasks.ts`

**Checklist**:
- [ ] Criar função `deleteTask(id)` em tasks.ts
- [ ] Adicionar botão "Deletar" no modal
- [ ] Adicionar confirmação antes de deletar
- [ ] Remover tarefa da lista após deletar
- [ ] Fechar modal após deletar

---

### ✅ 8. Atualizar prioridade da tarefa
**Status**: Pendente
**Descrição**: Adicionar seletor de prioridade
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/tasks.ts`

**Checklist**:
- [ ] Adicionar campo priority no tipo Task
- [ ] Criar Select para prioridade (low, medium, high, urgent)
- [ ] Atualizar `updateTask()` para incluir priority
- [ ] Mostrar badge de prioridade no card
- [ ] Adicionar cores para cada prioridade

---

### ✅ 9. Atualizar progresso da tarefa
**Status**: Pendente
**Descrição**: Adicionar indicador de progresso
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/tasks.ts`

**Checklist**:
- [ ] Adicionar campo progress no tipo Task
- [ ] Criar slider ou input para progresso (0-100%)
- [ ] Atualizar `updateTask()` para incluir progress
- [ ] Mostrar barra de progresso no card
- [ ] Calcular automaticamente baseado no checklist

---

## ☑️ FASE 3: CHECKLIST COMPLETO (Tasks 10-13)

### ✅ 10. Carregar checklist do backend
**Status**: Pendente
**Descrição**: Buscar items do checklist do Supabase
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/tasks.ts`

**Checklist**:
- [ ] Chamar `listChecklist(taskId)` ao abrir modal
- [ ] Mapear itens do backend para UI
- [ ] Substituir checklist mock por dados reais
- [ ] Adicionar loading state

---

### ✅ 11. Adicionar item no backend
**Status**: Pendente
**Descrição**: Salvar novos itens do checklist no Supabase
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/tasks.ts`

**Checklist**:
- [ ] Atualizar `handleAddChecklistItem()` para usar `addChecklistItem()`
- [ ] Recarregar checklist após adicionar
- [ ] Adicionar feedback visual
- [ ] Limpar input após adicionar

---

### ✅ 12. Marcar/desmarcar item no backend
**Status**: Pendente
**Descrição**: Persistir status completed no Supabase
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/tasks.ts`

**Checklist**:
- [ ] Atualizar `handleToggleChecklistItem()` para usar `toggleChecklistItem()`
- [ ] Atualizar UI otimisticamente
- [ ] Recalcular progresso da tarefa
- [ ] Adicionar feedback visual

---

### ✅ 13. Deletar item do backend
**Status**: Pendente
**Descrição**: Remover item do checklist do Supabase
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/tasks.ts`

**Checklist**:
- [ ] Atualizar `handleRemoveChecklistItem()` para usar `removeChecklistItem()`
- [ ] Remover item da UI
- [ ] Recalcular progresso
- [ ] Adicionar confirmação (opcional)

---

## 💬 FASE 4: SISTEMA DE COMENTÁRIOS (Tasks 14-17)

### ✅ 14. Carregar comentários do backend
**Status**: Pendente
**Descrição**: Buscar comentários da tarefa do Supabase
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/task-comments.ts` (criar)

**Checklist**:
- [ ] Criar `lib/data/task-comments.ts`
- [ ] Implementar `listComments(taskId)`
- [ ] Carregar comentários ao abrir modal
- [ ] Incluir informações do autor (nome, avatar)
- [ ] Ordenar por data (mais recente primeiro ou último)

---

### ✅ 15. Adicionar comentário no backend
**Status**: Pendente
**Descrição**: Salvar novos comentários no Supabase
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/task-comments.ts`

**Checklist**:
- [ ] Implementar `createComment(taskId, content)`
- [ ] Atualizar `handleAddComment()` para usar função
- [ ] Recarregar comentários após adicionar
- [ ] Pegar user_id do usuário autenticado
- [ ] Limpar textarea após adicionar

---

### ✅ 16. Editar comentário no backend
**Status**: Pendente
**Descrição**: Permitir editar comentários próprios
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/task-comments.ts`

**Checklist**:
- [ ] Implementar `updateComment(id, content)`
- [ ] Adicionar botão "Editar" nos comentários próprios
- [ ] Adicionar modo de edição inline
- [ ] Salvar alterações no backend
- [ ] Verificar permissão (apenas autor pode editar)

---

### ✅ 17. Deletar comentário do backend
**Status**: Pendente
**Descrição**: Permitir deletar comentários próprios
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/task-comments.ts`

**Checklist**:
- [ ] Implementar `deleteComment(id)`
- [ ] Adicionar botão "Deletar" nos comentários próprios
- [ ] Adicionar confirmação
- [ ] Remover da UI após deletar
- [ ] Verificar permissão (apenas autor pode deletar)

---

## 👥 FASE 5: GERENCIAMENTO DE MEMBROS (Tasks 18-22)

### ✅ 18. Carregar membros da tarefa do backend
**Status**: Pendente
**Descrição**: Buscar membros atribuídos à tarefa
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/task-members.ts` (criar)

**Checklist**:
- [ ] Criar `lib/data/task-members.ts`
- [ ] Implementar `listTaskMembers(taskId)`
- [ ] Carregar membros ao abrir modal
- [ ] Incluir informações do usuário (nome, avatar, role)
- [ ] Mostrar badges dos membros

---

### ✅ 19. Adicionar membro à tarefa no backend
**Status**: Pendente
**Descrição**: Atribuir usuários à tarefa
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/task-members.ts`

**Checklist**:
- [ ] Implementar `addTaskMember(taskId, userId, role?)`
- [ ] Criar seletor de usuários (listar profiles)
- [ ] Adicionar membro ao clicar
- [ ] Atualizar lista de membros
- [ ] Prevenir duplicatas

---

### ✅ 20. Remover membro da tarefa no backend
**Status**: Pendente
**Descrição**: Desatribuir usuários da tarefa
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/task-members.ts`

**Checklist**:
- [ ] Implementar `removeTaskMember(taskId, userId)`
- [ ] Adicionar botão X nos badges de membros
- [ ] Remover membro ao clicar
- [ ] Atualizar lista de membros
- [ ] Adicionar confirmação (opcional)

---

### ✅ 21. Selecionar responsável de lista de usuários
**Status**: Pendente
**Descrição**: Substituir input texto por seletor
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/profiles.ts` (criar se necessário)

**Checklist**:
- [ ] Criar função para listar profiles
- [ ] Substituir Input por Select/Combobox
- [ ] Mostrar nome e avatar dos usuários
- [ ] Permitir remover responsável (null)
- [ ] Sincronizar com assigned_to

---

### ✅ 22. Atualizar responsável no backend
**Status**: Pendente
**Descrição**: Salvar responsável no Supabase
**Arquivos**: `components/kanban/task-modal.tsx`, `lib/data/tasks.ts`

**Checklist**:
- [ ] Atualizar `updateTask()` para incluir assigned_to (UUID)
- [ ] Salvar ao selecionar responsável
- [ ] Mostrar responsável no card da tarefa
- [ ] Atualizar lista de tarefas

---

## 🎨 FASE 6: UI/UX E POLISH (Tasks 23-25)

### ✅ 23. Adicionar loading states em todas as ações
**Status**: Pendente
**Descrição**: Melhorar feedback durante operações assíncronas
**Arquivos**: Todos os componentes

**Checklist**:
- [ ] Adicionar loading em criar/editar/deletar colunas
- [ ] Adicionar loading em criar/editar/deletar tarefas
- [ ] Adicionar loading em checklist operations
- [ ] Adicionar loading em comentários
- [ ] Adicionar loading em membros
- [ ] Desabilitar botões durante loading

---

### ✅ 24. Adicionar toasts de sucesso/erro
**Status**: Pendente
**Descrição**: Feedback visual para todas as operações
**Arquivos**: Todos os componentes

**Checklist**:
- [ ] Toast de sucesso ao criar tarefa
- [ ] Toast de sucesso ao mover tarefa
- [ ] Toast de erro em falhas de rede
- [ ] Toast de sucesso ao adicionar comentário
- [ ] Toast de sucesso ao completar checklist
- [ ] Toast de confirmação ao deletar

---

### ✅ 25. Melhorar feedback visual de drag and drop
**Status**: Pendente
**Descrição**: UX mais fluida no drag and drop
**Arquivos**: `app/(app)/kanban/page.tsx`

**Checklist**:
- [ ] Adicionar overlay mais bonito
- [ ] Destacar zona de drop
- [ ] Animações suaves
- [ ] Indicador de drop permitido/não permitido
- [ ] Feedback de sucesso ao soltar

---

## 🧪 FASE 7: TESTES E VALIDAÇÃO (Tasks 26-30)

### ✅ 26. Testar criação de tarefas end-to-end
**Status**: Pendente
**Descrição**: Validar fluxo completo de criação
**Checklist**:
- [ ] Criar tarefa vazia
- [ ] Preencher todos os campos
- [ ] Verificar salvamento no Supabase
- [ ] Verificar exibição na UI
- [ ] Testar com diferentes usuários

---

### ✅ 27. Testar movimento de tarefas entre colunas
**Status**: Pendente
**Descrição**: Validar drag and drop
**Checklist**:
- [ ] Mover tarefa entre colunas
- [ ] Verificar atualização no Supabase
- [ ] Testar reordenação dentro da coluna
- [ ] Testar com múltiplas tarefas
- [ ] Verificar performance

---

### ✅ 28. Testar todas as operações de checklist
**Status**: Pendente
**Descrição**: Validar CRUD de checklist
**Checklist**:
- [ ] Adicionar múltiplos itens
- [ ] Marcar/desmarcar itens
- [ ] Deletar itens
- [ ] Verificar persistência
- [ ] Testar cálculo de progresso

---

### ✅ 29. Testar todas as operações de comentários
**Status**: Pendente
**Descrição**: Validar CRUD de comentários
**Checklist**:
- [ ] Adicionar comentários
- [ ] Editar comentários próprios
- [ ] Deletar comentários próprios
- [ ] Verificar permissões
- [ ] Testar formatação de data

---

### ✅ 30. Testar gerenciamento de colunas completo
**Status**: Pendente
**Descrição**: Validar CRUD de colunas
**Checklist**:
- [ ] Criar coluna
- [ ] Renomear coluna
- [ ] Deletar coluna
- [ ] Verificar movimentação de tarefas ao deletar
- [ ] Testar reordenação de colunas

---

## 📊 MÉTRICAS DE SUCESSO

- [ ] Todas as operações CRUD funcionam
- [ ] Nenhum erro no console
- [ ] Feedback visual em todas as ações
- [ ] Performance aceitável (< 1s para operações)
- [ ] Sincronização correta com Supabase
- [ ] Políticas RLS funcionando
- [ ] UI responsiva e intuitiva
- [ ] Zero dados mockados (tudo do backend)

---

## 🚀 PRÓXIMOS PASSOS APÓS COMPLETAR

1. Adicionar filtros (por responsável, prioridade, prazo)
2. Adicionar busca de tarefas
3. Adicionar anexos de arquivos
4. Adicionar notificações
5. Adicionar histórico de atividades
6. Adicionar templates de tarefas
7. Adicionar dashboard de analytics

---

**Data de Início**: [A definir]
**Data de Conclusão Estimada**: [A definir]
**Responsável**: Claude Code + Matheus Pina
