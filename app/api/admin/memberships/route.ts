import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureAdmin } from '@/lib/server/auth'
import { grantMembership } from '@/lib/server/membership'
import { errorResponse } from '@/lib/server/api-response'

// GET /api/admin/memberships — danh sách tất cả subscriptions kèm email user
export async function GET(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*, membership_plans(id, name, duration_days)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return errorResponse('Lỗi tải danh sách subscription', 500)

  // Gắn email từ auth.users
  const userIds = [...new Set((data ?? []).map((s) => s.user_id as string))]
  const emailMap: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    for (const u of users) {
      if (u.email) emailMap[u.id] = u.email
    }
  }

  const enriched = (data ?? []).map((s) => ({
    ...s,
    user_email: emailMap[s.user_id as string] ?? '—',
  }))

  return NextResponse.json({ subscriptions: enriched })
}

// POST /api/admin/memberships — admin grant subscription thủ công theo email
export async function POST(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const body = await req.json().catch(() => null)
  if (!body) return errorResponse('Body không hợp lệ', 400)

  const { email, planId, note } = body as { email?: string; planId?: string; note?: string }

  if (!email || !planId) return errorResponse('Thiếu email hoặc planId', 400)

  // Tìm user theo email
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const user = users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase())

  if (!user) return errorResponse('Không tìm thấy user với email này', 404)

  try {
    const sub = await grantMembership({
      userId: user.id,
      planId,
      grantedBy: admin.id,
      note: note || 'Admin grant thủ công',
    })
    return NextResponse.json({ subscription: sub })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi tạo subscription'
    return errorResponse(msg, 500)
  }
}
