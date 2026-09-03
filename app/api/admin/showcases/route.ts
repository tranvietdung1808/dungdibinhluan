import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { errorResponse, runRoute } from '@/lib/server/api-response'

// =====================================================
// /api/admin/showcases — quản lý ảnh showcase theo slug
// GET   ?slug=…      → danh sách ảnh
// POST  {slug,image_url,caption} → thêm ảnh (sort_order tự tăng)
// PATCH {slug, ids[]} → sắp xếp lại thứ tự
// =====================================================
const isAdmin = (request: NextRequest) =>
  request.cookies.get('admin_user')?.value === '1'

export async function GET(request: NextRequest) {
  return runRoute(async () => {
    if (!isAdmin(request)) return errorResponse('Forbidden', 403)

    const slug = request.nextUrl.searchParams.get('slug')
    if (!slug) return errorResponse('slug không hợp lệ', 400)

    const { data, error } = await supabaseAdmin
      .from('mod_showcases')
      .select('*')
      .eq('slug', slug)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return errorResponse('Không đọc được showcase', 500)
    return NextResponse.json({ images: data ?? [] })
  })
}

export async function POST(request: NextRequest) {
  return runRoute(async () => {
    if (!isAdmin(request)) return errorResponse('Forbidden', 403)

    const body = (await request.json().catch(() => null)) as {
      slug?: string
      image_url?: string
      caption?: string | null
    } | null

    if (!body?.slug?.trim() || !body.image_url?.trim()) {
      return errorResponse('Thiếu slug hoặc image_url', 400)
    }

    // sort_order = max hiện tại + 1 (thêm vào cuối)
    const { data: existing, error: listError } = await supabaseAdmin
      .from('mod_showcases')
      .select('sort_order')
      .eq('slug', body.slug)
      .order('sort_order', { ascending: false })
      .limit(1)
    if (listError) return errorResponse('Không đọc được showcase', 500)

    const nextOrder =
      existing && existing.length > 0
        ? (existing[0].sort_order as number) + 1
        : 0

    const { data, error } = await supabaseAdmin
      .from('mod_showcases')
      .insert({
        slug: body.slug.trim(),
        image_url: body.image_url.trim(),
        caption: body.caption?.trim() || null,
        sort_order: nextOrder,
      })
      .select()
      .single()

    if (error) return errorResponse('Lưu showcase thất bại', 500)
    return NextResponse.json({ success: true, image: data })
  })
}

export async function PATCH(request: NextRequest) {
  return runRoute(async () => {
    if (!isAdmin(request)) return errorResponse('Forbidden', 403)

    const body = (await request.json().catch(() => null)) as {
      slug?: string
      ids?: string[]
    } | null

    if (!body?.slug?.trim() || !Array.isArray(body.ids) || body.ids.length === 0) {
      return errorResponse('Dữ liệu sắp xếp không hợp lệ', 400)
    }

    // Cập nhật sort_order theo đúng thứ tự mảng ids
    const updates = body.ids.map((id, index) =>
      supabaseAdmin
        .from('mod_showcases')
        .update({ sort_order: index })
        .eq('slug', body.slug!.trim())
        .eq('id', id)
    )
    const results = await Promise.all(updates)
    if (results.some((r) => r.error)) {
      return errorResponse('Sắp xếp thất bại', 500)
    }

    return NextResponse.json({ success: true })
  })
}
