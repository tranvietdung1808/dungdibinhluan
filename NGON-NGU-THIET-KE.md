# Ngôn Ngữ Thiết Kế — DungDiBinhLuan (FC 26 Mod)

> Tài liệu phục vụ họp team: tổng hợp design language hiện tại của **account dashboard (đã migrate)** và **admin (chưa migrate)**, kèm điểm mâu thuẫn cần tinh chỉnh.
> Trạng thái: 2026-08-31 · Codebase: `app/globals.css`, `app/account/**`, `app/admin/**`, `app/components/Navbar.tsx`

---

## 1. Concept Tổng Quan

**Creative North Star: "The VIP Arcade Booth"**

Website như một gian booth premium trong khu game arcade sau giờ tối: nền tối tự nhiên, nhưng mọi bề mặt tương tác đều **solid, phân lớp, ấm — không bao giờ đen phẳng**. Chiều sâu được tạo bằng **3 lớp surface** (page → card → raised/hover) thay vì border/glow trang trí.

- **Coral `#f06078` = làn VIP**: chỉ xuất hiện ở khoảnh khắc chuyển đổi/giá trị — nút mua, nâng cấp, vương miện membership, badge VIP, focus ring. Giống "dây rào VIP".
- **Violet `#8f7bf7` = làn sở hữu**: dành cho profile, mod library, unlock — nội dung "bạn đang sở hữu / có thể mở khóa".
- **Nguyên tắc 2 làn**: coral và violet **không bao giờ chung một interaction surface**. Trả tiền = coral, sở hữu = violet.

**Tính cách:** Tần số cao, dày, tự tin. Typography nặng (900/700) + tracking chặt; micro-label uppercase tracking rộng. Motion tiết chế (150ms color transition). Mọi trạng thái (loading/error/empty) là một khoảnh khắc được thiết kế với copy + hành động tiếp theo.

---

## 2. Design Tokens (globals.css)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--color-surface-0` | `#0c0e13` | Nền page, nền input |
| `--color-surface-1` | `#151922` | Card thường (resting) |
| `--color-surface-2` | `#1d2330` | Raised / hover, sidebar active, skeleton |
| `--color-line` | `rgba(255,255,255,0.08)` | Hairline border (raised: 0.12) |
| `--color-title` | `#f4f5f7` | Tiêu đề, giá trị lớn |
| `--color-body` | `#b6bcc9` | Text mặc định / đọc |
| `--color-muted` | `#7c8494` | Label, hint, metadata, timestamp |
| `--color-coral` | `#f06078` | **Primary accent — CTA & VIP** |
| `--color-coral-strong` | `#e14a68` | Hover của coral |
| `--color-violet` | `#8f7bf7` | **Secondary accent — profile & mod** |
| `--color-ok` | `#3ddc97` | Thành công, active plan |
| `--color-warn` | `#f4b860` | Cảnh báo, pending |
| `--color-danger` | `#f45d6a` | Hủy diệt, lỗi, danger zone |

### Surface helpers (`@utility` — dùng kèm `hover:`/`group-hover:`)

```
surface-0      → nền page (surface-0 + border line)
surface-card   → card thường (surface-1 + border line + shadow nhẹ)
surface-raised → raised/hover (surface-2 + border white/12 + shadow sâu)
text-title / text-body / text-muted
```

### Typography

- **Display** (Be Vietnam Pro, 900, clamp 1.5–2rem, lh 1.1, tracking -0.02em): giá trị hero — số membership, stat lớn
- **Headline** (700, 1.5rem, lh 1.2): tiêu đề section ("Gói membership")
- **Title** (700, 1.125rem, lh 1.25): tiêu đề card, tên plan
- **Body** (400, 0.875rem, lh 1.625, ~65ch): mô tả, list item
- **Label** (900, 0.6875rem, lh 1.2, tracking 0.06em, UPPERCASE): micro-label metadata

---

## 3. Button System (account/ui.tsx — CHUẨN MỚI)

**Base:** `rounded-xl font-bold transition-colors duration-150 disabled:opacity-40`

| Variant | Class | Dùng cho |
|---|---|---|
| `primary` | `bg-coral text-white hover:bg-coral-strong` + coral glow shadow | CTA chính, submit, nâng cấp |
| `secondary` | `bg-surface-2 text-title border-line hover:bg-surface-1 hover:border-white/20` | Hành động phụ |
| `ghost` | `text-body hover:text-title hover:bg-surface-2` | Link-action, icon |
| `danger` | `bg-danger/10 text-danger border-danger/25 hover:bg-danger/20` | Xóa, thu hồi |
| `violet` | `bg-violet/15 text-violet border-violet/25 hover:bg-violet/25` | Mod / unlock |

**Size:** `sm` px-3 py-1.5 text-xs · `md` px-4 py-2.5 text-sm · `lg` px-6 py-3 text-sm

### Badge

`rounded-lg text-[11px] font-black uppercase tracking-wide border` + fill tone 12% / border tone 25%.
Tones: `coral | violet | ok | warn | danger | neutral` (neutral: white/6 fill, body text, white/12 border).

### Input

`bg-surface-0 border-line rounded-xl px-4 py-2.5 text-title placeholder:text-muted` — focus: `border-coral + ring-coral/20`. Lỗi: `border-danger/50 + ring-danger/25` + message `role="alert"`.

### Shadow Vocabulary

- Card: `0 10px 30px -18px rgba(0,0,0,0.7)`
- Raised: `0 16px 40px -20px rgba(0,0,0,0.8)`
- **Coral glow duy nhất**: `0 8px 24px -12px rgba(240,96,120,0.55)` — chỉ CTA primary + VIP crown tile

### Radius

