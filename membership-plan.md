# Kế hoạch kỹ thuật – Hệ thống Membership

> **Mục tiêu:** Xây khung kỹ thuật hoàn chỉnh.  
> Giá, quyền lợi cụ thể, thời hạn từng gói — **điền sau** không cần sửa code.  
> Ngôn ngữ: Next.js 16 · Supabase · Tailwind CSS · TypeScript  
> Người đọc: developer thực thi

---

## Tổng quan kiến trúc

```
auth.users (Supabase built-in)
    │
    ├─► profiles           (thông tin hiển thị: username, avatar)
    │
    ├─► subscriptions      (user đang có gói gì, hết hạn khi nào)
    │       │
    │       └─► membership_plans  (catalog gói: tên, giá, thời hạn, tags quyền lợi)
    │
    └─► user_roles         (hiện tại: admin/vip/moderator/user — GIỮ NGUYÊN)
```

**Nguyên tắc thiết kế:**
- `membership_plans` là catalog — thêm/sửa gói từ DB, không cần deploy lại
- Quyền lợi của gói lưu dạng **mảng text tags** trong cột `features jsonb`
- Kiểm tra quyền ở **server-side** trước khi trả nội dung
- Admin grant tay hoặc webhook tự động → cùng một hàm `grantMembership()`

---

## Phase 1 – Database

### 1.1 Bảng `membership_plans`

**Mục đích:** Catalog các gói membership. Admin thêm/sửa gói từ đây.  
**Quan trọng:** `features` là mảng text — khi làm UI chỉ cần render list này ra, không cần logic gì thêm.

```sql
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id            text PRIMARY KEY,
  -- VD: 'vip-1month', 'vip-1year', 'mod-pack'
  -- Đặt tên có nghĩa vì id này dùng trong code để check quyền

  name          text NOT NULL,
  -- Tên hiển thị cho user. VD: 'VIP 1 Tháng', 'Gói Mods FC26'

  description   text,
  -- Mô tả ngắn hiển thị trên trang mua. Để null cũng được.

  price         integer NOT NULL DEFAULT 0,
  -- Giá tính bằng VND. Điền 0 nếu chưa xác định, sửa sau.

  duration_days integer NOT NULL,
  -- Số ngày hiệu lực sau khi kích hoạt. VD: 30, 365.
  -- KHÔNG có gói vĩnh viễn theo yêu cầu.

  features      jsonb NOT NULL DEFAULT '[]',
  -- Mảng text, mỗi phần tử là 1 quyền lợi.
  -- VD: ["Tải mods không giới hạn", "Xem bài viết VIP", "Badge VIP trên hồ sơ"]
  -- Thêm/sửa quyền lợi = UPDATE câu này trong DB, không cần sửa code.

  is_active     boolean NOT NULL DEFAULT false,
  -- false = ẩn khỏi trang mua, dùng để chuẩn bị gói chưa ra mắt.

  sort_order    integer NOT NULL DEFAULT 0,
  -- Thứ tự hiển thị trên trang mua. Số nhỏ = hiển thị trước.

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

**Thêm trigger tự cập nhật `updated_at`:**
```sql
CREATE TRIGGER handle_membership_plans_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- Hàm handle_updated_at() đã có sẵn trong schema hiện tại
```

**Dữ liệu mẫu (điền giá + features sau):**
```sql
INSERT INTO public.membership_plans
  (id, name, price, duration_days, features, is_active, sort_order)
VALUES
  ('vip-1month', 'VIP 1 Tháng', 0, 30, '[]', false, 1),
  ('vip-1year',  'VIP 1 Năm',   0, 365, '[]', false, 2)
