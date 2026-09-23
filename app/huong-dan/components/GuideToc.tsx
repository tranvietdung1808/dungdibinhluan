import type { TocItem } from "./guide-content"

// =====================================================
// GuideToc — mục lục bài viết build từ h2/h3 (§15.2)
// Desktop: nav trong sidebar sticky · Mobile: <details> đầu bài
// =====================================================

function TocList({ items }: { items: TocItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className={`block rounded-md py-1.5 pr-2 text-sm leading-snug text-[var(--color-muted)] transition-colors hover:text-[var(--color-title)] ${
              item.level === 3 ? "pl-7" : "pl-3 font-medium text-[var(--color-body)]"
            } border-l-2 border-transparent hover:border-[var(--color-accent)]`}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function GuideTocDesktop({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null
  return (
    <nav
      aria-label="Mục lục bài viết"
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-4"
    >
      <p className="mb-3 text-sm font-bold text-[var(--color-title)]">Mục lục</p>
      <TocList items={items} />
    </nav>
  )
}

export function GuideTocMobile({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null
  return (
    <details className="mb-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-4">
      <summary className="cursor-pointer select-none text-sm font-bold text-[var(--color-title)]">
        Mục lục bài viết
      </summary>
      <nav aria-label="Mục lục bài viết" className="mt-3">
        <TocList items={items} />
      </nav>
    </details>
  )
}
