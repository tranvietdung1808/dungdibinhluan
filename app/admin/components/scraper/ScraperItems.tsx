'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminFetch, adminFetchJson, adminJson, adminErrorMessage, isAdminAuthError } from '../admin-api'
import { useAdminToast } from '../AdminShell'
import { ConfirmDialog } from '../ConfirmDialog'
import type { Source } from './SourceManager'
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Field,
  InlineNotice,
  Spinner,
  inputClass,
  textareaClass,
} from '@/app/components/ui'

// =====================================================
// ScraperItems — vùng "Nội dung" của trang Scraper (§16.9)
// Review trước khi đăng: nguồn, tên, cover, category,
// mô tả, link tải, dữ liệu thiếu. Batch publish/skip/
// delete báo đủ: đã chọn / thành công / thất bại.
// =====================================================

export interface ScraperItem {
  id: string
  source_name: string
  url: string
  slug: string
  name: string
  author: string
  category: string
  version: string
  description: string
  thumbnail: string
  download_url: string
  tags: string[]
  thumbnail_orientation: string
  status: string
  created_at: string
}

const STATUS_META: Record<string, { label: string; tone: 'warning' | 'success' | 'neutral' | 'danger' | 'violet' }> = {
  pending: { label: 'Chờ duyệt', tone: 'warning' },
  published: { label: 'Đã đăng', tone: 'success' },
  skipped: { label: 'Đã bỏ qua', tone: 'neutral' },
  duplicate: { label: 'Trùng lặp', tone: 'violet' },
  error: { label: 'Lỗi', tone: 'danger' },
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'published', label: 'Đã đăng' },
  { value: 'skipped', label: 'Đã bỏ qua' },
  { value: 'duplicate', label: 'Trùng lặp' },
  { value: 'error', label: 'Lỗi' },
]

/** Dữ liệu còn thiếu để review trước khi đăng */
function missingFields(item: ScraperItem): string[] {
  const missing: string[] = []
  if (!item.name?.trim()) missing.push('tên')
  if (!item.thumbnail?.trim()) missing.push('ảnh bìa')
  if (!item.download_url?.trim()) missing.push('link tải')
  if (!item.category?.trim()) missing.push('danh mục')
  if (!item.description?.trim()) missing.push('mô tả')
  return missing
}

