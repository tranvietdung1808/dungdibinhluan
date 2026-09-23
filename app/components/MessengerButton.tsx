"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

// =====================================================
// Nút hỗ trợ nổi (§7.3)
// - FAB 48px, cách mép 16–24px, z = --layer-support.
// - Popup min(340px, 100vw - 32px); chỉ render khi mở.
// - aria-expanded, Escape đóng + trả focus, click ngoài đóng.
// - Link m.me kèm fallback tab mới nếu popup bị chặn.
// - Ẩn trên /admin và khi body[data-modal-open] (Dialog đang mở).
// =====================================================

const MESSENGER_URL = "https://m.me/dungbinhluan";

function MessengerGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.145 2 11.26c0 2.91 1.488 5.503 3.82 7.243v3.497l3.488-1.928c.866.241 1.77.368 2.692.368 5.523 0 10-4.145 10-9.26S17.523 2 12 2zm1.157 12.394l-2.986-3.18-5.839 3.18 6.417-6.815 3.056 3.18 5.766-3.18-6.414 6.815z" />
    </svg>
  );
}

export default function MessengerButton() {
  const pathname = usePathname() ?? "";
  const [isOpen, setIsOpen] = useState(false);
  const [hiddenByModal, setHiddenByModal] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Ẩn khi có modal mở: ui/Dialog set document.body.dataset.modalOpen
  useEffect(() => {
    const update = () =>
      setHiddenByModal(document.body.dataset.modalOpen === "true");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-modal-open"],
    });
    return () => observer.disconnect();
  }, []);

  // Escape đóng + trả focus; click ngoài đóng
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        fabRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [isOpen]);

  const close = (returnFocus = false) => {
    setIsOpen(false);
    if (returnFocus) fabRef.current?.focus();
  };

  // Mở popup Messenger nhỏ; nếu trình duyệt chặn popup → để anchor mở tab mới
  const handleOpenMessenger = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const width = 450;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const win = window.open(
      MESSENGER_URL,
      "messenger_chat",
      `width=${width},height=${height},top=${top},left=${left},location=no,status=no,toolbar=no,scrollbars=yes,menubar=no`,
    );
    if (win) {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Admin dùng shell riêng; modal mở → FAB ẩn khỏi cả tab order
  if (pathname.startsWith("/admin") || hiddenByModal) return null;

  return (
    <div
      ref={rootRef}
      className="fixed bottom-4 right-4 z-[var(--layer-support)] flex flex-col items-end md:bottom-6 md:right-6"
    >
      {isOpen && (
        <div
          id="support-chat-popup"
          role="region"
          aria-label="Hỗ trợ qua Messenger"
          className="mb-3 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-[var(--color-accent)] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-sm">
                <Image
                  src="/logo.png"
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-white">
                  DungDiBinhLuan
                </h3>
                <p className="text-xs text-white/85">
                  Kênh hỗ trợ chính thức
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => close(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
              aria-label="Đóng hỗ trợ"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex min-h-[120px] flex-col gap-3 bg-[var(--color-surface-2)]/50 p-4">
            <div className="flex gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-surface-1)]">
                <Image
                  src="/logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full object-cover"
                />
              </span>
              <p className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[var(--color-line)] bg-[var(--color-surface-1)] p-3 text-sm leading-relaxed text-[var(--color-body)] shadow-sm">
                Chào bạn! Cần hỗ trợ về mod FC 26, tải game hay đặt trước FC 27?
                Nhắn cho DungDiBinhLuan qua Messenger nhé.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--color-line)] p-4">
            <a
              href={MESSENGER_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenMessenger}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-3 text-sm font-semibold text-[var(--color-on-accent)] shadow-md transition-colors hover:bg-[var(--color-accent-strong)]"
            >
              <MessengerGlyph className="h-5 w-5" />
              Mở Messenger để trao đổi với hỗ trợ
            </a>
          </div>
        </div>
      )}

      {/* FAB 48px */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="support-chat-popup"
        aria-label={isOpen ? "Đóng hỗ trợ" : "Mở hỗ trợ qua Messenger"}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-[0_6px_24px_-6px_var(--color-accent)] transition-all duration-200 hover:scale-105 hover:bg-[var(--color-accent-strong)] active:scale-95"
      >
        <span
          className={`absolute transition-all duration-200 ${
            isOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        >
          <MessengerGlyph className="h-6 w-6" />
        </span>
        <span
          className={`absolute transition-all duration-200 ${
            isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
    </div>
  );
}
