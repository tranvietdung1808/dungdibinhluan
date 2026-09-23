'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AdminPage } from '../components/AdminPage'
import { AdminTable, AdminThead, AdminTh, AdminTr, AdminTd } from '../components/AdminTable'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAdminToast } from '../components/AdminShell'
import {
  adminFetch,
  adminFetchJson,
  adminJson,
  adminErrorMessage,
  isAdminAuthError,
} from '../components/admin-api'
import { Badge, Button, ButtonLink, EmptyState, ErrorState, Field, InlineNotice, Spinner, inputClass } from '@/app/components/ui'

// =====================================================
// /admin/mods — danh sách mod (§16.3)
// - Bảng desktop + thẻ mobile với menu thao tác từng mod
// - Giá credit: draft → Lưu rõ ràng → pending theo hàng →
//   thành công hoặc rollback (không báo thành công sớm)
// - Xác nhận nêu rõ tên mod + hiệu ứng quyền truy cập
// =====================================================

interface Mod {
  id: string
  slug: string
  name: string
  author: string
  category: string
  version: string
  updated_at: string
  thumbnail: string | null
  featured: boolean
  credit_enabled?: boolean
  credit_cost?: number | null
}

type AccessFilter = 'all' | 'free' | 'credit'

/** Menu thao tác gọn cho thẻ mobile (đủ lớn để chạm) */
function ModActionsMenu({ mod, onDelete }: { mod: Mod; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Thao tác cho mod ${mod.name}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-title)]"
      >
        Thao tác
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] shadow-xl"
        >
          {[
            { href: `/mods/${mod.slug}`, label: 'Xem trang công khai', external: true },
            { href: `/admin/mods/${mod.slug}/edit`, label: 'Sửa thông tin' },
            { href: `/admin/mods/${mod.slug}/showcase`, label: 'Quản lý showcase' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              target={item.external ? '_blank' : undefined}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-1)] hover:text-[var(--color-title)]"
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            className="block w-full px-4 py-3 text-left text-sm text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-subtle)]"
          >
            Xóa mod
          </button>
        </div>
      )}
    </div>
  )
}

/** Ô điều khiển credit: switch + giá draft + nút Lưu riêng */
function CreditControl({
  mod,
  draft,
  pending,
  error,
  onDraft,
  onSave,
  onToggle,
}: {
  mod: Mod
  draft: string
  pending: boolean
  error?: string
  onDraft: (v: string) => void
  onSave: () => void
  onToggle: () => void
}) {
  const saved = String(mod.credit_cost ?? 5)
  const dirty = mod.credit_enabled && draft !== saved
  const valid = Number.isFinite(Number(draft)) && Number(draft) >= 1
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={!!mod.credit_enabled}
          aria-label={
            mod.credit_enabled
              ? `Tắt mở khóa credit cho ${mod.name}`
              : `Bật mở khóa credit cho ${mod.name}`
          }
          disabled={pending}
          onClick={onToggle}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            mod.credit_enabled ? 'bg-[var(--color-credit)]' : 'bg-[var(--color-line-strong)]'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              mod.credit_enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
        {mod.credit_enabled ? (
          <>
            <input
              type="number"
              min={1}
              aria-label={`Giá credit của ${mod.name}`}
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (dirty && valid) onSave()
                }
              }}
              disabled={pending}
              className="h-9 w-20 rounded-lg border border-[var(--color-credit-border)] bg-[var(--color-surface-2)] px-2 text-center text-sm font-bold tabular text-[var(--color-credit-strong)] focus:border-[var(--color-credit)] focus:outline-none disabled:opacity-50"
            />
            <span className="text-xs text-[var(--color-muted)]">credit</span>
            {pending ? (
              <Spinner size={16} label={`Đang lưu giá credit của ${mod.name}`} />
            ) : (
              dirty && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onSave}
                  disabled={!valid}
                >
                  Lưu
                </Button>
              )
            )}
          </>
        ) : (
          <span className="text-xs text-[var(--color-muted)]">Miễn phí</span>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      {dirty && !pending && valid && (
        <p className="text-xs text-[var(--color-muted)]">Giá mới chưa lưu — bấm Lưu để áp dụng</p>
      )}
    </div>
  )
}

