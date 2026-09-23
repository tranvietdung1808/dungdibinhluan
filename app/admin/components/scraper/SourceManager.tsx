'use client'

import { useState } from 'react'
import { adminFetch, adminJson, adminErrorMessage, isAdminAuthError } from '../admin-api'
import { useAdminToast } from '../AdminShell'
import { ConfirmDialog } from '../ConfirmDialog'
import { Badge, Button, Field, InlineNotice, Spinner, inputClass, textareaClass } from '@/app/components/ui'

// =====================================================
// SourceManager — vùng "Nguồn" của trang Scraper (§16.9)
// Danh sách nguồn + form thêm/sửa + bật/tắt + xóa + nút
// "Thu thập" chạy đồng bộ (chỉ hiển thị đang chạy + thời
// gian trôi — không vẽ % giả).
// =====================================================

export interface Source {
  id: string
  name: string
  base_url: string
  list_urls: string[]
  link_allow_pattern: string
  blocked_slugs: string[]
  title_selector: string
  image_selector: string
  content_selectors: string[]
  download_selector: string
  download_exclude_selector: string
  download_exclude_pattern: string
  enabled: boolean
}

const GAMEKOT_PRESET = {
  name: 'Gamekot FC26',
  base_url: 'https://gamekot.pro',
  list_urls:
    'https://gamekot.pro/category/fc26/\nhttps://gamekot.pro/category/fc26/page/2/',
  link_allow_pattern: '^https://gamekot\\.pro/[a-z0-9][a-z0-9-]+[a-z0-9]/$',
  blocked_slugs:
    'wishlist\nmy-account\nfaqs\nabout-us\ncontact-us\nsend-us-mod\nprivacy-policy\nrefund_returns\ncart\ncheckout\npayment-page\nkak-pokypat\nreshenie-problem',
  title_selector: 'h1.entry-title, h1',
  image_selector: 'meta[property="og:image"]',
  content_selectors: '.entry-content p\n.elementor-widget-text-editor p',
  download_selector: '[class*="elementor-button-success"] a[href], a.elementor-button[href]',
  download_exclude_selector: '[class*="elementor-button-info"]',
  download_exclude_pattern: 't\\.me|telegram|gamekot\\.pro',
}

const emptyForm = {
  name: '',
  base_url: '',
  list_urls: '',
  link_allow_pattern: '',
  blocked_slugs: '',
  title_selector: 'h1.entry-title, h1',
  image_selector: 'meta[property="og:image"]',
  content_selectors: '',
  download_selector: 'a[href]',
  download_exclude_selector: '',
  download_exclude_pattern: '',
  enabled: true,
}

type SourceForm = typeof emptyForm

const linesToArray = (s: string) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
const arrayToLines = (a?: string[]) => (a || []).join('\n')

