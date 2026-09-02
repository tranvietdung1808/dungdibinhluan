# DỰ ÁN: BẢN THIẾT KẾ HỆ THỐNG GAME & MOD (SYSTEM BLUEPRINT)

> **Vai trò:** Source of Truth — dành cho tất cả AI Agent đọc và tuân thủ khi viết code.
> **Ngày tạo:** 2026-09-01
> **Tên dự án:** DungDiBinhLuan — Nền tảng chia sẻ Mod/Patch/Customization cho Game (FC 26, FIFA, EA Sports FC)

---

## 1. Tech Stack & Infrastructure

### Frontend / Fullstack
| Lớp | Công nghệ | Phiên bản |
|-----|-----------|-----------|
| Framework | **Next.js** (App Router) | `16.1.6` |
| UI Library | **React** | `19.2.3` |
| Ngôn ngữ | **TypeScript** | `^5` |
| Styling | **Tailwind CSS** | `^4` (+ `@tailwindcss/postcss`) |
| Rich Text Editor | **Tiptap** | `^3.20.4` |
| Font | Be Vietnam Pro (Google Fonts) | — |
| Analytics | **@vercel/analytics** | `^2.0.0` |

### Backend & API
| Lớp | Công nghệ |
|-----|-----------|
| Runtime | Next.js API Routes (Edge + Node.js) |
| AI | **DeepSeek** (qua OpenAI SDK) — dùng cho Scraper dịch & phân loại nội dung |
| AI (phụ) | **@google/generative-ai** — dự phòng |
| Email | **Nodemailer** — gửi mã code sau thanh toán |
| Web Scraping | **Cheerio** — cào bài viết mod từ nguồn ngoài |

### Database & ORM
| Lớp | Công nghệ |
|-----|-----------|
| Database chính | **Supabase (PostgreSQL)** hosting cloud |
| Client SDK | `@supabase/supabase-js` + `@supabase/ssr` |
| Caching / KV | **Upstash Redis** (`@upstash/redis`) — dùng cho mã code thanh toán, session cache |
| Schema migration | File SQL thủ công (`supabase-schema.sql`, `supabase/migrations/`) |
| **Không dùng Prisma/Drizzle** — query trực tiếp qua Supabase client |

### Lưu trữ & Phân phối File (Storage & CDN)
| Lớp | Công nghệ |
|-----|-----------|
| Object Storage | **Cloudflare R2** (tương thích S3 API, qua `@aws-sdk/client-s3`) |
| Public URL / Proxy | **`/api/media/[filename]`** — proxy R2 về cùng origin, không cần bucket public |
| File tải game | Sinh **Presigned URL** từ R2 (có thời hạn 1 giờ) qua 3 endpoint: `/api/download`, `/api/download-mods`, `/api/download-tool` |
| Bucket chính | `dungdibinhluan-images` (ảnh, thumbnail) |
| Bucket game | `fc26download` (file game `.rar`, `.zip`) |
| Ảnh thumbnail | Lưu DB dạng path `/api/media/<key>`, resolve tự động qua `resolveThumbnailSrc()` |

### Hosting & DNS
| Lớp | Chi tiết |
|-----|----------|
| Hosting | **Vercel** (tên miền `dungdibinhluan.com`) |
| DNS | Trỏ về Vercel |
| Dev port | `5000` (custom) |

---

## 2. Directory Structure (Sơ đồ thư mục lõi)

