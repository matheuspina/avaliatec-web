# Implementation Plan - Gestão de Usuários

## Overview

Este plano de implementação divide a feature de Gestão de Usuários em tarefas incrementais e executáveis. Cada tarefa é focada em implementação de código e referencia os requisitos específicos do documento de requirements.

---

- [x] 1. Setup database schema and migrations
  - Create migration file for new tables (user_groups, group_permissions, users, user_invites)
  - Add columns to existing tables (team_members, watchers, assigned_users arrays)
  - Create indexes for performance optimization
  - Insert default groups (Administrador, Atendimento) with permissions
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4_

- [x] 2. Implement Row Level Security policies
  - Create RLS policies for user_groups table (admin-only access)
  - Create RLS policies for group_permissions table (admin-only access)
  - Create RLS policies for users table (view all, admin modify)
  - Create RLS policies for user_invites table (admin-only access)
  - Update RLS policies for projects table (filter by team_members)
  - Update RLS policies for tasks table (filter by assigned users and watchers)
  - Update RLS policies for clients table (filter by assigned_users)
  - Update RLS policies for events table (filter by participants)
  - Update RLS policies for files table (filter by project access)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.3_

- [x] 3. Create TypeScript types and constants
  - Add new types to lib/types.ts (UserGroup, GroupPermission, User, UserInvite, Permission, UserPermissions, SectionKey)
  - Create SECTIONS constant mapping with all section keys and metadata
  - Create DEFAULT_GROUPS constant with initial group configurations
  - Create error classes (PermissionError, InviteError, UserSyncError)
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 4. Implement user sync service
- [x] 4.1 Create user sync service module
  - Write syncUserWithDatabase function to check if user exists by auth_user_id
  - Implement logic to create new user with default group if not exists
  - Implement logic to update existing user data and last_access timestamp
  - Add error handling for database connection issues
  - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.7_

- [x] 4.2 Integrate user sync in auth callback
  - Update app/auth/callback/route.ts to call syncUserWithDatabase after successful auth
  - Pass user data from Microsoft auth to sync function
  - Handle sync errors gracefully without blocking login
  - _Requirements: 8.1, 8.6_


- [x] 5. Implement permission service
- [x] 5.1 Create permission service module
  - Write getUserPermissions function to fetch user's group permissions from database
  - Transform database permissions into UserPermissions object format
  - Implement checkPermission function for quick boolean checks
  - Add caching logic to minimize database queries
  - _Requirements: 4.1, 4.5, 9.1_

- [x] 5.2 Create permission context provider
  - Create contexts/permission-context.tsx with PermissionProvider component
  - Load user permissions on mount and store in context state
  - Implement hasPermission function for component usage
  - Add loading state management
  - Export usePermissions hook for easy access
  - _Requirements: 4.1, 4.5_

- [x] 5.3 Create Protected component wrapper
  - Create components/protected.tsx component
  - Accept section, action, fallback, and children props
  - Use usePermissions hook to check permission
  - Render children if permission granted, fallback otherwise
  - _Requirements: 4.4, 9.1, 9.2_

- [x] 6. Implement invite service and email templates
- [x] 6.1 Create invite service module
  - Write createInvite function to generate unique token with crypto
  - Set expiry to 7 days from creation
  - Create invite record in database
  - Implement validateInviteToken function to check token validity and expiry
  - Implement acceptInvite function to update user group and mark invite as accepted
  - _Requirements: 3.2, 3.4, 3.5_

- [x] 6.2 Create email template for invites
  - Create lib/email/templates/user-invite.ts
  - Write generateInviteEmail function with HTML template
  - Include group name, invite link, and expiry information
  - Style email template for professional appearance
  - _Requirements: 7.2, 7.3_

- [x] 6.3 Integrate email sending in invite service
  - Import sendEmail from lib/email/mailer.ts
  - Call sendEmail in createInvite function after database insert
  - Handle email send failures gracefully
  - Log email send attempts for audit
  - _Requirements: 3.3, 7.1, 7.5_

- [x] 7. Create API routes for groups management
- [x] 7.1 Implement groups CRUD API
  - Create app/api/groups/route.ts with GET (list all) and POST (create) handlers
  - Create app/api/groups/[id]/route.ts with PUT (update) and DELETE (delete) handlers
  - Validate admin permissions in all handlers
  - Validate input data (name uniqueness, required fields)
  - Handle group deletion with user assignment check
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 7.2 Implement group permissions API
  - Create app/api/groups/[id]/permissions/route.ts with GET and PUT handlers
  - Validate admin permissions
  - Validate that at least one section is selected
  - Auto-check "view" permission when other permissions are set
  - Return formatted permissions for UI consumption
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 8. Create API routes for users management
- [x] 8.1 Implement users API
  - Create app/api/users/route.ts with GET (list all users) handler
  - Create app/api/users/me/route.ts with GET (current user with permissions) handler
  - Create app/api/users/[id]/route.ts with PUT (update user) handler
  - Implement filtering and search functionality
  - Return user data with group information
  - _Requirements: 6.1, 6.2, 6.7_

