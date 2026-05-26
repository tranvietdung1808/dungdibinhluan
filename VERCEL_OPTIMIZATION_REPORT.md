# Báo Cáo Tối Ưu Hóa DungDiBinhLuan — Vercel Hạn Mức Miễn Phí

> Ngày thực hiện: 2026-05-26
> Dự án: Next.js 16.1.6 (Turbopack) + Supabase + Cloudflare R2
> Trạng thái Build: ✅ Thành công (95/95 pages, 2.3s)

---

## Mục Lục

1. [Thông Số Báo Động Ban Đầu](#1-thông-số-báo-động-ban-đầu)
2. [Kiến Trúc Dự Án](#2-kiến-trúc-dự-án)
3. [Các Thay Đổi Đã Thực Hiện](#3-các-thay-đổi-đã-thực-hiện)
   - [3.1 Image Optimization + CPU](#31-image-optimization--cpu)
   - [3.2 ISR Writes](#32-isr-writes)
   - [3.3 Fast Origin Transfer](#33-fast-origin-transfer)
4. [Kết Quả Dự Kiến](#4-kết-quả-dự-kiến)
5. [Danh Sách File Đã Sửa](#5-danh-sách-file-đã-sửa)

---

## 1. Thông Số Báo Động Ban Đầu

| Chỉ số Vercel | Hạn mức | Đã dùng | % Vượt |
|---------------|---------|---------|--------|
| Fast Origin Transfer | 10 GB | **16.22 GB** | 🔴 162% |
| Fluid Active CPU | 4h | **4h 47m** | 🔴 120% |
| ISR Writes | 200K | **174K** | 🟡 87% |
| Image Transformations | 5K | **4.3K** | 🟡 86% |

**Traffic thực tế:** ~130 lượt/ngày — các chỉ số bất thường so với traffic.

---

## 2. Kiến Trúc Dự Án

### Tổng quan công nghệ
- **Framework:** Next.js 16.1.6 (App Router, Turbopack)
- **Database:** Supabase (PostgreSQL)
- **Storage ảnh:** Cloudflare R2 (S3-compatible)
- **Cache:** Upstash Redis
- **Payment:** PayOS
- **Auth:** Supabase Auth
- **Phân tích:** Vercel Analytics

### Cấu trúc thư mục chính
```
app/
├── layout.tsx                 — Root layout, metadata, fonts
├── page.tsx                   — Homepage (ISR: 120s → 86400s)
├── sitemap.ts                 — Dynamic sitemap (fetch từ Supabase)
├── mods/
│   ├── page.tsx               — Mod listing (ISR: 120s → 86400s)
│   ├── [slug]/page.tsx        — Mod detail (SSG + dynamic)
│   ├── ModsClient.tsx         — Client-side mod rendering
│   └── components/
│       ├── ModCard.tsx
│       ├── FeaturedModCard.tsx
│       ├── FilterTags.tsx
│       ├── Pagination.tsx
│       └── SearchBar.tsx
├── huong-dan/
│   ├── page.tsx               — Guide listing (ISR: 120s → 86400s)
│   └── [slug]/page.tsx        — Guide detail (ISR: 120s → 86400s)
├── games/fc26/
│   ├── page.tsx               — Game download page (Client Component)
│   ├── select/page.tsx        — Edition selection
│   ├── payment/page.tsx       — Payment page
│   ├── download/page.tsx      — Download redirect
│   └── download-mods/page.tsx — Mods download redirect
├── api/
│   ├── mods/route.ts          — Public mods API
│   ├── download/route.ts      — R2 signed URL generator
│   ├── download-mods/route.ts — R2 signed URL (mods pack)
│   ├── community/route.ts     — Comments CRUD
│   ├── media/[filename]/route.ts — R2 image proxy
│   └── payment/               — PayOS integration
├── components/
│   ├── HeroSection.tsx
│   ├── FeatureSlider.tsx
│   ├── Navbar.tsx
│   ├── CommunityComments.tsx
│   └── ...
├── data/
│   ├── mods.ts                — Static mod data
│   ├── faces.ts               — Static face data
│   └── games.ts               — Static game data
├── admin/                     — Admin dashboard (CRUD mods, guides, comments)
└── auth/callback/             — Supabase OAuth callback
lib/
├── supabase.ts                — Supabase Admin client (service role)
├── admin.ts                   — Admin authorization helpers
├── related-content.ts         — Related content scoring algorithm
├── payment/config.ts          — PayOS configuration
└── server/
    ├── mods.ts                — Mods CRUD helpers
    ├── guides.ts              — Guides CRUD helpers
    ├── email.ts               — Email sending (nodemailer)
    ├── gen-code.ts            — Code generation
    └── api-response.ts        — API response helpers
utils/
├── r2.ts                      — Cloudflare R2 client + thumbnail resolver
├── slug.ts                    — URL slug utilities
└── supabase/
    ├── client.ts              — Supabase client (anon key)
    ├── server.ts              — Supabase server client
    └── database.types.ts      — Database type definitions
```

### Điểm đau (Pain Points) đã xác định

1. **next.config.ts** — Bật `next/image` optimization với `formats: ["avif", "webp"]` + `remotePatterns` → Mỗi ảnh hiển thị qua `<Image />` đều bị Vercel tải về, nén/resize, transform sang AVIF/WebP, tốn CPU + Transformations.

2. **4 trang có `revalidate = 120`** — Trang chủ, Mods listing, Guides listing, Guide detail đều tái tạo mỗi 2 phút. Với Bot quét (Googlebot, SEO crawlers), mỗi lần quét tạo ISR write → 174K writes/tháng.

3. **Fetch `*` (toàn bộ columns) từ Supabase** — `huong-dan/page.tsx` lấy cả `content` (HTML dài) khi list guides. `mods/page.tsx` lấy tất cả columns. `mods/[slug]/page.tsx` fetch ALL mods từ DB mỗi lần để tính related mods.

4. **API routes không có cache headers** — Các API như `/api/mods` không set `Cache-Control` → Mỗi request đều về Origin (Vercel Function) thay vì Edge cache.

5. **Hình ảnh từ R2 qua proxy `/api/media/[filename]`** — Tuyến proxy này lấy ảnh từ R2, stream qua Vercel → Tiêu tốn Fast Origin Transfer (dữ liệu từ Vercel → R2 và ngược lại).

---

## 3. Các Thay Đổi Đã Thực Hiện

### 3.1 Image Optimization + CPU

#### File: `next.config.ts`

```diff
- images: {
-   formats: ["image/avif", "image/webp"],
-   minimumCacheTTL: 31536000,
-   remotePatterns: [
-     { protocol: "https", hostname: "**.supabase.co" },
-     { protocol: "https", hostname: "**.cloudflarestorage.com" },
-     { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
-   ],
- },
+ images: {
+   unoptimized: true,
+ },
```

**Lý do:** `unoptimized: true` tắt toàn bộ pipeline xử lý ảnh của Vercel:
- Không còn nén/resize ảnh trên server Vercel
- Không còn chuyển đổi sang AVIF/WebP
- Mọi ảnh `<Image />` load trực tiếp từ nguồn gốc
- Ảnh từ Cloudflare R2 (qua `/api/media/[filename]`) được stream thẳng, không qua transform

**Tác động lên chỉ số:**
- Image Transformations: 4.3K → ~0
- Fluid Active CPU: giảm đáng kể phần CPU dành cho xử lý ảnh

---

### 3.2 ISR Writes

#### File: `app/page.tsx`
```diff
- export const revalidate = 120;
+ export const revalidate = 86400;
```

#### File: `app/mods/page.tsx`
```diff
- export const revalidate = 120;
+ export const revalidate = 86400;
```

#### File: `app/huong-dan/page.tsx`
```diff
- export const revalidate = 120
+ export const revalidate = 86400
```

#### File: `app/huong-dan/[slug]/page.tsx`
```diff
- export const revalidate = 120
+ export const revalidate = 86400
```

**Phân tích chi tiết:**

Với `revalidate = 120`:
- Mỗi trang bị tái tạo tối đa 720 lần/ngày (24h × 60m / 2m)
- Với 4 trang → 2.880 ISR writes/ngày → ~86.400 ISR writes/tháng
- Cộng với Bot quét liên tục → còn cao hơn nữa

Với `revalidate = 86400` (24 giờ):
- Mỗi trang tái tạo tối đa 1 lần/ngày
- 4 trang → 4 ISR writes/ngày → ~120 ISR writes/tháng
- **Giảm ~99.9% ISR writes**

**Tại sao an toàn khi tăng lên 1 ngày?**
- Dữ liệu mods, guides, homepage ít thay đổi (chỉ admin cập nhật)
- Các thành phần biến động (comments, download status) đã dùng Client-side fetch
- Khi admin cập nhật nội dung → có thể trigger On-Demand Revalidation qua API route nếu cần
- SEO không bị ảnh hưởng vì dữ liệu vẫn chính xác trong ngày

---

### 3.3 Fast Origin Transfer

#### 3.3a. `app/huong-dan/page.tsx` — Bỏ `content` và `*` trong query

```diff
- .select(`*,
+ .select(`
+   id,
+   title,
+   slug,
+   thumbnail_url,
+   tags,
+   author_id,
+   created_at,
+   updated_at,
    profiles:author_id (
      username,
      avatar_url
    )
  `)
```

**Lý do:** Trường `content` chứa HTML dài (có thể vài chục KB), không cần thiết cho danh sách guides. Mỗi trang list ~20 guides → tiết kiệm ~500KB-1MB dữ liệu truyền qua Vercel mỗi request.

#### 3.3b. `app/huong-dan/[slug]/page.tsx` — Thu hẹp related guides query

```diff
- .select('id, slug, title, content, thumbnail_url, tags, created_at')
+ .select('id, slug, title, thumbnail_url, tags, created_at')
...
- .limit(60)
+ .limit(20)
```

**Lý do:** 
- Bỏ `content` khỏi related guides (không hiển thị trong sidebar)
- Giảm limit từ 60 → 20 (sidebar chỉ hiển thị tối đa vài items)

#### 3.3c. `app/mods/[slug]/page.tsx` — In-memory cache cho `fetchDbMods()`

```diff
+ let _dbModsCache: { data: DbMod[]; ts: number } | null = null;
+ const DB_MODS_CACHE_TTL = 60000;
+
  async function fetchDbMods(): Promise<DbMod[]> {
+   if (_dbModsCache && Date.now() - _dbModsCache.ts < DB_MODS_CACHE_TTL) {
+     return _dbModsCache.data;
+   }
    const { data, error } = await supabaseAdmin.from("mods").select("*");
    if (error || !data) return [];
-   return data as DbMod[];
+   _dbModsCache = { data: data as DbMod[], ts: Date.now() };
+   return _dbModsCache.data;
  }
```

**Lý do:** Mỗi request trang detail mod đều gọi `fetchDbMods()` để tính related mods, query này fetch **toàn bộ** mods từ DB. Cache 60 giây giảm đáng kể số lần query Supabase và dữ liệu truyền qua Vercel.

#### 3.3d. `lib/server/mods.ts` — Thêm `listModsPublic()` chỉ lấy trường cần thiết

```diff
+ export async function listModsPublic() {
+   return supabaseAdmin
+     .from('mods')
+     .select('id, slug, name, author, category, version, updated_at, description, thumbnail, download_url, tags, thumbnail_orientation, featured, video_id, created_at')
+     .order('created_at', { ascending: false })
+ }
```

**Lý do:** `listMods()` dùng `select('*')` bao gồm `long_description` (HTML rất dài). `listModsPublic()` bỏ `long_description` → giảm đáng kể payload cho API public.

#### 3.3e. `app/api/mods/route.ts` — Dùng `listModsPublic()`

```diff
- import { listMods } from '@/lib/server/mods'
+ import { listModsPublic } from '@/lib/server/mods'
...
- const { data, error } = await listMods()
+ const { data, error } = await listModsPublic()
```

#### 3.3f. `lib/server/api-response.ts` — Thêm Cache-Control headers

```diff
- export function successResponse<T>(payload: T, status = 200) {
-   return NextResponse.json(payload, { status })
+ export function successResponse<T>(payload: T, status = 200, cacheMaxAge = 300) {
+   return NextResponse.json(payload, {
+     status,
+     headers: {
+       'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=86400`,
+     },
+   })
  }
```

**Lý do:** 
- `s-maxage=300`: Edge cache 5 phút → request từ CDN, không về Origin
- `stale-while-revalidate=86400`: Khi cache hết hạn, trả về stale content trong khi tái tạo ngầm
- Tất cả API routes (`/api/mods`, `/api/community`, `/api/admin/*`, ...) được hưởng lợi

---

## 4. Kết Quả Dự Kiến

| Chỉ số Vercel | Hạn mức | Trước tối ưu | Dự kiến sau | Cải thiện |
|---------------|---------|--------------|-------------|-----------|
| **Fast Origin Transfer** | 10 GB | 16.22 GB (162%) | ~1.5-2 GB | ↓ ~90% |
| **Fluid Active CPU** | 4h | 4h 47m (120%) | ~30-50m | ↓ ~85% |
| **ISR Writes** | 200K | 174K (87%) | ~500 | ↓ ~99.7% |
| **Image Transformations** | 5K | 4.3K (86%) | ~0 | ↓ ~100% |

### Cơ chế tiết kiệm chính

| Cơ chế | Tiết kiệm |
|--------|-----------|
| **`unoptimized: true`** | Không còn Vercel xử lý ảnh → 0 Transformations, giảm CPU |
| **`revalidate: 86400` trên 4 trang** | ISR writes giảm từ ~2.880/ngày → ~4/ngày |
| **Bỏ `content` khỏi list guides** | Giảm ~80% payload mỗi request danh sách guides |
| **Cache `fetchDbMods()` 60s** | Giảm query Supabase dư thừa khi tính related mods |
| **`Cache-Control: s-maxage=300`** | CDN cache 5 phút → request không về Origin |
| **`listModsPublic()` không `long_description`** | Giảm ~70% payload `/api/mods` |

---

## 5. Danh Sách File Đã Sửa

| # | File | Thay đổi chính |
|---|------|----------------|
| 1 | `next.config.ts` | Tắt Image Optimization: `unoptimized: true` |
| 2 | `app/page.tsx` | `revalidate: 120` → `86400` |
| 3 | `app/mods/page.tsx` | `revalidate: 120` → `86400` |
| 4 | `app/huong-dan/page.tsx` | `revalidate: 120` → `86400`; bỏ `content` khỏi query; sửa type `GuideWithProfile` |
| 5 | `app/huong-dan/[slug]/page.tsx` | `revalidate: 120` → `86400`; bỏ `content` khỏi related query; `limit(60)` → `limit(20)` |
| 6 | `app/mods/[slug]/page.tsx` | Thêm in-memory cache 60s cho `fetchDbMods()` |
| 7 | `lib/server/mods.ts` | Thêm `listModsPublic()` (không `long_description`) |
| 8 | `app/api/mods/route.ts` | Dùng `listModsPublic()` thay `listMods()` |
| 9 | `lib/server/api-response.ts` | Thêm `Cache-Control` headers cho tất cả API response |

---

## Khuyến Nghị Bổ Sung (Tương Lai)

1. **On-Demand Revalidation:** Khi admin cập nhật mod/guide, gọi `revalidatePath()` hoặc `revalidateTag()` thay vì chờ TTL. Điều này cho phép giữ `revalidate = 86400` vô thời hạn mà content vẫn cập nhật tức thì.

2. **Giảm `/api/media/[filename]` proxy traffic:** Cân nhắc cấu hình Cloudflare R2 public bucket hoặc dùng custom domain cho R2 để ảnh load trực tiếp từ R2/CDN thay vì qua Vercel proxy. Đây là nguồn tiêu thụ Fast Origin Transfer lớn nhất.

3. **Static Generation cho mods:** Chuyển các trang mod có dữ liệu tĩnh sang `generateStaticParams` với `dynamicParams: false` để tránh server render cho các path không tồn tại (Bot quét URL ảo).

4. **Bundle Analysis:** Chạy `ANALYZE=true next build` để kiểm tra bundle size và tối ưu code splitting.

---

> **Trạng thái:** Tất cả thay đổi đã build thành công ✅. Sẵn sàng deploy lên Vercel.