```
c:\dungdibinhluan/
├── app/                              # Next.js App Router — toàn bộ giao diện & API
│   ├── layout.tsx                    # Root layout: font, metadata SEO, Navbar, Analytics
│   ├── page.tsx                      # Homepage
│   ├── globals.css                   # Tailwind v4 + @theme inline
│   ├── sitemap.ts                    # Sitemap XML generator
│   ├── components/                   # Shared UI components (Navbar, Hero, useAuth hook...)
│   │   └── useAuth.ts               # Shared auth hook (user state, admin check, login/logout)
│   ├── data/                         # Dữ liệu tĩnh (faces, games, mods hardcoded)
│   ├── api/                          # API Routes (backend logic)
│   │   ├── mods/                     # Public API: danh sách & chi tiết mod
│   │   ├── community/                # API bình luận (GET/POST)
│   │   ├── download/                 # Presigned URL cho game FC26.rar
│   │   ├── download-mods/            # Presigned URL cho FC26-MODS.rar
│   │   ├── download-tool/            # Presigned URL cho ClientTool.zip
│   │   ├── media/[filename]/         # Proxy ảnh từ R2 (cache 1 năm)
│   │   ├── payment/                  # PayOS — create order, webhook, success/cancel
│   │   ├── gen-code/                 # Admin tạo mã code tải game
│   │   ├── verify-code/              # Người dùng xác thực mã code
│   │   ├── auth/                     # Admin session sync
│   │   └── admin/                    # Admin CRUD: mods, guides, scraper, memberships...
│   ├── admin/                        # Admin dashboard pages
│   ├── account/                      # Trang tài khoản người dùng
│   ├── games/fc26/                   # Trang game FC26 + download + payment flow
│   ├── mods/                         # Public: danh sách & chi tiết mod + components
│   ├── huong-dan/                    # Public: danh sách & chi tiết hướng dẫn
│   ├── dmca/                         # Trang DMCA
│   ├── payment/                      # Trang cancel/success sau thanh toán
│   └── auth/callback/                # OAuth callback sau Google login
│
├── lib/                              # Business logic shared (server-only)
│   ├── supabase.ts                   # Supabase admin client (service_role key)
│   ├── admin.ts                      # Hệ thống RBAC: roles, cache, checkIsAdminEmail
│   ├── related-content.ts            # NLP tagging: phân loại hướng dẫn & gợi ý nội dung liên quan
│   ├── server/
│   │   ├── auth.ts                   # Auth middleware: token extraction, verify, ensureAdmin
│   │   ├── api-response.ts           # Wrapper chuẩn: errorResponse, successResponse, runRoute
│   │   ├── mods.ts                   # CRUD mod + validation payload
│   │   ├── guides.ts                 # CRUD guide + validation payload
│   │   ├── membership.ts             # Membership logic: grant, revoke, check active subscription
│   │   ├── scraper.ts                # Engine cào bài tự động: scrape + AI translate + publish
│   │   ├── gen-code.ts               # Tạo mã code qua Upstash Redis
│   │   └── email.ts                  # Gửi email chứa mã code
│   └── payment/
│       └── config.ts                 # Cấu hình sản phẩm (FC26 normal, FC26 mods, Mix Mods)
│
├── utils/                            # Shared utilities (server + client)
│   ├── r2.ts                         # R2 client creator + resolveThumbnailSrc + rewriteImageSrcInHtml
│   ├── slug.ts                       # Bỏ dấu tiếng Việt → tạo slug URL
│   └── supabase/
│       ├── client.ts                 # Supabase browser client (anon key)
│       ├── server.ts                 # Supabase server client (anon key)
│       └── database.types.ts         # TypeScript types sinh từ DB schema
│
├── public/                           # Static assets (ảnh game, mod thumbnails, favicon...)
├── scripts/                          # Scripts phụ trợ (load-test-auth.mjs)
├── supabase/migrations/              # SQL migrations (membership tables)
├── supabase-schema.sql               # Schema SQL chính (profiles, guides, mods, comments, roles)
├── next.config.ts                    # Cấu hình Next.js (images.unoptimized = true)
├── tsconfig.json                     # TypeScript config (strict, path alias @/*)
└── package.json                      # Dependencies
```

---

## 3. Core Database Schema & Relationships (ERD)

> **Database:** Supabase PostgreSQL. Không dùng Prisma/Drizzle ORM — query trực tiếp bằng Supabase JS client.

