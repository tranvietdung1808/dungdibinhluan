import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureAdmin } from '@/lib/server/auth'
import { errorResponse } from '@/lib/server/api-response'

// GET /api/admin/plans — lấy tất cả plans (kể cả inactive)
export async function GET(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { data, error } = await supabaseAdmin
    .from('membership_plans')
    .select('*')
    .order('sort_order')

  if (error) return errorResponse('Lỗi tải danh sách plan', 500)

  return NextResponse.json({ plans: data ?? [] })
}

// POST /api/admin/plans — tạo plan mới
export async function POST(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const body = await req.json().catch(() => null)
  if (!body) return errorResponse('Body không hợp lệ', 400)

  const { id, name, description, price, duration_days, features, is_active, sort_order } =
    body as {
      id?: string
      name?: string
      description?: string
      price?: number
      duration_days?: number
      features?: string[]
      is_active?: boolean
      sort_order?: number
    }

  if (!id || !name) return errorResponse('Thiếu id hoặc name', 400)
  if (typeof price !== 'number' || price < 0) return errorResponse('Giá không hợp lệ', 400)
  if (typeof duration_days !== 'number' || duration_days < 1) {
    return errorResponse('Thời hạn phải >= 1 ngày', 400)
  }

  const { data, error } = await supabaseAdmin
    .from('membership_plans')
    .insert({
      id,
      name,
      description: description ?? null,
      price,
      duration_days,
      features: features ?? [],
      is_active: is_active ?? false,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return errorResponse('ID gói đã tồn tại', 409)
    return errorResponse('Tạo plan thất bại: ' + error.message, 500)
  }

  return NextResponse.json({ plan: data }, { status: 201 })
}

// PATCH /api/admin/plans — sửa plan (dùng query param ?id=...)
export async function PATCH(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const planId = req.nextUrl.searchParams.get('id')
  if (!planId) return errorResponse('Thiếu id', 400)

  const body = await req.json().catch(() => null)
  if (!body) return errorResponse('Body không hợp lệ', 400)

  const allowed = ['name', 'description', 'price', 'duration_days', 'features', 'is_active', 'sort_order']
  const updates: Record<string, unknown> = {}

  for (const key of allowed) {
    if (key in body) updates[key] = (body as Record<string, unknown>)[key]
  }

  if (Object.keys(updates).length === 0) return errorResponse('Không có gì để cập nhật', 400)

  const { error } = await supabaseAdmin
    .from('membership_plans')
    .update(updates)
    .eq('id', planId)

  if (error) return errorResponse('Cập nhật thất bại: ' + error.message, 500)

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/plans — xóa plan (dùng query param ?id=...)
export async function DELETE(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const planId = req.nextUrl.searchParams.get('id')
  if (!planId) return errorResponse('Thiếu id', 400)

  // Kiểm tra còn subscription nào đang dùng plan này không
  const { data: activeSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('plan_id', planId)
    .eq('status', 'active')
    .limit(1)

  if (activeSubs && activeSubs.length > 0) {
    return errorResponse('Không thể xóa gói đang có người dùng active', 409)
  }

  const { error } = await supabaseAdmin
    .from('membership_plans')
    .delete()
    .eq('id', planId)

  if (error) return errorResponse('Xóa thất bại: ' + error.message, 500)

  return NextResponse.json({ success: true })
}
