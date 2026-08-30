import { NextRequest, NextResponse } from 'next/server'
import { ensureAdmin } from '@/lib/server/auth'
import { errorResponse } from '@/lib/server/api-response'
import { deleteItem, getItem, updateItem } from '@/lib/server/scraper'

// PATCH /api/admin/scraper/items/[id] — sửa field (name, category, tags...)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { id } = await params
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return errorResponse('Body không hợp lệ', 400)

  const { data: existing, error: existingError } = await getItem(id)
  if (existingError || !existing) return errorResponse('Không tìm thấy bài', 404)

  const { data, error } = await updateItem(id, body)
  if (error) return errorResponse('Cập nhật thất bại: ' + error.message, 500)

  return NextResponse.json({ item: data })
}

// DELETE /api/admin/scraper/items/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { id } = await params
  const { data: existing, error: existingError } = await getItem(id)
  if (existingError || !existing) return errorResponse('Không tìm thấy bài', 404)

  const { error } = await deleteItem(id)
  if (error) return errorResponse('Xóa thất bại: ' + error.message, 500)

  return NextResponse.json({ success: true })
}