- `rounded-xl` (12px): buttons, inputs, nav items
- `rounded-2xl` (16px): cards, membership hero
- `rounded-lg` (6px): badges, focus outline

---

## 4. Navbar (public — ĐÃ MIGRATE)

- Fixed top: `bg-surface-0/70 backdrop-blur-xl border-line`, h-14/md:h-16
- Logo tròn `ring-coral/40`, brand + tagline `text-muted tracking-[0.3em]`
- Nav links: `text-muted hover:text-white hover:bg-surface-2 rounded-lg`
- CTA "TẢI NGAY": **coral filled + glow**
- Auth (account/admin): `border-coral/40 bg-coral/15 hover:bg-coral/25`
- Logout: `border-line bg-surface-1`
- Mobile: hamburger `bg-surface-1 border-line` → dropdown `bg-surface-0/95`

---

## 5. Account Dashboard (ĐÃ MIGRATE — chuẩn mới)

**Layout:** sidebar desktop sticky 240px (dưới lg → tab rail ngang scroll), 6 tabs: overview, profile, orders, library, membership, security. `role=tablist` + arrow-key.

- **Focal point:** MembershipHero — active VIP (raised + coral/25 border + crown tile + time-bar) ; non-VIP (coral CTA "Nâng cấp lên VIP" → payment)
- **StatCard:** icon accent (coral=vip / violet=mod / ok=active) + `text-xl font-black` value + uppercase label
- **Orders:** desktop table / mobile compact cards + OrderDetailModal (drawer, ESC, auto-focus)
- **Mod library:** grid, accent violet
- **Empty state:** mọi list = 0 đều có copy + CTA
- **Loading:** Skeleton `animate-pulse bg-surface-2/80` · Error: ErrorState + retry

---

## 6. Admin (CHƯA MIGRATE — hệ cũ) + Mapping

| Hạng mục | Admin hiện tại | Account mới (chuẩn) |
|---|---|---|
| Page bg | `bg-[#0a0a0a]` | `surface-0` `#0c0e13` |
| Card | `bg-[#111111]` flat + `border-white/10` | `surface-card` (3 lớp + shadow) |
| Accent chính | `--color-primary` `#ce5a67` | **coral `#f06078`** |
| VIP | **amber** (`amber-500`) | **coral** (VIP = coral theo semantics) |
| Buttons | inline thủ công lặp lại | `Button` component 5 variants |
| Text | `slate-400/500` | `text-muted / text-body / text-title` |
| Badge role | `red/amber/blue/slate` (role-based) | tone-based: `coral/violet/ok/warn/danger` |
| Loading | spinner thủ công | Skeleton |
| Toast | `green-500/90` | (chưa có chuẩn — cần quyết định) |

**Điểm mâu thuẫn cần team quyết định:**

1. **Accent admin**: giữ màu riêng cho admin (ví dụ: admin = một màu quản trị) hay thống nhất coral toàn site?
2. **VIP màu**: account dùng coral cho VIP, admin đang dùng amber — chọn 1 (đề xuất: coral).
3. **Badge role admin** (`admin/vip/moderator/user`): giữ màu theo role (red/amber/blue) hay map sang tone system (`coral/violet/ok/neutral`)?
4. **Toast/confirm**: account không có toast chuẩn; admin dùng `confirm()` + toast xanh — có đưa vào design system chung?
5. **Pane collapsible admin** (Quản lý Member, Membership VIP, Thêm Mod): giữ kiểu `bg-[#111117] border accent/20` hay đổi sang `surface-card + accent-border/25`?

---

## 7. Luật Bất Biến (Do / Don't)

### Do
- ✅ Phân lớp chiều sâu bằng 3 surface (0 → card → raised), không lồng card trong card
- ✅ Coral chỉ cho conversion/value (mua, nâng cấp, VIP); violet chỉ cho ownership (profile, mods, unlocks)
- ✅ Mọi list rỗng / stat = 0 đều có copy giải thích + CTA
- ✅ Micro-label metadata: uppercase font-black 11px tracking 0.06em
- ✅ Focus-visible coral 2px / offset 2px trên mọi element tương tác
- ✅ Hairline border 8% white (12% raised) — structure, không trang trí
- ✅ Tôn trọng reduced motion (animation co về ~0.01ms, chức năng giữ nguyên)

### Don't
- ❌ Nền đen phẳng / text xám thuần — luôn pha vào nền navy tối
- ❌ Glow ngoài CTA coral, crown tile, khoảnh khắc VIP
- ❌ Glassmorphism trên account surfaces
- ❌ Gradient/animation nền chồng chéo — hệ thống là layered-lift, không phải liquid
- ❌ Trộn coral + violet trên một element
- ❌ Tràn ngang dưới 320px — scroll ngang chỉ ở tab strip mobile
- ❌ Easing bounce/elastic — chỉ 150ms color shift

---

## 8. Trạng thái chuyển đổi (Migration Status)

| Khu vực | Trạng thái |
|---|---|
| `app/account/**` (overview, profile, orders, library, membership, security) | ✅ Migrated đầy đủ |
| `app/components/Navbar.tsx` | ✅ Migrated |
| `app/mods/mix-mods-fc26/payment/page.tsx` | ✅ Migrated |
| `app/admin/**` (dashboard, mods, guides, community, generate, scraper) | ⏳ Chưa migrate |
| `app/page.tsx` (home), `app/mods/*`, `app/huong-dan/*` | ⏳ Chưa migrate (chờ quyết định) |

---

*File này sinh từ codebase thực tế — tham chiếu: `app/globals.css`, `app/account/components/ui.tsx`, `app/account/components/DashboardLayout.tsx`, `app/components/Navbar.tsx`, `app/admin/dashboard/page.tsx`, `DESIGN.md`.*