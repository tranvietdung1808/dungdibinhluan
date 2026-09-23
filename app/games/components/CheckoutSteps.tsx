// =====================================================
// CheckoutSteps — "Chọn phiên bản → Thanh toán → Nhận nội dung" (§12.2)
// Presentational, server-safe. `current` là bước đang đứng (0-based).
// =====================================================

const DEFAULT_STEPS = ["Chọn phiên bản", "Thanh toán", "Nhận nội dung"];

export function CheckoutSteps({
  current = 1,
  steps = DEFAULT_STEPS,
  className = "",
}: {
  current?: number;
  steps?: string[];
  className?: string;
}) {
  return (
    <nav aria-label="Các bước mua hàng" className={className}>
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex min-w-0 items-center gap-2 sm:gap-3">
              {i > 0 && (
                <span aria-hidden="true" className="h-px w-5 bg-[var(--color-line-strong)] sm:w-8" />
              )}
              <span
                aria-current={active ? "step" : undefined}
                className={`flex min-w-0 items-center gap-2 text-meta ${
                  active
                    ? "font-semibold text-[var(--color-title)]"
                    : done
                      ? "text-[var(--color-body)]"
                      : "text-[var(--color-muted)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    active
                      ? "border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-[var(--color-accent-strong)]"
                      : done
                        ? "border-[var(--color-ok)]/40 bg-[var(--color-ok-subtle)] text-[var(--color-ok)]"
                        : "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-muted)]"
                  }`}
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="truncate">{label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
