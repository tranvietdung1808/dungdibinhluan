# 🎯 Hướng dẫn quản lý User Roles qua Supabase SQL

## Bước 1: Tạo bảng `user_roles` (chạy 1 lần)

Vào **Supabase Dashboard → SQL Editor**, paste và chạy đoạn SQL sau:

```sql
-- Tạo bảng user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(email, role)
);

-- Indexes
CREATE INDEX IF NOT EXISTS user_roles_email_idx ON public.user_roles(email);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS user_roles_email_role_idx ON public.user_roles(email, role);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy cho service_role
CREATE POLICY "Service role full access" ON public.user_roles FOR ALL USING (true);

-- Auto-update updated_at
CREATE TRIGGER handle_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

---

## Bước 2: Thêm role cho user

### ✅ Thêm Admin cho người khác
```sql
INSERT INTO public.user_roles (email, role, note)
VALUES ('email_cua_nguoi_do@gmail.com', 'admin', 'Admin được thêm ngày 03/04/2026');
```

### ✅ Thêm VIP
```sql
INSERT INTO public.user_roles (email, role, note)
VALUES ('user_vip@gmail.com', 'vip', 'VIP đến 31/12/2026');
```

### ✅ Thêm Moderator
```sql
INSERT INTO public.user_roles (email, role, note)
VALUES ('mod_user@gmail.com', 'moderator', 'Mod khu vực bình luận');
```

### ✅ Thêm nhiều role cho 1 người
```sql
-- Người này vừa là admin vừa là VIP
INSERT INTO public.user_roles (email, role, note) VALUES
  ('super_user@gmail.com', 'admin', 'Super admin'),
  ('super_user@gmail.com', 'vip', 'VIP vĩnh viễn');
```

### ✅ Thêm nhiều người cùng lúc
```sql
INSERT INTO public.user_roles (email, role, note) VALUES
  ('nguoi1@gmail.com', 'admin', 'Admin mới'),
  ('nguoi2@gmail.com', 'vip', 'VIP tháng 4'),
  ('nguoi3@gmail.com', 'moderator', 'Mod mới');
```

---

## Bước 3: Xem / Xóa / Sửa role

### 📋 Xem tất cả role
```sql
SELECT * FROM public.user_roles ORDER BY created_at DESC;
```

### 📋 Xem role của 1 người
```sql
SELECT * FROM public.user_roles WHERE email = 'user@gmail.com';
```

### 📋 Xem tất cả admin
```sql
SELECT * FROM public.user_roles WHERE role = 'admin';
```

### 📋 Xem tất cả VIP
```sql
SELECT * FROM public.user_roles WHERE role = 'vip';
```

### ❌ Xóa role của 1 người
```sql
DELETE FROM public.user_roles 
WHERE email = 'user@gmail.com' AND role = 'admin';
```

### ❌ Xóa tất cả role của 1 người
```sql
DELETE FROM public.user_roles WHERE email = 'user@gmail.com';
```

### ✏️ Đổi role
```sql
UPDATE public.user_roles 
SET role = 'vip', note = 'Chuyển từ admin sang VIP'
WHERE email = 'user@gmail.com' AND role = 'admin';
```

---

## Các role có sẵn trong hệ thống

| Role | Mô tả | Quyền |
|------|--------|-------|
| `admin` | Quản trị viên | Duyệt/xóa comment, quản lý nội dung, truy cập admin panel |
| `vip` | Người dùng VIP | (Tùy bạn định nghĩa thêm) |
| `moderator` | Điều hành viên | (Tùy bạn định nghĩa thêm) |
| `user` | Người dùng thường | (Mặc định) |

> [!TIP]
> Bạn có thể tạo bất kỳ role nào bạn muốn — chỉ cần INSERT vào bảng với giá trị `role` tùy ý. Ví dụ: `'beta_tester'`, `'premium'`, `'content_creator'`...

---

## Cách sử dụng trong code

```typescript
import { hasRole, hasAnyRole, getUserRoles } from "@/lib/admin";

// Check 1 role cụ thể
const isAdmin = await hasRole(supabaseClient, email, "admin");
const isVip = await hasRole(supabaseClient, email, "vip");

// Check có bất kỳ role nào trong danh sách
const isPrivileged = await hasAnyRole(supabaseClient, email, ["admin", "vip"]);

// Lấy tất cả role của 1 user
const roles = await getUserRoles(supabaseClient, email);
// => ["admin", "vip"]
```
