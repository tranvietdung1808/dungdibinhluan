'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AdminPage } from '../components/AdminPage'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAdminToast } from '../components/AdminShell'
import {
  adminFetch,
  adminFetchJson,
  adminJson,
  adminErrorMessage,
  isAdminAuthError,
} from '../components/admin-api'
import { Badge, Button, EmptyState, ErrorState, InlineNotice, Spinner } from '@/app/components/ui'

// =====================================================
// /admin/community — kiểm duyệt bình luận (§16.7)
// Tabs: Chờ duyệt / Đã duyệt. Mỗi item: tác giả, thời
// gian, trích nội dung, link bài/mod gốc. Xóa dùng
// destructive confirm. Pending độc lập từng item; sau khi
// xử lý giữ scroll + trả focus về item kế tiếp.
// =====================================================

interface CommentItem {
  id: string
  scope_type: 'guide' | 'mods' | string
  scope_id: string
  parent_id: string | null
  author_name: string
  author_avatar: string | null
  content: string
  is_admin_comment: boolean
  is_pinned: boolean
  status: 'pending' | 'approved' | string
  created_at: string
}

type TabKey = 'pending' | 'approved'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
]

function excerpt(content: string, max = 280): string {
  const clean = content.trim()
  return clean.length > max ? `${clean.slice(0, max)}…` : clean
}

