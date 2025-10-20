# API Route Protection Middleware Implementation

## Summary

Task 18 has been completed. A comprehensive API route protection middleware has been implemented to verify user permissions before API operations, return 403 Forbidden for unauthorized operations, and log permission denied attempts.

## What Was Implemented

### 1. Core Middleware (`lib/middleware/api-protection.ts`)

Created a robust middleware system with three main functions:

#### `withPermissionCheck(request, section, handler)`
- Verifies user authentication
- Checks user account status (active/inactive)
- Maps HTTP methods to permission actions (GET→view, POST→create, PUT/PATCH→edit, DELETE→delete)
- Validates user has required permission for the section and action
- Logs permission denied attempts with full context
- Returns 403 Forbidden with detailed error message if permission denied
- Executes handler function if permission granted

#### `withAdminCheck(request, handler)`
- Specialized middleware for admin-only operations
- Verifies user is authenticated and active
- Checks if user belongs to 'Administrador' group
- Logs unauthorized admin access attempts
- Returns 403 Forbidden if not admin
- Executes handler function if admin check passes

#### `getAuthenticatedUser(request)`
- Helper function to get authenticated user without permission checks
- Useful for endpoints with custom permission logic
- Returns user IDs and email or null if not authenticated

### 2. Protected API Routes

Created complete CRUD API routes with permission protection for all major sections:

#### Projects API (`app/api/projects/`)
- `GET /api/projects` - List projects (requires 'view' permission on 'projetos')
- `POST /api/projects` - Create project (requires 'create' permission on 'projetos')
- `GET /api/projects/[id]` - Get project details (requires 'view' permission)
- `PUT /api/projects/[id]` - Update project (requires 'edit' permission)
- `DELETE /api/projects/[id]` - Delete project (requires 'delete' permission)

#### Tasks API (`app/api/tasks/`)
- `GET /api/tasks` - List tasks (requires 'view' permission on 'kanban')
- `POST /api/tasks` - Create task (requires 'create' permission on 'kanban')
- `GET /api/tasks/[id]` - Get task details (requires 'view' permission)
- `PUT /api/tasks/[id]` - Update task (requires 'edit' permission)
- `DELETE /api/tasks/[id]` - Delete task (requires 'delete' permission)

#### Clients API (`app/api/clients/`)
- `GET /api/clients` - List clients (requires 'view' permission on 'clientes')
- `POST /api/clients` - Create client (requires 'create' permission on 'clientes')
- `GET /api/clients/[id]` - Get client details (requires 'view' permission)
- `PUT /api/clients/[id]` - Update client (requires 'edit' permission)
- `DELETE /api/clients/[id]` - Delete client (requires 'delete' permission)

#### Events API (`app/api/events/`)
- `GET /api/events` - List events (requires 'view' permission on 'agenda')
- `POST /api/events` - Create event (requires 'create' permission on 'agenda')
- `GET /api/events/[id]` - Get event details (requires 'view' permission)
- `PUT /api/events/[id]` - Update event (requires 'edit' permission)
- `DELETE /api/events/[id]` - Delete event (requires 'delete' permission)

#### Files API (`app/api/files/`)
- `GET /api/files` - List files (requires 'view' permission on 'arquivos')
- `POST /api/files` - Upload file (requires 'create' permission on 'arquivos')
- `GET /api/files/[id]` - Get file details (requires 'view' permission)
- `DELETE /api/files/[id]` - Delete file (requires 'delete' permission, with ownership check)

#### Email API (Updated)
- `POST /api/email/send` - Send email (requires 'create' permission on 'email')

### 3. Security Features

#### Permission Logging
All permission denied attempts are logged with:
- User ID and email
- Section and action attempted
- Request path and HTTP method
- Timestamp
- Severity level (WARNING)
- Type (UNAUTHORIZED_ACCESS_ATTEMPT)

Log format:
```json
{
  "userId": "uuid",
  "userEmail": "user@example.com",
  "section": "projetos",
  "action": "delete",
  "path": "/api/projects/123",
  "method": "DELETE",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "severity": "WARNING",
  "type": "UNAUTHORIZED_ACCESS_ATTEMPT"
}
```

