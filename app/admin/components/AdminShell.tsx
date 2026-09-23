'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Breadcrumb, type Crumb } from '@/app/components/ui/Breadcrumb'
import { ButtonLink } from '@/app/components/ui/Button'
import { getAdminAuthHeaders } from './admin-api'

// =====================================================
// AdminShell — khung làm việc chung của khu vực /admin
// Blueprint §16.1: sidebar 232px desktop, drawer có focus trap
// trên mobile; header gồm breadcrumb + tiêu đề + action chính
// + vùng notification.
// =====================================================

// ── Toast dùng chung toàn khu admin ──
const AdminToastContext = createContext<(message: string) => void>(() => {})

/** Toast nhanh từ bất kỳ trang admin nào: const toast = useAdminToast() */
export function useAdminToast() {
  return useContext(AdminToastContext)
}

// ── Điều hướng admin ──
interface NavItem {
  href: string
  label: string
  /** pathname bắt đầu bằng tiền tố này thì coi là active */
  match: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Tổng quan',
    match: '/admin/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M3 12l9-8 9 8" />
        <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
      </svg>
    ),
  },
  {
    href: '/admin/mods',
    label: 'Mods',
    match: '/admin/mods',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    ),
  },
  {
    href: '/admin/guides',
    label: 'Bài hướng dẫn',
    match: '/admin/guides',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/admin/community',
    label: 'Bình luận',
    match: '/admin/community',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/generate',
    label: 'Mã truy cập',
    match: '/admin/generate',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
  {
    href: '/admin/scraper',
    label: 'Scraper',
    match: '/admin/scraper',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
]

// ── Meta trang theo pathname ──
interface PageMeta {
  title: string
  crumbs: Crumb[]
  actionHref?: string
  actionLabel?: string
}

const ADMIN_ROOT: Crumb = { label: 'Quản trị', href: '/admin/dashboard' }

function getPageMeta(pathname: string): PageMeta {
  if (pathname === '/admin/mods/new') {
    return {
      title: 'Thêm mod mới',
      crumbs: [ADMIN_ROOT, { label: 'Mods', href: '/admin/mods' }, { label: 'Thêm mod mới' }],
    }
  }
  const modSubMatch = pathname.match(/^\/admin\/mods\/([^/]+)\/(edit|showcase)$/)
  if (modSubMatch) {
    const [, slug, sub] = modSubMatch
    if (sub === 'edit') {
      return {
        title: 'Chỉnh sửa mod',
        crumbs: [
          ADMIN_ROOT,
          { label: 'Mods', href: '/admin/mods' },
          { label: slug, href: `/admin/mods/${slug}/edit` },
          { label: 'Chỉnh sửa' },
        ],
        actionHref: `/admin/mods/${slug}/showcase`,
        actionLabel: 'Quản lý showcase',
      }
    }
    return {
      title: 'Showcase mod',
      crumbs: [
        ADMIN_ROOT,
        { label: 'Mods', href: '/admin/mods' },
        { label: slug },
        { label: 'Showcase' },
      ],
      actionHref: `/admin/mods/${slug}/edit`,
      actionLabel: 'Sửa thông tin mod',
    }
  }
  if (pathname === '/admin/guides/new') {
    return {
      title: 'Bài viết mới',
      crumbs: [ADMIN_ROOT, { label: 'Bài hướng dẫn', href: '/admin/guides' }, { label: 'Bài viết mới' }],
    }
  }
  const guideEditMatch = pathname.match(/^\/admin\/guides\/[^/]+\/edit$/)
  if (guideEditMatch) {
    return {
      title: 'Sửa bài viết',
      crumbs: [ADMIN_ROOT, { label: 'Bài hướng dẫn', href: '/admin/guides' }, { label: 'Sửa bài viết' }],
    }
  }
  switch (pathname) {
    case '/admin/dashboard':
      return { title: 'Tổng quan', crumbs: [{ label: 'Quản trị' }, { label: 'Tổng quan' }] }
    case '/admin/mods':
      return {
        title: 'Mods',
        crumbs: [ADMIN_ROOT, { label: 'Mods' }],
        actionHref: '/admin/mods/new',
        actionLabel: 'Thêm mod mới',
      }
    case '/admin/guides':
      return {
        title: 'Bài hướng dẫn',
        crumbs: [ADMIN_ROOT, { label: 'Bài hướng dẫn' }],
        actionHref: '/admin/guides/new',
        actionLabel: 'Bài viết mới',
      }
    case '/admin/community':
      return { title: 'Bình luận', crumbs: [ADMIN_ROOT, { label: 'Bình luận' }] }
    case '/admin/generate':
      return { title: 'Mã truy cập', crumbs: [ADMIN_ROOT, { label: 'Mã truy cập' }] }
    case '/admin/scraper':
      return { title: 'Scraper', crumbs: [ADMIN_ROOT, { label: 'Scraper' }] }
    default:
      return { title: 'Quản trị', crumbs: [{ label: 'Quản trị' }] }
  }
}

// ── Drawer mobile (focus trap + Escape + scroll lock) ──
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function MobileDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE)
    ;(focusables?.[0] ?? panel)?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      )
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = prevOverflow
      restoreRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[var(--layer-modal)] lg:hidden" role="presentation">
      <div className="absolute inset-0 bg-[var(--color-overlay)]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Điều hướng quản trị"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] overflow-y-auto border-r border-[var(--color-line)] bg-[var(--color-surface-1)] outline-none"
      >
        {children}
      </div>
    </div>
  )
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const meta = getPageMeta(pathname)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pendingComments, setPendingComments] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 4000)
  }, [])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  // Đóng drawer khi chuyển route
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Vùng notification: số bình luận chờ duyệt (API thật)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const headers = await getAdminAuthHeaders()
      if (!headers) return
      try {
        const res = await fetch('/api/admin/pending-comments', { headers })
        if (!cancelled && res.ok) {
          const d = await res.json()
          setPendingComments(typeof d?.count === 'number' ? d.count : 0)
        }
      } catch {
        /* notification lỗi không chặn shell */
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [pathname])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      await fetch('/api/auth/admin-session', { method: 'DELETE' })
    } catch {
      /* vẫn điều hướng về trang đăng nhập */
    } finally {
      window.location.href = '/admin'
    }
  }

  const navContent = (
    <>
      <div className="border-b border-[var(--color-line)] px-5 py-5">
        <Link href="/admin/dashboard" className="block">
          <span className="text-sm font-black tracking-[0.18em] text-[var(--color-title)]">
            DUNGDIBINHLUAN
          </span>
          <span className="mt-0.5 block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Quản trị
          </span>
        </Link>
      </div>
      <nav aria-label="Điều hướng quản trị" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.match || pathname.startsWith(`${item.match}/`)
            const showBadge = item.href === '/admin/community' && (pendingComments ?? 0) > 0
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--color-title)]'
                      : 'text-[var(--color-body)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-title)]'
                  }`}
                >
                  <span
                    className={active ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {showBadge && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-xs font-bold text-[var(--color-on-accent)] tabular">
                      {pendingComments}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="space-y-1 border-t border-[var(--color-line)] px-3 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-title)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[var(--color-muted)]" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Về trang chủ
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-medium text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-title)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[var(--color-muted)]" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </>
  )

  return (
    <AdminToastContext.Provider value={showToast}>
      <div className="min-h-screen bg-[var(--color-surface-0)] text-[var(--color-body)]">
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--layer-toast)] focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-on-accent)]"
        >
          Nhảy tới nội dung chính
        </a>

        {/* Sidebar desktop */}
        <aside className="fixed inset-y-0 left-0 hidden w-[232px] flex-col border-r border-[var(--color-line)] bg-[var(--color-surface-1)] lg:flex">
          {navContent}
        </aside>

        {/* Drawer mobile */}
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          {navContent}
        </MobileDrawer>

        <div className="lg:pl-[232px]">
          {/* Header */}
          <header className="sticky top-0 z-[var(--layer-navbar)] border-b border-[var(--color-line)] bg-[var(--color-surface-0)]/95 backdrop-blur">
            <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Mở menu quản trị"
                aria-expanded={drawerOpen}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[var(--color-line)] text-[var(--color-body)] hover:bg-[var(--color-surface-2)] lg:hidden"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="min-w-0 flex-1">
                <Breadcrumb items={meta.crumbs} className="hidden sm:block" />
                <h1 className="truncate text-lg font-bold leading-tight text-[var(--color-title)] sm:text-xl">
                  {meta.title}
                </h1>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* Notification: bình luận chờ duyệt */}
                <Link
                  href="/admin/community"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[var(--color-line)] text-[var(--color-body)] hover:bg-[var(--color-surface-2)]"
                  aria-label={
                    pendingComments && pendingComments > 0
                      ? `Bình luận: ${pendingComments} đang chờ duyệt`
                      : 'Bình luận'
                  }
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                  {(pendingComments ?? 0) > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 py-0.5 text-xs font-bold text-[var(--color-on-accent)] tabular" aria-hidden="true">
                      {pendingComments}
                    </span>
                  )}
                </Link>

                {meta.actionHref && meta.actionLabel && (
                  <ButtonLink href={meta.actionHref} size="sm" className="hidden sm:inline-flex">
                    {meta.actionLabel}
                  </ButtonLink>
                )}
              </div>
            </div>
          </header>

          <main id="admin-main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>

        {/* Toast chung */}
        {toast && (
          <div
            role="status"
            className="fixed bottom-6 left-1/2 z-[var(--layer-toast)] -translate-x-1/2 rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] px-5 py-3 text-sm text-[var(--color-title)] shadow-xl"
          >
            {toast}
          </div>
        )}
      </div>
    </AdminToastContext.Provider>
  )
}
