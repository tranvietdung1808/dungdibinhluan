# Membership System – Thiết kế & Checklist Triển khai

> Dự án: dungdibinhluan.com — Next.js 16 · Supabase · Tailwind CSS · PayOS  
> Cập nhật: 2026-08-27

---

## Phân tích hệ thống hiện tại

### Những gì đang có

| Thành phần | Vị trí | Ghi chú |
|---|---|---|
| `profiles` | `supabase-schema.sql` | Liên kết `auth.users.id`, có username/avatar |
| `user_roles` | `supabase-schema.sql` | Khóa là **email** (không phải user_id), UNIQUE(email, role) |
| `mods`, `guides`, `community_comments` | SQL | Nội dung chính của site |
| PayOS payment | `app/api/payment/` | Tạo link, webhook, lưu order trong Redis TTL 1h |
| Access code | `app/api/gen-code/`, `app/api/verify-code/` | Lưu trong Redis TTL 24h, xác thực bằng ADMIN_SECRET |
| Products | `lib/payment/config.ts` | 3 sản phẩm hard-code: FC26 normal/mods, mix-mods |
| Role check | `lib/admin.ts` | admin/vip/moderator/user, cache 60s |
| Auth middleware | `lib/server/auth.ts` | extractToken, getUserFromToken, ensureAdmin, cache 30s |

### Khoảng trống & vấn đề kiến trúc

- `user_roles` dùng **email làm khóa** → không bền vững khi user đổi email
- Đơn hàng PayOS chỉ lưu **Redis TTL 1h** → không có lịch sử thanh toán vĩnh viễn
- Không có bảng `membership_plans`, `subscriptions`, `entitlements` trong DB
- Access code lưu Redis 24h → không kiểm soát được ai đã dùng code nào
- `user_roles.note` dùng để ghi "VIP đến 2026-12-31" → không có trường `expires_at` thực sự
- Không có RLS policy phân quyền theo membership tier

---

## Database Schema

### Thiết kế mới (chuẩn hóa)

```sql
-- =====================================================
-- BƯỚC 1: Chuẩn hóa user_roles → dùng user_id
-- =====================================================

-- Thêm cột user_id vào user_roles (migration, không xóa email cũ)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Sau khi migrate dữ liệu → đặt NOT NULL + index
-- ALTER TABLE public.user_roles ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);

-- Unique mới theo user_id + role (thay thế UNIQUE(email, role) khi đủ dữ liệu)
-- ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE(user_id, role);

-- =====================================================
-- BƯỚC 2: Membership Plans – catalog gói membership
-- =====================================================

CREATE TABLE IF NOT EXISTS public.membership_plans (
  id          text PRIMARY KEY,                    -- 'vip-monthly', 'vip-yearly', 'mod-pack'
  name        text NOT NULL,                       -- 'VIP Tháng', 'VIP Năm', 'Mod Pack'
  description text,
  price       integer NOT NULL,                    -- VND, đơn vị đồng
  duration_days integer,                           -- NULL = vĩnh viễn (one-time)
  features    jsonb NOT NULL DEFAULT '[]',         -- ["Tải mods không giới hạn", "VIP badge"]
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Dữ liệu mẫu
INSERT INTO public.membership_plans (id, name, price, duration_days, features, sort_order) VALUES
  ('vip-monthly', 'VIP Tháng', 69000, 30, '["Tải mods VIP", "Badge VIP", "Ưu tiên hỗ trợ"]', 1),
  ('vip-yearly',  'VIP Năm',  599000, 365, '["Tải mods VIP", "Badge VIP", "Ưu tiên hỗ trợ", "Tiết kiệm 30%"]', 2),
  ('mod-pack-fc26','FC26 Full Mods', 199000, NULL, '["Tải FC26 Full Mods", "Cập nhật trọn đời"]', 3)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- BƯỚC 3: Subscriptions – trạng thái membership của user
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id       text NOT NULL REFERENCES public.membership_plans(id),
  status        text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  starts_at     timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz,                        -- NULL = không hết hạn
  cancelled_at  timestamptz,
  granted_by    uuid REFERENCES auth.users(id),     -- admin grant thủ công
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx     ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx      ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_expires_at_idx  ON public.subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS subscriptions_user_active_idx ON public.subscriptions(user_id, status)
  WHERE status = 'active';

-- =====================================================
-- BƯỚC 4: Payment Transactions – lịch sử thanh toán vĩnh viễn
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email           text NOT NULL,                    -- backup nếu user xóa
  plan_id         text REFERENCES public.membership_plans(id),
  order_code      bigint UNIQUE NOT NULL,           -- PayOS orderCode
  payment_link_id text,                             -- PayOS paymentLinkId
  amount          integer NOT NULL,                 -- VND
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'cancelled', 'failed', 'refunded')),
  provider        text NOT NULL DEFAULT 'payos',
  webhook_received_at timestamptz,
  subscription_id uuid REFERENCES public.subscriptions(id),
  metadata        jsonb,                            -- raw webhook payload
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pt_user_id_idx    ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS pt_order_code_idx ON public.payment_transactions(order_code);
CREATE INDEX IF NOT EXISTS pt_status_idx     ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS pt_email_idx      ON public.payment_transactions(email);

-- =====================================================
-- BƯỚC 5: Access Codes – lịch sử code, ai dùng, khi nào
-- =====================================================

CREATE TABLE IF NOT EXISTS public.access_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE NOT NULL,
  plan_id         text REFERENCES public.membership_plans(id),
  transaction_id  uuid REFERENCES public.payment_transactions(id),
  used_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at         timestamptz,
  expires_at      timestamptz,                      -- NULL = không hết hạn
  created_by      uuid REFERENCES auth.users(id),   -- admin tạo thủ công
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ac_code_idx    ON public.access_codes(code);
CREATE INDEX IF NOT EXISTS ac_used_by_idx ON public.access_codes(used_by);

-- =====================================================
-- BƯỚC 6: Updated_at triggers cho bảng mới
-- =====================================================

CREATE TRIGGER handle_membership_plans_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

### RLS Policies

```sql
-- membership_plans: public read, service-role write
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans"
  ON public.membership_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Service role manages plans"
  ON public.membership_plans FOR ALL USING (auth.role() = 'service_role');

