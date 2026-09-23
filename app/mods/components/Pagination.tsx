interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const pageButtonClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] border px-2 text-sm font-medium transition-colors";
const idleClass =
  "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-body)] hover:border-[var(--color-accent-border)] hover:text-[var(--color-title)]";
const navButtonClass = `${pageButtonClass} gap-1.5 px-3.5 disabled:cursor-not-allowed disabled:opacity-40 ${idleClass}`;

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Phân trang danh sách mod"
      className="flex flex-wrap items-center justify-center gap-1.5 pt-2"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Trang trước"
        className={navButtonClass}
      >
        <span aria-hidden="true">←</span> Trước
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const isNear =
          Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages;
        if (!isNear) {
          if (p === currentPage - 3 || p === currentPage + 3) {
            return (
              <span
                key={p}
                aria-hidden="true"
                className="px-1 text-sm text-[var(--color-muted)]"
              >
                …
              </span>
            );
          }
          return null;
        }
        const isCurrent = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            disabled={isCurrent}
            aria-label={`Trang ${p}`}
            aria-current={isCurrent ? "page" : undefined}
            className={`${pageButtonClass} ${
              isCurrent
                ? "border-transparent bg-[var(--color-accent)] font-semibold text-[var(--color-on-accent)]"
                : idleClass
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Trang sau"
        className={navButtonClass}
      >
        Tiếp <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}