ON CONFLICT (id) DO NOTHING;
-- Khi sẵn sàng: UPDATE price, features, đặt is_active = true
```

---

### 1.2 Bảng `subscriptions`

**Mục đích:** Ghi nhận user nào đang có gói gì, bắt đầu khi nào, hết hạn khi nào.  
Đây là nguồn sự thật chính để kiểm tra quyền truy cập.

```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Khóa ngoại đến auth.users. Xóa user → xóa subscription luôn.

  plan_id      text NOT NULL REFERENCES public.membership_plans(id),
  -- Gói đang dùng. Liên kết đến membership_plans.id

  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'expired', 'cancelled')),
  -- active    = đang hiệu lực
  -- expired   = đã hết hạn (tự động cập nhật)
  -- cancelled = bị admin thu hồi

  starts_at    timestamptz NOT NULL DEFAULT now(),
  -- Thời điểm bắt đầu hiệu lực

  expires_at   timestamptz NOT NULL,
  -- Thời điểm hết hạn. Tính = starts_at + duration_days của plan.
  -- Bắt buộc phải có (không có gói vĩnh viễn).

  granted_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- NULL = tự động qua thanh toán
  -- user_id của admin = admin grant tay

  note         text,
  -- Ghi chú tùy chọn. VD: 'Grant tặng', 'Gia hạn khuyến mãi'

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Index để query nhanh
CREATE INDEX IF NOT EXISTS sub_user_id_idx    ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS sub_status_idx     ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS sub_expires_at_idx ON public.subscriptions(expires_at);

-- Index composite: tìm subscription active của một user — dùng nhiều nhất
CREATE INDEX IF NOT EXISTS sub_user_active_idx
  ON public.subscriptions(user_id, status, expires_at)
  WHERE status = 'active';

CREATE TRIGGER handle_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

### 1.3 Bảng `payment_transactions`

**Mục đích:** Lưu lịch sử thanh toán vĩnh viễn. Hiện tại Redis chỉ giữ 1 giờ — mất hết.  
Webhook PayOS sẽ update bảng này thay vì chỉ update Redis.

```sql
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- SET NULL thay vì CASCADE: xóa user không mất lịch sử thanh toán

  email           text NOT NULL,
  -- Lưu lại email lúc mua, dùng để tra cứu khi user_id bị null

  plan_id         text REFERENCES public.membership_plans(id),
  -- Gói đã mua. Có thể null nếu là giao dịch cũ không có plan.

  order_code      bigint UNIQUE NOT NULL,
  -- PayOS orderCode. UNIQUE để đảm bảo idempotency webhook.

  amount          integer NOT NULL,
  -- Số tiền thực tế thanh toán (VND)

  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
  -- pending  = đã tạo link, chờ thanh toán
  -- paid     = webhook xác nhận thanh toán thành công
  -- cancelled = user cancel hoặc hết giờ
  -- failed   = có lỗi

  subscription_id uuid REFERENCES public.subscriptions(id),
  -- Liên kết đến subscription được tạo sau khi thanh toán thành công

  webhook_data    jsonb,
  -- Lưu raw payload từ PayOS để debug

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pt_order_code_idx ON public.payment_transactions(order_code);
CREATE INDEX IF NOT EXISTS pt_user_id_idx    ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS pt_status_idx     ON public.payment_transactions(status, created_at DESC);

CREATE TRIGGER handle_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

### 1.4 RLS Policies

```sql
-- membership_plans: ai cũng xem được gói đang active, chỉ service_role sửa
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public xem gói active"
  ON public.membership_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role quản lý plans"
  ON public.membership_plans FOR ALL
  USING (auth.role() = 'service_role');

-- subscriptions: user chỉ xem của mình, service_role xem tất cả
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User xem subscription của mình"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role quản lý subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- payment_transactions: user chỉ xem của mình
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User xem giao dịch của mình"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role quản lý transactions"
  ON public.payment_transactions FOR ALL
  USING (auth.role() = 'service_role');
```

---

## Phase 2 – Backend

### 2.1 File `lib/server/membership.ts` (TẠO MỚI)

File này chứa toàn bộ logic membership. Các API route chỉ gọi hàm từ đây.

```typescript
// lib/server/membership.ts
import { supabaseAdmin } from '@/lib/supabase'

// ── Kiểu dữ liệu ──────────────────────────────────────────────

export interface MembershipPlan {
  id: string
  name: string
  description: string | null
  price: number
  duration_days: number
  features: string[]   // mảng text quyền lợi, VD: ["Tải mods VIP", "Badge VIP"]
  is_active: boolean
  sort_order: number
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'expired' | 'cancelled'
  starts_at: string
  expires_at: string
  granted_by: string | null
  note: string | null
  plan?: MembershipPlan
}

// ── Hàm lấy subscription đang active của user ─────────────────