### 3.1 Danh sách Thực thể (Entities)

#### `profiles` — Hồ sơ người dùng
| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | `uuid PK` | FK → `auth.users.id`, CASCADE |
| `username` | `text UNIQUE` | Tên hiển thị |
| `avatar_url` | `text` | URL ảnh đại diện |
| `created_at`, `updated_at` | `timestamptz` | Auto trigger |

#### `mods` — Mod / Patch / Customization
| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | `uuid PK` | |
| `slug` | `text UNIQUE` | URL slug (VD: `facepack-messi`) |
| `name` | `text` | Tên mod |
| `author` | `text` | Tác giả mod |
| `category` | `text` | Mặc định `'Faces'` — các giá trị: Faces, Kits, Gameplay, Đồ họa, Cơ chế game |
| `version` | `text` | Phiên bản (VD: `1.0`, `2.1`) |
| `updated_at` | `text` | Ngày cập nhật (dạng `DD/MM/YYYY`) |
| `description` | `text` | Mô tả ngắn |
| `long_description` | `text` | Mô tả dài (HTML) |
| `thumbnail` | `text` | URL thumbnail (thường là `/api/media/<key>`) |
| `download_url` | `text` | Link tải file mod |
| `tags` | `text[]` | Mảng tag |
| `thumbnail_orientation` | `text` | `portrait` hoặc `landscape` |
| `featured` | `boolean` | Mod nổi bật? |
| `video_id` | `text` | YouTube video ID |
| `created_at` | `timestamptz` | |

#### `guides` — Bài hướng dẫn
| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | `uuid PK` | |
| `title`, `slug` | `text` | Tiêu đề + slug URL |
| `content` | `text` | Nội dung HTML |
| `thumbnail_url` | `text` | Ảnh bìa |
| `tags` | `text[]` | 3 tag cố định: Hướng dẫn mods, Career Mode, Thông tin game |
| `author_id` | `uuid FK` | → `profiles.id`, CASCADE |
| `created_at`, `updated_at` | `timestamptz` | |

#### `community_comments` — Bình luận cộng đồng
| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | `uuid PK` | |
| `scope_type` | `text` | `'guide'` hoặc `'mods'` |
| `scope_id` | `text` | ID của guide hoặc mod |
| `parent_id` | `uuid FK` | → `community_comments.id` (reply), CASCADE |
| `user_id` | `uuid FK` | → `auth.users.id`, SET NULL |
| `author_name` | `text` | Tên hiển thị |
| `author_avatar` | `text` | |
| `content` | `text` | Nội dung (2-2000 ký tự) |
| `is_admin_comment` | `boolean` | |
| `is_pinned` | `boolean` | Ghim? |
| `status` | `text` | `pending` / `approved` / `rejected` |
| `created_at`, `updated_at` | `timestamptz` | |

#### `user_roles` — Phân quyền động (RBAC)
| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | `uuid PK` | |
| `email` | `text` | Email người dùng |
| `role` | `text` | `admin` / `vip` / `moderator` / `user` / custom |
| `note` | `text` | Ghi chú (VD: "VIP đến 2026-12-31") |
| `created_at`, `updated_at` | `timestamptz` | |
| **UNIQUE** | `(email, role)` | Một user có thể có nhiều role |

#### `membership_plans` — Catalog gói membership
| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | `text PK` | Mã gói |
| `name`, `description` | `text` | |
| `price` | `integer` | VNĐ |
| `duration_days` | `integer` | Số ngày hiệu lực |
| `features` | `jsonb` | Danh sách tính năng |
| `is_active` | `boolean` | |
| `sort_order` | `integer` | |

