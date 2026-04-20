// Central TypeScript types for Supabase tables and views

export type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
  role: 'admin' | 'manager' | 'user'
  created_at: string
  updated_at: string
}

export type Client = {
  id: string
  name: string
  document: string
  email: string
  phone: string
  address: string
  type: 'company' | 'individual'
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Project = {
  id: string
  code: string
  name: string
  description: string | null
  client_id: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent' | null
  start_date: string | null
  end_date: string | null
  budget: string | null
  progress: number | null
  created_by: string | null
  project_manager: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  project_id: string | null
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline: string | null
  assigned_to: string | null
  labels: string[] | null
  position: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type TaskChecklist = {
  id: string
  task_id: string
  text: string
  completed: boolean
  position: number
  created_at: string
}

export type TaskMember = {
  task_id: string
  user_id: string
  added_at: string
}

export type TaskComment = {
  id: string
  task_id: string
  user_id: string | null
  text: string
  created_at: string
  updated_at: string
}

export type Event = {
  id: string
  title: string
  description: string | null
  event_date: string
  event_time: string
  location: string | null
  type: 'meeting' | 'deadline' | 'visit'
  client_id: string | null
  project_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type EventParticipant = {
  event_id: string
  user_id: string
  added_at: string
}

export type FileItem = {
  id: string
  name: string
  original_name: string
  file_type: string
  mime_type: string
  size_bytes: number
  storage_path: string
  project_id: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
  // Google Drive integration fields (null when not using Drive)
  external_provider: 'google_drive' | null
  external_file_id: string | null
  web_view_link: string | null
  drive_parent_id: string | null
}

/** Item returned by the file explorer — can be a file or a Drive folder */
export type DriveItem =
  | (FileItem & { item_type: 'file' })
  | {
      item_type: 'folder'
      id: string
      name: string
      drive_folder_id: string
      parent_folder_id: string | null
      created_at: string | null
    }

export type KanbanColumn = {
  id: string
  title: string
  status_key: string
  position: number
  color: string | null
  created_at: string
}

export type ActivityLog = {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string
  details: any
  created_at: string
}

// Views
export type VProjectStats = {
  id: string
  code: string
  title: string
  status: Project['status']
  deadline: string
  client_name: string | null
  assigned_to_name: string | null
  task_count: number
  file_count: number
  completed_tasks: number
  created_at: string
  updated_at: string
}

export type VUpcomingDeadlines = {
  type: 'project' | 'task'
  id: string
  identifier: string
  title: string
  due_date: string
  user_id: string | null
  user_name: string | null
}

export type VUserWorkload = {
  id: string
  full_name: string
  active_projects: number
  active_tasks: number
  upcoming_events: number
}

// User Management Types

export type UserGroup = {
  id: string
  name: string
  description: string | null
  is_default: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type GroupPermission = {
  id: string
  group_id: string
  section_key: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  created_at: string
}

export type User = {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  avatar_url: string | null
  group_id: string | null
  status: 'active' | 'inactive'
  last_access: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type UserInvite = {
  id: string
  email: string
  group_id: string
  token: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired'
  invited_by: string | null
  created_at: string
}

export type Permission = {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

// ─── CRM types ───────────────────────────────────────────────────────────────

/** Light metrics returned for every client in the list view (one RPC round-trip). */
export type ClientListMetrics = {
  client_since: string
  total_completed_revenue: number
  last_sale_date: string | null
  total_projects: number
  completed_projects: number
  active_projects: number
}

/** A project row embedded in the client CRM detail response. */
export type ClientCrmProject = {
  id: string
  code: string
  name: string
  status: string
  status_name: string
  status_color: string | null
  end_date: string | null
  actual_value: number | null
  estimated_value: number | null
  completed_at: string | null
  created_at: string
}

/** Full CRM detail for a single client (from get_client_crm_detail RPC). */
export type ClientCrmDetail = {
  client_since: string
  total_revenue_all_time: number
  last_sale_date: string | null
  first_sale_date: string | null
  total_projects: number
  completed_projects: number
  active_projects: number
  next_deadline: string | null
  projects: ClientCrmProject[]
}

export type UserPermissions = {
  [sectionKey: string]: Permission
}

export type SectionKey = 
  | 'dashboard'
  | 'clientes'
  | 'projetos'
  | 'kanban'
  | 'agenda'
  | 'arquivos'
  | 'email'
  | 'configuracoes'

// Section Configuration

export const SECTIONS = {
  dashboard: {
    key: 'dashboard' as const,
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard'
  },
  clientes: {
    key: 'clientes' as const,
    label: 'Clientes',
    path: '/clientes',
    icon: 'Users'
  },
  projetos: {
    key: 'projetos' as const,
    label: 'Projetos',
    path: '/projetos',
    icon: 'Briefcase'
  },
  kanban: {
    key: 'kanban' as const,
    label: 'Tarefas',
    path: '/kanban',
    icon: 'FolderKanban'
  },
  agenda: {
    key: 'agenda' as const,
    label: 'Agenda',
    path: '/agenda',
    icon: 'Calendar'
  },
  arquivos: {
    key: 'arquivos' as const,
    label: 'Arquivos',
    path: '/arquivos',
    icon: 'FileText'
  },
  email: {
    key: 'email' as const,
    label: 'Email',
    path: '/email',
    icon: 'Mail'
  },
  configuracoes: {
    key: 'configuracoes' as const,
    label: 'Configurações',
    path: '/configuracoes',
    icon: 'Settings'
  }
} as const

// Default Groups Configuration

export const DEFAULT_GROUPS = [
  {
    name: 'Administrador',
    description: 'Acesso completo ao sistema',
    is_default: false,
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true },
      clientes: { view: true, create: true, edit: true, delete: true },
      projetos: { view: true, create: true, edit: true, delete: true },
      kanban: { view: true, create: true, edit: true, delete: true },
      agenda: { view: true, create: true, edit: true, delete: true },
      arquivos: { view: true, create: true, edit: true, delete: true },
      email: { view: true, create: true, edit: true, delete: true },
      configuracoes: { view: true, create: true, edit: true, delete: true }
    }
  },
  {
    name: 'Usuário',
    description: 'Acesso padrão ao sistema',
    is_default: true,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      clientes: { view: true, create: false, edit: false, delete: false },
      projetos: { view: true, create: false, edit: false, delete: false },
      kanban: { view: true, create: false, edit: false, delete: false },
      agenda: { view: true, create: true, edit: true, delete: false },
      arquivos: { view: true, create: false, edit: false, delete: false },
      email: { view: true, create: true, edit: false, delete: false },
      configuracoes: { view: false, create: false, edit: false, delete: false }
    }
  }
] as const

// Error Classes

export class PermissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PermissionError'
  }
}

export class InviteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InviteError'
  }
}

export class UserSyncError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserSyncError'
  }
}


