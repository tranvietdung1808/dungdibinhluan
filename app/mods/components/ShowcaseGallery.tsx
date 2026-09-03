"use client";

import { useEffect, useCallback, useRef, useState } from "react";

interface ShowcaseItem {
  id: string;
  image_url: string;
  caption: string | null;
}

interface ShowcaseGalleryProps {
  slug: string;
}

/**
 * Showcase ảnh của mod — grid 2 cột (mobile) / 3-4 cột (desktop),
 * bấm vào để mở lightbox xem lớn (hỗ trợ ESC, phím ←/→).
 * Ảnh được quản lý qua trang admin `/admin/mods/<slug>/showcase`.
 */
export default function ShowcaseGallery({ slug }: ShowcaseGalleryProps) {
  const [images, setImages] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/mods/${encodeURIComponent(slug)}/showcase`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setImages(Array.isArray(data.images) ? data.images : []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const close = useCallback(() => setActiveIndex(null), []);

  const navigate = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        if (current === null || images.length === 0) return current;
        return (current + direction + images.length) % images.length;
      });
    },
    [images.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") navigate(1);
      if (event.key === "ArrowLeft") navigate(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, close, navigate]);

  // Ảnh mở lên → focus vào lightbox để hỗ trợ đọc màn hình
  useEffect(() => {
    if (activeIndex !== null) dialogRef.current?.focus();
  }, [activeIndex]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-video rounded-2xl bg-white/[0.04] border border-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-slate-500">
        Không tải được ảnh showcase. Vui lòng thử lại sau.
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-slate-500 text-sm">Chưa có ảnh showcase.</p>
      </div>
    );
  }

  const activeImage = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Xem ảnh ${index + 1}${image.caption ? `: ${image.caption}` : ""}`}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-[#0c0c10] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.image_url}
              alt={image.caption || `Showcase ${index + 1}`}
              loading={index < 6 ? "eager" : "lazy"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh showcase"
          onClick={close}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative max-w-5xl w-full outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full overflow-hidden rounded-2xl bg-[#0c0c10] border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.image_url}
                alt={activeImage.caption || `Showcase ${activeIndex! + 1}`}
                className="w-full max-h-[78vh] object-contain"
              />
            </div>

            {activeImage.caption && (
              <p className="mt-3 text-center text-sm text-slate-300">{activeImage.caption}</p>
            )}

            {/* Counter */}
            <p className="absolute top-3 left-4 text-xs font-bold text-white/80 bg-black/50 px-3 py-1 rounded-full">
              {activeIndex! + 1} / {images.length}
            </p>

            {/* Đóng */}
            <button
              type="button"
              onClick={close}
              aria-label="Đóng"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Điều hướng */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  aria-label="Ảnh trước"
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(1)}
                  aria-label="Ảnh sau"
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