-- subscriptions: user xem của mình, admin xem tất cả
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User views own subscriptions"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

-- payment_transactions: user xem của mình
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User views own transactions"
  ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages transactions"
  ON public.payment_transactions FOR ALL USING (auth.role() = 'service_role');

-- access_codes: chỉ service role
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages codes"
  ON public.access_codes FOR ALL USING (auth.role() = 'service_role');
```

---

## API Flow

### 1. Luồng mua membership (PayOS)

```
Client                    Next.js API              PayOS              Supabase DB
  │                           │                      │                    │
  │  POST /api/payment/create │                      │                    │
  │  { planId, email, token } │                      │                    │
  │─────────────────────────►│                      │                    │
  │                           │ 1. xác thực token    │                    │
  │                           │ 2. lấy plan từ DB    │                    │
  │                           │ 3. tạo orderCode     │                    │
  │                           │─────────────────────►│                    │
  │                           │                      │ create payment link│
  │                           │◄─────────────────────│                    │
  │                           │ 4. lưu transaction   │                    │
  │                           │   status=pending     │───────────────────►│
  │◄─────────────────────────│                      │                    │
  │  { checkoutUrl, orderId } │                      │                    │
  │                           │                      │                    │
  │  [user thanh toán trên PayOS]                    │                    │
  │                           │                      │                    │
  │                           │◄─────────────────────│                    │
  │                           │  POST /api/payment/webhook               │
  │                           │  { code:"00", orderCode }                │
  │                           │                      │                    │
  │                           │ 5. verify signature  │                    │
  │                           │ 6. check idempotency │───────────────────►│
  │                           │    (transaction paid?)                    │
  │                           │ 7. update transaction status=paid         │
  │                           │ 8. tạo subscription  │───────────────────►│
  │                           │ 9. gán role vip      │───────────────────►│
  │                           │ 10. gửi email xác nhận                   │
```

### 2. Kiểm tra entitlement (server-side)

```typescript
// lib/server/membership.ts
export async function getUserMembership(userId: string) {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*, membership_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}
```

### 3. API Endpoints cần tạo mới

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/membership/plans` | Danh sách gói (public) | None |
| GET | `/api/membership/status` | Trạng thái membership của user | Bearer |
| POST | `/api/payment/create` | (**sửa**) nhận planId thay vì productId | Bearer |
| POST | `/api/payment/webhook` | (**sửa**) lưu vào DB thay vì chỉ Redis | None (signature verify) |
| GET | `/api/payment/order` | Kiểm tra đơn hàng | Bearer |
| POST | `/api/membership/redeem` | Dùng access code để kích hoạt | Bearer |
| GET | `/api/admin/memberships` | Danh sách subscription (admin) | Admin |
| POST | `/api/admin/memberships` | Grant subscription thủ công | Admin |
| PATCH | `/api/admin/memberships/[id]` | Sửa subscription | Admin |
| DELETE | `/api/admin/memberships/[id]` | Thu hồi subscription | Admin |

