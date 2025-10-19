# AvaliaTec - Sistema de Gestão de Demandas Empresariais

Sistema completo de gestão de demandas para empresas de engenharia de avaliações, desenvolvido com Next.js 14+, TypeScript e shadcn/ui.

## 🚀 Tecnologias

- **Framework:** Next.js 15.5.6 (App Router)
- **Linguagem:** TypeScript
- **Design System:** shadcn/ui
- **Estilo:** Tailwind CSS
- **Tema:** Dark mode padrão com next-themes
- **Cor Primária:** #25C961
- **Componentes UI:** Radix UI
- **Drag & Drop:** @dnd-kit
- **Calendário:** react-day-picker

## 📦 Estrutura do Projeto

```
avaliatec-web/
├── app/
│   ├── (auth)/
│   │   └── login/          # Tela de autenticação
│   ├── (app)/
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── clientes/       # Gestão de clientes
│   │   ├── projetos/       # Gestão de projetos (lista/grid)
│   │   ├── kanban/         # Quadro Kanban
│   │   ├── agenda/         # Calendário e eventos
│   │   ├── arquivos/       # Gestão de arquivos
│   │   └── configuracoes/  # Configurações do sistema
│   ├── globals.css         # Estilos globais com tema dark
│   └── layout.tsx          # Layout root com ThemeProvider
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   ├── app-sidebar.tsx     # Sidebar de navegação
│   └── theme-provider.tsx  # Provider de tema
└── lib/
    └── utils.ts            # Utilitários (cn, etc)
```

## 🎨 Módulos Implementados

### 1. Login
- Tela de autenticação com email/senha
- Botão "Entrar com Google"
- Aviso de acesso restrito
- Cadastro fechado

### 2. Dashboard
- Cards com estatísticas principais
- Projetos recentes
- Atividades do sistema
- Indicadores visuais

### 3. Clientes
- Listagem completa de clientes
- Formulário de cadastro/edição
- Busca por nome, documento ou email
- Campos: Nome, CNPJ/CPF, Email, Telefone, Endereço

### 4. Projetos
- Visualização em lista (tabela)
- Visualização em grid (cards)
- Alternar entre visualizações
- Campos: Código, Título, Cliente, Status, Prazo

### 5. Kanban
- Quadro com drag-and-drop
- 5 colunas: Backlog, A Fazer, Em Progresso, Revisão, Concluído
- Cards de tarefas arrastáveis
- Implementado com @dnd-kit

### 6. Agenda
- Calendário interativo
- Lista de eventos do dia
- Tipos de eventos: Reunião, Prazo, Visita
- Horários e localizações

### 7. Arquivos
- Interface de upload (mock)
- Listagem de arquivos
- Estatísticas por tipo
- Simulação de integração S3

### 8. Configurações
- Perfil do usuário
- Papéis: Diretoria, Técnico, Atendimento
- Preferências do sistema
- Exibição do tema dark ativo

## 🎨 Design System

- **Tema:** Dark mode ativo por padrão
- **Cor Primária:** #25C961 (verde)
- **Tipografia:** Inter (Google Fonts)
- **Componentes:** 100% aderência ao shadcn/ui
- **Responsividade:** Mobile-first
- **Tokens CSS:** Variáveis CSS para cores

## 🚀 Como Executar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Build de Produção

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## 🔑 Login

Para acessar o sistema:
1. Acesse `/login`
2. Clique em "Entrar" ou "Entrar com Google"
3. Será redirecionado para o dashboard

> **Nota:** O sistema não possui backend real. É apenas frontend com dados mockados.

## 📁 Rotas Disponíveis

- `/` - Redireciona para login
- `/login` - Página de autenticação
- `/dashboard` - Dashboard principal
- `/clientes` - Gestão de clientes
- `/projetos` - Gestão de projetos
- `/kanban` - Quadro Kanban
- `/agenda` - Calendário e eventos
- `/arquivos` - Gestão de arquivos
- `/configuracoes` - Configurações

## 🎯 Funcionalidades

### Frontend Completo
- ✅ Todas as páginas implementadas
- ✅ Navegação completa com sidebar
- ✅ Dark mode padrão
- ✅ Cor primária #25C961 aplicada
- ✅ Componentes shadcn/ui
- ✅ Layout responsivo
- ✅ TypeScript 100%

### Sem Backend
- ⚠️ Dados mockados (hardcoded)
- ⚠️ Sem persistência real
- ⚠️ Sem autenticação real
- ⚠️ Sem upload real de arquivos

## 🎨 Componentes Shadcn/UI Utilizados

- Button
- Card
- Input
- Label
- Table
- Dialog
- Dropdown Menu
- Badge
- Tabs
- Calendar
- Separator
- Sidebar (customizado)

## 📝 Papéis de Usuário (UI apenas)

- **Diretoria:** Acesso completo ao sistema
- **Técnico:** Gerenciar projetos e laudos
- **Atendimento:** Gerenciar clientes e agenda

> **Nota:** Os papéis são apenas visuais, sem controle real de acesso.

## 🌙 Dark Mode

O dark mode está ativo por padrão e pode ser alternado através do ThemeProvider. A cor primária #25C961 é aplicada em:
- Botões principais
- Links ativos
- Realces e badges
- Indicadores de seleção

## 📦 Dependências Principais

```json
{
  "next": "^15.1.8",
  "react": "^19.0.0",
  "typescript": "^5",
  "tailwindcss": "^3.4.1",
  "shadcn/ui": "componentes individuais",
  "@dnd-kit/core": "^6.3.1",
  "react-day-picker": "^9.4.4",
  "next-themes": "^0.4.4",
  "lucide-react": "^0.468.0"
}
```

## 📄 Licença

Projeto desenvolvido para fins de demonstração.

## 👨‍💻 Desenvolvimento

Sistema desenvolvido com foco em:
- Clean code
- Componentização
- Responsividade
- Acessibilidade
- Performance
- Type safety

---

**AvaliaTec** - Sistema de Gestão de Demandas Empresariais
