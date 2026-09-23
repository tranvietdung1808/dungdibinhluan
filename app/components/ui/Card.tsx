import type { ReactNode } from "react";

// =====================================================
// Card — default / interactive / selected
// hover chỉ áp dụng khi interactive
// =====================================================

export function Card({
  interactive = false,
  selected = false,
  padding = true,
  className = "",
  children,
}: {
  interactive?: boolean;
  selected?: boolean;
  padding?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const classes = [
    "rounded-2xl border",
    selected
      ? "border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)]"
      : "border-[var(--color-line)] bg-[var(--color-surface-1)]",
    interactive
      ? "transition-all duration-150 hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-2)] hover:-translate-y-0.5 cursor-pointer"
      : "",
    padding ? "p-5 md:p-6" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={classes}>{children}</div>;
}
