"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface StickyBuyBarProps {
  price?: string;
  href: string;
}

/**
 * Thanh CTA dính dưới màn hình (mobile) — xuất hiện khi cuộn qua hero
 * và tự ẩn khi khối CTA chính trong trang đang hiển thị trên màn hình.
 */
export default function StickyBuyBar({ price, href }: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);
  const [ctaBlockVisible, setCtaBlockVisible] = useState(false);

  useEffect(() => {
    const mainCta = document.getElementById("mix-cta");

    const onScroll = () => {
      setVisible(window.scrollY > 360);

      if (mainCta) {
        const rect = mainCta.getBoundingClientRect();
        // Khối CTA chính nằm trong viewport → ẩn bar để tránh trùng
        setCtaBlockVisible(rect.top < window.innerHeight - 24 && rect.bottom > 24);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const show = visible && !ctaBlockVisible;

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-[60] md:hidden transition-transform duration-300 ease-out ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="border-t border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {price && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">MIX MODS FC 26</p>
                <p className="text-lg font-black leading-tight text-[var(--color-primary)]">{price}</p>
              </>
            )}
          </div>
          <Link
            href={href}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-[var(--color-primary)] rounded-xl font-black tracking-wider text-sm text-white hover:bg-[#b44c5c] active:scale-[0.98] transition-all shadow-[0_8px_24px_-8px_rgba(206,90,103,0.6)]"
          >
            MUA NGAY
          </Link>
        </div>
      </div>
    </div>
  );
}
