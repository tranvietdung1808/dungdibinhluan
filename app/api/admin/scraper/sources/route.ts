import { NextRequest, NextResponse } from 'next/server'
import { ensureAdmin } from '@/lib/server/auth'
import { errorResponse } from '@/lib/server/api-response'
import { createSource, listSources, type ScraperSourceInput } from '@/lib/server/scraper'

// GET /api/admin/scraper/sources
export async function GET(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const { data, error } = await listSources()
  if (error) return errorResponse('Lỗi tải danh sách nguồn: ' + error.message, 500)

  return NextResponse.json({ sources: data ?? [] })
}

// POST /api/admin/scraper/sources
export async function POST(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const body = (await req.json().catch(() => null)) as ScraperSourceInput | null
  if (!body) return errorResponse('Body không hợp lệ', 400)
  if (!body.name || !body.base_url) return errorResponse('Thiếu name hoặc base_url', 400)

  const { data, error } = await createSource(body)
  if (error) return errorResponse('Tạo nguồn thất bại: ' + error.message, 500)

  return NextResponse.json({ source: data }, { status: 201 })
}
