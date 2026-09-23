"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface StickyBuyBarProps {
  /** Giá đã format (vd "169.000đ") — caller server suy ra từ PRODUCTS */
  price: string;
  href: string;
  /** id của khối CTA chính trong trang — bar ẩn khi khối này vào viewport */
  observeId?: string;
  title?: string;
  ctaLabel?: string;
}

/**
 * Thanh CTA dính dưới màn hình (mobile) — §10.5:
 * - IntersectionObserver gắn với CTA chính (#mix-cta): CTA hiển thị
 *   → bar ẩn; CTA ra khỏi viewport → bar hiện. Không dùng ngưỡng
 *   scrollY tùy ý.
 * - Khi ẩn: inert + aria-hidden + translate ra khỏi màn hình →
 *   không còn trong tab order/interaction, không chỉ che bằng mắt.
 * - Layer: --layer-sticky-action; giữ safe-area-inset-bottom.
 */
export default function StickyBuyBar({
  price,
  href,
  observeId = "mix-cta",
  title = "MIX MODS FC 26",
  ctaLabel = "Mua Mix Mods",
}: StickyBuyBarProps) {
  // Mặc định coi như CTA đang hiển thị → bar ẩn (fail-safe nếu
  // không tìm thấy #mix-cta: không bật bar che nội dung).
  const [ctaVisible, setCtaVisible] = useState(true);

  useEffect(() => {
    const target = document.getElementById(observeId);
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setCtaVisible(entry.isIntersecting);
        }
      },
      // buffer nhỏ để bar không chồng lên mép CTA
      { rootMargin: "-24px 0px", threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [observeId]);

  const show = !ctaVisible;

  return (
    <div
      aria-hidden={!show}
      // inert khi ẩn: ra khỏi tab order + mọi tương tác (React 19 hỗ trợ)
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-[var(--layer-sticky-action)] transition-transform duration-300 ease-out md:hidden ${
        show ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <div className="border-t border-[var(--color-line)] bg-[var(--color-surface-0)]/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              {title}
            </p>
            <p className="tabular text-lg font-black leading-tight text-[var(--color-accent)]">
              {price}
            </p>
          </div>
          <Link
            href={href}
            className="flex h-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-accent)] px-5 text-sm font-bold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