export async function getActiveSubscription(
  userId: string
): Promise<Subscription | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*, membership_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())  // chưa hết hạn
    .order('expires_at', { ascending: false })   // lấy cái hết hạn muộn nhất
    .limit(1)
    .maybeSingle()

  return data as Subscription | null
}

// ── Hàm kiểm tra user có subscription active không ────────────

export async function hasActiveMembership(userId: string): Promise<boolean> {
  const sub = await getActiveSubscription(userId)
  return sub !== null
}

// ── Hàm grant membership (dùng cho cả admin grant tay và webhook) ──

export async function grantMembership({
  userId,
  planId,
  grantedBy,   // null nếu qua payment
  note,
  startsAt,    // mặc định = now()
}: {
  userId: string
  planId: string
  grantedBy?: string | null
  note?: string
  startsAt?: Date
}): Promise<Subscription> {
  // 1. Lấy thông tin gói
  const { data: plan, error: planErr } = await supabaseAdmin
    .from('membership_plans')
    .select('duration_days')
    .eq('id', planId)
    .single()

  if (planErr || !plan) throw new Error(`Plan không tồn tại: ${planId}`)

  // 2. Tính ngày hết hạn
  const start = startsAt ?? new Date()
  const expires = new Date(start)
  expires.setDate(expires.getDate() + plan.duration_days)

  // 3. Tạo subscription
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      starts_at: start.toISOString(),
      expires_at: expires.toISOString(),
      granted_by: grantedBy ?? null,
      note: note ?? null,
    })
    .select()
    .single()

  if (error || !data) throw new Error('Không thể tạo subscription')

  // 4. Gán role 'vip' vào user_roles (hệ thống hiện tại)
  // Dùng upsert để không bị lỗi nếu đã có
  const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(userId)
  const email = userRecord?.user?.email?.toLowerCase()

  if (email) {
    await supabaseAdmin
      .from('user_roles')
      .upsert({ email, role: 'vip', note: `Subscription ${data.id}` }, {
        onConflict: 'email,role',
        ignoreDuplicates: true,
      })
  }

  return data as Subscription
}

// ── Hàm thu hồi membership ────────────────────────────────────

export async function revokeMembership(subscriptionId: string): Promise<void> {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscriptionId)
    .select('user_id')
    .single()

  if (!sub) return

  // Kiểm tra còn subscription active nào khác không
  const { data: remaining } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', sub.user_id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .limit(1)

  // Nếu không còn subscription nào → xóa role vip
  if (!remaining || remaining.length === 0) {
    const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(sub.user_id)
    const email = userRecord?.user?.email?.toLowerCase()
    if (email) {
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('email', email)
        .eq('role', 'vip')
    }
  }
}
```

---

### 2.2 Sửa `app/api/payment/webhook/route.ts`

**Vấn đề hiện tại:** Webhook chỉ lưu trạng thái vào Redis, không lưu DB, không tạo subscription.

**Cần sửa:**

```typescript
// Thêm vào đầu file
import { supabaseAdmin } from '@/lib/supabase'
import { grantMembership } from '@/lib/server/membership'

// Trong hàm POST, sau khi xác nhận code === '00':

// 1. Lấy transaction từ DB (thay vì chỉ từ Redis)
const { data: transaction } = await supabaseAdmin
  .from('payment_transactions')
  .select('*')
  .eq('order_code', orderCode)
  .maybeSingle()

// 2. Idempotency check — đã xử lý rồi thì bỏ qua
if (transaction?.status === 'paid') {
  return NextResponse.json({ success: true })
}

// 3. Lấy thông tin order từ Redis (giữ nguyên logic cũ)
const order = await kv.get<{ productId: string; email: string; status: string }>(`order:${orderCode}`)
if (!order) return NextResponse.json({ success: true })

// 4. Cập nhật transaction status → paid
await supabaseAdmin
  .from('payment_transactions')
  .update({ status: 'paid', webhook_data: body })
  .eq('order_code', orderCode)

// 5. Tìm user theo email để tạo subscription
const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
const user = users.find(u => u.email?.toLowerCase() === order.email.toLowerCase())

