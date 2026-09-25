"use client";

import { useState } from "react";

// =====================================================
// PlayerAvatar — ảnh nhỏ hoặc fallback initials ổn định (§9.1)
// Ảnh lỗi/không có → chữ cái đầu của từ đầu + từ cuối (VD "KM").
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
}: {
  name: string;
  url: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] font-bold text-[var(--color-muted)] ${className}`}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL media ngoài, dùng img thuần như Navbar
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full bg-[var(--color-surface-2)] object-cover ${className}`}
    />
  );
}
