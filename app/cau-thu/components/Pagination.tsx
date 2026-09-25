import Link from "next/link";
import { PARAM } from "./catalogQuery";

// =====================================================
// Pagination — Trước / Sau + "Trang X / Y" (§9.1)
// Link-based, giữ nguyên query; đầu/cuối → span aria-disabled.
// Server-safe (không hook) — nhận queryString từ page.
// =====================================================

const linkClass =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 text-sm font-medium text-[var(--color-body)] transition-colors hover:border-[var(--color-accent-border)] hover:text-[var(--color-title)]";
const disabledClass =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-1)] px-4 text-sm font-medium text-[var(--color-muted)] opacity-50";

export function Pagination({
  page,
  totalPages,
  queryString,
}: {
  page: number;
  totalPages: number;
  /** Query hiện tại (không gồm dấu ?) — param trang sẽ được ghi đè */
  queryString: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number): string => {
    const sp = new URLSearchParams(queryString);
    if (target <= 1) {
      sp.delete(PARAM.page); // trang 1 = URL sạch, chống nhân bản
    } else {
      sp.set(PARAM.page, String(target));
    }
    const qs = sp.toString();
    return qs ? `/cau-thu?${qs}` : "/cau-thu";
  };

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Phân trang danh sách cầu thủ"
      className="flex items-center justify-between gap-3 pt-5"
    >
      {hasPrev ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          <span aria-hidden="true">←</span> Trước
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          <span aria-hidden="true">←</span> Trước
        </span>
      )}

      <p className="text-sm font-medium text-[var(--color-muted)]">
        Trang {page} / {totalPages}
      </p>

      {hasNext ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          Sau <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Sau <span aria-hidden="true">→</span>
        </span>
      )}
    </nav>
  );
}