// 6. Nếu tìm được user và có planId → tạo subscription
if (user && transaction?.plan_id) {
  const sub = await grantMembership({
    userId: user.id,
    planId: transaction.plan_id,
    note: `PayOS order ${orderCode}`,
  })

  // Gắn subscription vào transaction
  await supabaseAdmin
    .from('payment_transactions')
    .update({ subscription_id: sub.id })
    .eq('order_code', orderCode)
}

// 7. Gửi email xác nhận (giữ nguyên logic cũ)
// ...
```

---

### 2.3 Sửa `app/api/payment/create/route.ts`

**Cần thêm:**
- Nhận thêm `planId` trong body
- Yêu cầu user đăng nhập (Bearer token)
- Lưu transaction vào DB ngay khi tạo link

```typescript
// Thêm vào đầu
import { extractToken, getUserFromToken } from '@/lib/server/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // Xác thực user (bắt buộc đăng nhập mới mua được)
  const token = extractToken(req)
  const user = token ? await getUserFromToken(token) : null
  if (!user) {
    return NextResponse.json({ error: 'Cần đăng nhập để mua membership' }, { status: 401 })
  }

  const { planId, email } = await req.json()
  // planId: VD 'vip-1month', lấy từ membership_plans.id

  // Lấy thông tin plan từ DB
  const { data: plan } = await supabaseAdmin
    .from('membership_plans')
    .select('*')
    .eq('id', planId)
    .eq('is_active', true)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Gói không hợp lệ' }, { status: 400 })
  }

  // ... tạo PayOS link như cũ ...
  const orderCode = generateOrderCode()
  const paymentLink = await getPayOS().paymentRequests.create({
    orderCode,
    amount: plan.price,
    description: plan.name,
    // ...
  })

  // Lưu vào DB (THÊM MỚI — giữ Redis cache song song)
  await supabaseAdmin.from('payment_transactions').insert({
    user_id: user.id,
    email: (email || user.email || '').toLowerCase(),
    plan_id: planId,
    order_code: orderCode,
    amount: plan.price,
    status: 'pending',
  })

  // Giữ Redis cache như cũ
  await kv.set(`order:${orderCode}`, { planId, email, status: 'PENDING', ... }, { ex: ORDER_TTL })

  return NextResponse.json({ checkoutUrl: paymentLink.checkoutUrl, orderCode })
}
```

---

### 2.4 Tạo `app/api/membership/status/route.ts` (MỚI)

**Mục đích:** Client gọi để biết user có đang là VIP không, gói gì, hết hạn khi nào.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractToken, getUserFromToken } from '@/lib/server/auth'
import { getActiveSubscription } from '@/lib/server/membership'

export async function GET(req: NextRequest) {
  const token = extractToken(req)
  const user = token ? await getUserFromToken(token) : null

  if (!user) {
    return NextResponse.json({ active: false })
  }

  const subscription = await getActiveSubscription(user.id)

  if (!subscription) {
    return NextResponse.json({ active: false })
  }

  return NextResponse.json({
    active: true,
    planId: subscription.plan_id,
    planName: subscription.plan?.name,
    features: subscription.plan?.features ?? [],   // mảng text quyền lợi
    expiresAt: subscription.expires_at,
  })
}
```

---

### 2.5 Tạo `app/api/membership/plans/route.ts` (MỚI)

**Mục đích:** Trả về danh sách gói đang mở bán. Dùng cho trang landing membership.

```typescript
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: plans } = await supabaseAdmin
    .from('membership_plans')
    .select('id, name, description, price, duration_days, features, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  return NextResponse.json({ plans: plans ?? [] })
}
```

---

### 2.6 Tạo `app/api/admin/memberships/route.ts` (MỚI)

**Mục đích:** Admin xem và grant membership thủ công.

```typescript
// GET: danh sách subscriptions
export async function GET(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*, membership_plans(name), auth.users!user_id(email)')
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ subscriptions: data ?? [] })
}

// POST: admin grant subscription thủ công
export async function POST(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { email, planId, note } = await req.json()

  // Tìm user theo email
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return errorResponse('Không tìm thấy user với email này', 404)

  const sub = await grantMembership({
    userId: user.id,
    planId,
    grantedBy: admin.id,
    note: note || 'Admin grant thủ công',
  })

  return NextResponse.json({ subscription: sub })
}
```

