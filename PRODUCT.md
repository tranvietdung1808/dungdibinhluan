# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Game thủ Việt Nam chơi EA FC 26** (người dùng chính): tải mod mặt cầu thủ (faces), bộ kit, chỉnh gameplay để làm tựa game thêm mới lạ, chân thực.
- **Game thủ mọi quốc gia**: cùng cộng đồng FC 26, tìm kho mod phong phú, cập nhật liên tục.
- **Player mua mod trả phí**: sẵn sàng chi trả qua membership/VIP/access code để mở khoá mod cao cấp, tải nhanh và ổn định.

## Product Purpose

DungDiBinhLuan là hub phân phối mod EA FC 26: giúp game thủ tìm, thanh toán và tải các bản mod (faces, kits, gameplay) nhanh chóng. Thành công = người chơi tìm được mod mình cần, trả phí gói membership/interactive để mở khoá nội dung premium, và tải về không lỗi, không nghẽn.

## Positioning

Kho mod đầy đủ và cập nhật theo bản game mới + cơ chế khoá nội dung linh hoạt (access code / membership / VIP) + phân phối file nhanh, ổn định (presigned URL qua R2/S3, không bị chặn hotlink). Đây là tổ hợp mà mod hub FC khác khó copy trọn vẹn cùng lúc.

## Operating Context

- Người dùng truy cập từ desktop lẫn mobile, tốc độ mạng Việt Nam đa dạng.
- Luồng chính: vào trang chủ/mod catalog → xem mod detail → chọn gói/payment → download hoặc nhập access code.
- Luồng tài khoản: đăng nhập (Google OAuth qua Supabase) → account dashboard (overview, profile, orders, unlocked mods, membership, security).
- Admin quản trị mod, guide, community, generate code qua `app/admin/*` — có ACTION_ADMIN_SECRET.
- Nội dung đăng tải và giao diện đều bằng tiếng Việt, giọng văn thân thiện với game thủ.

## Capabilities and Constraints

- Next.js 16 App Router + React 19, TypeScript; styling Tailwind CSS v4.
- Supabase (PostgreSQL) cho auth, mod metadata, membership (`membership_plans`, `subscriptions`, `payment_transactions`), unlocked mods (`mod_access`).
- File lớn lưu ở Cloudflare R2 / AWS S3; presigned URL TTL 1 giờ qua `/api/download`.
- Upstash Redis cho rate limiting + hệ thống access code (`/api/gen-code`).
- Thanh toán qua PAYOS (`/api/payment/*`), có transaction lưu trong Supabase.
- Hỗ trợ static mod (hardcode trong `app/data/`) và dynamic mod (Supabase) — routing phân giải ưu tiên static trước.
- RLS bảo vệ toàn bộ bảng; write chỉ qua service_role hoặc owner.
- Deploy trên Vercel.

## Brand Commitments

- Tên thương hiệu: **DungDiBinhLuan** (giữ nguyên tên miền, brand, cấu trúc kênh hiện tại).
- Ngôn ngữ: **Tiếng Việt**, giọng văn thân thiện, gần gũi game thủ.
- Design direction (đã xác nhận từ người dùng): **premium dark gaming SaaS** — bỏ nền đen phẳng, cảm giác admin template; 3 lớp surface (page background / card / raised-hover); **coral/pink** accent chính cho CTA/VIP; **violet** accent phụ cho profile/mod; không lạm dụng glow, glassmorphism, gradient, border, animation; membership card/hero là focal point; bắt buộc loading, error, hover, focus-visible, keyboard a11y, reduced motion, responsive từ 320px, không horizontal overflow; data luôn lấy từ API/config không hard-code.

## Evidence on Hand

- README.md — kiến trúc, luồng data, setup, các quyết định thiết kế (đã đọc).
- package.json — stack chính xác (Next.js 16.1.6, React 19.2.3, Tailwind v4, Supabase, PAYOS, Upstash, AWS S3).
- supabase/migrations/add_membership_tables.sql — schema `membership_plans`, `subscriptions`, `payment_transactions`.
- app/* — toàn bộ routes hiện có (mods, games/fc26, account, admin, huong-dan, payment…).
- Chưa có testimonials, case study, press, hay assets marketing đi kèm — không được bịa thêm.

## Product Principles

1. **Tốc độ là trải nghiệm**: file lớn phải tải nhanh, ổn định, không bị chặn — mọi thứ khác phục vụ mục tiêu này.
2. **Nội dung premium thật sự đáng tiền**: membership/VIP/access code phải mở được giá trị rõ ràng; copy và CTA khi danh sách rỗng phải hướng dẫn người dùng hành động tiếp.
3. **Giọng Việt, thân thiện**: mọi copy UI phải tiếng Việt tự nhiên, gần gũi game thủ, không máy móc.
4. **Đáng tin về kỹ thuật**: loading/error/empty state, focus-visible, keyboard a11y, reduced motion, responsive từ 320px — là tiêu chuẩn, không phải tuỳ chọn.
5. **Một ngôn ngữ thiết kế 3 lớp surface**: thống nhất toàn bộ surface public (mods, payment) lẫn product UI (account, admin) để không lệch cảm nhận brand.

## Accessibility & Inclusion

- Hỗ trợ keyboard operability và focus-visible rõ ràng trên mọi interactive element.
- Tôn trọng `prefers-reduced-motion`.
- Responsive từ 320px, không horizontal overflow, đặc biệt trên mobile tại thị trường Việt Nam.