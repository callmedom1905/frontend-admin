# CSRF Protection Setup for Moobeef Steak Admin

## Tổng quan

Dự án đã được cập nhật để hỗ trợ đầy đủ CSRF protection cho stateful authentication với Laravel Sanctum.

## Các thay đổi đã thực hiện

### 1. Backend (Laravel)

#### AuthController.php
- Thêm method `getCsrfToken()` để cung cấp CSRF token
- Cải thiện error handling trong logout method
- Đảm bảo token validation đúng cách

#### Routes (api.php)
- Thêm route `/api/csrf-token` để lấy CSRF token
- Route này không cần authentication

#### Middleware
- Tạo `EnsureCsrfTokenIsSet` middleware để đảm bảo CSRF token luôn có sẵn
- Middleware này tự động generate CSRF token nếu chưa có

### 2. Frontend (Next.js)

#### AuthContext.tsx
- Thêm `initializeAuth()` method để khởi tạo CSRF token
- Cải thiện cookie security với `secure` và `sameSite` options
- Sử dụng API client mới cho tất cả requests
- Better error handling và token validation

#### apiClient.ts
- Tạo API client mới với CSRF protection
- Tự động initialize CSRF token cho stateful requests
- Centralized error handling
- Support cho tất cả HTTP methods (GET, POST, PUT, DELETE, PATCH)

#### RouteGuard.tsx
- Cập nhật để sử dụng authentication system mới
- Better loading states
- Role-based access control

## Cách hoạt động

### 1. CSRF Token Flow
```
Frontend → /sanctum/csrf-cookie → Laravel Sanctum
Frontend → /api/csrf-token → Custom CSRF endpoint
Frontend → API requests (với CSRF token)
```

### 2. Authentication Flow
```
1. User truy cập app
2. initializeAuth() được gọi
3. CSRF token được request từ backend
4. Check existing cookies cho authentication
5. Nếu có token, verify với backend
6. Nếu valid, user được authenticate
7. Nếu invalid, redirect to login
```

### 3. Login Flow
```
1. User nhập credentials
2. CSRF token được ensure có sẵn
3. Login request được gửi với CSRF protection
4. Backend validate credentials và CSRF token
5. Nếu success, token và user data được lưu vào cookies
6. User được redirect to dashboard
```

## Security Improvements

### 1. Cookie Security
- `secure: true` trong production (HTTPS only)
- `sameSite: 'strict'` để prevent CSRF attacks
- Proper expiration times

### 2. CSRF Protection
- Tất cả stateful requests đều có CSRF token
- Automatic CSRF token initialization
- Proper error handling cho invalid tokens

### 3. Token Management
- Automatic token refresh
- Proper token cleanup on logout
- Session validation

## Cách sử dụng

### 1. Trong Components
```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  // Component logic
}
```

### 2. API Calls
```typescript
import { apiClient } from '@/lib/apiClient';

// GET request
const data = await apiClient.get('/api/users');

// POST request (CSRF protected)
const result = await apiClient.post('/api/users', userData);
```

### 3. Route Protection
```typescript
import RouteGuard from '@/components/auth/RouteGuard';

// Protect route for specific roles
<RouteGuard allowedRoles={['manager', 'staff']}>
  <AdminDashboard />
</RouteGuard>
```

## Testing

### 1. Test CSRF Protection
1. Mở browser developer tools
2. Go to Network tab
3. Try to login
4. Verify CSRF requests are made before login request

### 2. Test Token Validation
1. Login successfully
2. Clear cookies manually
3. Refresh page
4. Should redirect to login

### 3. Test Role-based Access
1. Login with different user roles
2. Try to access protected routes
3. Verify proper access control

## Troubleshooting

### 1. CSRF Token Mismatch
- Check if `/sanctum/csrf-cookie` route is accessible
- Verify CORS configuration
- Check session configuration

### 2. Authentication Issues
- Check token expiration
- Verify cookie settings
- Check network connectivity

### 3. Role-based Access Issues
- Verify user role in database
- Check role guard names
- Verify route protection logic

## Environment Variables

### Backend (.env)
```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=false  # true in production
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Production Considerations

1. Set `SESSION_SECURE_COOKIE=true` in production
2. Configure proper CORS origins
3. Use HTTPS in production
4. Set proper session lifetime
5. Configure proper domain settings 