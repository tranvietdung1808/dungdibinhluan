import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureAdmin } from '@/lib/server/auth'
import { revokeMembership } from '@/lib/server/membership'
import { errorResponse } from '@/lib/server/api-response'

// PATCH /api/admin/memberships/[id] — sửa note hoặc gia hạn expires_at
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return errorResponse('Body không hợp lệ', 400)

  const { note, expiresAt } = body as { note?: string; expiresAt?: string }

  const updates: Record<string, unknown> = {}
  if (note !== undefined) updates.note = note
  if (expiresAt !== undefined) updates.expires_at = expiresAt

  if (Object.keys(updates).length === 0) {
    return errorResponse('Không có gì để cập nhật', 400)
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update(updates)
    .eq('id', id)

  if (error) return errorResponse('Cập nhật thất bại', 500)

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/memberships/[id] — thu hồi subscription
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { id } = await params

  try {
    await revokeMembership(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Thu hồi thất bại'
    return errorResponse(msg, 500)
  }
}
