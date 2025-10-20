# API Route Protection Middleware

This middleware provides permission-based access control for API routes in the application.

## Overview

The middleware verifies user permissions before allowing API operations, ensuring that users can only perform actions they are authorized for based on their group permissions.

## Features

- **Permission Verification**: Automatically checks user permissions based on section and HTTP method
- **Authentication Check**: Verifies user is authenticated and active
- **Permission Logging**: Logs all permission denied attempts for security audit
- **Admin-Only Operations**: Special middleware for admin-only endpoints
- **Flexible Integration**: Easy to integrate with existing API routes

## Usage

### Basic Permission Check

Use `withPermissionCheck` to protect API routes based on section permissions:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'projetos', async (userId, authUserId) => {
    // Your API logic here
    // userId: User ID from users table
    // authUserId: Auth user ID from Supabase auth
    
    return NextResponse.json({ data: [] })
  })
}
```

### Admin-Only Operations

Use `withAdminCheck` for operations that require administrator privileges:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdminCheck } from '@/lib/middleware/api-protection'

export async function DELETE(request: NextRequest) {
  return withAdminCheck(request, async (userId, authUserId) => {
    // Your admin-only API logic here
    
    return NextResponse.json({ success: true })
  })
}
```

### Custom Permission Logic

Use `getAuthenticatedUser` when you need user info but have custom permission logic:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/middleware/api-protection'

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Your custom permission logic here
  
  return NextResponse.json({ success: true })
}
```

## HTTP Method to Permission Mapping

The middleware automatically maps HTTP methods to permission actions:

| HTTP Method | Permission Action |
|-------------|------------------|
| GET         | view             |
| POST        | create           |
| PUT/PATCH   | edit             |
| DELETE      | delete           |

## Section Keys

Available section keys for permission checks:

- `dashboard` - Dashboard section
- `clientes` - Clients section
- `projetos` - Projects section
- `kanban` - Tasks/Kanban section
- `agenda` - Events/Calendar section
- `atendimento` - Customer service section
- `arquivos` - Files section
- `email` - Email section
- `configuracoes` - Settings section

## Error Responses

### 401 Unauthorized
User is not authenticated:
```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

### 403 Forbidden - Permission Denied
User lacks required permission:
```json
{
  "error": "Permission denied",
  "code": "PERMISSION_DENIED",
  "details": {
    "section": "projetos",
    "action": "delete",
    "message": "You do not have permission to delete in projetos"
  }
}
```

### 403 Forbidden - Admin Required
Operation requires admin privileges:
```json
{
  "error": "Admin access required",
  "code": "ADMIN_REQUIRED",
  "details": {
    "message": "This operation requires administrator privileges"
  }
}
```

### 403 Forbidden - User Inactive
User account is deactivated:
```json
{
  "error": "User account is inactive",
  "code": "USER_INACTIVE"
}
```

### 404 Not Found - User Not Found
User record not found in database:
```json
{
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

## Security Logging

All permission denied attempts are logged with the following information:

```typescript
{
  userId: string,        // User ID from users table
  userEmail: string,     // User email
  section: string,       // Section being accessed
  action: string,        // Action being attempted
  path: string,          // API route path
  method: string,        // HTTP method
  timestamp: string,     // ISO timestamp
  severity: 'WARNING',
  type: 'UNAUTHORIZED_ACCESS_ATTEMPT'
}
```

These logs can be monitored for security audit and anomaly detection.

## Examples

### Complete CRUD API with Protection

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

export async function GET(request: NextRequest) {
  return withPermissionCheck(request, 'projetos', async (userId) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  })
}

export async function POST(request: NextRequest) {
  return withPermissionCheck(request, 'projetos', async (userId) => {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...body, created_by: userId })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data }, { status: 201 })
  })
}
```

### Dynamic Route with Protection

```typescript
// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withPermissionCheck } from '@/lib/middleware/api-protection'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(request, 'projetos', async (userId) => {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('projects')
      .update(body)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  })
}
```

## Best Practices

1. **Always use middleware**: Protect all API routes that perform data operations
2. **Use appropriate section keys**: Match the section key to the data being accessed
3. **Handle errors gracefully**: Provide clear error messages to clients
4. **Log security events**: Monitor permission denied logs for suspicious activity
5. **Test permissions**: Verify that users with different permission levels can/cannot access routes
6. **Use admin check sparingly**: Only use `withAdminCheck` for truly admin-only operations
7. **Combine with RLS**: Use middleware for API protection and RLS for database-level security

## Integration with Existing Routes

To add protection to existing routes:

1. Import the middleware:
   ```typescript
   import { withPermissionCheck } from '@/lib/middleware/api-protection'
   ```

2. Wrap your handler function:
   ```typescript
   export async function GET(request: NextRequest) {
     return withPermissionCheck(request, 'section_key', async (userId) => {
       // Your existing logic here
     })
   }
   ```

3. Update any references to get the current user - the `userId` parameter is now provided by the middleware

## Performance Considerations

- Permission checks are cached for 5 minutes to minimize database queries
- Authentication is verified on every request for security
- RLS policies provide an additional layer of security at the database level
- Consider implementing rate limiting for sensitive endpoints

## Troubleshooting

### Permission denied but user should have access
- Check user's group assignment in the database
- Verify group permissions are correctly configured
- Check if user account is active
- Clear permission cache if recently updated

### Middleware not working
- Ensure middleware is imported correctly
- Verify section key matches defined sections
- Check that user exists in users table (not just auth.users)
- Review server logs for detailed error messages

### Performance issues
- Monitor permission cache hit rate
- Consider increasing cache TTL if permissions change infrequently
- Review RLS policy complexity
- Check database indexes on users and group_permissions tables
