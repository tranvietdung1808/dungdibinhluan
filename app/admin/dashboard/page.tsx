'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminPage } from '../components/AdminPage'
import { CollapsibleSection } from '../components/dashboard/CollapsibleSection'
import { RoleManager } from '../components/dashboard/RoleManager'
import { MembershipPanel } from '../components/dashboard/MembershipPanel'
import { adminFetchJson, adminErrorMessage, isAdminAuthError } from '../components/admin-api'
import { Button, ErrorState, InlineNotice } from '@/app/components/ui'

// =====================================================
// /admin/dashboard — Tổng quan (§16.2)
// Chỉ giữ: việc cần xử lý + số liệu thật từ API + lối tắt.
// Quản lý role / gói / subscription nằm trong các section
// gấp được — sẽ tách route khi có endpoint riêng.
// =====================================================

interface DashboardStats {
  mods: number | null
  guides: number | null
  pendingComments: number | null
  pendingScraper: number | null
}

async function countArray(url: string): Promise<number> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status}`)
  const data: unknown = await res.json()
  return Array.isArray(data) ? data.length : 0
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    mods: null,
    guides: null,
    pendingComments: null,
    pendingScraper: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authFailed, setAuthFailed] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [mods, guides, pendingComments, pendingScraper] = await Promise.allSettled([
        countArray('/api/admin/mods'),
        countArray('/api/admin/guides'),
        adminFetchJson<{ count?: number }>('/api/admin/pending-comments').then(
          (d) => d.count ?? 0
        ),
        adminFetchJson<{ items?: unknown[] }>('/api/admin/scraper/items?status=pending').then(
          (d) => d.items?.length ?? 0
        ),
      ])

      const settled = [mods, guides, pendingComments, pendingScraper]
      const anyAuth = settled.some(
        (s) => s.status === 'rejected' && isAdminAuthError(s.reason)
      )
      if (anyAuth) {
        setAuthFailed(true)
        return
      }
      const allFailed = settled.every((s) => s.status === 'rejected')
      if (allFailed) {
        setError('Chưa tải được số liệu tổng quan')
      }
      setStats({
        mods: mods.status === 'fulfilled' ? mods.value : null,
        guides: guides.status === 'fulfilled' ? guides.value : null,
        pendingComments:
          pendingComments.status === 'fulfilled' ? pendingComments.value : null,
        pendingScraper: pendingScraper.status === 'fulfilled' ? pendingScraper.value : null,
      })
    } catch (err) {
      setError(adminErrorMessage(err, 'Chưa tải được số liệu tổng quan'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  if (authFailed) {
    return (
      <AdminPage>
        <ErrorState
          title="Không còn quyền quản trị"
          description="Phiên đăng nhập hết hạn hoặc tài khoản không còn quyền admin. Đăng nhập lại để tiếp tục."
          onRetry={() => {
            window.location.href = '/admin'
          }}
          retryLabel="Đăng nhập lại"
        />
      </AdminPage>
    )
  }

  const attention: { label: string; count: number | null; href: string }[] = [
    { label: 'Bình luận chờ duyệt', count: stats.pendingComments, href: '/admin/community' },
    { label: 'Nội dung scraper chờ duyệt', count: stats.pendingScraper, href: '/admin/scraper' },
  ]
  const hasAttention = attention.some((a) => (a.count ?? 0) > 0)

  return (
    <AdminPage>
      {error && (
        <InlineNotice tone="danger" className="mb-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => void fetchStats()}>
              Thử lại
            </Button>
          </div>
        </InlineNotice>
      )}

      {/* Việc cần xử lý */}
      <section
        aria-label="Việc cần xử lý"
        className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {attention.map((item) => {
          const needsAction = (item.count ?? 0) > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition-colors ${
                needsAction
                  ? 'border-[var(--color-warn)]/50 bg-[var(--color-warn-subtle)]'
                  : 'border-[var(--color-line)] bg-[var(--color-surface-1)]'
              }`}
            >
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    needsAction ? 'text-[var(--color-warn)]' : 'text-[var(--color-muted)]'
                  }`}
                >
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-bold tabular text-[var(--color-title)]">
                  {loading && item.count === null ? '—' : (item.count ?? '—')}
                </p>
              </div>
              <span className="text-sm text-[var(--color-muted)]">
                {needsAction ? 'Xử lý →' : 'Xem →'}
              </span>
            </Link>
          )
        })}
        {!loading && !hasAttention && !error && (
          <p className="text-sm text-[var(--color-muted)] md:col-span-2">
            Không có việc nào đang chờ xử lý.
          </p>
        )}
      </section>

      {/* Số liệu */}
      <section aria-label="Số liệu" className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Mods', value: stats.mods, href: '/admin/mods' },
          { label: 'Bài hướng dẫn', value: stats.guides, href: '/admin/guides' },
          {
            label: 'Bình luận chờ duyệt',
            value: stats.pendingComments,
            href: '/admin/community',
          },
          {
            label: 'Scraper chờ duyệt',
            value: stats.pendingScraper,
            href: '/admin/scraper',
          },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 transition-colors hover:border-[var(--color-accent)]"
          >
            <p className="text-xs font-medium text-[var(--color-muted)]">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular text-[var(--color-title)]">
              {loading && s.value === null ? '—' : (s.value ?? '—')}
            </p>
          </Link>
        ))}
      </section>

      {/* Lối tắt */}
      <section aria-label="Lối tắt" className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-title)]">Lối tắt</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            { href: '/admin/mods/new', label: 'Tạo mod' },
            { href: '/admin/mods', label: 'Quản lý mods' },
            { href: '/admin/guides/new', label: 'Viết bài mới' },
            { href: '/admin/guides', label: 'Quản lý bài viết' },
            { href: '/admin/community', label: 'Duyệt bình luận' },
            { href: '/admin/generate', label: 'Tạo mã truy cập' },
            { href: '/admin/scraper', label: 'Scraper' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-1)] px-4 py-3 text-center text-sm font-medium text-[var(--color-body)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-title)]"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Quản trị nâng cao — gấp được */}
      <div className="space-y-4">
        <CollapsibleSection
          title="Thành viên & phân quyền"
          description="Gán/xóa role cho tài khoản người dùng"
        >
          <RoleManager />
        </CollapsibleSection>
        <CollapsibleSection
          title="Membership & gói"
          description="Cấp subscription, quản lý các gói membership"
        >
          <MembershipPanel />
        </CollapsibleSection>
      </div>
    </AdminPage>
  )
}