- [x] 8.2 Implement user group change functionality
  - Add group_id update logic in PUT /api/users/[id]
  - Validate new group exists
  - Log group change in audit trail
  - Invalidate user's permission cache
  - _Requirements: 6.3, 6.4_

- [x] 8.3 Implement user activation/deactivation
  - Add status toggle logic in PUT /api/users/[id]
  - Prevent deactivation of last admin user
  - Handle active sessions for deactivated users
  - _Requirements: 6.5, 6.6_


- [x] 9. Create API routes for invites management
- [x] 9.1 Implement invites CRUD API
  - Create app/api/invites/route.ts with GET (list pending) and POST (create) handlers
  - Create app/api/invites/[id]/route.ts with DELETE (cancel) handler
  - Validate admin permissions
  - Validate email format and group existence
  - Call invite service to generate token and send email
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 9.2 Implement invite validation and acceptance API
  - Create app/api/invites/validate/route.ts with POST handler
  - Create app/api/invites/accept/route.ts with POST handler
  - Validate token in validate endpoint
  - Handle expired tokens with appropriate error messages
  - Update user group and invite status in accept endpoint
  - _Requirements: 3.4, 3.5, 7.4_

- [x] 10. Create user management UI components
- [x] 10.1 Create main user management page
  - Create app/(app)/configuracoes/usuarios/page.tsx
  - Implement tabs layout (Grupos, Usuários, Convites)
  - Add navigation between tabs
  - Verify admin permissions before rendering
  - _Requirements: 1.1, 6.1_

- [x] 10.2 Create groups management component
  - Create component to list all groups with name, description, user count
  - Add "Create Group" button and dialog
  - Add edit button for each group (opens permissions dialog)
  - Add delete button with confirmation dialog
  - Handle group CRUD operations with API calls
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 10.3 Create group permissions dialog
  - Create dialog component with table layout
  - Display all sections as rows with checkboxes for each permission level
  - Implement auto-check logic for "view" when other permissions selected
  - Save permissions to API on submit
  - Show loading and success/error states
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 10.4 Create users list component
  - Create table component displaying all users with avatar, name, email, group, status, last access
  - Add search/filter functionality
  - Add group dropdown for each user to change group
  - Add status toggle for activate/deactivate
  - Implement pagination for large user lists
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.7_

- [x] 10.5 Create invite users component
  - Create form with email input and group selector
  - Add "Send Invite" button
  - Display list of pending invites with email, group, expiry, status
  - Add resend and cancel actions for pending invites
  - Show success/error messages for invite operations
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 11. Create invite acceptance page
  - Create app/auth/invite/page.tsx
  - Extract token from URL query parameters
  - Validate token on page load
  - Display error message for invalid/expired tokens
  - Show registration form pre-filled with email for valid tokens
  - Handle registration submission and auto-assign to group
  - Redirect to login after successful registration
  - _Requirements: 3.4, 3.5, 7.4_

- [x] 12. Update sidebar with permission filtering
  - Modify components/app-sidebar.tsx to use usePermissions hook
  - Filter menuItems array based on user's view permissions
  - Show loading skeleton while permissions load
  - Hide sections user doesn't have access to
  - _Requirements: 4.2, 4.3_

- [x] 13. Add permission checks to all pages
- [x] 13.1 Update dashboard page
  - Wrap page content with permission check for "dashboard" section
  - Redirect to first available section if no access
  - _Requirements: 4.3, 9.1_

- [x] 13.2 Update clientes page
  - Add permission checks for create, edit, delete actions
  - Hide/disable action buttons based on permissions
  - Wrap forms and modals with Protected component
  - _Requirements: 4.4, 9.1, 9.2_

- [x] 13.3 Update projetos page
  - Add permission checks for create, edit, delete actions
  - Hide/disable action buttons based on permissions
  - Wrap forms and modals with Protected component
  - Add user assignment UI to project forms
  - _Requirements: 4.4, 9.1, 9.2, 5.1_

- [x] 13.4 Update kanban page
  - Add permission checks for create, edit, delete actions
  - Hide/disable action buttons based on permissions
  - Wrap task modals with Protected component
  - Add user assignment UI to task forms
  - _Requirements: 4.4, 9.1, 9.2, 5.2_