#### Error Responses
Standardized error responses for different scenarios:
- 401 Unauthorized - Not authenticated
- 403 Permission Denied - Lacks required permission
- 403 Admin Required - Admin-only operation
- 403 User Inactive - Account deactivated
- 404 User Not Found - User record missing

### 4. Documentation

Created comprehensive documentation (`lib/middleware/README.md`) covering:
- Overview and features
- Usage examples for all middleware functions
- HTTP method to permission mapping
- Available section keys
- Error response formats
- Security logging details
- Best practices
- Integration guide
- Performance considerations
- Troubleshooting guide

## Integration with Existing System

### Permission Service Integration
The middleware integrates with the existing permission service (`lib/services/permissions.ts`):
- Uses `checkPermission()` function for permission validation
- Leverages permission caching (5-minute TTL)
- Respects user group assignments

### RLS Policy Synergy
The middleware works in conjunction with Row Level Security policies:
- Middleware provides API-level permission checks
- RLS policies provide database-level security
- Both layers ensure comprehensive access control

### User Management Integration
- Checks user status (active/inactive)
- Validates user exists in users table
- Supports admin group detection
- Works with user sync service

## Requirements Satisfied

✅ **Requirement 9.3**: API routes validate permissions before executing operations
✅ **Requirement 9.4**: Returns 403 Forbidden for unauthorized operations with detailed error messages
✅ **Requirement 9.5**: Implements verification across all major API routes (projects, tasks, clients, events, files, email)
✅ **Additional**: Logs all permission denied attempts for security audit

## Files Created

1. `lib/middleware/api-protection.ts` - Core middleware implementation
2. `lib/middleware/README.md` - Comprehensive documentation
3. `app/api/projects/route.ts` - Projects list/create endpoints
4. `app/api/projects/[id]/route.ts` - Project detail/update/delete endpoints
5. `app/api/tasks/route.ts` - Tasks list/create endpoints
6. `app/api/tasks/[id]/route.ts` - Task detail/update/delete endpoints
7. `app/api/clients/route.ts` - Clients list/create endpoints
8. `app/api/clients/[id]/route.ts` - Client detail/update/delete endpoints
9. `app/api/events/route.ts` - Events list/create endpoints
10. `app/api/events/[id]/route.ts` - Event detail/update/delete endpoints
11. `app/api/files/route.ts` - Files list/upload endpoints
12. `app/api/files/[id]/route.ts` - File detail/delete endpoints

## Files Modified

1. `app/api/email/send/route.ts` - Added permission check middleware

## Usage Example

```typescript
// Before (no protection)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('*')
  return NextResponse.json({ data })
}

// After (with protection)
export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'projetos', async (userId) => {
    const supabase = await createClient()
    const { data } = await supabase.from('projects').select('*')
    return NextResponse.json({ data })
  })
}
```

## Testing Recommendations

1. **Permission Tests**: Test each permission level (view, create, edit, delete) for each section
2. **Admin Tests**: Verify admin-only operations are properly protected
3. **Inactive User Tests**: Ensure inactive users cannot access APIs
4. **Logging Tests**: Verify permission denied attempts are logged correctly
5. **Error Response Tests**: Validate error response formats and status codes
6. **Integration Tests**: Test middleware with actual database operations and RLS policies

## Next Steps

The middleware is now ready for use. To integrate with frontend:

1. Update frontend API calls to handle 403 responses
2. Display appropriate error messages to users
3. Implement permission-based UI hiding (already done in previous tasks)
4. Monitor permission denied logs for security issues
5. Consider implementing rate limiting for sensitive endpoints

## Performance Notes

- Permission checks are cached for 5 minutes
- Authentication is verified on every request
- Minimal overhead added to API routes
- Database queries optimized with proper indexes
- RLS policies provide additional security layer

## Security Considerations

- All API routes now require authentication
- Permission checks happen before any business logic
- Failed attempts are logged for audit
- User status (active/inactive) is verified
- Admin operations are strictly controlled
- Error messages don't leak sensitive information
