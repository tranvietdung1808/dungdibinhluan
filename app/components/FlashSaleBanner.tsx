"use client";

import { useEffect, useMemo, useState } from "react";

// =====================================================
// FlashSaleBanner (§4.3)
// Chỉ hiển thị countdown khi có thời điểm kết thúc THẬT:
//   - prop `endsAt` (ISO date string), hoặc
//   - env NEXT_PUBLIC_SALE_ENDS_AT.
// Không có / đã qua / sai định dạng → render null (không banner giả).
// =====================================================

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function parseEndsAt(value?: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

function getTimeLeft(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function FlashSaleBanner({
  endsAt,
  label = "Ưu đãi đang diễn ra",
}: {
  /** ISO date string, ví dụ "2026-10-01T23:59:59+07:00" */
  endsAt?: string;
  label?: string;
}) {
  const target = useMemo(
    () => parseEndsAt(endsAt ?? process.env.NEXT_PUBLIC_SALE_ENDS_AT),
    [endsAt],
  );
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!target) return;
    // setTime chỉ chạy trong callback (rAF/interval), không sync trong effect body
    const tick = () => setTime(getTimeLeft(target));
    const raf = requestAnimationFrame(tick);
    const interval = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [target]);

  // Không có deadline thật, chưa mount (tránh hydration mismatch) hoặc đã hết → không render
  if (!target || !time) return null;
  const expired =
    time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0;
  if (expired) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const endLabel = new Date(target).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-gradient-to-r from-[var(--color-accent-subtle)] via-[var(--color-surface-0)]/40 to-[var(--color-credit-subtle)] px-4 py-3 text-center">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-title)]">
        {label} — kết thúc {endLabel}
      </p>
      <div
        role="timer"
        aria-label={`Ưu đãi kết thúc lúc ${endLabel}`}
        className="flex items-center justify-center gap-2"
      >
        <TimeBlock value={pad(time.days)} label="ngày" />
        <span className="font-black text-white/30" aria-hidden="true">:</span>
        <TimeBlock value={pad(time.hours)} label="giờ" />
        <span className="font-black text-white/30" aria-hidden="true">:</span>
        <TimeBlock value={pad(time.minutes)} label="phút" />
        <span className="font-black text-white/30" aria-hidden="true">:</span>
        <TimeBlock value={pad(time.seconds)} label="giây" />
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span
        className="min-w-[2.5rem] rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 text-center text-xl font-black tabular-nums text-white md:text-2xl"
        aria-hidden="true"
      >
        {value}
      </span>
      <span className="mt-0.5 text-xs uppercase tracking-widest text-white/60">
        {label}
      </span>
    </span>
  );
}
