"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, ErrorState, Skeleton } from "@/app/components/ui";

// =====================================================
// ShowcaseGallery — ảnh showcase public của mod (§10.4)
// - Grid thumbnail → lightbox: đóng/trước/sau, keyboard ←/→/Esc,
//   counter "3/8", focus trap + return focus + data-modal-open
//   (qua ui/Dialog), swipe bổ sung trên mobile, thumbnail strip
//   có trạng thái selected rõ.
// - Lỗi tải ảnh KHÔNG đóng lightbox — hiện fallback trong khung.
// - hideWhenEmpty: chưa có showcase → không dựng gallery rỗng
//   (chỉ giữ cover trang chi tiết — §10.4).
// =====================================================

interface ShowcaseItem {
  id: string;
  image_url: string;
  caption: string | null;
}

interface ShowcaseGalleryProps {
  slug: string;
  /** true → render null khi không có ảnh (thay vì khối trống) */
  hideWhenEmpty?: boolean;
  /** Tiêu đề section — chỉ hiện khi có ảnh */
  heading?: string;
}

function ZoomIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function ChevronIcon({
  direction,
  className = "h-4 w-4",
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "left" ? <path d="M15 19l-7-7 7-7" /> : <path d="M9 5l7 7-7 7" />}
    </svg>
  );
}

/** Fallback khi ảnh lỗi — giữ đúng khung, không đóng lightbox. */
function ImageBroken({ label }: { label: string }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--color-surface-2)] p-6 text-center"
      role="img"
      aria-label={label}
    >
      <svg
        className="h-8 w-8 text-[var(--color-muted)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-4.5-4.5a1.5 1.5 0 0 0-2 0L5 20" />
      </svg>
      <span className="text-meta text-[var(--color-muted)]">
        Ảnh chưa tải được
      </span>
    </div>
  );
}

export default function ShowcaseGallery({
  slug,
  hideWhenEmpty = false,
  heading,
}: ShowcaseGalleryProps) {
  const [images, setImages] = useState<ShowcaseItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [brokenIds, setBrokenIds] = useState<ReadonlySet<string>>(new Set());
  const touchStartX = useRef<number | null>(null);

  // Không setStatus đồng bộ trong effect body (react-hooks/set-state-in-effect):
  // mount đã ở "loading"; retry set loading trong event handler trước khi gọi.
  const fetchShowcase = useCallback(() => {
    let cancelled = false;
    fetch(`/api/mods/${encodeURIComponent(slug)}/showcase`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setImages(Array.isArray(data.images) ? data.images : []);
        setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => fetchShowcase(), [fetchShowcase]);

  const retryFetch = useCallback(() => {
    setStatus("loading");
    void fetchShowcase();
  }, [fetchShowcase]);

  const close = useCallback(() => setActiveIndex(null), []);

  const navigate = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        if (current === null || images.length === 0) return current;
        return (current + direction + images.length) % images.length;
      });
    },
    [images.length],
  );

  // Phím ←/→ điều hướng (Escape đóng do Dialog xử lý)
  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") navigate(1);
      if (event.key === "ArrowLeft") navigate(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, navigate]);

  const markBroken = useCallback((id: string) => {
    setBrokenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Swipe mobile — bổ sung, nút điều hướng vẫn giữ (§10.4)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) < 48) return;
    navigate(dx < 0 ? 1 : -1);
  };

  if (status === "loading") {
    return (
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4"
        aria-label="Đang tải ảnh showcase"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    // §17.1: lỗi resource riêng + retry đúng resource
    return (
      <ErrorState
        title="Chưa tải được ảnh showcase"
        retryLabel="Thử lại"
        onRetry={retryFetch}
      />
    );
  }

  if (images.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface-1)] p-8 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          Chưa có ảnh showcase.
        </p>
      </div>
    );
  }

  const activeImage = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      {heading && (
        <h3 className="mb-4 text-h3 text-[var(--color-title)]">{heading}</h3>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Xem ảnh ${index + 1}${image.caption ? `: ${image.caption}` : ""}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] transition-colors hover:border-[var(--color-accent-border)] focus-visible:border-[var(--color-accent-border)]"
          >
            {brokenIds.has(image.id) ? (
              <ImageBroken label={image.caption || `Showcase ${index + 1}`} />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.image_url}
                  alt={image.caption || `Showcase ${index + 1}`}
                  loading={index < 6 ? "eager" : "lazy"}
                  onError={() => markBroken(image.id)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <ZoomIcon />
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox — Dialog: focus trap + return focus + Escape +
          scroll lock + data-modal-open (ẩn support bubble, B07) */}
      <Dialog
        open={activeImage !== null}
        onClose={close}
        label={`Ảnh showcase ${activeIndex !== null ? activeIndex + 1 : ""}`}
        className="max-w-5xl border-0 bg-transparent p-0 shadow-none"
      >
        {activeImage && (
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="relative w-full overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)]">
              {brokenIds.has(activeImage.id) ? (
                <div className="flex h-[50vh] items-center justify-center">
                  <ImageBroken
                    label={activeImage.caption || `Showcase ${activeIndex! + 1}`}
                  />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={activeImage.image_url}
                  alt={activeImage.caption || `Showcase ${activeIndex! + 1}`}
                  onError={() => markBroken(activeImage.id)}
                  className="max-h-[68vh] w-full object-contain"
                />
              )}
            </div>

            {activeImage.caption && (
              <p className="mt-3 text-center text-sm text-[var(--color-body)]">
                {activeImage.caption}
              </p>
            )}

            {/* Counter + điều hướng */}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="tabular rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[var(--color-body)]">
                {activeIndex! + 1} / {images.length}
              </p>
              {images.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Ảnh trước"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] text-[var(--color-title)] transition-colors hover:bg-[var(--color-surface-2)]"
                  >
                    <ChevronIcon direction="left" className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(1)}
                    aria-label="Ảnh sau"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] text-[var(--color-title)] transition-colors hover:bg-[var(--color-surface-2)]"
                  >
                    <ChevronIcon direction="right" className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail strip — selected rõ bằng ring + aria-current */}
            {images.length > 1 && (
              <div
                className="mt-3 flex gap-2 overflow-x-auto pb-1"
                aria-label="Chọn ảnh showcase"
              >
                {images.map((image, index) => {
                  const selected = index === activeIndex;
                  return (
                    <button
                      key={image.id}
                      type="button"
                      aria-current={selected || undefined}
                      aria-label={`Ảnh ${index + 1}${image.caption ? `: ${image.caption}` : ""}`}
                      onClick={() => setActiveIndex(index)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-all ${
                        selected
                          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]"
                          : "border-[var(--color-line)] opacity-60 hover:opacity-100"
                      }`}
                    >
                      {brokenIds.has(image.id) ? (
                        <ImageBroken label={`Ảnh ${index + 1}`} />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={image.image_url}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          onError={() => markBroken(image.id)}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