---

### 2.7 Tạo `app/api/admin/memberships/[id]/route.ts` (MỚI)

```typescript
// PATCH: sửa ghi chú, gia hạn
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { note, expiresAt } = await req.json()

  await supabaseAdmin
    .from('subscriptions')
    .update({ note, expires_at: expiresAt })
    .eq('id', params.id)

  return NextResponse.json({ success: true })
}

// DELETE: thu hồi membership
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  await revokeMembership(params.id)
  return NextResponse.json({ success: true })
}
```

---

## Phase 3 – Frontend

### 3.1 Hook `useMembership()` (TẠO MỚI)

File: `app/components/useMembership.ts`

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface MembershipStatus {
  active: boolean
  planId?: string
  planName?: string
  features?: string[]   // danh sách quyền lợi dạng text
  expiresAt?: string
}

export function useMembership() {
  const [status, setStatus] = useState<MembershipStatus>({ active: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/membership/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setStatus(data)
      setLoading(false)
    }
    void fetchStatus()
  }, [])

  return { ...status, loading }
}
```

**Cách dùng trong component:**
```typescript
const { active, planName, features, expiresAt, loading } = useMembership()

if (active) {
  // Hiện nội dung VIP
}
```

---

### 3.2 Component `VipGate` – ẩn/hiện nội dung

File: `app/components/VipGate.tsx`

```typescript
'use client'
import { useMembership } from './useMembership'

interface VipGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode  // hiện gì khi chưa là VIP
}

export function VipGate({ children, fallback }: VipGateProps) {
  const { active, loading } = useMembership()

  if (loading) return null  // hoặc skeleton

  if (!active) {
    return fallback ?? (
      <div className="border border-yellow-500/30 rounded-lg p-6 text-center bg-yellow-500/5">
        <p className="text-yellow-400 font-medium">Nội dung dành cho thành viên VIP</p>
        <a href="/membership" className="mt-2 inline-block text-sm underline text-yellow-300">
          Xem các gói membership →
        </a>
      </div>
    )
  }

  return <>{children}</>
}
```

**Cách dùng:**
```tsx
// Bao quanh bất kỳ nội dung nào cần khóa
<VipGate>
  <DownloadButton />
</VipGate>

// Hoặc custom fallback
<VipGate fallback={<p>Mua VIP để xem</p>}>
  <SecretContent />
</VipGate>
```

---

### 3.3 Trang `/membership` (TẠO MỚI)

File: `app/membership/page.tsx`

**Không hardcode gói ở đây.** Gọi API lấy từ DB, render ra:

```typescript
// Đây là server component — không cần 'use client'
import { supabaseAdmin } from '@/lib/supabase'

