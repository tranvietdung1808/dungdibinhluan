import { NextRequest, NextResponse } from 'next/server'
import { ensureAdmin } from '@/lib/server/auth'
import { errorResponse } from '@/lib/server/api-response'
import {
  deleteSource,
  getSource,
  updateSource,
  type ScraperSourceInput,
} from '@/lib/server/scraper'

// PUT /api/admin/scraper/sources/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { id } = await params
  const body = (await req.json().catch(() => null)) as ScraperSourceInput | null
  if (!body) return errorResponse('Body không hợp lệ', 400)

  const { data: existing, error: existingError } = await getSource(id)
  if (existingError || !existing) return errorResponse('Không tìm thấy nguồn', 404)

  const { data, error } = await updateSource(id, body)
  if (error) return errorResponse('Cập nhật thất bại: ' + error.message, 500)

  return NextResponse.json({ source: data })
}

// DELETE /api/admin/scraper/sources/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { id } = await params
  const { data: existing, error: existingError } = await getSource(id)
  if (existingError || !existing) return errorResponse('Không tìm thấy nguồn', 404)

  const { error } = await deleteSource(id)
  if (error) return errorResponse('Xóa thất bại: ' + error.message, 500)

  return NextResponse.json({ success: true })
}
