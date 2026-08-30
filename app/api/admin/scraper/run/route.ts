import { NextRequest, NextResponse } from 'next/server'
import { ensureAdmin } from '@/lib/server/auth'
import { errorResponse } from '@/lib/server/api-response'
import { getSource, scrapeSource } from '@/lib/server/scraper'

// POST /api/admin/scraper/run  { sourceId }
export async function POST(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const body = (await req.json().catch(() => null)) as { sourceId?: string } | null
  if (!body?.sourceId) return errorResponse('Thiếu sourceId', 400)

  const { data: source, error } = await getSource(body.sourceId)
  if (error || !source) return errorResponse('Không tìm thấy nguồn', 404)

  const stats = await scrapeSource(source)

  return NextResponse.json({ success: true, stats })
}
