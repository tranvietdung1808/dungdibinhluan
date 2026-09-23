import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { resolveThumbnailSrc, rewriteImageSrcInHtml } from '@/utils/r2'
import { notFound } from 'next/navigation'
import { buildExcerpt } from '@/lib/related-content'
import CommunityComments from '@/app/components/CommunityComments'
import { Badge, Breadcrumb, Container, ButtonLink } from '@/app/components/ui'
import ArticleBody from '@/app/huong-dan/components/ArticleBody'
import { GuideTocDesktop, GuideTocMobile } from '@/app/huong-dan/components/GuideToc'
import { GuideCard, type GuideCardData } from '@/app/huong-dan/components/GuideExplorer'
import { prepareArticleHtml } from '@/app/huong-dan/components/guide-content'

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
  thumbnail_url: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  profiles?: {
    username: string | null
    avatar_url: string | null
  }[] | null
}

export const revalidate = 86400

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
    .select(`
      id,
      slug,
      title,
      thumbnail_url,
      tags,
      created_at,
      updated_at,
      profiles:author_id (
        username,
        avatar_url
      )
    `)
    .neq('id', currentGuideId)
    .order('created_at', { ascending: false })
    .limit(20)
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
  const description =
    buildExcerpt(guideData.content, 155) || `Hướng dẫn chi tiết: ${guideData.title}`
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
    // rewriteImageSrcInHtml giữ nguyên — ảnh R2 map sang /api/media; prepareArticleHtml
    // xử lý heading/anchor/iframe/ảnh lazy (xem guide-content.ts)
    const prepared = prepareArticleHtml(rewriteImageSrcInHtml(guideData.content || ''))
    const guideTags = guideData.tags || []

    const { data: relatedGuideCandidates } = await fetchRelatedGuideCandidates(guideData.id)
    const candidates = (relatedGuideCandidates || []) as GuideSummary[]
    const relatedGuides: GuideCardData[] = (
      guideTags.length > 0
        ? candidates
            .filter((candidate) => candidate.tags?.some((tag) => guideTags.includes(tag)))
            .slice(0, 6)
        : candidates.slice(0, 6)
    ).map((candidate) => ({
      id: candidate.id,
      slug: candidate.slug,
      title: candidate.title,
      excerpt: null,
      thumbnail: resolveThumbnailSrc(candidate.thumbnail_url),
      tags: candidate.tags ?? [],
      authorName: candidate.profiles?.[0]?.username || 'Admin',
      authorAvatar: candidate.profiles?.[0]?.avatar_url || null,
      dateLabel: new Date(candidate.updated_at || candidate.created_at).toLocaleDateString('vi-VN'),
    }))

    const updatedAt = guideData.updated_at || guideData.created_at
    const updatedLabel = new Date(updatedAt).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const authorName = guideData.profiles?.username || 'Admin'
    const authorAvatar = guideData.profiles?.avatar_url || null
    const hasToc = prepared.toc.length > 0

    return (
      <div className="min-h-screen">
        <Container className="py-8 md:py-10">
          <Breadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Hướng dẫn & mẹo', href: '/huong-dan' },
              { label: guideData.title },
            ]}
          />

          <div className="mx-auto mt-8 max-w-[1040px]">
            <header className="max-w-[760px]">
              {guideTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {guideTags.map((tag) => (
                    <Badge key={tag} tone="accent">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <h1 className="text-h1 mt-4 break-words text-[var(--color-title)]">
                {guideData.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-meta text-[var(--color-muted)]">
                <span className="inline-flex items-center gap-2">
                  {authorAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={authorAvatar}
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                      decoding="async"
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-xs font-bold text-[var(--color-accent-strong)]"
                    >
                      {authorName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="font-medium text-[var(--color-body)]">{authorName}</span>
                </span>
                <span aria-hidden="true" className="text-[var(--color-line-strong)]">•</span>
                <span>
                  Cập nhật{' '}
                  <time dateTime={updatedAt}>{updatedLabel}</time>
                </span>
              </div>

              {prepared.excerpt && (
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-[var(--color-body)]">
                  {prepared.excerpt}
                </p>
              )}
            </header>

            {thumbnailSrc && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailSrc}
                  alt={guideData.title}
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}

            <div
              className={`mt-10 ${
                hasToc
                  ? 'xl:grid xl:grid-cols-[minmax(0,760px)_240px] xl:items-start xl:justify-center xl:gap-10'
                  : ''
              }`}
            >
              <div className="min-w-0 max-w-[760px]">
                <div className="xl:hidden">
                  <GuideTocMobile items={prepared.toc} />
                </div>
                <ArticleBody html={prepared.html} />
              </div>

              {hasToc && (
                <aside className="mt-10 hidden xl:mt-0 xl:block">
                  <div className="sticky top-24">
                    <GuideTocDesktop items={prepared.toc} />
                  </div>
                </aside>
              )}
            </div>
          </div>

          <section className="mx-auto mt-14 max-w-[1040px]" aria-labelledby="related-guides">
            <h2 id="related-guides" className="text-h2 text-[var(--color-title)]">
              Bài viết liên quan
            </h2>
            {relatedGuides.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Chưa có bài viết liên quan phù hợp.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedGuides.map((relatedGuide) => (
                  <GuideCard key={relatedGuide.id} guide={relatedGuide} />
                ))}
              </div>
            )}
          </section>

          <div className="mx-auto mt-4 max-w-[760px]">
            <CommunityComments
              scopeType="guide"
              scopeId={guideData.id}
              title="Bình luận bài viết"
              emptyText="Chưa có bình luận nào cho bài viết này."
            />
          </div>

          <div className="mx-auto mt-10 max-w-[1040px]">
            <ButtonLink href="/huong-dan" variant="secondary" size="sm">
              ← Quay lại danh sách hướng dẫn
            </ButtonLink>
          </div>
        </Container>
      </div>
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    notFound()
  }
}