export default function AdminCommunityPage() {
  const toast = useAdminToast()
  const [items, setItems] = useState<CommentItem[]>([])
  const [guideMap, setGuideMap] = useState<Record<string, { slug: string; title: string }>>({})
  const [tab, setTab] = useState<TabKey>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authFailed, setAuthFailed] = useState(false)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<CommentItem | null>(null)
  const itemRefs = useRef(new Map<string, HTMLElement>())
  const panelRef = useRef<HTMLDivElement>(null)

  const setPending = (id: string, on: boolean) =>
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [comments, guides] = await Promise.allSettled([
        adminFetchJson<CommentItem[]>('/api/admin/community'),
        adminFetchJson<{ id: string; slug: string; title: string }[]>('/api/admin/guides'),
      ])
      if (comments.status === 'rejected') {
        if (isAdminAuthError(comments.reason)) setAuthFailed(true)
        setError(adminErrorMessage(comments.reason, 'Chưa tải được danh sách kiểm duyệt'))
        return
      }
      setItems(Array.isArray(comments.value) ? comments.value : [])
      if (guides.status === 'fulfilled' && Array.isArray(guides.value)) {
        setGuideMap(
          Object.fromEntries(guides.value.map((g) => [g.id, { slug: g.slug, title: g.title }]))
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const pendingItems = useMemo(() => items.filter((i) => i.status === 'pending'), [items])
  const approvedItems = useMemo(() => items.filter((i) => i.status === 'approved'), [items])
  const visibleItems = tab === 'pending' ? pendingItems : approvedItems

  const originOf = (item: CommentItem): { href: string; label: string } | null => {
    if (item.scope_type === 'guide') {
      const g = guideMap[item.scope_id]
      return g
        ? { href: `/huong-dan/${g.slug}`, label: `Bài: ${g.title}` }
        : { href: '/admin/guides', label: 'Bài viết (đã xóa?)' }
    }
    if (item.scope_type === 'mods') return { href: '/mods', label: 'Mục chia sẻ mod' }
    return null
  }

  // Sau khi item bị xóa khỏi danh sách: giữ scroll, focus item kế tiếp
  const focusAfterRemoval = (removedId: string, list: CommentItem[]) => {
    requestAnimationFrame(() => {
      const idx = list.findIndex((i) => i.id === removedId)
      const next = list[idx + 1] ?? list[idx - 1]
      const el = next ? itemRefs.current.get(next.id) : null
      ;(el ?? panelRef.current)?.focus()
    })
  }

  const updateStatus = async (item: CommentItem, status: 'approved' | 'rejected') => {
    setPending(item.id, true)
    setError('')
    const list = visibleItems
    try {
      await adminFetch('/api/admin/community', adminJson('PATCH', { id: item.id, status }))
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      toast(status === 'approved' ? `Đã duyệt bình luận của ${item.author_name}` : `Đã từ chối bình luận của ${item.author_name}`)
      focusAfterRemoval(item.id, list)
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Không cập nhật được trạng thái'))
    } finally {
      setPending(item.id, false)
    }
  }

  const updatePin = async (item: CommentItem, isPinned: boolean) => {
    setPending(item.id, true)
    setError('')
    try {
      await adminFetch(
        '/api/admin/community',
        adminJson('PATCH', { id: item.id, isPinned })
      )
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_pinned: isPinned } : i)))
      toast(isPinned ? 'Đã ghim bình luận' : 'Đã bỏ ghim')
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Không cập nhật được trạng thái ghim'))
    } finally {
      setPending(item.id, false)
    }
  }

  const handleDelete = async () => {
    const item = deleteTarget
    if (!item) return
    setPending(item.id, true)
    const list = visibleItems
    try {
      await adminFetch(`/api/admin/community?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      })
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      toast('Đã xóa bình luận vĩnh viễn')
      setDeleteTarget(null)
      focusAfterRemoval(item.id, list)
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Xóa bình luận thất bại'))
      setDeleteTarget(null)
    } finally {
      setPending(item.id, false)
    }
  }

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

  const renderItem = (item: CommentItem) => {
    const pending = pendingIds.has(item.id)
    const origin = originOf(item)
    return (
      <article
        key={item.id}
        ref={(el) => {
          if (el) itemRefs.current.set(item.id, el)
          else itemRefs.current.delete(item.id)
        }}
        tabIndex={-1}
        aria-label={`Bình luận của ${item.author_name}`}
        className={`rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-4 outline-none transition-opacity focus-visible:border-[var(--color-accent-border)] ${
          pending ? 'opacity-60' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--color-muted)]">
          <Badge tone={item.scope_type === 'guide' ? 'violet' : 'accent'}>
            {item.scope_type === 'guide' ? 'Bài viết' : 'Chia sẻ mod'}
          </Badge>
          {item.is_pinned && <Badge tone="warning">Đã ghim</Badge>}
          {item.parent_id && <span>Trả lời bình luận</span>}
          <time dateTime={item.created_at}>
            {new Date(item.created_at).toLocaleString('vi-VN')}
          </time>
          {origin && (
            <Link
              href={origin.href}
              target={origin.href.startsWith('/admin') ? undefined : '_blank'}
              className="font-medium text-[var(--color-accent)] hover:underline"
            >
              {origin.label} ↗
            </Link>
          )}
        </div>

        <div className="mt-2.5 flex items-start gap-3">
          {item.author_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.author_avatar}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full border border-[var(--color-line)] object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-xs font-bold text-[var(--color-muted)]">
              {item.author_name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-title)]">
              {item.author_name}
              {item.is_admin_comment && (
                <span className="ml-2 text-xs font-medium text-[var(--color-accent)]">admin</span>
              )}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-[var(--color-body)]">
              {excerpt(item.content)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] pt-3">
          {tab === 'pending' ? (
            <>
              <Button
                size="sm"
                loading={pending}
                onClick={() => void updateStatus(item, 'approved')}
              >
                Duyệt
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => void updateStatus(item, 'rejected')}
              >
                Từ chối
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              loading={pending}
              onClick={() => void updatePin(item, !item.is_pinned)}
            >
              {item.is_pinned ? 'Bỏ ghim' : 'Ghim'}
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => setDeleteTarget(item)}
          >
            Xóa
          </Button>
          {pending && <Spinner size={16} label="Đang xử lý bình luận" />}
        </div>
      </article>
    )
  }

  return (
    <AdminPage>
      {/* Tabs */}
      <div role="tablist" aria-label="Trạng thái bình luận" className="flex gap-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-1">
        {TABS.map((t) => {
          const active = tab === t.key
          const count = t.key === 'pending' ? pendingItems.length : approvedItems.length
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-title)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-title)]'
              }`}
            >
              {t.label}
              <span className="ml-2 tabular text-xs">({count})</span>
            </button>
          )
        })}
      </div>

      {error && (
        <InlineNotice tone="danger">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadItems()}
              className="font-semibold text-[var(--color-title)] underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        </InlineNotice>
      )}

      <div
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        ref={panelRef}
        tabIndex={-1}
        className="space-y-3 outline-none"
      >
        {loading ? (
          <div className="flex items-center gap-3 py-10 text-sm text-[var(--color-muted)]">
            <Spinner size={20} /> Đang tải bình luận…
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title={tab === 'pending' ? 'Không có bình luận chờ duyệt' : 'Chưa có bình luận đã duyệt'}
            description={
              tab === 'pending'
                ? 'Bình luận mới của người dùng sẽ xuất hiện ở đây.'
                : 'Các bình luận đã duyệt sẽ hiển thị ở đây để ghim/xóa.'
            }
          />
        ) : (
          visibleItems.map(renderItem)
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa bình luận"
        danger
        busy={deleteTarget ? pendingIds.has(deleteTarget.id) : false}
        confirmLabel="Xóa vĩnh viễn"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        description={
          deleteTarget && (
            <>
              Xóa vĩnh viễn bình luận của{' '}
              <strong className="text-[var(--color-title)]">{deleteTarget.author_name}</strong>: “
              {excerpt(deleteTarget.content, 120)}”? Không hoàn tác được.
            </>
          )
        }
      />
    </AdminPage>
  )
}
