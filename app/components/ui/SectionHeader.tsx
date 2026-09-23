import Link from "next/link";
import type { ReactNode } from "react";

// =====================================================
// SectionHeader — eyebrow / title / description / action
// =====================================================

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  actionHref,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-h2 text-[var(--color-title)]">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
            {description}
          </p>
        )}
      </div>
      {action &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="shrink-0 text-sm font-semibold text-[var(--color-accent-strong)] hover:text-[var(--color-accent)]"
          >
            {action}
          </Link>
        ) : (
          <div className="shrink-0">{action}</div>
        ))}
    </div>
  );
}
