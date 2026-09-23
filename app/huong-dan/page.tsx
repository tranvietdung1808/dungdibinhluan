import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { resolveThumbnailSrc } from '@/utils/r2'
import { buildExcerpt } from '@/lib/related-content'
import { Container } from '@/app/components/ui'
import GuideExplorer, { type GuideCardData } from './components/GuideExplorer'
import RefreshErrorState from './components/RefreshErrorState'

export const metadata: Metadata = {
  title: 'Hướng dẫn & mẹo',
  description: 'Danh sách bài hướng dẫn cài đặt, tối ưu và sử dụng mod EA FC 26/FIFA cho game thủ Việt.',
  alternates: {
    canonical: 'https://dungdibinhluan.com/huong-dan',
  },
}

export const revalidate = 86400

type GuideRow = {
  id: string
  title: string
  slug: string
  content: string
  thumbnail_url: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  profiles?: {
    username: string | null
    avatar_url: string | null
  }[] | null
}

export default async function GuidesPage() {
  const supabase = createClient()

  // Chưa có cột excerpt trong schema → lấy content về và strip HTML phía server
  // để tạo mô tả thật cho card (B11). Client chỉ nhận excerpt đã rút gọn.
  const { data: guides, error } = await supabase
    .from('guides')
    .select(`
      id,
      title,
      slug,
      content,
      thumbnail_url,
      tags,
      created_at,
      updated_at,
      profiles:author_id (
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching guides:', error)
  }

  const items: GuideCardData[] = ((guides ?? []) as GuideRow[]).map((guide) => {
    const excerpt = buildExcerpt(guide.content || '', 170)
    return {
      id: guide.id,
      slug: guide.slug,
      title: guide.title,
      excerpt: excerpt.length > 0 ? excerpt : null,
      thumbnail: resolveThumbnailSrc(guide.thumbnail_url),
      tags: guide.tags ?? [],
      authorName: guide.profiles?.[0]?.username || 'Admin',
      authorAvatar: guide.profiles?.[0]?.avatar_url || null,
      dateLabel: new Date(guide.updated_at || guide.created_at).toLocaleDateString('vi-VN'),
    }
  })

  return (
    <main className="min-h-screen">
      <Container className="py-10 md:py-14">
        <header className="max-w-2xl">
          <h1 className="text-h1 text-[var(--color-title)]">Hướng dẫn &amp; mẹo</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
            Tổng hợp bài hướng dẫn cài đặt mod, tối ưu FC 26 và mẹo chơi hữu ích cho game thủ Việt.
          </p>
        </header>

        <div className="mt-8 md:mt-10">
          {error ? (
            <RefreshErrorState
              title="Chưa tải được bài hướng dẫn"
              description="Kết nối dữ liệu đang gặp sự cố. Thử lại để tải danh sách bài viết."
            />
          ) : (
            <GuideExplorer items={items} />
          )}
        </div>
      </Container>
    </main>
  )
}
