import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { errorResponse, runRoute } from '@/lib/server/api-response'

// =====================================================
// /api/mods/[slug]/showcase — danh sách ảnh showcase công khai
// (bảng mod_showcases móc theo slug → áp dụng được cho cả mod static)
// =====================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return runRoute(async () => {
    const { slug } = await params
    const { data, error } = await supabaseAdmin
      .from('mod_showcases')
      .select('id, image_url, caption, sort_order')
      .eq('slug', slug)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      return errorResponse('Failed to fetch showcase', 500)
    }

    return NextResponse.json(
      { images: data ?? [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      }
    )
  })
}