#### `subscriptions` — Đăng ký của user
| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | `uuid PK` | |
| `user_id` | `uuid FK` | → `auth.users.id` |
| `plan_id` | `text FK` | → `membership_plans.id` |
| `status` | `text` | `active` / `expired` / `cancelled` |
| `starts_at`, `expires_at` | `timestamptz` | |
| `granted_by` | `uuid FK` | → `auth.users.id` (admin cấp) |
| `note` | `text` | |

#### `payment_transactions` — Lịch sử thanh toán
| Field | Type | Ghi chú |
|-------|------|---------|
| `id` | `uuid PK` | |
| `user_id` | `uuid FK` | → `auth.users.id` |
| `email` | `text` | |
| `plan_id` | `text FK` | → `membership_plans.id` |
| `order_code` | `bigint UNIQUE` | Mã đơn PayOS |
| `amount` | `integer` | |
| `status` | `text` | `pending` / `paid` / `cancelled` / `failed` |
| `webhook_data` | `jsonb` | Dữ liệu raw từ PayOS |

#### `scraper_sources` & `scraper_items` — Hệ thống cào tự động
| Bảng | Vai trò |
|------|---------|
| `scraper_sources` | Cấu hình nguồn cào: URL, CSS selectors, patterns... |
| `scraper_items` | Bài viết cào được, chờ duyệt → publish vào `mods` |

### 3.2 Mối quan hệ (Relationships)

```
auth.users (Supabase Auth)
  ├── 1:1 ── profiles (id = profiles.id)
  ├── 1:N ── community_comments (user_id)
  ├── 1:N ── subscriptions (user_id)
  └── 1:N ── payment_transactions (user_id)

profiles
  └── 1:N ── guides (author_id)

user_roles (standalone, keyed by email)
  └── Liên kết logic với auth.users qua email

membership_plans
  └── 1:N ── subscriptions (plan_id)
  └── 1:N ── payment_transactions (plan_id)

community_comments
  ├── scoped to (guide | mods) qua (scope_type, scope_id)
  └── 1:N ── self (parent_id → replies)

mods
  └── 1:N ── community_comments (qua scope_type='mods', scope_id=slug)

guides
  ├── 1:N ── community_comments (qua scope_type='guide', scope_id=id)
  └── N:1 ── profiles (author_id)

scraper_sources
  └── 1:N ── scraper_items (source_id)

scraper_items ── publish ──→ mods (khi admin duyệt)
```

---

## 4. Authentication & RBAC (Cơ chế Phân quyền)

### 4.1 Auth Flow

1. **Đăng nhập:** Google OAuth qua Supabase Auth (`supabase.auth.signInWithOAuth({ provider: "google" })`)
2. **Callback:** `/auth/callback` → xử lý session → redirect về trang trước đó
3. **Session:** Supabase SSR — session được duy trì qua cookie
4. **Token verification (API):** Bearer token từ `Authorization` header → `supabaseAdmin.auth.getUser(token)` → cache in-memory 30s
5. **Admin session sync:** Client gọi `POST /api/auth/admin-session` → server verify & set cookie `admin_user`

### 4.2 Ma trận RBAC (Role-Based Access Control)

| Role | Cơ chế xác định | Quyền hạn |
|------|----------------|-----------|
| **Admin** | `STATIC_ADMIN_EMAILS` (hardcode `dungba66@gmail.com` + env `ADMIN_EMAILS`) **HOẶC** có row `user_roles.role = 'admin'` | **Toàn quyền:** quản lý mods, guides, scraper, duyệt bình luận, cấp membership, tạo mã code, cấu hình domain/hosting. Admin comment được auto-approve. |
| **VIP** | Có row `user_roles.role = 'vip'` (tự động gán khi grant membership) | Truy cập nội dung VIP, tải mod premium (membership-based). |
| **Moderator** | Có row `user_roles.role = 'moderator'` | Duyệt bình luận, quản lý nội dung cộng đồng (đã định nghĩa type, chưa triển khai UI đầy đủ). |
| **Member** (Authenticated) | Đã đăng nhập qua Google OAuth | Bình luận (vào hàng chờ duyệt), tải file, đánh giá. |
| **Guest** (Anon) | Chưa đăng nhập | Xem danh sách mod, đọc bài hướng dẫn, xem bình luận đã duyệt. Không bình luận, không tải file yêu cầu code. |