export function SourceManager({
  sources,
  loading,
  onRefresh,
  onAuthLost,
  runningSourceId,
  elapsedSec,
  onRun,
}: {
  sources: Source[]
  loading: boolean
  onRefresh: () => void
  onAuthLost: () => void
  /** Nguồn đang chạy thu thập (đồng bộ) */
  runningSourceId: string | null
  /** Giây đã trôi khi đang thu thập */
  elapsedSec: number
  onRun: (source: Source) => void
}) {
  const toast = useAdminToast()
  const [editing, setEditing] = useState<Source | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SourceForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Source | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (s: Source) => {
    setEditing(s)
    setForm({
      name: s.name,
      base_url: s.base_url,
      list_urls: arrayToLines(s.list_urls),
      link_allow_pattern: s.link_allow_pattern || '',
      blocked_slugs: arrayToLines(s.blocked_slugs),
      title_selector: s.title_selector || 'h1.entry-title, h1',
      image_selector: s.image_selector || 'meta[property="og:image"]',
      content_selectors: arrayToLines(s.content_selectors),
      download_selector: s.download_selector || 'a[href]',
      download_exclude_selector: s.download_exclude_selector || '',
      download_exclude_pattern: s.download_exclude_pattern || '',
      enabled: s.enabled,
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.base_url.trim()) {
      setFormError('Cần nhập tên nguồn và Base URL')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: form.name.trim(),
        base_url: form.base_url.trim(),
        list_urls: linesToArray(form.list_urls),
        link_allow_pattern: form.link_allow_pattern,
        blocked_slugs: linesToArray(form.blocked_slugs),
        title_selector: form.title_selector,
        image_selector: form.image_selector,
        content_selectors: linesToArray(form.content_selectors),
        download_selector: form.download_selector,
        download_exclude_selector: form.download_exclude_selector,
        download_exclude_pattern: form.download_exclude_pattern,
        enabled: form.enabled,
      }
      await adminFetch(
        editing ? `/api/admin/scraper/sources/${editing.id}` : '/api/admin/scraper/sources',
        adminJson(editing ? 'PUT' : 'POST', payload)
      )
      toast(editing ? `Đã cập nhật nguồn “${form.name}”` : `Đã thêm nguồn “${form.name}”`)
      setShowForm(false)
      onRefresh()
    } catch (err) {
      if (isAdminAuthError(err)) onAuthLost()
      else setFormError(adminErrorMessage(err, 'Không lưu được nguồn'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const s = deleteTarget
    if (!s) return
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/scraper/sources/${s.id}`, { method: 'DELETE' })
      toast(`Đã xóa nguồn “${s.name}”`)
      setDeleteTarget(null)
      onRefresh()
    } catch (err) {
      if (isAdminAuthError(err)) onAuthLost()
      setDeleteTarget(null)
      toast(adminErrorMessage(err, 'Xóa nguồn thất bại'))
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = async (s: Source) => {
    setPendingToggleId(s.id)
    try {
      await adminFetch(
        `/api/admin/scraper/sources/${s.id}`,
        adminJson('PUT', { enabled: !s.enabled })
      )
      toast(s.enabled ? `Đã tắt nguồn “${s.name}”` : `Đã bật nguồn “${s.name}”`)
      onRefresh()
    } catch (err) {
      if (isAdminAuthError(err)) onAuthLost()
      else toast(adminErrorMessage(err, 'Đổi trạng thái nguồn thất bại'))
    } finally {
      setPendingToggleId(null)
    }
  }

  return (
    <section
      aria-label="Nguồn thu thập"
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--color-title)]">Nguồn thu thập</h2>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            Cấu hình các site để cào nội dung mod về duyệt
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + Thêm nguồn
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-[var(--color-title)]">
              {editing ? `Sửa nguồn “${editing.name}”` : 'Thêm nguồn mới'}
            </h3>
            <button
              type="button"
              onClick={() => setForm({ ...emptyForm, ...GAMEKOT_PRESET })}
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
            >
              Dùng preset Gamekot FC26
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên nguồn" required hint='VD: "Gamekot FC26"'>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                  placeholder="Gamekot FC26"
                />
              )}
            </Field>
            <Field label="Base URL" required hint="VD: https://gamekot.pro">
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  value={form.base_url}
                  onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
                  className={inputClass}
                  placeholder="https://example.com"
                />
              )}
            </Field>
            <Field label="List URLs" hint="Mỗi dòng 1 URL trang danh sách cần quét">
              {({ id, describedBy }) => (
                <textarea
                  id={id}
                  aria-describedby={describedBy}
                  value={form.list_urls}
                  onChange={(e) => setForm((f) => ({ ...f, list_urls: e.target.value }))}
                  rows={3}
                  className={textareaClass}
                  placeholder="https://example.com/category/fc26/"
                />
              )}
            </Field>
            <Field label="Link pattern" hint="Regex lọc link bài viết">
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  value={form.link_allow_pattern}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link_allow_pattern: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="^https://example\.com/…"
                />
              )}
            </Field>
            <Field label="Blocked slugs" hint="Mỗi dòng 1 slug cần bỏ qua">
              {({ id, describedBy }) => (
                <textarea
                  id={id}
                  aria-describedby={describedBy}
                  value={form.blocked_slugs}
                  onChange={(e) => setForm((f) => ({ ...f, blocked_slugs: e.target.value }))}
                  rows={3}
                  className={textareaClass}
                />
              )}
            </Field>
            <Field label="Title selector">
              {({ id }) => (
                <input
                  id={id}
                  value={form.title_selector}
                  onChange={(e) => setForm((f) => ({ ...f, title_selector: e.target.value }))}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Image selector">
              {({ id }) => (
                <input
                  id={id}
                  value={form.image_selector}
                  onChange={(e) => setForm((f) => ({ ...f, image_selector: e.target.value }))}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Content selectors" hint="Mỗi dòng 1 selector lấy nội dung">
              {({ id, describedBy }) => (
                <textarea
                  id={id}
                  aria-describedby={describedBy}
                  value={form.content_selectors}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content_selectors: e.target.value }))
                  }
                  rows={3}
                  className={textareaClass}
                  placeholder=".entry-content p"
                />
              )}
            </Field>
            <Field label="Download selector">
              {({ id }) => (
                <input
                  id={id}
                  value={form.download_selector}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, download_selector: e.target.value }))
                  }
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Download exclude selector">
              {({ id }) => (
                <input
                  id={id}
                  value={form.download_exclude_selector}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, download_exclude_selector: e.target.value }))
                  }
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Download exclude pattern" hint="Regex loại link tải không mong muốn">
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  value={form.download_exclude_pattern}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, download_exclude_pattern: e.target.value }))
                  }
                  className={inputClass}
                  placeholder="t\.me|telegram|example\.com"
                />
              )}
            </Field>
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[var(--color-body)]">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Kích hoạt nguồn
          </label>
          {formError && (
            <InlineNotice tone="danger" className="mt-3">
              {formError}
            </InlineNotice>
          )}
          <div className="mt-4 flex gap-3">
            <Button onClick={() => void handleSave()} loading={saving}>
              {editing ? 'Cập nhật nguồn' : 'Thêm nguồn'}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-3 py-6 text-sm text-[var(--color-muted)]">
            <Spinner size={18} /> Đang tải nguồn…
          </div>
        ) : sources.length === 0 ? (
          <p className="py-4 text-sm text-[var(--color-muted)]">
            Chưa có nguồn nào. Nhấn “Thêm nguồn” hoặc dùng preset Gamekot.
          </p>
        ) : (
          <ul className="space-y-3">
            {sources.map((s) => {
              const running = runningSourceId === s.id
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--color-title)]">{s.name}</span>
                      {s.enabled ? (
                        <Badge tone="success">Đang bật</Badge>
                      ) : (
                        <Badge>Đang tắt</Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--color-muted)]">{s.base_url}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {s.list_urls?.length || 0} URL quét
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onRun(s)}
                      loading={running}
                      disabled={!s.enabled || !!runningSourceId}
                    >
                      {running ? `Đang thu thập… ${elapsedSec}s` : 'Thu thập'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={pendingToggleId === s.id}
                      onClick={() => void handleToggle(s)}
                    >
                      {s.enabled ? 'Tắt' : 'Bật'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>
                      Cấu hình
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(s)}>
                      Xóa
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa nguồn thu thập"
        danger
        busy={deleting}
        confirmLabel="Xóa nguồn"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        description={
          deleteTarget && (
            <>
              Xóa nguồn{' '}
              <strong className="text-[var(--color-title)]">“{deleteTarget.name}”</strong> (
              {deleteTarget.base_url})? Các item đã cào về vẫn được giữ lại.
            </>
          )
        }
      />
    </section>
  )
}