### 4. Webhook Idempotency

```typescript
// Trong webhook handler
const existing = await supabaseAdmin
  .from('payment_transactions')
  .select('id, status')
  .eq('order_code', orderCode)
  .maybeSingle()

if (existing?.status === 'paid') {
  return NextResponse.json({ success: true }) // idempotent
}

// Atomic update
await supabaseAdmin
  .from('payment_transactions')
  .update({ status: 'paid', webhook_received_at: new Date().toISOString() })
  .eq('order_code', orderCode)
  .eq('status', 'pending') // chỉ update nếu vẫn là pending
```

### 5. Auto-expire subscriptions (Supabase cron job)

```sql
-- Chạy mỗi ngày lúc 2:00 AM UTC qua pg_cron hoặc Edge Function scheduled
UPDATE public.subscriptions
SET status = 'expired', updated_at = now()
WHERE status = 'active'
  AND expires_at IS NOT NULL
  AND expires_at < now();
```

---

## Checklist Triển khai Kỹ thuật

### Phase 1 – Database Migration

- [ ] **1.1** Chạy migration thêm cột `user_id` vào `user_roles`
  ```sql
  ALTER TABLE public.user_roles
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
  ```
- [ ] **1.2** Tạo bảng `membership_plans` + insert dữ liệu mẫu
- [ ] **1.3** Tạo bảng `subscriptions` + indexes
- [ ] **1.4** Tạo bảng `payment_transactions` + indexes
- [ ] **1.5** Tạo bảng `access_codes` + indexes
- [ ] **1.6** Thêm triggers `updated_at` cho 3 bảng mới
- [ ] **1.7** Thêm RLS policies cho cả 4 bảng
- [ ] **1.8** Script migrate `user_roles.email` → fill `user_id` từ `auth.users`
  ```sql
  UPDATE public.user_roles ur
  SET user_id = au.id
  FROM auth.users au
  WHERE lower(au.email) = lower(ur.email)
    AND ur.user_id IS NULL;
  ```
- [ ] **1.9** Chạy `npx tsc --noEmit` để kiểm tra types sau migration

### Phase 2 – Backend API

- [ ] **2.1** Tạo `lib/server/membership.ts`
  - `getUserMembership(userId)` – lấy subscription active
  - `grantMembership(userId, planId, grantedBy?)` – admin grant
  - `revokeMembership(subscriptionId)` – admin revoke
  - `hasActiveMembership(userId, planId?)` – kiểm tra entitlement
- [ ] **2.2** Tạo `lib/server/gen-code.ts` nếu chưa có
  - Generate code prefix theo plan
  - Lưu vào bảng `access_codes` thay vì chỉ Redis
- [ ] **2.3** Sửa `app/api/payment/create/route.ts`
  - Nhận `planId` (thay vì `productId`)
  - Yêu cầu Bearer token (xác thực user)
  - Lưu `payment_transactions` với status `pending`
  - Giữ Redis làm cache phụ, DB là nguồn sự thật chính
- [ ] **2.4** Sửa `app/api/payment/webhook/route.ts`
  - Verify PayOS signature (dùng `checksumKey`)
  - Implement idempotency check từ DB
  - Update `payment_transactions` status → `paid`
  - Gọi `grantMembership()` tạo subscription
  - Gán role `vip` vào `user_roles`
  - Gửi email xác nhận (giữ logic cũ)
  - Vẫn return `{ success: true }` trong mọi trường hợp
- [ ] **2.5** Tạo `app/api/membership/plans/route.ts`
  - GET: trả về `membership_plans` đang active
- [ ] **2.6** Tạo `app/api/membership/status/route.ts`
  - GET: yêu cầu Bearer token
  - Trả về subscription active, plan details, expires_at
- [ ] **2.7** Tạo `app/api/membership/redeem/route.ts`
  - POST: nhận `{ code }` + Bearer token
  - Kiểm tra `access_codes` còn dùng được không
  - Tạo subscription tương ứng
  - Đánh dấu code đã dùng (`used_by`, `used_at`)
