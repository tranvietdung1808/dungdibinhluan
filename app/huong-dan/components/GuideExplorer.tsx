"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge, EmptyState, inputClass } from "@/app/components/ui"
import { GUIDE_FIXED_TAGS, normalizeText } from "@/lib/related-content"

// =====================================================
// GuideExplorer — §15.1: search không dấu + lọc theo tag
// + bài nổi bật (mới nhất) + grid 3/2/1 cột.
// Dữ liệu đã được resolve thumbnail/excerpt/format ngày ở server.
// =====================================================

export type GuideCardData = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  thumbnail: string | null
  tags: string[]
  authorName: string
  authorAvatar: string | null
  dateLabel: string
}

function BookIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  )
}

function GuideCover({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-[var(--color-surface-2)] text-[var(--color-muted)]">
        <BookIcon />
      </div>
    )
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-surface-2)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"
      />
    </div>
  )
}

function TagBadges({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 2).map((tag) => (
        <Badge key={tag} tone="neutral">
          {tag}
        </Badge>
      ))}
    </div>
  )
}

function CardMeta({ guide }: { guide: GuideCardData }) {
  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-4 text-meta text-[var(--color-muted)]">
      <span className="inline-flex min-w-0 items-center gap-2">
        {guide.authorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={guide.authorAvatar}
            alt=""
            width={20}
            height={20}
            loading="lazy"
            decoding="async"
            className="h-5 w-5 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-[10px] font-bold text-[var(--color-accent-strong)]"
          >
            {guide.authorName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="truncate">{guide.authorName}</span>
      </span>
      <span className="shrink-0">{guide.dateLabel}</span>
    </div>
  )
}

export function GuideCard({ guide }: { guide: GuideCardData }) {
  return (
    <Link
      href={`/huong-dan/${guide.slug}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-2)]"
    >
      <GuideCover src={guide.thumbnail} />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <TagBadges tags={guide.tags} />
        <h3 className="text-h3 break-words text-[var(--color-title)] transition-colors line-clamp-2 group-hover:text-[var(--color-accent-strong)]">
          {guide.title}
        </h3>
        {guide.excerpt ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--color-muted)]">
            {guide.excerpt}
          </p>
        ) : null}
        <CardMeta guide={guide} />
      </div>
    </Link>
  )
}

function FeaturedCard({ guide }: { guide: GuideCardData }) {
  return (
    <Link
      href={`/huong-dan/${guide.slug}`}
      className="group grid min-w-0 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] transition-all duration-150 hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-2)] md:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]"
    >
      <GuideCover src={guide.thumbnail} />
      <div className="flex min-w-0 flex-col gap-3 p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Bài mới nhất</Badge>
          <TagBadges tags={guide.tags} />
        </div>
        <h3 className="text-h2 break-words text-[var(--color-title)] transition-colors line-clamp-3 group-hover:text-[var(--color-accent-strong)]">
          {guide.title}
        </h3>
        {guide.excerpt ? (
          <p className="line-clamp-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
            {guide.excerpt}
          </p>
        ) : null}
        <CardMeta guide={guide} />
      </div>
    </Link>
  )
}

const chipClass = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-[var(--color-accent-strong)]"
      : "border-[var(--color-line)] bg-[var(--color-surface-1)] text-[var(--color-body)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-title)]"
  }`

export default function GuideExplorer({ items }: { items: GuideCardData[] }) {
  const [query, setQuery] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const tags = useMemo(() => {
    const present = new Set<string>()
    for (const item of items) {
      for (const tag of item.tags) present.add(tag)
    }
    const fixed = (GUIDE_FIXED_TAGS as readonly string[]).filter((t) =>
      present.has(t)
    )
    const extras = [...present]
      .filter((t) => !(GUIDE_FIXED_TAGS as readonly string[]).includes(t))
      .sort((a, b) => a.localeCompare(b, "vi"))
    return [...fixed, ...extras]
  }, [items])

  const filtered = useMemo(() => {
    const q = normalizeText(query.trim())
    return items.filter((item) => {
      if (activeTag && !item.tags.includes(activeTag)) return false
      if (!q) return true
      const haystack = normalizeText(
        `${item.title} ${item.excerpt ?? ""} ${item.tags.join(" ")}`
      )
      return haystack.includes(q)
    })
  }, [items, query, activeTag])

  const filtering = query.trim().length > 0 || activeTag !== null
  const resetFilters = () => {
    setQuery("")
    setActiveTag(null)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Chưa có bài hướng dẫn nào"
        description="Các bài viết hướng dẫn và mẹo chơi sẽ xuất hiện tại đây. Hãy quay lại sau."
        icon={<BookIcon className="h-12 w-12" />}
      />
    )
  }

  // Bài nổi bật: bài mới nhất, chỉ hiển thị khi chưa lọc/tìm kiếm
  const featured = !filtering && filtered.length > 1 ? filtered[0] : null
  const rest = featured ? filtered.slice(1) : filtered

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="guide-search"
            className="mb-1.5 block text-sm font-medium text-[var(--color-title)]"
          >
            Tìm kiếm bài viết
          </label>
          <div className="relative">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="guide-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tiêu đề, nội dung, tag…"
              className={`${inputClass} pl-11`}
            />
          </div>
        </div>

        {tags.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Lọc theo chủ đề"
          >
            <button
              type="button"
              aria-pressed={activeTag === null}
              onClick={() => setActiveTag(null)}
              className={chipClass(activeTag === null)}
            >
              Tất cả
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={activeTag === tag}
                onClick={() => setActiveTag(tag)}
                className={chipClass(activeTag === tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <p
        className="mt-6 text-meta text-[var(--color-muted)]"
        aria-live="polite"
      >
        {filtered.length} bài viết
        {filtering ? " đang khớp bộ lọc" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Không tìm thấy bài viết phù hợp"
            description={
              query.trim()
                ? `Không có bài viết nào khớp với “${query.trim()}” và bộ lọc hiện tại.`
                : "Không có bài viết nào trong chủ đề này."
            }
            action="Xóa bộ lọc"
            onAction={resetFilters}
          />
        </div>
      ) : (
        <>
          {featured && (
            <div className="mt-4">
              <FeaturedCard guide={featured} />
            </div>
          )}
          {rest.length > 0 && (
            <div
              className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
                featured ? "mt-6" : "mt-4"
              }`}
            >
              {rest.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
