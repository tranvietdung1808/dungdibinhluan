"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// =====================================================
// ArticleBody — B12/§15.2: render nội dung Tiptap đã xử lý server
// (guide-content.ts) với class .article-body từ globals.css.
//  - Bấm ảnh → lightbox xem lớn (Escape/click nền để đóng)
//  - iframe .article-video → click-to-play: gán src khi bấm nút
// =====================================================

type LightboxImage = { src: string; alt: string }

export default function ArticleBody({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null)

  const closeLightbox = useCallback(() => setLightbox(null), [])

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement

    // Video click-to-play: nút phủ .article-video__play → nạp src thật cho iframe
    const playButton = target.closest<HTMLElement>(".article-video__play")
    if (playButton) {
      const shell = playButton.closest(".article-video")
      const iframe = shell?.querySelector("iframe")
      const src = iframe?.getAttribute("data-src")
      if (iframe && src) {
        iframe.setAttribute("src", src)
        iframe.removeAttribute("data-src")
      }
      playButton.remove()
      return
    }

    // Ảnh → lightbox
    const img = target.closest("img")
    if (
      img &&
      containerRef.current?.contains(img) &&
      (img.currentSrc || img.src)
    ) {
      setLightbox({
        src: img.currentSrc || img.src,
        alt: img.getAttribute("alt") || "",
      })
    }
  }, [])

  // Lightbox: Escape để đóng, khóa scroll nền, báo modal mở (ẩn support bubble B07)
  useEffect(() => {
    if (!lightbox) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        closeLightbox()
      }
    }
    document.addEventListener("keydown", onKeyDown, true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.body.dataset.modalOpen = "true"
    return () => {
      document.removeEventListener("keydown", onKeyDown, true)
      document.body.style.overflow = prevOverflow
      delete document.body.dataset.modalOpen
    }
  }, [lightbox, closeLightbox])

  return (
    <>
      <div
        ref={containerRef}
        className="article-body"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {lightbox && (
        <div
          className="fixed inset-0 z-[var(--layer-modal)] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh lớn"
        >
          <button
            type="button"
            aria-label="Đóng ảnh"
            onClick={closeLightbox}
            className="absolute inset-0 h-full w-full cursor-zoom-out bg-[var(--color-overlay)]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            className="relative max-h-[85vh] max-w-full rounded-xl border border-[var(--color-line-strong)] object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Đóng"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] text-[var(--color-title)] transition-colors hover:bg-[var(--color-surface-2)]"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
