'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Source {
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

interface Item {
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

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  published: 'Đã đăng',
  skipped: 'Đã bỏ qua',
  duplicate: 'Trùng',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  published: 'bg-green-500/20 text-green-400 border-green-500/40',
  skipped: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  duplicate: 'bg-red-500/20 text-red-400 border-red-500/40',
}

const GAMEKOT_PRESET = {
  name: 'Gamekot FC26',
  base_url: 'https://gamekot.pro',
  list_urls: 'https://gamekot.pro/category/fc26/\nhttps://gamekot.pro/category/fc26/page/2/',
  link_allow_pattern: '^https://gamekot\\.pro/[a-z0-9][a-z0-9-]+[a-z0-9]/$',
  blocked_slugs: 'wishlist\nmy-account\nfaqs\nabout-us\ncontact-us\nsend-us-mod\nprivacy-policy\nrefund_returns\ncart\ncheckout\npayment-page\nkak-pokypat\nreshenie-problem',
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

const linesToArray = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean)
const arrayToLines = (a?: string[]) => (a || []).join('\n')

export default function AdminScraperPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const [view, setView] = useState<'sources' | 'items'>('sources')
  const [editing, setEditing] = useState<Source | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<SourceForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const getAuthHeaders = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : null
  }, [])

  const fetchSources = useCallback(async () => {
    const headers = await getAuthHeaders()
    if (!headers) return
    const res = await fetch('/api/admin/scraper/sources', { headers })
    if (res.ok) {
      const d = await res.json()
      setSources(d.sources || [])
    }
    setLoading(false)
  }, [getAuthHeaders])

  useEffect(() => {
    void fetchSources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
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
    setShowForm(true)
  }

  const applyPreset = () => setForm({ ...emptyForm, ...GAMEKOT_PRESET })

  const handleSave = async () => {
    if (!form.name || !form.base_url) {
      notify('Thiếu tên hoặc base_url')
      return
    }
    const headers = await getAuthHeaders()
    if (!headers) return
    setSaving(true)
    const payload = {
      name: form.name,
      base_url: form.base_url,
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
    const url = editing ? `/api/admin/scraper/sources/${editing.id}` : '/api/admin/scraper/sources'
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      notify(editing ? 'Đã cập nhật nguồn' : 'Đã thêm nguồn')
      setShowForm(false)
      fetchSources()
    } else {
      const d = await res.json().catch(() => ({}))
      notify('Lỗi: ' + (d.error || 'không xác định'))
    }
  }

  const handleDelete = async (s: Source) => {
    if (!confirm(`Xóa nguồn "${s.name}"?`)) return
    const headers = await getAuthHeaders()
    if (!headers) return
    const res = await fetch(`/api/admin/scraper/sources/${s.id}`, { method: 'DELETE', headers })
    if (res.ok) {
      notify('Đã xóa nguồn')
      if (activeSourceId === s.id) setActiveSourceId(null)
      fetchSources()
    } else {
      const d = await res.json().catch(() => ({}))
      notify('Lỗi: ' + (d.error || 'không xác định'))
    }
  }

  const handleToggle = async (s: Source) => {
    const headers = await getAuthHeaders()
    if (!headers) return
    const res = await fetch(`/api/admin/scraper/sources/${s.id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !s.enabled }),
    })
    if (res.ok) fetchSources()
  }

  const handleSelectSource = (id: string) => {
    setActiveSourceId(id)
    setView('items')
  }

  const activeSource = sources.find((s) => s.id === activeSourceId) || null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex">
        {/* ── SIDEBAR ── */}
        <aside className="w-64 shrink-0 bg-[#111111] border-r border-white/10 min-h-screen sticky top-0 h-screen flex flex-col">
          <div className="px-4 py-5 border-b border-white/10">
            <h1 className="font-bold text-lg">Scraper</h1>
            <p className="text-slate-500 text-xs mt-0.5">Quản lý nguồn cào dữ liệu</p>
          </div>

          <div className="px-3 py-3 flex items-center justify-between">
            <button
              onClick={() => { setView('sources'); setActiveSourceId(null) }}
              className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${view === 'sources' && !activeSourceId ? 'bg-[var(--color-primary)] text-white' : 'text-slate-300 hover:bg-white/5'}`}
            >
              Tất cả nguồn
            </button>
            <button onClick={openCreate} title="Thêm nguồn" className="ml-2 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-lg font-bold">
              +
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {loading ? (
              <div className="text-slate-500 text-sm px-3 py-2">Đang tải...</div>
            ) : sources.length === 0 ? (
              <div className="text-slate-500 text-sm px-3 py-2">Chưa có nguồn nào</div>
            ) : (
              sources.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSource(s.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${activeSourceId === s.id ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${s.enabled ? 'bg-green-400' : 'bg-slate-500'}`} />
                  <span className="flex-1 truncate">{s.name}</span>
                </button>
              ))
            )}
          </nav>

          <div className="px-3 py-4 border-t border-white/10">
            <Link href="/admin/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
              ← Về Dashboard
            </Link>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 min-w-0 p-6">
          {showForm ? (
            <SourceFormPanel
              editing={editing}
              form={form}
              setForm={setForm}
              saving={saving}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
              onPreset={applyPreset}
            />
          ) : view === 'items' && activeSource ? (
            <SourceItemsPanel
              source={activeSource}
              notify={notify}
              getAuthHeaders={getAuthHeaders}
              onEditSource={() => openEdit(activeSource)}
            />
          ) : (
            <SourcesList
              sources={sources}
              loading={loading}
              onSelect={handleSelectSource}
              onAdd={openCreate}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          )}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-white/20 rounded-lg px-5 py-3 shadow-xl text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SOURCE FORM
// ─────────────────────────────────────────────
function SourceFormPanel({ editing, form, setForm, saving, onSave, onCancel, onPreset }: {
  editing: Source | null
  form: SourceForm
  setForm: React.Dispatch<React.SetStateAction<SourceForm>>
  saving: boolean
  onSave: () => void
  onCancel: () => void
  onPreset: () => void
}) {
  const set = (k: keyof SourceForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{editing ? 'Sửa nguồn' : 'Thêm nguồn mới'}</h2>
        <button onClick={onPreset} className="text-sm text-blue-400 hover:text-blue-300">
          Dùng preset Gamekot FC26
        </button>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tên nguồn" required>
            <input value={form.name} onChange={set('name')} className={inputCls} placeholder="Gamekot FC26" />
          </Field>
          <Field label="Base URL" required>
            <input value={form.base_url} onChange={set('base_url')} className={inputCls} placeholder="https://example.com" />
          </Field>
          <Field label="List URLs (mỗi dòng 1 URL)">
            <textarea value={form.list_urls} onChange={set('list_urls')} rows={3} className={inputCls} placeholder="https://example.com/category/..." />
          </Field>
          <Field label="Link pattern (regex lọc bài)">
            <input value={form.link_allow_pattern} onChange={set('link_allow_pattern')} className={inputCls} placeholder="^https://example\.com/..." />
          </Field>
          <Field label="Blocked slugs (mỗi dòng 1)">
            <textarea value={form.blocked_slugs} onChange={set('blocked_slugs')} rows={3} className={inputCls} />
          </Field>
          <Field label="Title selector">
            <input value={form.title_selector} onChange={set('title_selector')} className={inputCls} />
          </Field>
          <Field label="Image selector">
            <input value={form.image_selector} onChange={set('image_selector')} className={inputCls} />
          </Field>
          <Field label="Content selectors (mỗi dòng 1)">
            <textarea value={form.content_selectors} onChange={set('content_selectors')} rows={3} className={inputCls} placeholder=".entry-content p" />
          </Field>
          <Field label="Download selector">
            <input value={form.download_selector} onChange={set('download_selector')} className={inputCls} />
          </Field>
          <Field label="Download exclude selector">
            <input value={form.download_exclude_selector} onChange={set('download_exclude_selector')} className={inputCls} />
          </Field>
          <Field label="Download exclude pattern (regex)">
            <input value={form.download_exclude_pattern} onChange={set('download_exclude_pattern')} className={inputCls} placeholder="t\.me|telegram|example\.com" />
          </Field>
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm text-slate-300">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
          Kích hoạt nguồn
        </label>

        <div className="flex gap-3 mt-6">
          <button onClick={onSave} disabled={saving} className="px-4 py-2 bg-[var(--color-primary)] rounded-lg font-semibold hover:bg-[#b44c5c] disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10">
            Hủy
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// SOURCES LIST (default view)
// ─────────────────────────────────────────────
function SourcesList({ sources, loading, onSelect, onAdd, onEdit, onDelete, onToggle }: {
  sources: Source[]
  loading: boolean
  onSelect: (id: string) => void
  onAdd: () => void
  onEdit: (s: Source) => void
  onDelete: (s: Source) => void
  onToggle: (s: Source) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Danh sách nguồn ({sources.length})</h2>
        <button onClick={onAdd} className="px-4 py-2 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors">
          + Thêm nguồn
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 py-16 text-center">Đang tải...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          Chưa có nguồn nào. Nhấn &quot;Thêm nguồn&quot; hoặc dùng preset.
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.id} className="bg-[#111111] border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
              <button onClick={() => onSelect(s.id)} className="min-w-0 text-left flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{s.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs border ${s.enabled ? 'bg-green-500/10 text-green-400 border-green-500/40' : 'bg-slate-500/10 text-slate-400 border-slate-500/40'}`}>
                    {s.enabled ? 'Bật' : 'Tắt'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1 truncate">{s.base_url}</p>
                <p className="text-slate-500 text-xs mt-1">{s.list_urls?.length || 0} URL quét</p>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onSelect(s.id)} className="px-3 py-2 bg-[var(--color-primary)] rounded-lg text-sm hover:bg-[#b44c5c]">
                  Mở
                </button>
                <button onClick={() => onToggle(s)} className="px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10">
                  {s.enabled ? 'Tắt' : 'Bật'}
                </button>
                <button onClick={() => onEdit(s)} className="px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10">
                  Sửa
                </button>
                <button onClick={() => onDelete(s)} className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20">
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SOURCE ITEMS PANEL (chạy cào + duyệt bài)
// ─────────────────────────────────────────────
function SourceItemsPanel({ source, notify, getAuthHeaders, onEditSource }: {
  source: Source
  notify: (m: string) => void
  getAuthHeaders: () => Promise<Record<string, string> | null>
  onEditSource: () => void
}) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [running, setRunning] = useState(false)
  const [busy, setBusy] = useState(false)

  const fetchItems = async () => {
    const headers = await getAuthHeaders()
    if (!headers) return
    setLoading(true)
    const q = new URLSearchParams({ sourceId: source.id })
    if (statusFilter) q.set('status', statusFilter)
    const res = await fetch(`/api/admin/scraper/items?${q.toString()}`, { headers })
    if (res.ok) {
      const d = await res.json()
      setItems(d.items || [])
    }
    setLoading(false)
    setSelected(new Set())
  }

  useEffect(() => {
    void fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, source.id])

  const handleRun = async () => {
    if (running) return
    const headers = await getAuthHeaders()
    if (!headers) return
    setRunning(true)
    notify(`Đang cào "${source.name}"...`)
    try {
      const res = await fetch('/api/admin/scraper/run', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: source.id }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d.stats) {
        notify(`Xong: ${d.stats.new_items} bài mới, ${d.stats.duplicates} trùng, ${d.stats.failed} lỗi`)
        setStatusFilter('pending')
        void fetchItems()
      } else {
        notify('Lỗi: ' + (d.error || 'không xác định'))
      }
    } catch {
      notify('Lỗi kết nối khi chạy cào')
    } finally {
      setRunning(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map((i) => i.id)))
  }

  const batchAction = async (action: 'publish' | 'skip' | 'delete') => {
    if (selected.size === 0) return
    const headers = await getAuthHeaders()
    if (!headers) return
    setBusy(true)
    const res = await fetch('/api/admin/scraper/items', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids: [...selected] }),
    })
    setBusy(false)
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      if (action === 'publish' && d.summary) {
        notify(`Đã đăng ${d.summary.published}, trùng ${d.summary.duplicates}, lỗi ${d.summary.failed}`)
      } else {
        notify('Đã xong')
      }
      void fetchItems()
    } else {
      notify('Lỗi: ' + (d.error || 'không xác định'))
    }
  }

  const saveItemEdit = async () => {
    if (!editingItem) return
    const headers = await getAuthHeaders()
    if (!headers) return
    const res = await fetch(`/api/admin/scraper/items/${editingItem.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingItem.name,
        author: editingItem.author,
        category: editingItem.category,
        version: editingItem.version,
        description: editingItem.description,
        tags: editingItem.tags,
      }),
    })
    if (res.ok) {
      notify('Đã lưu bài')
      setEditingItem(null)
      void fetchItems()
    } else {
      const d = await res.json().catch(() => ({}))
      notify('Lỗi: ' + (d.error || 'không xác định'))
    }
  }

  return (
    <div>
      {/* Header nguồn */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold">{source.name}</h2>
          <p className="text-slate-400 text-sm mt-1">{source.base_url}</p>
          <p className="text-slate-500 text-xs mt-1">{source.list_urls?.length || 0} URL quét</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleRun} disabled={running} className="px-4 py-2 bg-[var(--color-primary)] font-semibold rounded-lg hover:bg-[#b44c5c] disabled:opacity-50">
            {running ? 'Đang cào...' : 'Cào dữ liệu'}
          </button>
          <button onClick={onEditSource} className="px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10">
            Cấu hình
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm"
        >
          <option value="pending">Chờ duyệt</option>
          <option value="published">Đã đăng</option>
          <option value="skipped">Đã bỏ qua</option>
          <option value="duplicate">Trùng</option>
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Đã chọn: {selected.size}</span>
          <button onClick={() => batchAction('publish')} disabled={selected.size === 0 || busy} className="px-3 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-40">
            Đăng chọn
          </button>
          <button onClick={() => batchAction('skip')} disabled={selected.size === 0 || busy} className="px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 disabled:opacity-40">
            Bỏ qua
          </button>
          <button onClick={() => batchAction('delete')} disabled={selected.size === 0 || busy} className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 disabled:opacity-40">
            Xóa
          </button>
          <button onClick={() => void fetchItems()} className="px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10">
            Làm mới
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-slate-400 py-16 text-center">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          Không có bài nào. Bấm &quot;Cào dữ liệu&quot; để bắt đầu.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-2 text-sm text-slate-400">
            <input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} />
            <span>Chọn tất cả ({items.length})</span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="bg-[#111111] border border-white/10 rounded-xl p-4 flex gap-4">
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="mt-1 shrink-0" />
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0 bg-black" />
              ) : (
                <div className="w-20 h-14 rounded-lg bg-white/5 shrink-0 flex items-center justify-center text-slate-600 text-xs">No img</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium leading-snug">{item.name}</p>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs border ${STATUS_COLORS[item.status] || STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{item.category}</span>
                  {(item.tags || []).map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-white/5 rounded text-xs text-slate-400">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>{item.version}</span>
                  {item.download_url && (
                    <a href={item.download_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 truncate max-w-[220px]">
                      {item.download_url}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 items-end">
                <button onClick={() => setEditingItem(item)} className="px-3 py-1.5 bg-white/5 rounded text-sm hover:bg-white/10">
                  Sửa
                </button>
                <a href={item.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-blue-400 text-sm hover:text-blue-300">
                  Gốc ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-[#1a1a1a] border border-white/15 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Sửa bài trước khi đăng</h3>
            <div className="space-y-3">
              <Field label="Tên">
                <input value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <input value={editingItem.category} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Version">
                  <input value={editingItem.version} onChange={(e) => setEditingItem({ ...editingItem, version: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <Field label="Author">
                <input value={editingItem.author} onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Tags (phân cách bằng dấu phẩy)">
                <input value={(editingItem.tags || []).join(', ')} onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} className={inputCls} />
              </Field>
              <Field label="Mô tả ngắn">
                <textarea value={editingItem.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} rows={3} className={inputCls} />
              </Field>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveItemEdit} className="px-4 py-2 bg-[var(--color-primary)] rounded-lg font-semibold hover:bg-[#b44c5c]">
                Lưu
              </button>
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Shared UI helpers
// ─────────────────────────────────────────────
const inputCls = 'w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400 mb-1 block">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {children}
    </label>
  )
}