export default async function MembershipPage() {
  // Lấy danh sách gói từ DB
  const { data: plans } = await supabaseAdmin
    .from('membership_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <main>
      <h1>Membership</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {plans?.map(plan => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </main>
  )
}

// Component hiển thị một gói
function PlanCard({ plan }: { plan: MembershipPlan }) {
  return (
    <div className="border rounded-xl p-6">
      <h2>{plan.name}</h2>
      <p className="text-2xl font-bold">{plan.price.toLocaleString('vi-VN')}đ</p>
      <p className="text-sm text-gray-400">{plan.duration_days} ngày</p>

      {/* Render features dạng tags — đây là mảng text từ DB */}
      <ul className="mt-4 space-y-1">
        {plan.features.map((feature: string) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <button>Mua ngay</button>
    </div>
  )
}
```

---

### 3.4 Card "Quản lý Membership" trong Admin Dashboard

Thêm vào `app/admin/dashboard/page.tsx` (tương tự card "Quản lý Member" hiện tại):

**Chức năng:**
- Danh sách subscription: email, gói, trạng thái, ngày hết hạn
- Tìm theo email
- Nút "Grant VIP": nhập email + chọn gói → gọi `POST /api/admin/memberships`
- Nút "Thu hồi": gọi `DELETE /api/admin/memberships/[id]`
- Nút "Gia hạn": cho sửa `expires_at` → gọi `PATCH /api/admin/memberships/[id]`

---

## Phase 4 – Auto-expire

**Vấn đề:** Subscription hết hạn nhưng status vẫn `active` nếu không có gì tự cập nhật.

**Giải pháp 1 (đơn giản nhất):** Không cần job, kiểm tra `expires_at` trực tiếp trong `getActiveSubscription()`:

```typescript
// Đã có trong hàm ở Phase 2.1:
.gt('expires_at', new Date().toISOString())
// Điều này đảm bảo: dù status là 'active' nhưng quá hạn vẫn bị coi là không active
```

**Giải pháp 2 (cho sạch DB):** Thêm Supabase Edge Function chạy mỗi ngày:

```typescript
// supabase/functions/expire-subscriptions/index.ts
Deno.serve(async () => {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())

  return new Response(JSON.stringify({ ok: !error }))
})
```

**Khuyến nghị:** Dùng Giải pháp 1 trước, thêm Giải pháp 2 sau nếu cần.

---

## Thứ tự làm việc

```
Ngày 1 – Database
  └─ Chạy SQL Phase 1.1 → 1.4 trên Supabase Dashboard (SQL Editor)
  └─ Kiểm tra các bảng đã tạo đúng chưa

Ngày 2 – Backend core
  └─ Tạo lib/server/membership.ts (Phase 2.1)
  └─ Sửa payment/webhook (Phase 2.2)
  └─ Tạo /api/membership/status và /plans (Phase 2.4, 2.5)

Ngày 3 – Admin grant
  └─ Tạo /api/admin/memberships/* (Phase 2.6, 2.7)
  └─ Thêm card membership vào admin dashboard (Phase 3.4)
  └─ Test: admin grant → user có subscription → role vip

Ngày 4 – Frontend user
  └─ Hook useMembership() (Phase 3.1)
  └─ Component VipGate (Phase 3.2)
  └─ Trang /membership (Phase 3.3) — để trống features, điền sau

Ngày 5 – Kết nối payment
  └─ Sửa payment/create (Phase 2.3)
  └─ Test luồng thanh toán end-to-end (sandbox PayOS)
```

---

## Checklist thực thi (tick khi xong)

### Database
- [ ] Tạo bảng `membership_plans`
- [ ] Insert dữ liệu mẫu (giá = 0, features = [], is_active = false)
- [ ] Tạo bảng `subscriptions` + indexes
- [ ] Tạo bảng `payment_transactions` + indexes
- [ ] Thêm RLS policies cho 3 bảng mới
- [ ] Thêm triggers `updated_at`

### Backend
- [ ] Tạo `lib/server/membership.ts` với 3 hàm: `getActiveSubscription`, `grantMembership`, `revokeMembership`
- [ ] Sửa `app/api/payment/webhook/route.ts` — lưu DB + tạo subscription
- [ ] Sửa `app/api/payment/create/route.ts` — yêu cầu auth + lưu transaction DB
- [ ] Tạo `app/api/membership/status/route.ts`
- [ ] Tạo `app/api/membership/plans/route.ts`
- [ ] Tạo `app/api/admin/memberships/route.ts` (GET + POST)
- [ ] Tạo `app/api/admin/memberships/[id]/route.ts` (PATCH + DELETE)

### Frontend
- [ ] Tạo hook `useMembership()`
- [ ] Tạo component `VipGate`
- [ ] Tạo trang `/membership` (skeleton, không cần điền giá/features vội)
- [ ] Thêm card membership vào admin dashboard

### Kiểm tra
- [ ] `npx tsc --noEmit` — 0 lỗi
- [ ] Test admin grant subscription → kiểm tra `user_roles` có role `vip`
- [ ] Test `VipGate` ẩn đúng nội dung với user không có VIP
- [ ] Test webhook idempotency (gửi 2 lần → chỉ 1 subscription)

---

## Khi muốn điền giá và quyền lợi (làm sau)

Chỉ cần chạy SQL này — **không cần sửa code:**

```sql
UPDATE public.membership_plans
SET
  price = 69000,
  duration_days = 30,
  features = '["Tải mods VIP không giới hạn", "Xem bài viết độc quyền", "Badge VIP trên hồ sơ"]',
  is_active = true
WHERE id = 'vip-1month';
```

Trang `/membership` sẽ tự động hiển thị gói mới sau khi cập nhật DB.
