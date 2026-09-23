'use client'

import { useId, useState, type ReactNode } from 'react'

// =====================================================
// CollapsibleSection — disclosure có aria, dùng cho các
// panel quản trị nặng trên trang Tổng quan
// =====================================================

export function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  onFirstOpen,
  children,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  /** Gọi một lần khi mở lần đầu (lazy fetch) */
  onFirstOpen?: () => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [openedOnce, setOpenedOnce] = useState(defaultOpen)
  const panelId = useId()

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && !openedOnce) {
      setOpenedOnce(true)
      onFirstOpen?.()
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)]">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="min-w-0">
          <span className="block text-base font-bold text-[var(--color-title)]">{title}</span>
          {description && (
            <span className="mt-0.5 block text-sm text-[var(--color-muted)]">{description}</span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div id={panelId} className="border-t border-[var(--color-line)] px-5 py-5">
          {children}
        </div>
      )}
    </section>
  )
}
