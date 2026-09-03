import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { errorResponse, runRoute } from '@/lib/server/api-response'

// =====================================================
// /api/admin/showcases/[id] — xóa / cập nhật 1 ảnh showcase
// =====================================================
const isAdmin = (request: NextRequest) =>
  request.cookies.get('admin_user')?.value === '1'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    if (!isAdmin(request)) return errorResponse('Forbidden', 403)

    const { id } = await params
    const { error } = await supabaseAdmin
      .from('mod_showcases')
      .delete()
      .eq('id', id)

    if (error) return errorResponse('Xóa ảnh thất bại', 500)
    return NextResponse.json({ success: true })
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    if (!isAdmin(request)) return errorResponse('Forbidden', 403)

    const { id } = await params
    const body = (await request.json().catch(() => null)) as {
      caption?: string | null
      sort_order?: number
    } | null

    if (!body) return errorResponse('Dữ liệu không hợp lệ', 400)

    const { error } = await supabaseAdmin
      .from('mod_showcases')
      .update({
        caption: body.caption?.trim() || null,
        ...(typeof body.sort_order === 'number' ? { sort_order: body.sort_order } : {}),
      })
      .eq('id', id)

    if (error) return errorResponse('Cập nhật ảnh thất bại', 500)
    return NextResponse.json({ success: true })
  })
}
