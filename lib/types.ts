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
