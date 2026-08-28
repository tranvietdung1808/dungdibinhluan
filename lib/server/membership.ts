import { supabaseAdmin } from '@/lib/supabase'

export interface MembershipPlan {
  id: string
  name: string
  description: string | null
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
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
  created_at: string
  plan?: MembershipPlan
  user_email?: string
}

// Lấy subscription đang active của user (chưa hết hạn)
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*, membership_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  return {
    ...data,
    plan: data.membership_plans as MembershipPlan,
  } as Subscription
}

// Grant membership cho user (dùng cho cả admin grant tay và webhook tự động)
export async function grantMembership({
  userId,
  planId,
  grantedBy,
  note,
  startsAt,
}: {
  userId: string
  planId: string
  grantedBy?: string | null
  note?: string
  startsAt?: Date
}): Promise<Subscription> {
  // Lấy thời hạn của gói
  const { data: plan, error: planErr } = await supabaseAdmin
    .from('membership_plans')
    .select('duration_days')
    .eq('id', planId)
    .single()

  if (planErr || !plan) throw new Error(`Gói không tồn tại: ${planId}`)

  // Tính ngày hết hạn
  const start = startsAt ?? new Date()
  const expires = new Date(start)
  expires.setDate(expires.getDate() + (plan.duration_days as number))

  // Tạo subscription
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

  if (error || !data) throw new Error('Không thể tạo subscription: ' + error?.message)

  // Gán role vip vào user_roles (hệ thống hiện tại)
  const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(userId)
  const email = userRecord?.user?.email?.toLowerCase()

  if (email) {
    await supabaseAdmin
      .from('user_roles')
      .upsert(
        { email, role: 'vip', note: `Subscription ${data.id as string}` },
        { onConflict: 'email,role', ignoreDuplicates: true }
      )
  }

  return data as Subscription
}

// Thu hồi membership (admin cancel)
export async function revokeMembership(subscriptionId: string): Promise<void> {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscriptionId)
    .select('user_id')
    .single()

  if (!sub) return

  // Nếu không còn subscription active nào khác → xóa role vip
  const { data: remaining } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', sub.user_id as string)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .limit(1)

  if (!remaining || remaining.length === 0) {
    const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(sub.user_id as string)
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
