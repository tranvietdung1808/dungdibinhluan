import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { resolveThumbnailSrc, rewriteImageSrcInHtml } from '@/utils/r2'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { stripHtml } from '@/lib/related-content'
import CommunityComments from '@/app/components/CommunityComments'

type Guide = {
  id: string
  title: string
  slug: string
  content: string
  thumbnail_url: string | null
  tags: string[]
  author_id: string
  created_at: string
  updated_at: string
  profiles: {
    username: string | null
    avatar_url: string | null
  }
}

type GuideSummary = {
  id: string
  slug: string
  title: string
  content: string
  thumbnail_url: string | null
  tags: string[]
  created_at: string
}

export const revalidate = 120

async function fetchGuideBySlug(slug: string) {
  const supabase = createClient()
  return supabase
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
}

async function fetchRelatedGuideCandidates(currentGuideId: string) {
  const supabase = createClient()
  return supabase
    .from('guides')
    .select('id, slug, title, content, thumbnail_url, tags, created_at')
    .neq('id', currentGuideId)
    .order('created_at', { ascending: false })
    .limit(60)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data: guide } = await fetchGuideBySlug(slug)

  if (!guide) {
    return {
      title: 'Bài viết không tồn tại',
      alternates: {
        canonical: `https://dungdibinhluan.com/huong-dan/${slug}`,
      },
    }
  }

  const guideData = guide as Guide
  const plainText = stripHtml(guideData.content)
  const description = plainText.slice(0, 155) || `Hướng dẫn chi tiết: ${guideData.title}`
  const thumbnailSrc = resolveThumbnailSrc(guideData.thumbnail_url)

  return {
    title: guideData.title,
    description,
    alternates: {
      canonical: `https://dungdibinhluan.com/huong-dan/${guideData.slug}`,
    },
    openGraph: {
      title: `${guideData.title} | DungDiBinhLuan`,
      description,
      type: 'article',
      url: `https://dungdibinhluan.com/huong-dan/${guideData.slug}`,
      images: thumbnailSrc ? [{ url: thumbnailSrc }] : undefined,
    },
  }
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  try {
    const { data: guide, error } = await fetchGuideBySlug(slug)

    if (error || !guide) {
      console.error('Error fetching guide:', error)
      notFound()
    }

    const guideData = guide as Guide
    const thumbnailSrc = resolveThumbnailSrc(guideData.thumbnail_url)
    const contentHtml = rewriteImageSrcInHtml(guideData.content)
    const guideTags = guideData.tags || []
    const { data: relatedGuideCandidates } = await fetchRelatedGuideCandidates(guideData.id)
    const candidates = (relatedGuideCandidates || []) as GuideSummary[]
    const relatedGuides =
      guideTags.length > 0
        ? candidates
            .filter((candidate) => candidate.tags?.some((tag) => guideTags.includes(tag)))
            .slice(0, 6)
        : candidates.slice(0, 6)

    const created = new Date(guideData.created_at).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return (
      <div className="min-h-screen bg-[#0d0d0f] text-white">
        <div className="mx-auto max-w-[1220px] px-4 sm:px-6 pb-16">
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

          <div className="mt-6">
            <div className="flex flex-wrap gap-2">
              {(guideTags.length > 0 ? guideTags : ['Chưa gắn tag']).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-[#333] bg-[#1e1e2e] px-3 py-1 text-[12px] text-[#cbd5e1]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <h1
            className="mb-4 mt-6 font-bold leading-tight text-white"
            style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
          >
            {guideData.title}
          </h1>

          <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#888]">
            <img
              src="/favicon.ico?v=20260325"
              alt={guideData.profiles?.username ? `Avatar ${guideData.profiles.username}` : 'Avatar tác giả'}
              className="h-7 w-7 shrink-0 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <span className="text-[#aaa] font-medium">{guideData.profiles?.username || 'Admin'}</span>
            <span className="text-[#555]">•</span>
            <time className="text-[#aaa]">{created}</time>
          </div>

          {thumbnailSrc && (
            <div className="mb-8 w-full overflow-hidden rounded-[16px] shadow-lg">
              <img
                src={thumbnailSrc}
                alt={guideData.title}
                className="block w-full object-cover transition-transform hover:scale-105 duration-300"
                loading="eager"
                decoding="async"
              />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
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

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-white/10 bg-[#121218] p-4 sm:p-5">
                <h2 className="text-base font-black tracking-wide text-white">Bài viết liên quan</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Gợi ý theo tag admin chọn, ưu tiên bài mới nhất.
                </p>
                <div className="mt-4 space-y-3">
                  {relatedGuides.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-sm text-slate-400">
                      Chưa có bài viết liên quan phù hợp.
                    </div>
                  ) : (
                    relatedGuides.map((relatedGuide) => {
                      const relatedThumbnail = resolveThumbnailSrc(relatedGuide.thumbnail_url)
                      const relatedTags = relatedGuide.tags || []
                      return (
                        <Link
                          key={relatedGuide.id}
                          href={`/huong-dan/${relatedGuide.slug}`}
                          className="block rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-[#e8535a]/60"
                        >
                          <div className="flex gap-3">
                            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#1d1d24]">
                              {relatedThumbnail && (
                                <img src={relatedThumbnail} alt={relatedGuide.title} className="h-full w-full object-cover" loading="lazy" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold text-white">{relatedGuide.title}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {relatedTags.slice(0, 2).map((tag) => (
                                  <span key={`${relatedGuide.id}-${tag}`} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-300">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {new Date(relatedGuide.created_at).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>
            </aside>
          </div>

          <CommunityComments
            scopeType="guide"
            scopeId={guideData.id}
            title="Bình luận bài viết"
            emptyText="Chưa có bình luận nào cho bài viết này."
          />

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
