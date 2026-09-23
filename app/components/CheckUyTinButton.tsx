"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// =====================================================
// Nút "Hỗ trợ" gọn — mở popover kênh liên hệ + đánh giá.
// Dùng trên navbar (desktop) và một số trang checkout.
// Không claim thời gian trả lời / hoạt động khi chưa có căn cứ.
// =====================================================

const CHANNELS = [
  {
    label: "Fanpage Facebook",
    note: "Kênh hỗ trợ chính thức",
    href: "https://web.facebook.com/dungbinhluan/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M13.5 21.9v-7.8h2.62l.4-3.03H13.5V9.13c0-.88.24-1.47 1.5-1.47h1.6V4.98c-.28-.04-1.23-.12-2.34-.12-2.32 0-3.9 1.41-3.9 4v2.2H7.72v3.04h2.62v7.8a10 10 0 0 0 3.16 0z" />
      </svg>
    ),
  },
  {
    label: "Zalo",
    note: "0917 742 686",
    href: "https://zalo.me/0917742686",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    note: "@dungdibinhluan",
    href: "https://www.tiktok.com/@dungdibinhluan",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M16.6 3c.4 2.1 1.8 3.6 4 3.9v3.1c-1.5 0-2.9-.5-4-1.3v6.6c0 3.9-2.6 6.7-6.4 6.7A6.1 6.1 0 0 1 4 15.8c0-3.4 2.7-6 6.2-6 .3 0 .7 0 1 .1v3.3a2.9 2.9 0 0 0-1-.2 2.9 2.9 0 0 0-2.9 2.9 2.9 2.9 0 0 0 2.9 2.8c1.8 0 3.1-1.3 3.1-3.4V3h3.3z" />
      </svg>
    ),
  },
];

export default function CheckUyTinButton() {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Đóng khi click ra ngoài + Escape (trả focus về nút)
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="support-popover"
        className="group relative flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--color-ok)]/40 bg-[var(--color-surface-1)] px-3.5 transition-colors hover:border-[var(--color-ok)]/70 hover:bg-[var(--color-ok-subtle)]"
      >
        <svg
          className="h-4 w-4 text-[var(--color-ok)]"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-bold text-[var(--color-ok)]">Hỗ trợ</span>
      </button>

      {isOpen && (
        <div
          id="support-popover"
          role="region"
          aria-label="Kênh hỗ trợ và cộng đồng"
          className="absolute right-0 top-full z-[var(--layer-popover)] mt-2 w-72 max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-surface-1)]/95 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="border-b border-[var(--color-line)] bg-[var(--color-ok-subtle)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-title)]">
              Hỗ trợ & cộng đồng
            </h3>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Các kênh chính thức của DungDiBinhLuan
            </p>
          </div>

          <div className="space-y-1 p-2">
            {/* Highlight: bài đánh giá khách hàng */}
            <Link
              href="https://web.facebook.com/dungbinhluan/posts/pfbid036HdhijihVSbeppjAq5RBhbPL5FZWQMVxpM3aCYmmbU9hvdJZwvosdBFMX8GypDfMl"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 flex items-center gap-3 rounded-xl border border-[var(--color-ok)]/25 bg-[var(--color-ok-subtle)] p-3 transition-colors hover:bg-[var(--color-ok)]/15"
              onClick={() => setIsOpen(false)}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ok)]/15 text-[var(--color-ok)]"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 17.3l-5.4 3.2 1.4-6.1-4.7-4.1 6.2-.5L12 4l2.5 5.8 6.2.5-4.7 4.1 1.4 6.1z" />
                </svg>
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-[var(--color-ok)]">
                  Xem đánh giá khách hàng
                </span>
                <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
                  Feedback thực tế trên fanpage
                </span>
              </span>
            </Link>

            {CHANNELS.map((ch) => (
              <Link
                key={ch.label}
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <span
                  className="flex w-6 shrink-0 justify-center text-[var(--color-body)]"
                  aria-hidden="true"
                >
                  {ch.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-sm text-[var(--color-title)]">
                    {ch.label}
                  </span>
                  <span className="block text-xs text-[var(--color-muted)]">
                    {ch.note}
                  </span>
                </span>
                <span
                  className="text-xs text-[var(--color-muted)] transition-colors group-hover:text-[var(--color-title)]"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