- [x] 13.5 Update agenda page
  - Add permission checks for create, edit, delete actions
  - Hide/disable action buttons based on permissions
  - Wrap event forms with Protected component
  - Add participant assignment UI to event forms
  - _Requirements: 4.4, 9.1, 9.2, 5.4_

- [x] 13.6 Update atendimento page
  - Add permission checks for create, edit, delete actions
  - Hide/disable action buttons based on permissions
  - _Requirements: 4.4, 9.1, 9.2_

- [x] 13.7 Update arquivos page
  - Add permission checks for create, edit, delete actions
  - Hide/disable upload and delete buttons based on permissions
  - _Requirements: 4.4, 9.1, 9.2_

- [x] 13.8 Update email page
  - Add permission checks for create, edit, delete actions
  - Hide/disable compose and delete buttons based on permissions
  - _Requirements: 4.4, 9.1, 9.2_

- [x] 13.9 Update configuracoes page
  - Add permission check for view access
  - Show user management section only to admins
  - _Requirements: 4.4, 9.1_


- [x] 14. Implement content filtering in queries
- [x] 14.1 Update projects queries
  - Modify project list queries to respect RLS policies
  - Add team_members assignment UI in project create/edit forms
  - Update project detail queries to check user access
  - _Requirements: 5.1, 9.5_

- [x] 14.2 Update tasks queries
  - Modify task list queries to respect RLS policies
  - Add watchers assignment UI in task create/edit modals
  - Update task detail queries to check user access
  - _Requirements: 5.2, 9.5_

- [x] 14.3 Update clients queries
  - Modify client list queries to respect RLS policies
  - Add assigned_users assignment UI in client create/edit forms
  - Update client detail queries to check user access
  - _Requirements: 5.3, 9.5_

- [x] 14.4 Update events queries
  - Modify event list queries to respect RLS policies
  - Ensure event_participants table is properly populated
  - Update event detail queries to check user access
  - _Requirements: 5.4, 9.5_

- [x] 14.5 Update files queries
  - Modify file list queries to respect RLS policies based on project access
  - Update file upload to check project permissions
  - Update file delete to check ownership or admin status
  - _Requirements: 5.5, 9.5_

- [x] 15. Add permission checks to all modals
- [x] 15.1 Update task modal
  - Add permission checks in components/kanban/task-modal.tsx
  - Disable edit fields if user doesn't have edit permission
  - Hide delete button if user doesn't have delete permission
  - Show read-only view for users with only view permission
  - _Requirements: 9.2, 9.4_

- [x] 15.2 Update event form dialog
  - Add permission checks in components/events/event-form-dialog.tsx
  - Disable form fields if user doesn't have edit permission
  - Hide delete button if user doesn't have delete permission
  - _Requirements: 9.2, 9.4_

- [x] 15.3 Update task filter dialog
  - Add permission checks in components/project/task-filter-dialog.tsx
  - Ensure filters respect user's content access
  - _Requirements: 9.2_

- [x] 16. Integrate PermissionProvider in app layout
  - Update app/(app)/layout.tsx to wrap children with PermissionProvider
  - Ensure PermissionProvider is inside AuthProvider
  - Handle loading states appropriately
  - _Requirements: 4.1, 4.5_

- [x] 17. Add data migration script
  - Create migration to copy existing profiles to users table
  - Assign all existing users to Administrador group initially
  - Update existing projects to populate team_members with creator
  - Update existing tasks to populate watchers with assigned user
  - Update existing clients to populate assigned_users with creator
  - Apply  migration script using Supabase MCP tool
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 18. Add API route protection middleware
  - Create middleware to verify user permissions before API operations
  - Apply to all existing API routes (projects, tasks, clients, events, files)
  - Return 403 Forbidden for unauthorized operations
  - Log permission denied attempts
  - _Requirements: 9.3, 9.4, 9.5_

- [ ]* 19. Create comprehensive test suite
  - Write unit tests for permission service functions
  - Write unit tests for invite service functions
  - Write unit tests for user sync service
  - Write integration tests for auth flow with user sync
  - Write integration tests for invite flow end-to-end
  - Write integration tests for permission checks across pages
  - Write E2E tests for admin creating groups and inviting users
  - Write E2E tests for user with limited permissions
  - _Requirements: All_

- [ ]* 20. Add documentation and admin guide
  - Create user guide for administrators on managing groups and users
  - Document permission levels and their meanings
  - Create troubleshooting guide for common issues
  - Document API endpoints for developers
  - _Requirements: All_

---

## Notes

- Tasks marked with * are optional and focus on testing and documentation
- Each task builds incrementally on previous tasks
- All tasks reference specific requirements from requirements.md
- Implementation should follow the design specified in design.md
- Test each task thoroughly before moving to the next
- Ensure RLS policies are working correctly before implementing UI
- Verify email sending works before deploying invite feature