### 4.3 Cơ chế Cache RBAC

- **Server-side:** In-memory LRU cache TTL 60s cho `checkIsAdminEmail()` để tránh query DB lặp lại
- **Client-side:** `localStorage` cache `isAdmin_{email}` + static admin check tức thì (0ms)
- **Token→User:** In-memory Map cache TTL 30s trong `getUserFromToken()`

---

## 5. Coding Conventions (Quy chuẩn viết code)

### 5.1 Chuẩn hóa API Response

Mọi API route đều dùng wrapper từ [lib/server/api-response.ts](file:///c:/dungdibinhluan/lib/server/api-response.ts):
```typescript
// Pattern chuẩn:
export async function GET() {
  return runRoute(async () => {
    const { data, error } = await someQuery()
    if (error) return errorResponse('Message', 500)
    return successResponse(data)
  })
}
```
- `successResponse(data, status?, cacheMaxAge?)` — luôn set `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400`
- `errorResponse(message, status)` — format `{ error: "message" }`
- `runRoute(handler, fallbackMessage)` — tự động catch lỗi → 500

### 5.2 Validation Payload

Mỗi entity có file validation riêng trong `lib/server/`:
- [mods.ts](file:///c:/dungdibinhluan/lib/server/mods.ts): `REQUIRED_CREATE_MOD_FIELDS`, `missingRequiredModFields()`, `normalizeCreateModPayload()`
- [guides.ts](file:///c:/dungdibinhluan/lib/server/guides.ts): `REQUIRED_GUIDE_FIELDS`, `missingRequiredGuideFields()`, `normalizeGuideInsertPayload()`
- Luôn validate fields bắt buộc trước khi insert/update, trả về danh sách field thiếu.

### 5.3 Xử lý File Upload

- **Validation 2 lớp:** check MIME type (`image/jpeg, image/png, image/gif, image/webp`) + giới hạn **5MB**
- **Tên file:** `<timestamp>-<random>.<ext>` → không dùng tên gốc để tránh collision
- **Path trả về:** `/api/media/<filename>` (cùng origin proxy) → trình duyệt không cần bucket public
- **Ảnh trong HTML:** `rewriteImageSrcInHtml()` tự động map URL R2 → `/api/media/...`
- **Media proxy:** Cache 1 năm (`max-age=31536000, immutable`)

### 5.4 Tối ưu Query Database

- **Chỉ SELECT các cột cần thiết** khi public (VD: [listModsPublic](file:///c:/dungdibinhluan/lib/server/mods.ts#L105-L110) chọn từng cột thay vì `*`)
- **Index đầy đủ:** `slug`, `category`, `featured`, `created_at DESC`, composite index cho `(scope_type, scope_id, created_at DESC)`
- **Phân trang:** ModsClient sử dụng component `Pagination` — query có `order` + phía client tự phân trang
- **Anti-duplicate:** Scraper kiểm tra trùng slug + trùng download_url trước khi insert

### 5.5 Xử lý lỗi

- **Graceful degradation:** Scraper dùng Google Translate fallback → nếu 429 thì chuyển sang DeepSeek AI
- **Không crash toàn bộ:** Mỗi bước cào (fetch, parse, upload ảnh) bọc try-catch riêng, lỗi từng bước không dừng toàn bộ
- **Webhook payment:** Luôn trả `{ success: true }` dù có lỗi (để PayOS không retry vô hạn)

---

## 6. Architectural Review & Risks (Đánh giá từ Chuyên gia)

### 6.1 Điểm nghẽn #1: Presigned URL cho File Game — Không có CDN / Chống Hotlink

**Hiện trạng:** Các file game lớn (`FC26.rar`, `FC26-MODS.rar`, `ClientTool.zip`) được phục vụ qua R2 Presigned URL có thời hạn 1 giờ. Mỗi lần người dùng vào trang download, server phải gọi R2 API để sinh URL mới.

**Rủi ro:**
- Khi có nhiều người tải đồng thời, mỗi request download = 1 lần gọi R2 `GetObjectCommand` + `getSignedUrl`. Đây là bottleneck không cần thiết vì presigned URL có thể cache lại.
- **Hotlink:** Presigned URL có thể bị share ra ngoài — trong 1 giờ, bất kỳ ai có URL đều tải được. Không có cơ chế giới hạn số lượt tải hoặc verify Referrer.
- **Băng thông R2:** Không có CDN layer (Cloudflare Cache, Vercel Edge Cache) phía trước R2. Toàn bộ traffic tải file đi thẳng vào R2.

**Đề xuất khắc phục:**
1. Cache presigned URL trong Redis (TTL ≤ 55 phút, ngắn hơn thời hạn URL) để tránh gọi R2 lặp lại.
2. Bật **Cloudflare CDN** trỏ vào R2 public bucket (nếu có) hoặc dùng **R2 Custom Domain + Cloudflare Cache Rules** để cache file tĩnh tại edge.
3. Thêm **token xác thực lượt tải** (1 token / 1 lượt, verify qua Redis) để chống hotlink và giới hạn số lượt tải.
4. Với file đặc biệt (game .rar), nên stream qua server + check quyền (membership/đã mua) trước khi cho tải, thay vì đưa thẳng presigned URL.

### 6.2 Điểm nghẽn #2: Upload File Mod — Thiếu Quét Mã Độc & Anti-Cheat

**Hiện trạng:** Upload ảnh qua `/api/admin/upload` chỉ validate MIME type và kích thước. File mod thực tế (`.rar`, `.zip`) được upload thủ công lên R2 bởi admin, không có pipeline kiểm tra tự động.

**Rủi ro:**
- **Mã độc:** File `.rar`/`.zip` mod game có thể chứa malware, ransomware, hoặc script độc hại. Không có cơ chế scan virus/malware trước khi publish.
- **Anti-cheat trigger:** Một số mod có thể bị các anti-cheat (EAC, BattlEye) flag là cheat, gây ảnh hưởng đến tài khoản game của người dùng. Hệ thống không có cảnh báo.
- **File đính kèm trong bài viết:** `long_description` là HTML raw, không sanitize `<img>`, `<a>`, `<script>` khi hiển thị — rủi ro XSS nếu scraper cào phải nội dung độc.

**Đề xuất khắc phục:**
1. Tích hợp **ClamAV** hoặc **VirusTotal API** để scan file trước khi publish. Chặn file có detection.
2. Thêm metadata flag `anti_cheat_safe: boolean` cho từng mod, kèm disclaimer tự động.
3. **Sanitize HTML** trong `long_description` bằng `DOMPurify` (server-side) trước khi lưu DB và trước khi render.
4. Pipeline upload tự động: Upload → Scan → Approve → Publish (thay vì upload thẳng R2 rồi quên).

### 6.3 Ghi chú bổ sung

- **Images `unoptimized: true`** trong `next.config.ts` nghĩa là Next.js không resize/optimize ảnh. Với lượng ảnh mod/facepack lớn, nên bật `sharp` + `next/image` với `remotePatterns` cho R2 domain để giảm băng thông.
- **Scraper engine** hiện chạy đồng bộ (tuần tự từng URL) trong API route — với nhiều nguồn, nên chuyển sang queue-based (VD: Upstash QStash) để tránh timeout của Vercel (10s/60s).
- **Không có rate limiting** trên các API public (`/api/mods`, `/api/download/*`) — rủi ro bị spam/abuse.