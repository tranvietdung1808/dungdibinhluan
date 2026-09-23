"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/app/components/ui/Badge";
import { formatVnd, type AccessOffer, type ModSummary } from "@/lib/catalog";

// Ảnh grid: 1 cột mobile → 4 cột desktop (§9.3)
const GRID_IMAGE_SIZES =
  "(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw";

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/**
 * OfferBadge — trạng thái giá/quyền ở vị trí ổn định (§9.3):
 * "Miễn phí" · "X credit" (credit) · "Đã mở" (success) · "169.000đ" (product)
 * · "Liên hệ" (chưa có kênh nhận tự động). Không dùng "VIP" chung chung.
 */
export function OfferBadge({
  offer,
  owned = false,
}: {
  offer: AccessOffer;
  owned?: boolean;
}) {
  if (owned && offer.kind === "credit") {
    return <Badge tone="success">Đã mở</Badge>;
  }
  switch (offer.kind) {
    case "credit":
      return (
        <Badge tone="credit">
          <LockIcon className="h-3.5 w-3.5" />
          <span className="tabular">{offer.creditCost} credit</span>
        </Badge>
      );
    case "product":
      return <Badge tone="accent">{formatVnd(offer.priceVnd)}</Badge>;
    case "contact":
      return <Badge tone="neutral">{offer.label}</Badge>;
    default:
      return <Badge tone="neutral">Miễn phí</Badge>;
  }
}

/** Fallback giữ đúng tỷ lệ khung khi ảnh thiếu/lỗi — tiêu đề/link vẫn còn trong body card. */
function ThumbnailFallback({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "M";
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-surface-2)]"
    >
      <svg
        className="h-8 w-8 text-[var(--color-muted)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-4.5-4.5a1.5 1.5 0 0 0-2 0L5 20" />
      </svg>
      <span className="text-2xl font-black text-[var(--color-line-strong)]">
        {initial}
      </span>
    </div>
  );
}

interface ModCardProps {
  mod: ModSummary;
  /** User đã mở khóa mod credit này (dữ liệu theo user, không nằm trong public payload) */
  owned?: boolean;
}

export default function ModCard({ mod, owned = false }: ModCardProps) {
  const [imageError, setImageError] = useState(false);
  const isPortrait = mod.orientation !== "landscape";
  const thumbnail = mod.thumbnail;
  const showImage = Boolean(thumbnail) && !imageError;

  return (
    <Link
      href={`/mods/${mod.slug}`}
      className="group block h-full rounded-2xl outline-none"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] shadow-[var(--shadow-ambient)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--color-accent-border)]">
        {/* Ảnh 16:10 — portrait contain trong cùng khung, nền tĩnh surface-2 */}
        <div className="relative aspect-[16/10] w-full flex-shrink-0 overflow-hidden bg-[var(--color-surface-2)]">
          {showImage ? (
            <Image
              src={thumbnail as string}
              alt={mod.name}
              fill
              className={`transition-transform duration-500 group-hover:scale-[1.03] ${
                isPortrait
                  ? "object-contain object-center p-3"
                  : "object-cover object-top"
              }`}
              sizes={GRID_IMAGE_SIZES}
              onError={() => setImageError(true)}
            />
          ) : (
            <ThumbnailFallback name={mod.name} />
          )}
        </div>

        {/* Nội dung: category → tên → mô tả → version/ngày → giá → tác giả */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{mod.category}</Badge>
            {mod.featured && <Badge tone="accent">Nổi bật</Badge>}
          </div>

          <h3
            className="line-clamp-2 text-[15px] font-bold leading-snug text-[var(--color-title)] transition-colors group-hover:text-[var(--color-accent-strong)]"
            title={mod.name}
          >
            {mod.name}
          </h3>

          {mod.description && (
            <p className="text-meta line-clamp-2 text-[var(--color-muted)]">
              {mod.description}
            </p>
          )}

          {(mod.version || mod.updatedAt) && (
            <p className="text-meta text-[var(--color-muted)]">
              {mod.version && <span className="tabular">{mod.version}</span>}
              {mod.version && mod.updatedAt && (
                <span aria-hidden="true"> · </span>
              )}
              {mod.updatedAt && (
                <span className="tabular">Cập nhật {mod.updatedAt}</span>
              )}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-2.5">
            <OfferBadge offer={mod.offer} owned={owned} />
            <span
              className="min-w-0 truncate text-meta text-[var(--color-muted)]"
              title={mod.author}
            >
              <span className="sr-only">Tác giả: </span>
              {mod.author}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