function ModThumb({ mod }: { mod: Mod }) {
  if (!mod.thumbnail) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] text-xs text-[var(--color-muted)]">
        N/A
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mod.thumbnail}
      alt=""
      className="h-14 w-14 rounded-lg border border-[var(--color-line)] object-cover"
      loading="lazy"
    />
  )
}

export default function AdminModsPage() {
  const toast = useAdminToast()
  const [mods, setMods] = useState<Mod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authFailed, setAuthFailed] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all')
  const [costDrafts, setCostDrafts] = useState<Record<string, string>>({})
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<Mod | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [creditConfirm, setCreditConfirm] = useState<{ mod: Mod; enable: boolean } | null>(null)

  const setPending = (id: string, on: boolean) =>
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const fetchMods = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetchJson<Mod[]>('/api/admin/mods')
      setMods(Array.isArray(data) ? data : [])
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Chưa tải được danh sách mod'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMods()
  }, [fetchMods])

  // Lưu cấu hình credit — pending theo hàng, rollback khi lỗi
  const persistCredit = async (mod: Mod, enabled: boolean, creditCost: number) => {
    setPending(mod.id, true)
    setRowErrors((prev) => ({ ...prev, [mod.id]: '' }))
    try {
      const res = await adminFetch(
        '/api/admin/mods/credit-config',
        adminJson('POST', { slug: mod.slug, enabled, creditCost })
      )
      const data = (await res.json()) as { credit_enabled: boolean; credit_cost: number | null }
      setMods((prev) =>
        prev.map((m) =>
          m.id === mod.id
            ? { ...m, credit_enabled: data.credit_enabled, credit_cost: data.credit_cost }
            : m
        )
      )
      setCostDrafts((prev) => ({ ...prev, [mod.id]: String(data.credit_cost ?? 5) }))
      toast(
        data.credit_enabled
          ? `“${mod.name}” cần ${data.credit_cost} credit để tải`
          : `“${mod.name}” đã chuyển sang miễn phí`
      )
    } catch (err) {
      if (isAdminAuthError(err)) {
        setAuthFailed(true)
      } else {
        // Rollback: trả draft về giá đã lưu trên server
        setCostDrafts((prev) => ({ ...prev, [mod.id]: String(mod.credit_cost ?? 5) }))
        setRowErrors((prev) => ({
          ...prev,
          [mod.id]: adminErrorMessage(err, 'Lưu giá credit thất bại'),
        }))
      }
    } finally {
      setPending(mod.id, false)
    }
  }

  const handleToggleRequest = (mod: Mod) => {
    setCreditConfirm({ mod, enable: !mod.credit_enabled })
  }

  const handleToggleConfirm = async () => {
    const c = creditConfirm
    if (!c) return
    setCreditConfirm(null)
    await persistCredit(c.mod, c.enable, c.enable ? Number(costDrafts[c.mod.id] ?? c.mod.credit_cost ?? 5) || 5 : 0)
  }

  const handleSaveCost = (mod: Mod) => {
    const raw = costDrafts[mod.id] ?? String(mod.credit_cost ?? 5)
    const value = Math.floor(Number(raw))
    if (!Number.isFinite(value) || value < 1) {
      setRowErrors((prev) => ({ ...prev, [mod.id]: 'Số credit phải là số nguyên ≥ 1' }))
      return
    }
    void persistCredit(mod, true, value)
  }

  const handleDelete = async () => {
    const mod = deleteTarget
    if (!mod) return
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/mods/${encodeURIComponent(mod.slug)}`, { method: 'DELETE' })
      setMods((prev) => prev.filter((m) => m.id !== mod.id))
      toast(`Đã xóa mod “${mod.name}”`)
      setDeleteTarget(null)
    } catch (err) {
      if (isAdminAuthError(err)) {
        setAuthFailed(true)
        setDeleteTarget(null)
      } else {
        setRowErrors((prev) => ({
          ...prev,
          [mod.id]: adminErrorMessage(err, 'Xóa mod thất bại'),
        }))
        setDeleteTarget(null)
      }
    } finally {
      setDeleting(false)
    }
  }

  const categories = Array.from(new Set(mods.map((m) => m.category).filter(Boolean))).sort()

  const filtered = mods.filter((m) => {
    if (search) {
      const s = search.toLowerCase()
      if (
        !m.name.toLowerCase().includes(s) &&
        !m.slug.toLowerCase().includes(s) &&
        !m.author.toLowerCase().includes(s)
      )
        return false
    }
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false
    if (accessFilter === 'free' && m.credit_enabled) return false
    if (accessFilter === 'credit' && !m.credit_enabled) return false
    return true
  })

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

  return (
    <AdminPage>
      {/* Toolbar tìm kiếm + lọc */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-4 md:flex-row md:items-end">
        <Field label="Tìm kiếm" className="flex-1">
          {({ id }) => (
            <input
              id={id}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
              placeholder="Tên, slug hoặc tác giả…"
            />
          )}
        </Field>
        <Field label="Danh mục" className="md:w-48">
          {({ id }) => (
            <select
              id={id}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">Tất cả</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Quyền truy cập" className="md:w-48">
          {({ id }) => (
            <select
              id={id}
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value as AccessFilter)}
              className={inputClass}
            >
              <option value="all">Tất cả</option>
              <option value="free">Miễn phí</option>
              <option value="credit">Mở khóa bằng credit</option>
            </select>
          )}
        </Field>
      </div>

      {error && (
        <InlineNotice tone="danger">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchMods()}
              className="font-semibold text-[var(--color-title)] underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        </InlineNotice>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-sm text-[var(--color-muted)]">
          <Spinner size={20} /> Đang tải danh sách mod…
        </div>
      ) : filtered.length === 0 ? (
        mods.length === 0 ? (
          <EmptyState
            title="Chưa có mod nào"
            description="Tạo mod đầu tiên để bắt đầu quản lý nội dung."
            action="Thêm mod mới"
            actionHref="/admin/mods/new"
          />
        ) : (
          <EmptyState
            title="Không có mod nào khớp bộ lọc"
            description="Thử đổi từ khóa tìm kiếm hoặc bộ lọc."
            action="Xóa bộ lọc"
            onAction={() => {
              setSearch('')
              setCategoryFilter('all')
              setAccessFilter('all')
            }}
          />
        )
      ) : (
        <>
          {/* ── Bảng desktop ── */}
          <div className="hidden md:block">
            <AdminTable label="Danh sách mod" minWidth={1000}>
              <AdminThead>
                <tr>
                  <AdminTh>Mod</AdminTh>
                  <AdminTh>Danh mục</AdminTh>
                  <AdminTh>Phiên bản</AdminTh>
                  <AdminTh>Cập nhật</AdminTh>
                  <AdminTh>Nổi bật</AdminTh>
                  <AdminTh>Quyền truy cập</AdminTh>
                  <AdminTh className="text-right">Thao tác</AdminTh>
                </tr>
              </AdminThead>
              <tbody>
                {filtered.map((mod) => (
                  <AdminTr key={mod.id} pending={pendingIds.has(mod.id)}>
                    <AdminTd>
                      <div className="flex items-center gap-3">
                        <ModThumb mod={mod} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--color-title)]">
                            {mod.name}
                          </p>
                          <p className="truncate font-mono text-xs text-[var(--color-muted)]">
                            {mod.slug}
                          </p>
                        </div>
                      </div>
                    </AdminTd>
                    <AdminTd>
                      <Badge>{mod.category}</Badge>
                    </AdminTd>
                    <AdminTd className="tabular">{mod.version}</AdminTd>
                    <AdminTd className="text-meta">{mod.updated_at}</AdminTd>
                    <AdminTd>
                      {mod.featured ? (
                        <Badge tone="credit">Nổi bật</Badge>
                      ) : (
                        <span className="text-xs text-[var(--color-muted)]">—</span>
                      )}
                    </AdminTd>
                    <AdminTd>
                      <CreditControl
                        mod={mod}
                        draft={costDrafts[mod.id] ?? String(mod.credit_cost ?? 5)}
                        pending={pendingIds.has(mod.id)}
                        error={rowErrors[mod.id]}
                        onDraft={(v) => setCostDrafts((prev) => ({ ...prev, [mod.id]: v }))}
                        onSave={() => handleSaveCost(mod)}
                        onToggle={() => handleToggleRequest(mod)}
                      />
                    </AdminTd>
                    <AdminTd className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ButtonLink
                          href={`/mods/${mod.slug}`}
                          variant="ghost"
                          size="sm"
                          external
                        >
                          Xem
                        </ButtonLink>
                        <ButtonLink href={`/admin/mods/${mod.slug}/edit`} variant="ghost" size="sm">
                          Sửa
                        </ButtonLink>
                        <ButtonLink
                          href={`/admin/mods/${mod.slug}/showcase`}
                          variant="ghost"
                          size="sm"
                        >
                          Showcase
                        </ButtonLink>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(mod)}>
                          <span className="text-[var(--color-danger)]">Xóa</span>
                        </Button>
                      </div>
                    </AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTable>
          </div>

          {/* ── Thẻ mobile ── */}
          <ul className="space-y-3 md:hidden" aria-label="Danh sách mod">
            {filtered.map((mod) => (
              <li
                key={mod.id}
                className={`rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-4 ${
                  pendingIds.has(mod.id) ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <ModThumb mod={mod} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--color-title)]">{mod.name}</p>
                    <p className="truncate font-mono text-xs text-[var(--color-muted)]">
                      {mod.slug}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge>{mod.category}</Badge>
                      <span className="text-xs tabular text-[var(--color-muted)]">
                        v{mod.version} · {mod.updated_at}
                      </span>
                      {mod.featured && <Badge tone="credit">Nổi bật</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 border-t border-[var(--color-line)] pt-3">
                  <CreditControl
                    mod={mod}
                    draft={costDrafts[mod.id] ?? String(mod.credit_cost ?? 5)}
                    pending={pendingIds.has(mod.id)}
                    error={rowErrors[mod.id]}
                    onDraft={(v) => setCostDrafts((prev) => ({ ...prev, [mod.id]: v }))}
                    onSave={() => handleSaveCost(mod)}
                    onToggle={() => handleToggleRequest(mod)}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <ModActionsMenu mod={mod} onDelete={() => setDeleteTarget(mod)} />
                </div>
              </li>
            ))}
          </ul>

          <p className="text-meta text-[var(--color-muted)]">
            Hiển thị {filtered.length}/{mods.length} mod
          </p>
        </>
      )}

      {/* Xác nhận đổi quyền truy cập — nêu rõ tên mod + hiệu ứng */}
      <ConfirmDialog
        open={!!creditConfirm}
        title={creditConfirm?.enable ? 'Bật mở khóa credit' : 'Tắt mở khóa credit'}
        confirmLabel={creditConfirm?.enable ? 'Bật mở khóa' : 'Chuyển miễn phí'}
        onConfirm={handleToggleConfirm}
        onCancel={() => setCreditConfirm(null)}
        description={
          creditConfirm && (
            <>
              {creditConfirm.enable ? (
                <>
                  Mod{' '}
                  <strong className="text-[var(--color-title)]">“{creditConfirm.mod.name}”</strong>{' '}
                  sẽ yêu cầu{' '}
                  <strong className="text-[var(--color-title)]">
                    {costDrafts[creditConfirm.mod.id] ?? creditConfirm.mod.credit_cost ?? 5} credit
                  </strong>{' '}
                  để tải. Người dùng chưa đủ credit sẽ không vào được trang mod.
                </>
              ) : (
                <>
                  Mod{' '}
                  <strong className="text-[var(--color-title)]">“{creditConfirm.mod.name}”</strong>{' '}
                  sẽ chuyển sang <strong className="text-[var(--color-title)]">miễn phí</strong> —
                  tất cả người dùng đều tải được, kể cả người đã trả credit trước đó.
                </>
              )}
            </>
          )
        }
      />

      {/* Xác nhận xóa — nêu rõ tên mod */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa mod"
        danger
        busy={deleting}
        confirmLabel="Xóa vĩnh viễn"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        description={
          deleteTarget && (
            <>
              Xóa vĩnh viễn mod{' '}
              <strong className="text-[var(--color-title)]">“{deleteTarget.name}”</strong> (
              {deleteTarget.slug})? Không hoàn tác được — ảnh showcase và cấu hình credit đi kèm cũng
              mất.
            </>
          )
        }
      />
    </AdminPage>
  )
}