- [ ] **2.8** Tạo `app/api/admin/memberships/route.ts`
  - GET: danh sách subscriptions (filter, search, paginate)
  - POST: grant subscription thủ công
- [ ] **2.9** Tạo `app/api/admin/memberships/[id]/route.ts`
  - PATCH: sửa expires_at, status, note
  - DELETE: thu hồi (status = cancelled)

### Phase 3 – Frontend UI

- [ ] **3.1** Trang `/membership` hoặc `/vip`
  - Hiển thị các plan từ `/api/membership/plans`
  - Nút "Mua ngay" → gọi `/api/payment/create`
  - Redirect đến PayOS checkout URL
- [ ] **3.2** Trang `/payment/success`
  - Gọi `/api/payment/order?orderCode=...` polling status
  - Hiển thị thông tin đơn hàng sau khi webhook xử lý xong
  - Nút về trang chủ / trang profile
- [ ] **3.3** Trang `/payment/cancel`
  - Thông báo đơn hàng bị hủy
  - Nút thử lại
- [ ] **3.4** Component `MembershipBadge`
  - Hiển thị badge VIP/Mod Pack trong Navbar và Profile
  - Gọi `/api/membership/status` một lần và cache client-side
- [ ] **3.5** Trang `/profile` hoặc `/account`
  - Hiển thị subscription hiện tại
  - Ngày hết hạn
  - Lịch sử thanh toán
- [ ] **3.6** Form nhập access code
  - Gọi `/api/membership/redeem`
  - Hiển thị kết quả kích hoạt

### Phase 4 – Admin Panel

- [ ] **4.1** Thêm card "Quản lý Membership" vào `app/admin/dashboard/page.tsx`
  - Danh sách subscription (tìm theo email, plan, status)
  - Grant thủ công theo email
  - Sửa ngày hết hạn
  - Thu hồi membership
- [ ] **4.2** Hiển thị lịch sử thanh toán trong admin dashboard
- [ ] **4.3** Thêm tính năng gen access code liên kết với `membership_plans`
  - Chọn plan → gen code → lưu vào `access_codes`
  - Loại bỏ phụ thuộc vào `ADMIN_SECRET` trong `/admin/generate`
  - Dùng Bearer token + `ensureAdmin()` thay thế

### Phase 5 – Kiểm tra & Hoàn thiện

- [ ] **5.1** Kiểm tra PayOS webhook signature đúng theo tài liệu PayOS
- [ ] **5.2** Test luồng thanh toán end-to-end với PayOS sandbox
- [ ] **5.3** Test idempotency: gửi webhook 2 lần → chỉ tạo 1 subscription
- [ ] **5.4** Test RLS: user A không xem được subscription của user B
- [ ] **5.5** Chạy `npx tsc --noEmit` → 0 lỗi
- [ ] **5.6** Thêm scheduled job / Edge Function expire subscription hàng ngày
  - Hoặc kiểm tra `expires_at < now()` trực tiếp trong `getUserMembership()`
- [ ] **5.7** Setup Supabase pg_cron hoặc Vercel Cron cho auto-expire
- [ ] **5.8** Deploy lên Vercel, kiểm tra production webhook endpoint
- [ ] **5.9** Cấu hình PayOS webhook URL trỏ đến production endpoint

---

## Quyết định kiến trúc quan trọng

| Vấn đề | Lựa chọn hiện tại | Khuyến nghị |
|---|---|---|
| Khoá user_roles | email | Thêm user_id, migrate dần |
| Lưu đơn hàng | Redis TTL 1h | DB chính + Redis cache phụ |
| Expire subscription | Cột note tay | Cột `expires_at` thật sự + auto-expire |
| Product catalog | Hard-code TypeScript | Bảng `membership_plans` trong DB |
| Access code | Redis TTL 24h | Bảng `access_codes` trong DB |
| Admin grant VIP | Sửa user_roles.note | Tạo subscription với `granted_by` |
| Webhook verify | Không verify | Verify PayOS checksum signature |

---

## Thứ tự ưu tiên triển khai

```
Phase 1 (DB) → Phase 2.1-2.4 (core API) → Phase 3.1-3.3 (payment UI)
     ↓
Phase 2.5-2.9 (membership API) → Phase 3.4-3.6 (profile/badge)
     ↓
Phase 4 (admin panel) → Phase 5 (kiểm tra & deploy)
```
