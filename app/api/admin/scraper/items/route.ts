import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureAdmin } from '@/lib/server/auth'
import { errorResponse } from '@/lib/server/api-response'
import { listItems, publishItems, setItemsStatus } from '@/lib/server/scraper'

// GET /api/admin/scraper/items?status=pending
export async function GET(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const status = req.nextUrl.searchParams.get('status') || undefined
  const sourceId = req.nextUrl.searchParams.get('sourceId') || undefined
  const { data, error } = await listItems(status, sourceId)
  if (error) return errorResponse('Lỗi tải danh sách bài: ' + error.message, 500)

  return NextResponse.json({ items: data ?? [] })
}

// POST /api/admin/scraper/items  { action: 'publish'|'skip'|'delete', ids: string[] }
export async function POST(req: NextRequest) {
  const admin = await ensureAdmin(req)
  if (!admin) return errorResponse('Forbidden', 403)

  const body = (await req.json().catch(() => null)) as {
    action?: string
    ids?: string[]
  } | null

  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return errorResponse('Thiếu ids', 400)
  }

  if (body.action === 'publish') {
    const summary = await publishItems(body.ids)
    return NextResponse.json({ success: true, summary })
  }

  if (body.action === 'skip') {
    const { error } = await setItemsStatus(body.ids, 'skipped')
    if (error) return errorResponse('Thao tác thất bại: ' + error.message, 500)
    return NextResponse.json({ success: true, count: body.ids.length })
  }

  if (body.action === 'delete') {
    const { error } = await supabaseAdmin.from('scraper_items').delete().in('id', body.ids)
    if (error) return errorResponse('Xóa thất bại: ' + error.message, 500)
    return NextResponse.json({ success: true, count: body.ids.length })
  }

  return errorResponse('action không hợp lệ', 400)
}