export function ScraperItems({
  sources,
  sourceFilter,
  onSourceFilter,
  refreshToken,
  onAuthLost,
}: {
  sources: Source[]
  sourceFilter: string
  onSourceFilter: (v: string) => void
  /** Tăng để buộc refetch (sau khi chạy thu thập) */
  refreshToken: number
  onAuthLost: () => void
}) {
  const toast = useAdminToast()
  const [items, setItems] = useState<ScraperItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchBusy, setBatchBusy] = useState<string | null>(null)
  const [batchResult, setBatchResult] = useState('')
  const [editingItem, setEditingItem] = useState<ScraperItem | null>(null)
  const [editDraft, setEditDraft] = useState<ScraperItem | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmBatch, setConfirmBatch] = useState<'delete' | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const q = new URLSearchParams()
      if (statusFilter) q.set('status', statusFilter)
      if (sourceFilter) q.set('sourceId', sourceFilter)
      const data = await adminFetchJson<{ items: ScraperItem[] }>(
        `/api/admin/scraper/items?${q.toString()}`
      )
      setItems(data.items || [])
      setSelected(new Set())
    } catch (err) {
      if (isAdminAuthError(err)) onAuthLost()
      setError(adminErrorMessage(err, 'Chưa tải được danh sách nội dung'))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sourceFilter, onAuthLost])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems, refreshToken])

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map((i) => i.id)))
  }

  // Batch: báo đủ số đã chọn / thành công / thất bại
  const runBatch = async (action: 'publish' | 'skip' | 'delete') => {
    const count = selected.size
    if (count === 0) return
    setBatchBusy(action)
    setBatchResult('')
    try {
      const res = await adminFetch(
        '/api/admin/scraper/items',
        adminJson('POST', { action, ids: [...selected] })
      )
      const d = (await res.json().catch(() => ({}))) as {
        summary?: { published?: number; duplicates?: number; failed?: number }
        count?: number
      }
      if (action === 'publish' && d.summary) {
        const ok = (d.summary.published ?? 0) + (d.summary.duplicates ?? 0)
        setBatchResult(
          `Đã chọn ${count} — đăng thành công ${d.summary.published ?? 0}, trùng ${d.summary.duplicates ?? 0}, thất bại ${d.summary.failed ?? 0}`
        )
        toast(`Đăng xong: ${ok}/${count} mục xử lý được`)
      } else {
        const ok = d.count ?? count
        setBatchResult(
          `Đã chọn ${count} — thành công ${ok}, thất bại ${Math.max(0, count - ok)}`
        )
        toast(`${action === 'skip' ? 'Đã bỏ qua' : 'Đã xóa'} ${ok}/${count} mục`)
      }
      setConfirmBatch(null)
      await fetchItems()
    } catch (err) {
      if (isAdminAuthError(err)) onAuthLost()
      else {
        setBatchResult(`Đã chọn ${count} — thất bại toàn bộ: ${adminErrorMessage(err, 'lỗi không xác định')}`)
      }
    } finally {
      setBatchBusy(null)
    }
  }

  const openEdit = (item: ScraperItem) => {
    setEditingItem(item)
    setEditDraft({ ...item })
  }

  const saveItemEdit = async () => {
    if (!editDraft || !editingItem) return
    setSavingEdit(true)
    try {
      await adminFetch(
        `/api/admin/scraper/items/${editingItem.id}`,
        adminJson('PATCH', {
          name: editDraft.name,
          author: editDraft.author,
          category: editDraft.category,
          version: editDraft.version,
          description: editDraft.description,
          tags: editDraft.tags,
        })
      )
      toast(`Đã lưu “${editDraft.name}”`)
      setEditingItem(null)
      setEditDraft(null)
      await fetchItems()
    } catch (err) {
      if (isAdminAuthError(err)) onAuthLost()
      else toast(adminErrorMessage(err, 'Lưu bài thất bại'))
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <section
      aria-label="Nội dung đã thu thập"
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--color-title)]">Nội dung đã thu thập</h2>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            Duyệt từng mục trước khi đăng lên site — kiểm tra kỹ dữ liệu còn thiếu
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
        <Field label="Nguồn" className="md:w-56">
          {({ id }) => (
            <select
              id={id}
              value={sourceFilter}
              onChange={(e) => onSourceFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">Tất cả nguồn</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Trạng thái" className="md:w-48">
          {({ id }) => (
            <select
              id={id}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Button variant="secondary" onClick={() => void fetchItems()} className="md:ml-auto">
          Làm mới
        </Button>
      </div>

      {/* Batch bar */}
      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-body)]">
            <input
              type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleAll}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Chọn tất cả ({items.length})
          </label>
          <span className="text-sm tabular text-[var(--color-muted)]">
            Đã chọn: {selected.size}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={selected.size === 0 || !!batchBusy}
              loading={batchBusy === 'publish'}
              onClick={() => void runBatch('publish')}
            >
              Đăng đã chọn
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={selected.size === 0 || !!batchBusy}
              loading={batchBusy === 'skip'}
              onClick={() => void runBatch('skip')}
            >
              Bỏ qua
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={selected.size === 0 || !!batchBusy}
              loading={batchBusy === 'delete'}
              onClick={() => setConfirmBatch('delete')}
            >
              Xóa
            </Button>
          </div>
        </div>
      )}

      {batchResult && (
        <InlineNotice tone="accent" className="mt-3">
          {batchResult}
        </InlineNotice>
      )}
      {error && (
        <InlineNotice tone="danger" className="mt-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchItems()}
              className="font-semibold text-[var(--color-title)] underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        </InlineNotice>
      )}

      {/* Danh sách item */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-3 py-10 text-sm text-[var(--color-muted)]">
            <Spinner size={20} /> Đang tải nội dung…
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Không có nội dung nào"
            description={
              statusFilter === 'pending'
                ? 'Chưa có mục chờ duyệt. Chạy “Thu thập” ở vùng Nguồn phía trên.'
                : 'Không có mục nào với trạng thái này.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const st = STATUS_META[item.status] ?? STATUS_META.pending
              const missing = missingFields(item)
              return (
                <li
                  key={item.id}
                  className={`rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] p-4 ${
                    batchBusy && selected.has(item.id) ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      aria-label={`Chọn “${item.name}”`}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                    />
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="h-16 w-24 shrink-0 rounded-lg border border-[var(--color-line)] bg-black object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--color-line-strong)] text-xs text-[var(--color-muted)]">
                        Không có ảnh
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold leading-snug text-[var(--color-title)]">
                          {item.name || <span className="text-[var(--color-danger)]">Chưa có tên</span>}
                        </p>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge>{item.source_name || 'Nguồn ?'}</Badge>
                        {item.category ? (
                          <Badge tone="accent">{item.category}</Badge>
                        ) : null}
                        <span className="text-xs tabular text-[var(--color-muted)]">
                          {item.version}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {item.author}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-[var(--color-muted)]">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        {item.download_url ? (
                          <a
                            href={item.download_url}
                            target="_blank"
                            rel="noreferrer"
                            className="max-w-[260px] truncate font-medium text-[var(--color-accent)] hover:underline"
                          >
                            Link tải ↗
                          </a>
                        ) : null}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[var(--color-muted)] hover:text-[var(--color-title)]"
                        >
                          Bài gốc ↗
                        </a>
                      </div>
                      {missing.length > 0 && (
                        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-[var(--color-warn)]">Thiếu:</span>
                          {missing.map((m) => (
                            <Badge key={m} tone="warning">
                              {m}
                            </Badge>
                          ))}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                        Sửa
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Confirm xóa hàng loạt */}
      <ConfirmDialog
        open={confirmBatch === 'delete'}
        title="Xóa các mục đã chọn"
        danger
        busy={batchBusy === 'delete'}
        confirmLabel="Xóa vĩnh viễn"
        onConfirm={() => void runBatch('delete')}
        onCancel={() => setConfirmBatch(null)}
        description={
          <>
            Xóa vĩnh viễn <strong className="text-[var(--color-title)]">{selected.size}</strong> mục
            đã chọn? Không hoàn tác được.
          </>
        }
      />

      {/* Dialog sửa item */}
      <Dialog
        open={!!editingItem}
        onClose={() => {
          if (!savingEdit) {
            setEditingItem(null)
            setEditDraft(null)
          }
        }}
        label="Sửa nội dung trước khi đăng"
      >
        {editDraft && (
          <>
            <h3 className="text-h3 text-[var(--color-title)]">Sửa nội dung trước khi đăng</h3>
            <div className="mt-4 space-y-4">
              <Field label="Tên" required>
                {({ id }) => (
                  <input
                    id={id}
                    value={editDraft.name}
                    onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Danh mục">
                  {({ id }) => (
                    <input
                      id={id}
                      value={editDraft.category}
                      onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                      className={inputClass}
                    />
                  )}
                </Field>
                <Field label="Phiên bản">
                  {({ id }) => (
                    <input
                      id={id}
                      value={editDraft.version}
                      onChange={(e) => setEditDraft({ ...editDraft, version: e.target.value })}
                      className={inputClass}
                    />
                  )}
                </Field>
              </div>
              <Field label="Tác giả">
                {({ id }) => (
                  <input
                    id={id}
                    value={editDraft.author}
                    onChange={(e) => setEditDraft({ ...editDraft, author: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Tags" hint="Phân cách bằng dấu phẩy">
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    value={(editDraft.tags || []).join(', ')}
                    onChange={(e) =>
                      setEditDraft({
                        ...editDraft,
                        tags: e.target.value
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean),
                      })
                    }
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Mô tả ngắn">
                {({ id }) => (
                  <textarea
                    id={id}
                    value={editDraft.description}
                    onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                    rows={4}
                    className={textareaClass}
                  />
                )}
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingItem(null)
                  setEditDraft(null)
                }}
                disabled={savingEdit}
              >
                Hủy
              </Button>
              <Button onClick={() => void saveItemEdit()} loading={savingEdit}>
                Lưu
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </section>
  )
}
