"use client";

import { useState } from "react";

// =====================================================
// PlayerAvatar — ảnh cầu thủ hoặc fallback initials ổn định (§9.1)
// Ảnh lỗi/không có → chữ cái đầu của từ đầu + từ cuối (VD "KM").
// variant="portrait": ảnh transparent nguyên tấm (trang chi tiết),
// không crop tròn — giữ phần đầu-người của ảnh EA.
// =====================================================

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PlayerAvatar({
  name,
  url,
  className = "",
  variant = "circle",
}: {
  name: string;
  url: string | null;
  className?: string;
  variant?: "circle" | "portrait";
}) {
  const [failed, setFailed] = useState(false);
  const portrait = variant === "portrait";

  if (!url || failed) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center font-bold text-[var(--color-muted)] ${
          portrait
            ? "rounded-3xl bg-[var(--color-surface-2)]"
            : "rounded-full bg-[var(--color-surface-2)]"
        } ${className}`}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL media ngoài, dùng img thuần như Navbar
    <img
      src={url}
      alt={portrait ? name : ""}
      loading={portrait ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className={`shrink-0 ${
        portrait ? "object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]" : "rounded-full bg-[var(--color-surface-2)] object-cover"
      } ${className}`}
    />
  );
}
