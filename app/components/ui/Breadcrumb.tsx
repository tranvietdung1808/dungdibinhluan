import Link from "next/link";
import { Fragment } from "react";

// =====================================================
// Breadcrumb — nav semantic, trang hiện tại aria-current
// =====================================================

export interface Crumb {
  label: string;
  href?: string; // không có href = trang hiện tại
}

export function Breadcrumb({
  items,
  className = "",
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--color-muted)]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 && (
                <li aria-hidden="true" className="select-none text-[var(--color-line-strong)]">
                  /
                </li>
              )}
              <li className="min-w-0">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-[var(--color-title)] transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={
                      isLast
                        ? "text-[var(--color-title)] font-medium"
                        : "text-[var(--color-muted)]"
                    }
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
