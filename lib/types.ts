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

export type UserPermissions = {
  [sectionKey: string]: Permission
}

export type SectionKey = 
  | 'dashboard'
  | 'clientes'
  | 'projetos'
  | 'kanban'
  | 'agenda'
  | 'atendimento'
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
  atendimento: {
    key: 'atendimento' as const,
    label: 'Atendimento',
    path: '/atendimento',
    icon: 'WhatsAppIcon'
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
      atendimento: { view: true, create: true, edit: true, delete: true },
      arquivos: { view: true, create: true, edit: true, delete: true },
      email: { view: true, create: true, edit: true, delete: true },
      configuracoes: { view: true, create: true, edit: true, delete: true }
    }
  },
  {
    name: 'Atendimento',
    description: 'Acesso a atendimento e visualização de projetos',
    is_default: true,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      clientes: { view: true, create: false, edit: false, delete: false },
      projetos: { view: true, create: false, edit: false, delete: false },
      kanban: { view: true, create: false, edit: false, delete: false },
      agenda: { view: true, create: true, edit: true, delete: false },
      atendimento: { view: true, create: true, edit: true, delete: false },
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

// WhatsApp Types

export type WhatsAppInstance = {
  id: string
  instance_name: string
  instance_token: string
  phone_number: string | null
  display_name: string
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_code'
  qr_code: string | null
  qr_code_updated_at: string | null
  webhook_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  connected_at: string | null
  last_seen_at: string | null
}

export type WhatsAppContact = {
  id: string
  instance_id: string
  remote_jid: string
  phone_number: string
  name: string | null
  profile_picture_url: string | null
  contact_type: 'cliente' | 'lead' | 'profissional' | 'prestador' | 'unknown'
  client_id: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export type WhatsAppMessage = {
  id: string
  instance_id: string
  contact_id: string
  message_id: string
  remote_jid: string
  from_me: boolean
  message_type: 'text' | 'audio' | 'image' | 'video' | 'document' | 'sticker' | 'location' | 'contact' | 'other'
  text_content: string | null
  media_url: string | null
  media_mime_type: string | null
  media_size: number | null
  media_filename: string | null
  quoted_message_id: string | null
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  created_at: string
}

export type WhatsAppQuickMessage = {
  id: string
  shortcut: string
  message_text: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type WhatsAppInstanceSettings = {
  id: string
  instance_id: string
  reject_calls: boolean
  reject_call_message: string | null
  ignore_groups: boolean
  always_online: boolean
  read_messages: boolean
  read_status: boolean
  auto_reply_enabled: boolean
  auto_reply_message: string | null
  availability_schedule: AvailabilitySchedule
  created_at: string
  updated_at: string
}

export type AvailabilitySchedule = {
  [day: string]: {
    enabled: boolean
    start: string // HH:mm
    end: string // HH:mm
  }
}

export type WhatsAppAutoReplyLog = {
  id: string
  instance_id: string
  contact_id: string
  message_sent: string
  sent_at: string
}

export type WebhookData = {
  event: string
  instance: string
  data: any
  destination: string
  date_time: string
  sender: string
  server_url: string
  apikey: string
}

// WhatsApp Error Classes

export class WhatsAppServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'WhatsAppServiceError'
  }
}
