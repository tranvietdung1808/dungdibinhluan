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
        <div className="mx-auto max-w-[960px] px-6 pb-16">
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
            className="mb-3 mt-5 font-bold leading-[1.2] text-white"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
          >
            {guideData.title}
          </h1>

          {/* 4. Meta */}
          <div className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[#888]">
            {guideData.profiles?.avatar_url ? (
              <img
                src={guideData.profiles.avatar_url}
                alt=""
                className="h-6 w-6 shrink-0 rounded-full object-cover"
              />
            ) : null}
            <span className="text-[#aaa]">{guideData.profiles?.username || 'Admin'}</span>
            <span className="text-[#555]">•</span>
            <span>{created}</span>
          </div>

          {/* 5. Ảnh thumbnail */}
          {thumbnailSrc ? (
            <div className="w-full overflow-hidden rounded-[12px]">
              <img
                src={thumbnailSrc}
                alt=""
                className="block w-full object-cover"
              />
            </div>
          ) : null}

          {/* 6. Nội dung */}
          <div
            className="prose prose-invert mt-10 max-w-none text-[17px] leading-[1.95] tracking-[0.01em] text-[#e0e0e0]
              prose-headings:scroll-mt-20 prose-headings:leading-snug
              prose-h1:mt-[2em] prose-h1:mb-2 prose-h1:border-b prose-h1:border-[#222] prose-h1:pb-2 prose-h1:text-[1.25em] prose-h1:font-bold prose-h1:text-white
              prose-h2:mt-[2em] prose-h2:mb-2 prose-h2:border-b prose-h2:border-[#222] prose-h2:pb-2 prose-h2:font-bold prose-h2:text-white
              prose-h3:mt-6 prose-h3:mb-2 prose-h3:font-semibold prose-h3:text-[#ddd]
              prose-p:mb-[1.35em] prose-p:leading-[1.95] prose-p:text-[#e0e0e0]
              prose-strong:font-semibold prose-strong:text-white
              prose-a:text-[#e8535a] prose-a:no-underline hover:prose-a:underline
              prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:text-[#e0e0e0]
              prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-[#e0e0e0]
              prose-li:my-2 prose-li:leading-[1.95] prose-li:text-[#e0e0e0]
              prose-blockquote:my-4 prose-blockquote:border-l-[3px] prose-blockquote:border-solid prose-blockquote:border-[#e8535a] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:leading-[1.95] prose-blockquote:text-[#aaa]
              prose-code:rounded prose-code:bg-[#1a1a2e] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:text-[#e0e0e0]
              prose-pre:rounded-lg prose-pre:border prose-pre:border-[#222] prose-pre:bg-[#1a1a2e] prose-pre:text-[#e0e0e0]
              prose-img:my-6 prose-img:max-w-full prose-img:rounded-lg
              prose-hr:border-[#222]
            "
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* 7. Footer */}
          <div className="mt-14 border-t border-[#222] pt-10">
            <Link
              href="/huong-dan"
              className="inline-flex items-center gap-2 rounded-lg border border-[#333] px-5 py-2.5 text-sm font-medium text-[#e0e0e0] transition-colors hover:border-[#e8535a] hover:bg-[#e8535a] hover:text-white"
            >
              <span aria-hidden>←</span>
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    notFound()
  }
}
