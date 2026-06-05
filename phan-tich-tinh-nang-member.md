# 🔍 Phân tích Tính năng Member - dungdibinhluan

**Ngày phân tích:** 01/06/2026  
**Công nghệ:** Next.js (App Router) + Supabase + Google OAuth  

---

## 📋 Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc dữ liệu](#2-kiến-trúc-dữ-liệu)
3. [Luồng xác thực](#3-luồng-xác-thực)
4. [Hệ thống phân quyền (RBAC)](#4-hệ-thống-phân-quyền-rbac)
5. [Hệ thống bình luận cộng đồng](#5-hệ-thống-bình-luận-cộng-đồng)
6. [Admin Panel](#6-admin-panel)
7. [Các file quan trọng](#7-các-file-quan-trọng)
8. [Nhận xét & Đánh giá](#8-nhận-xét--đánh-giá)
9. [Đề xuất cải thiện](#9-đề-xuất-cải-thiện)
10. [Kết luận](#10-kết-luận)

---

## 1. Tổng quan hệ thống

Trang web **dungdibinhluan** là một nền tảng chia sẻ mod game (tập trung vào FC26/FIFA). Hệ thống member hiện tại hỗ trợ các tính năng sau:

| Tính năng | Trạng thái | Mô tả |
|-----------|------------|-------|
| Đăng nhập Google OAuth | ✅ Hoạt động | Đăng nhập qua Google, dùng Supabase Auth |
| Tự động tạo profile | ✅ Hoạt động | Trigger DB tự tạo profile khi user đăng ký |
| Đồng bộ profile | ✅ Hoạt động | API `/api/auth/profile-sync` cập nhật username, avatar |
| Phân quyền (RBAC) | ✅ Hoạt động | Hỗ trợ admin, vip, moderator, user (có thể mở rộng) |
| Admin Panel | ✅ Hoạt động | 2 lớp xác thực: admin key + Google OAuth |
| Bình luận cộng đồng | ✅ Hoạt động | Hỗ trợ guide & mods scope, nested replies |
| Kiểm duyệt bình luận | ✅ Hoạt động | Duyệt/từ chối/ghim/xóa bình luận |
| Quản lý bài viết (guides) | ✅ Hoạt động | CRUD bài viết hướng dẫn |
| Quản lý mods | ✅ Hoạt động | CRUD mod qua admin dashboard |
| Đăng ký email/password | ❌ Chưa có | Chỉ hỗ trợ Google OAuth |
| Trang profile người dùng | ❌ Chưa có | Không có trang profile công khai |
| Quên mật khẩu | ❌ Không áp dụng | Do chỉ dùng OAuth |
| VIP role thực tế | ⚠️ Đã định nghĩa nhưng chưa có chức năng | Role VIP chưa được sử dụng trong code |
| Moderator role thực tế | ⚠️ Đã định nghĩa nhưng chưa có chức năng | Role moderator chưa có quyền cụ thể |

---

## 2. Kiến trúc dữ liệu

### 2.1 Bảng `profiles`

Nằm trong Supabase schema `public`, bảng này lưu thông tin cơ bản của người dùng:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | uuid (PK, FK → auth.users) | ID user từ Supabase Auth |
| `username` | text (UNIQUE) | Tên hiển thị |
| `avatar_url` | text | Ảnh đại diện (từ Google) |
| `created_at` | timestamptz | Ngày tạo |
| `updated_at` | timestamptz | Ngày cập nhật cuối |

**Cơ chế tự động tạo:** Trigger `on_auth_user_created` chạy function `handle_new_user()` để tự động INSERT profile khi có user mới đăng ký qua Supabase Auth.

### 2.2 Bảng `user_roles`

Bảng linh hoạt hỗ trợ phân quyền đa role:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | uuid (PK) | ID bản ghi |
| `email` | text (NOT NULL) | Email người dùng |
| `role` | text (NOT NULL) | Tên role (admin, vip, moderator, ...) |
| `note` | text | Ghi chú thêm |
| `created_at` | timestamptz | Ngày tạo |
| `updated_at` | timestamptz | Ngày cập nhật |

**Ràng buộc:** UNIQUE(email, role) - Một user có thể có nhiều role nhưng không trùng lặp.  
**RLS:** Chỉ `service_role` mới có quyền đọc/ghi.

### 2.3 Bảng `community_comments`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | uuid (PK) | ID bình luận |
| `scope_type` | text | 'guide' hoặc 'mods' |
| `scope_id` | text | ID của bài viết/mod |
| `parent_id` | uuid (FK → self) | NULL = comment gốc, có giá trị = reply |
| `user_id` | uuid (FK → auth.users) | Người bình luận |
| `author_name` | text | Tên hiển thị |
| `author_avatar` | text | Avatar URL |
| `content` | text | Nội dung bình luận |
| `is_admin_comment` | boolean | Đánh dấu bình luận của admin |
| `is_pinned` | boolean | Bình luận được ghim |
| `status` | text | 'pending', 'approved', 'rejected' |
| `created_at` | timestamptz | Ngày tạo |

---

## 3. Luồng xác thực

### 3.1 Đăng nhập người dùng thường

```
[Người dùng] → Click "Login with Google" (Navbar/CommunityComments)
    → supabase.auth.signInWithOAuth({ provider: 'google' })
    → Google OAuth Consent Screen
    → Redirect về /auth/callback?next={currentPath}
    → exchangeCodeForSession(code)
    → Gọi /api/auth/profile-sync (đồng bộ profile)
    → Gọi /api/auth/admin-session (kiểm tra quyền admin)
    → Redirect về trang ban đầu
```

### 3.2 Đăng nhập Admin (2 lớp)

**Lớp 1 - Admin Key (Basic Auth):**
```
[/admin] → Nhập ADMIN_SECRET → POST /api/admin/verify
    → Lưu sessionStorage.setItem('admin_authenticated', 'true')
    → Redirect → /admin/dashboard
```

**Lớp 2 - Google OAuth (Deep Auth):**
```
[/admin/login] → Click "Login with Google (Admin)"
    → Kiểm tra admin-session hiện tại
    → Nếu chưa có → Google OAuth → checkIsAdminEmail()
    → Set cookie 'admin_user=1' httpOnly
    → Redirect về /admin/dashboard
```

**Admin Layout Protection:**
```
[AdminLayout] → Kiểm tra sessionStorage 'admin_authenticated'
    → Nếu không có → Redirect về /admin
```

### 3.3 Đăng xuất

```
[Navbar] → handleLogout()
    → supabase.auth.signOut()
    → DELETE /api/auth/admin-session (xóa cookie)
    → sessionStorage.removeItem('admin_authenticated')
    → Nếu đang ở /admin → redirect về /
```

---

## 4. Hệ thống phân quyền (RBAC)

### 4.1 Các role hiện có

| Role | Mô tả | Quyền thực tế trong code |
|------|-------|--------------------------|
| `admin` | Quản trị viên | ✅ Duyệt/từ chối/ghim/xóa comment, quản lý mods, quản lý guides, truy cập admin panel |
| `vip` | Người dùng VIP | ⚠️ Chưa có quyền đặc biệt nào trong code |
| `moderator` | Điều hành viên | ⚠️ Chưa có quyền đặc biệt nào trong code |
| `user` | Người dùng thường | Đọc bình luận, gửi bình luận (chờ duyệt) |

### 4.2 Cơ chế kiểm tra quyền

**File:** [lib/admin.ts](file:///c:/dungdibinhluan/lib/admin.ts)

- `normalizeEmail()` - Chuẩn hóa email (trim + lowercase)
- `getStaticAdminEmails()` - Lấy danh sách admin từ code + env
- `isStaticAdminEmail()` - Kiểm tra nhanh không cần DB
- `getUserRoles()` - Lấy tất cả role từ DB
- `hasRole()` - Kiểm tra 1 role cụ thể
- `hasAnyRole()` - Kiểm tra nhiều role (OR logic)
- `checkIsAdminEmail()` - Legacy wrapper

**Static Admin Email:** `dungba66@gmail.com` (hardcoded) + biến môi trường `NEXT_PUBLIC_ADMIN_EMAILS` / `ADMIN_EMAILS`.

### 4.3 Admin Session Cookie

[app/api/auth/admin-session/route.ts](file:///c:/dungdibinhluan/app/api/auth/admin-session/route.ts):
- `POST`: Kiểm tra token → xác thực user → kiểm tra `checkIsAdminEmail()` → set cookie `admin_user=1` (httpOnly, 7 ngày)
- `DELETE`: Xóa cookie `admin_user`

---

## 5. Hệ thống bình luận cộng đồng

### 5.1 Kiến trúc

- **Component:** [CommunityComments.tsx](file:///c:/dungdibinhluan/app/components/CommunityComments.tsx)
- **API:** [app/api/community/route.ts](file:///c:/dungdibinhluan/app/api/community/route.ts)
- **Scope types:** `guide` (bài viết hướng dẫn), `mods` (chia sẻ mod)
- **Hỗ trợ:** Nested replies (parent_id), optimistic UI

### 5.2 Luồng bình luận

```
[User đăng nhập] → Viết bình luận → POST /api/community
    → Kiểm tra token → Lấy user info
    → Xác định author_name, author_avatar
    → Nếu là admin → is_admin_comment = true, status = ??? 
    → Thực tế: status luôn = 'pending' (kể cả admin)
    → Optimistic insert vào UI (hiện ngay cho user)
```

> ⚠️ **Phát hiện:** Admin comment vẫn bị set `status = 'pending'` trong API, mặc dù frontend hiển thị như đã approved. Điều này có thể gây inconsistent nếu admin không tự duyệt comment của chính mình.

### 5.3 Hiển thị bình luận

- GET `/api/community` chỉ trả về comment có `status = 'approved'`
- Sắp xếp: `is_pinned DESC, created_at ASC`
- User thường chỉ thấy comment đã duyệt + comment của chính họ (pending)
- Admin thấy tất cả comment của mình (qua RLS policy)

### 5.4 Kiểm duyệt (Admin)

[app/admin/community/page.tsx](file:///c:/dungdibinhluan/app/admin/community/page.tsx):
- Xem danh sách pending + approved
- Duyệt (approved) / Từ chối (rejected)
- Ghim / Bỏ ghim bình luận
- Xóa bình luận (DELETE)
- Thống kê: số lượng pending theo scope

---

## 6. Admin Panel

### 6.1 Cấu trúc

| Path | Chức năng |
|------|-----------|
| `/admin` | Login bằng admin key (ADMIN_SECRET) |
| `/admin/login` | Login bằng Google OAuth (admin email) |
| `/admin/dashboard` | Dashboard chính - quản lý mods |
| `/admin/community` | Kiểm duyệt bình luận |
| `/admin/guides` | Quản lý bài viết hướng dẫn |
| `/admin/guides/new` | Tạo bài viết mới |
| `/admin/guides/[id]/edit` | Sửa bài viết |
| `/admin/mods` | Quản lý mods |
| `/admin/mods/new` | Tạo mod mới |
| `/admin/mods/[slug]/edit` | Sửa mod |

### 6.2 Bảo mật Admin Panel

**Lớp bảo vệ 1 (Layout):** [admin/layout.tsx](file:///c:/dungdibinhluan/app/admin/layout.tsx)
- Kiểm tra `sessionStorage.getItem('admin_authenticated')`
- Nếu không có → redirect về `/admin`

**Lớp bảo vệ 2 (API):**
- Community API: `ensureAdmin()` kiểm tra Bearer token → checkIsAdminEmail()
- Guides API: **KHÔNG có kiểm tra quyền** - dùng hardcoded `ADMIN_AUTHOR_ID = '00000000-0000-0000-0000-000000000001'`

> ⚠️ **Vấn đề bảo mật:** Guides API không có cơ chế xác thực người dùng. Bất kỳ ai biết API endpoint đều có thể CRUD guides. Việc dùng fixed `ADMIN_AUTHOR_ID` thay vì ID thực của admin là một lỗ hổng.

---

## 7. Các file quan trọng

### 7.1 File nguồn chính

| File | Vai trò |
|------|---------|
| [lib/admin.ts](file:///c:/dungdibinhluan/lib/admin.ts) | Hệ thống RBAC, kiểm tra role |
| [lib/supabase.ts](file:///c:/dungdibinhluan/lib/supabase.ts) | Supabase admin client (service_role) |
| [utils/supabase/client.ts](file:///c:/dungdibinhluan/utils/supabase/client.ts) | Supabase client (anon key) |
| [app/auth/callback/page.tsx](file:///c:/dungdibinhluan/app/auth/callback/page.tsx) | OAuth callback handler |
| [app/components/Navbar.tsx](file:///c:/dungdibinhluan/app/components/Navbar.tsx) | Navbar + auth UI + admin cache |
| [app/components/CommunityComments.tsx](file:///c:/dungdibinhluan/app/components/CommunityComments.tsx) | Hệ thống bình luận |
| [app/admin/layout.tsx](file:///c:/dungdibinhluan/app/admin/layout.tsx) | Admin layout + auth guard |
| [app/admin/page.tsx](file:///c:/dungdibinhluan/app/admin/page.tsx) | Admin key login |
| [app/admin/login/page.tsx](file:///c:/dungdibinhluan/app/admin/login/page.tsx) | Admin Google OAuth login |
| [app/admin/dashboard/page.tsx](file:///c:/dungdibinhluan/app/admin/dashboard/page.tsx) | Admin dashboard (quản lý mods) |
| [app/admin/community/page.tsx](file:///c:/dungdibinhluan/app/admin/community/page.tsx) | Kiểm duyệt bình luận |
| [app/api/auth/profile-sync/route.ts](file:///c:/dungdibinhluan/app/api/auth/profile-sync/route.ts) | Đồng bộ profile |
| [app/api/auth/admin-session/route.ts](file:///c:/dungdibinhluan/app/api/auth/admin-session/route.ts) | Admin session cookie |
| [app/api/community/route.ts](file:///c:/dungdibinhluan/app/api/community/route.ts) | API bình luận (GET/POST) |
| [app/api/admin/community/route.ts](file:///c:/dungdibinhluan/app/api/admin/community/route.ts) | API kiểm duyệt (GET/PATCH/DELETE) |
| [app/api/admin/verify/route.ts](file:///c:/dungdibinhluan/app/api/admin/verify/route.ts) | Verify admin key |
| [supabase-schema.sql](file:///c:/dungdibinhluan/supabase-schema.sql) | Schema database |
| [user_roles_guide.md](file:///c:/dungdibinhluan/user_roles_guide.md) | Hướng dẫn quản lý role |

---

## 8. Nhận xét & Đánh giá

### 8.1 Điểm mạnh ✅

1. **RBAC linh hoạt:** Hệ thống `user_roles` cho phép thêm role mới mà không cần sửa code, hỗ trợ đa role trên một user.

2. **Tự động tạo profile:** Trigger `on_auth_user_created` đảm bảo mỗi user luôn có profile tương ứng, giảm thiểu edge case.

3. **Optimistic UI cho bình luận:** Bình luận hiển thị ngay lập tức cho người dùng, cải thiện trải nghiệm.

4. **Admin session cookie:** Dùng httpOnly cookie để lưu trạng thái admin, an toàn hơn localStorage.

5. **Caching admin status:** Navbar dùng `localStorage` cache + static check để hiển thị nhanh trạng thái admin (0ms latency).

6. **Tách biệt client/server Supabase:** Dùng `anon key` cho client, `service_role key` cho server.

### 8.2 Điểm yếu & Rủi ro ⚠️

1. **Không có đăng ký email/password:**
   - Chỉ hỗ trợ Google OAuth → hạn chế người dùng không có tài khoản Google
   - Không có fallback nếu Google OAuth gặp sự cố

2. **Không có trang profile công khai:**
   - Người dùng không thể xem hoặc chỉnh sửa profile
   - Không có avatar/username tùy chỉnh (chỉ lấy từ Google)

3. **Admin comment vẫn bị set `status = 'pending'`:**
   - Trong [app/api/community/route.ts](file:///c:/dungdibinhluan/app/api/community/route.ts#L102), tất cả comment đều có `status: "pending"`, kể cả admin
   - Frontend hiển thị như đã approved (optimistic), nhưng thực tế admin phải tự duyệt comment của mình

4. **Guides API không có xác thực:**
   - [lib/server/guides.ts](file:///c:/dungdibinhluan/lib/server/guides.ts#L16) dùng hardcoded `ADMIN_AUTHOR_ID = '00000000-0000-0000-0000-000000000001'`
   - Guides API không kiểm tra Bearer token hay quyền admin
   - Ai cũng có thể gửi POST/PUT/DELETE đến `/api/admin/guides`

5. **Admin Panel double authentication phức tạp:**
   - Cần nhập admin key + đăng nhập Google để sử dụng đầy đủ
   - SessionStorage dễ bị mất khi đóng tab
   - Google OAuth redirect flow có thể gây mất context

6. **VIP và Moderator role chưa được sử dụng:**
   - Đã định nghĩa trong type và DB nhưng không có code nào kiểm tra các role này
   - `hasAnyRole` có tồn tại nhưng không được gọi ở đâu cho vip/moderator

7. **Thiếu rate limiting:**
   - API bình luận không có giới hạn tần suất gửi
   - API admin verify không có chống brute-force

8. **Không có thông báo cho người dùng:**
   - Khi bình luận được duyệt/từ chối, không có thông báo nào
   - Không có email notification

9. **Static admin email hardcoded:**
   - `dungba66@gmail.com` trong [lib/admin.ts](file:///c:/dungdibinhluan/lib/admin.ts#L7) và [Navbar.tsx](file:///c:/dungdibinhluan/app/components/Navbar.tsx#L67)
   - Khó bảo trì khi cần đổi email admin

10. **Thiếu input sanitization:**
    - Nội dung bình luận chỉ kiểm tra độ dài (2-2000 ký tự), không lọc HTML/script
    - Có nguy cơ XSS nếu render không an toàn

---

## 9. Đề xuất cải thiện

### 9.1 Ưu tiên cao 🔴

| STT | Đề xuất | Chi tiết | Impact |
|-----|---------|----------|--------|
| 1 | **Thêm xác thực cho Guides API** | Thêm `ensureAdmin()` middleware vào tất cả endpoint guides (POST/PUT/DELETE), loại bỏ hardcoded `ADMIN_AUTHOR_ID`, dùng `auth.uid()` thực tế | Bảo mật |
| 2 | **Fix admin comment auto-approve** | Trong [community/route.ts](file:///c:/dungdibinhluan/app/api/community/route.ts#L102), đổi `status: "pending"` thành `status: isAdmin ? "approved" : "pending"` | Trải nghiệm |
| 3 | **Thêm rate limiting** | Áp dụng rate limit cho `/api/community` POST (vd: 5 comments/phút/user), `/api/admin/verify` (5 lần/IP) | Bảo mật |
| 4 | **Chống XSS cho bình luận** | Dùng thư viện như `DOMPurify` để sanitize nội dung bình luận trước khi lưu và hiển thị | Bảo mật |

### 9.2 Ưu tiên trung bình 🟡

| STT | Đề xuất | Chi tiết | Impact |
|-----|---------|----------|--------|
| 5 | **Thêm đăng ký email/password** | Bật Supabase email auth provider, tạo trang đăng ký/đăng nhập với email | UX |
| 6 | **Trang profile người dùng** | Tạo `/profile` hoặc `/user/[id]` để hiển thị avatar, tên, danh sách bình luận, cho phép edit username | UX |
| 7 | **Hiện thực hóa VIP role** | Thêm quyền cho VIP: bình luận tự động approve, tải mod không giới hạn, hiển thị badge VIP cạnh tên | Tính năng |
| 8 | **Thông báo khi bình luận được duyệt** | Gửi toast/notification khi admin duyệt/từ chối bình luận (có thể dùng Supabase Realtime) | UX |
| 9 | **Đơn giản hóa Admin auth** | Gộp 2 bước xác thực admin thành 1: Google OAuth + check admin email, bỏ admin key | DX |

### 9.3 Ưu tiên thấp 🟢

| STT | Đề xuất | Chi tiết | Impact |
|-----|---------|----------|--------|
| 10 | **Admin audit log** | Ghi log các hành động admin: ai duyệt/từ chối comment nào, thời gian | Quản trị |
| 11 | **User activity history** | Lưu lịch sử bình luận, download của user để phân tích | Phân tích |
| 12 | **Role management UI** | Tạo giao diện quản lý role trong admin panel thay vì phải dùng SQL | DX |
| 13 | **Avatar upload** | Cho phép user upload avatar thay vì chỉ dùng ảnh Google | UX |
| 14 | **Email notification** | Gửi email khi có reply, khi bình luận được duyệt | UX |
| 15 | **Ban/Block user** | Thêm khả năng chặn user vi phạm, quản lý danh sách chặn | Quản trị |

### 9.4 Code Refactoring đề xuất

1. **Tách Admin API middleware:** Tạo `ensureAdmin()` dùng chung thay vì copy-paste ở nhiều file API ([community/route.ts](file:///c:/dungdibinhluan/app/api/admin/community/route.ts#L19-L32), [pending-comments/route.ts](file:///c:/dungdibinhluan/app/api/admin/pending-comments/route.ts#L7-L20))

2. **Loại bỏ hardcoded email admin:** Chuyển tất cả static admin emails vào biến môi trường `ADMIN_EMAILS`, xóa `dungba66@gmail.com` khỏi code.

3. **Dùng cookie thay sessionStorage cho admin auth:** SessionStorage không tồn tại qua các tab. Nên dùng httpOnly cookie hoặc Supabase session để kiểm tra admin.

4. **Tách component auth logic ra custom hook:** Cả Navbar và CommunityComments đều có logic kiểm tra admin giống nhau → tạo `useAdmin()` hook.

---

## 10. Kết luận

Hệ thống member của **dungdibinhluan** có nền tảng khá tốt với Supabase Auth + RBAC linh hoạt. Các tính năng cốt lõi (đăng nhập Google, bình luận, admin panel) đều hoạt động ổn định.

Tuy nhiên, còn một số **lỗ hổng bảo mật nghiêm trọng** cần khắc phục ngay:
- Guides API không có xác thực
- Admin comment không được auto-approve đúng cách
- Thiếu rate limiting và XSS protection

Đồng thời, nhiều **tính năng đã được lên kế hoạch** (VIP, moderator roles) nhưng chưa được hiện thực hóa trong code. Việc bổ sung các tính năng này sẽ giúp hệ thống member hoàn thiện và chuyên nghiệp hơn.

**Điểm tổng quan:** 6.5/10 - Hệ thống hoạt động được nhưng cần cải thiện bảo mật và bổ sung tính năng.
