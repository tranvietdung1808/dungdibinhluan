import type { ReactNode } from "react";

// =====================================================
// Badge — trạng thái có nhãn, không chỉ khác màu
// =====================================================

export type BadgeTone =
  | "neutral"
  | "accent"
  | "credit"
  | "success"
  | "warning"
  | "danger"
  | "violet";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-body)] border-[var(--color-line)]",
  accent: "bg-[var(--color-accent-subtle)] text-[var(--color-accent-strong)] border-[var(--color-accent-border)]",
  credit: "bg-[var(--color-credit-subtle)] text-[var(--color-credit-strong)] border-[var(--color-credit-border)]",
  success: "bg-[var(--color-ok-subtle)] text-[var(--color-ok)] border-[var(--color-ok)]/30",
  warning: "bg-[var(--color-warn-subtle)] text-[var(--color-warn)] border-[var(--color-warn)]/30",
  danger: "bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-[var(--color-danger)]/30",
  violet: "bg-[var(--color-violet-subtle)] text-[var(--color-violet)] border-[var(--color-violet)]/30",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
