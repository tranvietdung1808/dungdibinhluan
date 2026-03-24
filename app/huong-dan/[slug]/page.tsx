import { createClient } from '@/utils/supabase/server'
import { resolveThumbnailSrc, rewriteImageSrcInHtml } from '@/utils/r2'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Guide = {
  id: string
  title: string
  slug: string
  content: string
  thumbnail_url: string | null
  author_id: string
  created_at: string
  updated_at: string
  profiles: {
    username: string | null
    avatar_url: string | null
  }
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createClient()

  try {
    const { data: guide, error } = await supabase
      .from('guides')
      .select(`
        *,
        profiles:author_id (
          username,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .single()

    if (error || !guide) {
      console.error('Error fetching guide:', error)
      notFound()
    }

    const guideData = guide as Guide
    const thumbnailSrc = resolveThumbnailSrc(guideData.thumbnail_url)
    const contentHtml = rewriteImageSrcInHtml(guideData.content)

    const created = new Date(guideData.created_at).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return (
      <div className="min-h-screen bg-[#0d0d0f] text-white">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6 pb-16">
          {/* 1. Breadcrumb */}
          <nav
            className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-8 text-sm text-[#888]"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition-colors hover:text-white">
              Trang chủ
            </Link>
            <span className="text-[#555]">/</span>
            <Link href="/huong-dan" className="transition-colors hover:text-white">
              Hướng Dẫn/Mẹo
            </Link>
            <span className="text-[#555]">/</span>
            <span className="text-[#aaa]">{guideData.title}</span>
          </nav>

          {/* 2. Tags */}
          <div className="mt-6">
            <span
              className="inline-block rounded-full border border-[#333] bg-[#1e1e2e] px-3 py-1 text-[12px] text-[#aaa]"
            >
              Hướng Dẫn
            </span>
          </div>

          {/* 3. Tiêu đề */}
          <h1
            className="mb-4 mt-6 font-bold leading-tight text-white"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
          >
            {guideData.title}
          </h1>

          {/* 4. Meta */}
          <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#888]">
            {guideData.profiles?.avatar_url ? (
              <img
                src={guideData.profiles.avatar_url}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="h-7 w-7 shrink-0 rounded-full bg-[#333] flex items-center justify-center">
                <span className="text-xs text-[#aaa]">A</span>
              </div>
            )}
            <span className="text-[#aaa] font-medium">{guideData.profiles?.username || 'Admin'}</span>
            <span className="text-[#555]">•</span>
            <time className="text-[#aaa]">{created}</time>
          </div>

          {/* 5. Ảnh thumbnail */}
          {thumbnailSrc && (
            <div className="mb-8 w-full overflow-hidden rounded-[16px] shadow-lg">
              <img
                src={thumbnailSrc}
                alt={guideData.title}
                className="block w-full object-cover transition-transform hover:scale-105 duration-300"
              />
            </div>
          )}

          {/* 6. Nội dung */}
          <div className="prose prose-lg prose-invert max-w-none text-[#e0e0e0]
            prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:text-white
            prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6 prose-h1:border-b prose-h1:border-[#333] prose-h1:pb-4
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-5 prose-h2:border-b prose-h2:border-[#333] prose-h2:pb-3
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-[#ddd]
            prose-p:mb-6 prose-p:leading-relaxed prose-p:text-[#e0e0e0]
            prose-strong:text-white prose-strong:font-semibold
            prose-a:text-[#e8535a] prose-a:font-medium prose-a:no-underline hover:prose-a:underline hover:prose-a:text-[#ff6b6b]
            prose-ul:my-6 prose-ul:list-disc prose-ul:space-y-2 prose-ul:pl-6 prose-ul:text-[#e0e0e0]
            prose-ol:my-6 prose-ol:list-decimal prose-ol:space-y-2 prose-ol:pl-6 prose-ol:text-[#e0e0e0]
            prose-li:mb-2 prose-li:leading-relaxed prose-li:text-[#e0e0e0]
            prose-blockquote:my-6 prose-blockquote:border-l-4 prose-blockquote:border-solid prose-blockquote:border-[#e8535a] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:leading-relaxed prose-blockquote:text-[#bbb]
            prose-code:rounded prose-code:bg-[#1a1a2e] prose-code:px-2 prose-code:py-1 prose-code:text-sm prose-code:text-[#e0e0e0] prose-code:font-mono
            prose-pre:rounded-lg prose-pre:border prose-pre:border-[#333] prose-pre:bg-[#1a1a2e] prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:text-[#e0e0e0]
            prose-img:my-8 prose-img:max-w-full prose-img:rounded-lg prose-img:shadow-md
            prose-hr:border-[#333] prose-hr:my-12
            prose-table:border prose-table:border-[#333] prose-table:text-[#e0e0e0]
            prose-thead:bg-[#1a1a2e] prose-thead:text-white
            prose-th:border prose-th:border-[#333] prose-th:px-4 prose-th:py-3 prose-th:font-semibold prose-th:text-left
            prose-td:border prose-td:border-[#333] prose-td:px-4 prose-td:py-3
          ">
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </div>

          {/* 7. Footer */}
          <div className="mt-16 border-t border-[#222] pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Link
                href="/huong-dan"
                className="inline-flex items-center gap-2 rounded-lg border border-[#333] px-5 py-3 text-sm font-medium text-[#e0e0e0] transition-all hover:border-[#e8535a] hover:bg-[#e8535a] hover:text-white hover:shadow-lg"
              >
                <span aria-hidden>←</span>
                Quay lại danh sách
              </Link>
              
              <div className="text-sm text-[#666]">
                Cảm ơn đã đọc bài viết!
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    notFound()
  }
}
