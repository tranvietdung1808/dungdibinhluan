'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

const CATEGORIES = ['All-in-One', 'Faces', 'Kits', 'Gameplay', 'Đồ họa', 'Cơ chế game'] as const
const VALID_ROLES = ['admin', 'vip', 'moderator', 'user'] as const

// ── Membership types ──
interface MembershipPlan {
  id: string
  name: string
  description: string | null
  price: number
  duration_days: number
  features: string[]
  is_active: boolean
  sort_order: number
}

interface SubscriptionEntry {
  id: string
  user_id: string
  user_email: string
  plan_id: string
  status: 'active' | 'expired' | 'cancelled'
  starts_at: string
  expires_at: string
  granted_by: string | null
  note: string | null
  membership_plans: { id: string; name: string; duration_days: number } | null
}

const initialPlanForm = {
  id: '',
  name: '',
  description: '',
  price: 0,
  duration_days: 30,
  features: '',   // nhập dạng mỗi dòng 1 quyền lợi, split khi submit
  is_active: false,
  sort_order: 0,
}

interface ModForm {
  name: string
  author: string
  category: string
  version: string
  updatedAt: string
  description: string
  longDescription: string
  thumbnail: string
  downloadUrl: string
  tags: string
  thumbnailOrientation: 'portrait' | 'landscape'
  featured: boolean
  videoId: string
}

interface UserRoleEntry {
  id: string
  email: string
  roles: string[]
  roleNames: string[]
  roleEntryId?: string
  note: string | null
  created_at: string
  last_sign_in: string | null
}

interface MemberForm {
  email: string
  role: string
  note: string
}

const initialModForm: ModForm = {
  name: '',
  author: '',
  category: 'Faces',
  version: '',
  updatedAt: new Date().toISOString().split('T')[0],
  description: '',
  longDescription: '',
  thumbnail: '',
  downloadUrl: '',
  tags: '',
  thumbnailOrientation: 'portrait',
  featured: false,
  videoId: '',
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim()
}

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

export default function AdminDashboard() {
  // ── Mod form state ──
  const [modOpen, setModOpen] = useState(false)
  const [form, setForm] = useState<ModForm>(initialModForm)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [modLoading, setModLoading] = useState(false)
  const [modError, setModError] = useState('')

  // ── Membership management state ──
  const [membershipOpen, setMembershipOpen] = useState(false)
  const [plansOpen, setPlansOpen] = useState(false)
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntry[]>([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [subsError, setSubsError] = useState('')
  const [subsSearch, setSubsSearch] = useState('')
  const [grantForm, setGrantForm] = useState({ email: '', planId: '', note: '' })
  const [grantSubmitting, setGrantSubmitting] = useState(false)
  const [planForm, setPlanForm] = useState(initialPlanForm)
  const [planFormOpen, setPlanFormOpen] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [plansError, setPlansError] = useState('')
  const [planSubmitting, setPlanSubmitting] = useState(false)

  // ── Member management state ──
  const [memberOpen, setMemberOpen] = useState(false)
  const [roles, setRoles] = useState<UserRoleEntry[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState('')
  const [memberForm, setMemberForm] = useState<MemberForm>({ email: '', role: 'vip', note: '' })
  const [memberSubmitting, setMemberSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState('')

  const [toast, setToast] = useState('')
  const [pendingCommentsCount, setPendingCommentsCount] = useState(0)
  const blobUrlRef = useRef<string | null>(null)

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
  }
  useEffect(() => () => revokeBlobUrl(), [])

  // ── Toast ──
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t) }
  }, [toast])

  // ── Auth helper ──
  const getAuthHeaders = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return null
    return { Authorization: `Bearer ${token}` }
  }, [])

  // ── Fetch pending comments ──
  const fetchPendingCommentsCount = async () => {
    const headers = await getAuthHeaders()
    if (!headers) return
    try {
      const res = await fetch('/api/admin/pending-comments', { headers })
      if (res.ok) {
        const d = await res.json()
        setPendingCommentsCount(d.count || 0)
      }
    } catch { /* ignore */ }
  }
  useEffect(() => { fetchPendingCommentsCount() }, [])

  // ── Fetch roles ──
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true)
    setRolesError('')
    const headers = await getAuthHeaders()
    if (!headers) { setRolesLoading(false); return }
    try {
      const res = await fetch('/api/admin/roles', { headers })
      if (res.ok) {
        const d = await res.json()
        setRoles(d || [])
      } else {
        setRolesError('Không tải được danh sách member')
      }
    } catch {
      setRolesError('Lỗi kết nối')
    } finally {
      setRolesLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    if (memberOpen) fetchRoles()
  }, [memberOpen, fetchRoles])

  // ── Mod form helpers ──
  const handleChange = (field: keyof ModForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    revokeBlobUrl()
    const localUrl = URL.createObjectURL(file)
    blobUrlRef.current = localUrl
    setThumbnailPreview(localUrl)
    setForm(prev => ({ ...prev, thumbnail: '' }))
    setIsUploadingThumbnail(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const d = await res.json()
        if (d?.url) setForm(prev => ({ ...prev, thumbnail: d.url }))
      } else {
        const ed = await res.json().catch(() => ({}))
        setModError('Upload failed: ' + (ed.error || res.statusText))
      }
    } catch (err) {
      setModError('Upload failed: ' + err)
    } finally {
      setIsUploadingThumbnail(false)
      e.target.value = ''
    }
  }

  const handleModSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setModLoading(true)
    setModError('')
    if (!form.name || !form.author || !form.version || !form.updatedAt) {
      setModError('Vui lòng điền đầy đủ các trường bắt buộc')
      setModLoading(false)
      return
    }
    const slug = generateSlug(form.name)
    const tags = form.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    try {
      const res = await fetch('/api/admin/mods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, name: form.name, author: form.author, category: form.category,
          version: form.version, updated_at: formatDateForDisplay(form.updatedAt),
          description: form.description, long_description: form.longDescription,
          thumbnail: form.thumbnail || null, download_url: form.downloadUrl || null,
          tags, thumbnail_orientation: form.thumbnailOrientation,
          featured: form.featured, video_id: form.videoId || null,
        }),
      })
      const d = await res.json()
      if (res.ok && d.success) {
        setToast('Thêm mod thành công!')
        setForm({ ...initialModForm, updatedAt: new Date().toISOString().split('T')[0] })
        setThumbnailPreview(null)
        revokeBlobUrl()
        setModOpen(false)
      } else {
        setModError(d.error || 'Có lỗi xảy ra khi thêm mod')
      }
    } catch {
      setModError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setModLoading(false)
    }
  }

  // ── Member CRUD ──
  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = memberForm.email.trim().toLowerCase()
    if (!email) { setRolesError('Email là bắt buộc'); return }
    if (!VALID_ROLES.includes(memberForm.role as any)) { setRolesError('Role không hợp lệ'); return }
    setMemberSubmitting(true)
    setRolesError('')
    const headers = await getAuthHeaders()
    if (!headers) { setRolesError('Không xác thực được'); setMemberSubmitting(false); return }
    try {
      if (editingId) {
        // Update existing
        const res = await fetch('/api/admin/roles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ id: editingId, role: memberForm.role, note: memberForm.note }),
        })
        if (!res.ok) { const d = await res.json().catch(() => ({})); setRolesError(d.error || 'Cập nhật thất bại'); return }
        setToast('Đã cập nhật role!')
      } else {
        // Add new
        const res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ email, role: memberForm.role, note: memberForm.note }),
        })
        if (!res.ok) { const d = await res.json().catch(() => ({})); setRolesError(d.error || 'Thêm thất bại'); return }
        setToast('Đã thêm role!')
      }
      setMemberForm({ email: '', role: 'vip', note: '' })
      setEditingId(null)
      await fetchRoles()
    } catch {
      setRolesError('Lỗi kết nối')
    } finally {
      setMemberSubmitting(false)
    }
  }

  const handleEditRole = (entry: UserRoleEntry) => {
    if (entry.roleEntryId) {
      setEditingId(entry.roleEntryId)
    }
    setMemberForm({ email: entry.email, role: entry.roleNames[0] || 'vip', note: entry.note || '' })
  }

  const handleDeleteRole = async (entry: UserRoleEntry) => {
    if (!entry.roleEntryId) return
    if (!window.confirm(`Bạn có chắc muốn xóa role "${entry.roleNames[0]}" của ${entry.email}?`)) return
    const headers = await getAuthHeaders()
    if (!headers) return
    try {
      const res = await fetch(`/api/admin/roles?id=${entry.roleEntryId}`, { method: 'DELETE', headers })
      if (res.ok) {
        setToast('Đã xóa role!')
        await fetchRoles()
      } else {
        const d = await res.json().catch(() => ({}))
        setRolesError(d.error || 'Xóa thất bại')
      }
    } catch {
      setRolesError('Lỗi kết nối')
    }
  }

  const handleBulkSync = async () => {
    if (!window.confirm('Đồng bộ tất cả người dùng chưa có role thành "user"? Việc này có thể mất vài giây.')) return
    setRolesLoading(true)
    setRolesError('')
    const headers = await getAuthHeaders()
    if (!headers) { setRolesLoading(false); return }
    try {
      const res = await fetch('/api/admin/roles/sync', { method: 'POST', headers })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setToast(`Đã đồng bộ! Thêm ${d.added || 0} role, bỏ qua ${d.skipped || 0}`)
        await fetchRoles()
      } else {
        setRolesError(d.error || 'Đồng bộ thất bại')
      }
    } catch {
      setRolesError('Lỗi kết nối')
    } finally {
      setRolesLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setMemberForm({ email: '', role: 'vip', note: '' })
  }

  // ── Membership: fetch plans ──
  const fetchPlans = useCallback(async () => {
    setPlansLoading(true)
    setPlansError('')
    const headers = await getAuthHeaders()
    if (!headers) { setPlansLoading(false); return }
    try {
      const res = await fetch('/api/admin/plans', { headers })
      if (res.ok) {
        const d = await res.json()
        setPlans(d.plans || [])
      } else {
        setPlansError('Không tải được danh sách gói')
      }
    } catch { setPlansError('Lỗi kết nối') }
    finally { setPlansLoading(false) }
  }, [getAuthHeaders])

  // ── Membership: fetch subscriptions ──
  const fetchSubscriptions = useCallback(async () => {
    setSubsLoading(true)
    setSubsError('')
    const headers = await getAuthHeaders()
    if (!headers) { setSubsLoading(false); return }
    try {
      const res = await fetch('/api/admin/memberships', { headers })
      if (res.ok) {
        const d = await res.json()
        setSubscriptions(d.subscriptions || [])
      } else {
        setSubsError('Không tải được danh sách subscription')
      }
    } catch { setSubsError('Lỗi kết nối') }
    finally { setSubsLoading(false) }
  }, [getAuthHeaders])

  useEffect(() => {
    if (membershipOpen) { void fetchSubscriptions(); void fetchPlans() }
  }, [membershipOpen, fetchSubscriptions, fetchPlans])

  useEffect(() => {
    if (plansOpen && plans.length === 0) void fetchPlans()
  }, [plansOpen, plans.length, fetchPlans])

  // Grant membership thủ công
  const handleGrantMembership = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grantForm.email || !grantForm.planId) { setSubsError('Cần nhập email và chọn gói'); return }
    setGrantSubmitting(true)
    setSubsError('')
    const headers = await getAuthHeaders()
    if (!headers) { setGrantSubmitting(false); return }
    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(grantForm),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setToast(`Đã grant membership cho ${grantForm.email}!`)
        setGrantForm({ email: '', planId: '', note: '' })
        await fetchSubscriptions()
      } else {
        setSubsError(d.error || 'Grant thất bại')
      }
    } catch { setSubsError('Lỗi kết nối') }
    finally { setGrantSubmitting(false) }
  }

  // Thu hồi membership
  const handleRevokeSub = async (sub: SubscriptionEntry) => {
    if (!window.confirm(`Thu hồi membership của ${sub.user_email}?`)) return
    const headers = await getAuthHeaders()
    if (!headers) return
    const res = await fetch(`/api/admin/memberships/${sub.id}`, { method: 'DELETE', headers })
    if (res.ok) { setToast('Đã thu hồi!'); await fetchSubscriptions() }
    else { const d = await res.json().catch(() => ({})); setSubsError(d.error || 'Thất bại') }
  }

  // Tạo / sửa plan
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planForm.id || !planForm.name) { setPlansError('Cần nhập ID và tên gói'); return }
    setPlanSubmitting(true)
    setPlansError('')
    const headers = await getAuthHeaders()
    if (!headers) { setPlanSubmitting(false); return }

    const features = planForm.features
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0)

    try {
      if (editingPlanId) {
        const res = await fetch(`/api/admin/plans?id=${encodeURIComponent(editingPlanId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ ...planForm, features }),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) { setPlansError(d.error || 'Cập nhật thất bại'); return }
        setToast('Đã cập nhật gói!')
      } else {
        const res = await fetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ ...planForm, features }),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) { setPlansError(d.error || 'Tạo thất bại'); return }
        setToast('Đã tạo gói mới!')
      }
      setPlanForm(initialPlanForm)
      setEditingPlanId(null)
      setPlanFormOpen(false)
      await fetchPlans()
    } catch { setPlansError('Lỗi kết nối') }
    finally { setPlanSubmitting(false) }
  }

  const handleEditPlan = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id)
    setPlanForm({
      id: plan.id,
      name: plan.name,
      description: plan.description ?? '',
      price: plan.price,
      duration_days: plan.duration_days,
      features: plan.features.join('\n'),
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    })
    setPlanFormOpen(true)
  }

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm(`Xóa gói "${planId}"?`)) return
    const headers = await getAuthHeaders()
    if (!headers) return
    const res = await fetch(`/api/admin/plans?id=${encodeURIComponent(planId)}`, { method: 'DELETE', headers })
    const d = await res.json().catch(() => ({}))
    if (res.ok) { setToast('Đã xóa gói!'); await fetchPlans() }
    else { setPlansError(d.error || 'Xóa thất bại') }
  }

  const filteredRoles = memberSearch
    ? roles.filter(r => {
        const search = memberSearch.toLowerCase()
        return r.email.includes(search) || r.roleNames.some(rn => rn.includes(search))
      })
    : roles

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'vip': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'moderator': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-6 py-3 bg-green-500/90 text-white rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#111111] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">← Trang chủ</Link>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <Link href="/admin/mods" className="px-4 py-2 bg-[#111111] border border-white/10 text-sm rounded-lg hover:bg-white/10 transition-colors">
            Quản lý Mods
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Quick Actions Grid ── */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Truy cập nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Quản lý bài viết */}
            <Link href="/admin/guides" className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[var(--color-primary)]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--color-primary)]/30 transition-colors">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Quản lý bài viết</h3>
                  <p className="text-slate-400 text-sm">Tạo và sửa bài hướng dẫn</p>
                </div>
              </div>
              <div className="flex items-center text-[var(--color-primary)] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">Quản lý ngay</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* Generate Code */}
            <Link href="/admin/generate" className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[var(--color-primary)]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--color-primary)]/30 transition-colors">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Generate Code</h3>
                  <p className="text-slate-400 text-sm">Tạo code unlock</p>
                </div>
              </div>
              <div className="flex items-center text-[var(--color-primary)] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">Tạo ngay</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* Quản lý Mods List */}
            <Link href="/admin/mods" className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[var(--color-primary)]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--color-primary)]/30 transition-colors">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Danh sách Mods</h3>
                  <p className="text-slate-400 text-sm">Xem, sửa, xóa mods</p>
                </div>
              </div>
              <div className="flex items-center text-[var(--color-primary)] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">Xem danh sách</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* Kiểm duyệt bình luận */}
            <Link href="/admin/community" className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[var(--color-primary)]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--color-primary)]/30 transition-colors">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">Kiểm duyệt bình luận</h3>
                    {pendingCommentsCount > 0 && (
                      <span className="px-2 py-1 text-xs font-bold text-white bg-[var(--color-primary)] rounded-full">{pendingCommentsCount}</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm">Duyệt comment bài viết và chia sẻ mod</p>
                </div>
              </div>
              <div className="flex items-center text-[var(--color-primary)] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">Mở kiểm duyệt</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            {/* ── Quản lý Member (NEW) ── */}
            <button
              onClick={() => setMemberOpen(!memberOpen)}
              className={`group bg-[#111111] border rounded-xl p-6 text-left transition-all duration-300 ${memberOpen ? 'border-[var(--color-primary)]/50 shadow-[0_8px_32px_rgba(206,90,103,0.15)]' : 'border-white/10 hover:border-[var(--color-primary)]/50 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]'}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--color-primary)]/30 transition-colors">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Quản lý Member</h3>
                  <p className="text-slate-400 text-sm">Thêm, sửa, xóa quyền member</p>
                </div>
              </div>
              <div className="flex items-center text-[var(--color-primary)] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">{memberOpen ? 'Đóng' : 'Mở'}</span>
                <svg className={`w-4 h-4 ml-1 transition-transform ${memberOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>

            {/* ── Membership (VIP) ── */}
            <button
              onClick={() => setMembershipOpen(!membershipOpen)}
              className={`group bg-[#111111] border rounded-xl p-6 text-left transition-all duration-300 ${membershipOpen ? 'border-amber-500/50 shadow-[0_8px_32px_rgba(245,158,11,0.15)]' : 'border-white/10 hover:border-amber-500/50 hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)]'}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Membership VIP</h3>
                  <p className="text-slate-400 text-sm">Quản lý gói & grant VIP cho user</p>
                </div>
              </div>
              <div className="flex items-center text-amber-400 group-hover:text-amber-300 transition-colors">
                <span className="text-sm font-medium">{membershipOpen ? 'Đóng' : 'Mở'}</span>
                <svg className={`w-4 h-4 ml-1 transition-transform ${membershipOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>

            {/* ── Thêm Mod (collapsible) ── */}
            <button
              onClick={() => setModOpen(!modOpen)}
              className={`group bg-[#111111] border rounded-xl p-6 text-left transition-all duration-300 ${modOpen ? 'border-[var(--color-primary)]/50 shadow-[0_8px_32px_rgba(206,90,103,0.15)]' : 'border-white/10 hover:border-[var(--color-primary)]/50 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]'}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--color-primary)]/30 transition-colors">
                  <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Thêm Mod mới</h3>
                  <p className="text-slate-400 text-sm">Tạo mod mới với đầy đủ thông tin</p>
                </div>
              </div>
              <div className="flex items-center text-[var(--color-primary)] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">{modOpen ? 'Đóng' : 'Mở form'}</span>
                <svg className={`w-4 h-4 ml-1 transition-transform ${modOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          </div>
        </section>

        {/* ── Member Management Panel ── */}
        {memberOpen && (
          <section className="mb-12 border border-[var(--color-primary)]/20 rounded-2xl bg-[#111117] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Quản lý Member &amp; Phân quyền</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBulkSync}
                  disabled={rolesLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 border border-white/15 rounded-lg hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                  {rolesLoading ? 'Đang đồng bộ...' : '🔄 Đồng bộ tất cả'}
                </button>
                <button
                  onClick={() => { setMemberOpen(false); setEditingId(null); setMemberForm({ email: '', role: 'vip', note: '' }) }}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕ Đóng
                </button>
              </div>
            </div>

            {/* Add / Edit form */}
            <form onSubmit={handleMemberSubmit} className="mb-6 p-4 rounded-xl border border-white/10 bg-[#0d0d13]">
              <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
                {editingId ? '✏️ Sửa role' : '➕ Thêm role mới'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    value={memberForm.email}
                    onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))}
                    disabled={!!editingId}
                    className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
                    placeholder="user@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Role *</label>
                  <select
                    value={memberForm.role}
                    onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ghi chú</label>
                  <input
                    type="text"
                    value={memberForm.note}
                    onChange={e => setMemberForm(p => ({ ...p, note: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)]"
                    placeholder="VD: VIP đến 31/12/2026"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={memberSubmitting}
                    className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:bg-[#b44c5c] disabled:opacity-50 transition-colors"
                  >
                    {memberSubmitting ? '...' : editingId ? 'Cập nhật' : 'Thêm'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={handleCancelEdit} className="px-4 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-lg hover:bg-white/10 transition-colors">
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Tìm kiếm theo email hoặc role..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="w-full max-w-md px-4 py-2 bg-[#0d0d13] border border-white/10 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            {/* Error */}
            {rolesError && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300">{rolesError}</div>
            )}

            {/* Roles table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0d0d13]">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Ghi chú</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Đăng nhập cuối</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rolesLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Đang tải...</td></tr>
                  ) : filteredRoles.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa có người dùng nào đăng ký</td></tr>
                  ) : (
                    filteredRoles.map(entry => {
                      const hasRoles = entry.roleNames.length > 0
                      return (
                      <tr key={`${entry.id}-${entry.roleNames.join('-') || 'none'}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{entry.email}</td>
                        <td className="px-4 py-3">
                          {hasRoles ? (
                            entry.roleNames.map(r => (
                              <span key={r} className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mr-1 ${roleBadgeColor(r)}`}>
                                {r.toUpperCase()}
                              </span>
                            ))
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-500/10 text-slate-500 border-slate-500/20">
                              CHƯA PHÂN QUYỀN
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell max-w-[200px] truncate">{entry.note || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                          {entry.last_sign_in ? new Date(entry.last_sign_in).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasRoles && (
                              <button
                                onClick={() => handleEditRole(entry)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors"
                              >
                                Sửa
                              </button>
                            )}
                            {hasRoles && (
                              <button
                                onClick={() => handleDeleteRole(entry)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                              >
                                Xóa
                              </button>
                            )}
                            {!hasRoles && (
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setMemberForm({ email: entry.email, role: 'vip', note: '' })
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
                              >
                                + Thêm role
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-600">Hiển thị {filteredRoles.length}/{roles.length} member</p>
          </section>
        )}

        {/* ── Membership VIP Panel ── */}
        {membershipOpen && (
          <section className="mb-12 border border-amber-500/20 rounded-2xl bg-[#111117] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-amber-400">Membership VIP</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlansOpen(!plansOpen)}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors"
                >
                  {plansOpen ? 'Ẩn quản lý gói' : 'Quản lý gói membership'}
                </button>
                <button onClick={() => setMembershipOpen(false)} className="text-slate-400 hover:text-white text-sm">✕ Đóng</button>
              </div>
            </div>

            {/* ── Quản lý gói (plans) ── */}
            {plansOpen && (
              <div className="mb-8 p-4 rounded-xl border border-amber-500/20 bg-[#0d0d13]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Quản lý gói membership</h3>
                  <button
                    onClick={() => { setEditingPlanId(null); setPlanForm(initialPlanForm); setPlanFormOpen(!planFormOpen) }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-500/80 rounded-lg hover:bg-amber-500 transition-colors"
                  >
                    {planFormOpen ? 'Hủy' : '+ Tạo gói mới'}
                  </button>
                </div>

                {/* Form tạo/sửa plan */}
                {planFormOpen && (
                  <form onSubmit={handlePlanSubmit} className="mb-5 p-4 rounded-lg border border-white/10 bg-[#111117]">
                    <h4 className="text-xs font-bold text-slate-300 mb-3">{editingPlanId ? '✏️ Sửa gói' : '➕ Tạo gói mới'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">ID gói * (vd: vip-1month)</label>
                        <input
                          type="text"
                          value={planForm.id}
                          onChange={e => setPlanForm(p => ({ ...p, id: e.target.value }))}
                          disabled={!!editingPlanId}
                          className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          placeholder="vip-1month"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Tên gói * (vd: VIP 1 Tháng)</label>
                        <input
                          type="text"
                          value={planForm.name}
                          onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                          placeholder="VIP 1 Tháng"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Giá (VND)</label>
                        <input
                          type="number"
                          min={0}
                          value={planForm.price}
                          onChange={e => setPlanForm(p => ({ ...p, price: Number(e.target.value) }))}
                          className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Thời hạn (ngày)</label>
                        <input
                          type="number"
                          min={1}
                          value={planForm.duration_days}
                          onChange={e => setPlanForm(p => ({ ...p, duration_days: Number(e.target.value) }))}
                          className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 mb-1">Mô tả</label>
                        <input
                          type="text"
                          value={planForm.description}
                          onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                          placeholder="Mô tả ngắn về gói"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 mb-1">Quyền lợi (mỗi dòng 1 quyền lợi)</label>
                        <textarea
                          value={planForm.features}
                          onChange={e => setPlanForm(p => ({ ...p, features: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
                          placeholder={'Tải mods VIP không giới hạn\nXem bài viết độc quyền'}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={planForm.is_active} onChange={e => setPlanForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                          <span className="text-sm text-slate-300">Đang mở bán</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Thứ tự hiển thị</label>
                        <input
                          type="number"
                          value={planForm.sort_order}
                          onChange={e => setPlanForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
                          className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    {plansError && <div className="mb-3 text-xs text-red-400">{plansError}</div>}
                    <button type="submit" disabled={planSubmitting} className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors">
                      {planSubmitting ? '...' : editingPlanId ? 'Cập nhật gói' : 'Tạo gói'}
                    </button>
                  </form>
                )}

                {/* Danh sách plans */}
                {plansLoading ? (
                  <p className="text-sm text-slate-500">Đang tải gói...</p>
                ) : plans.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có gói nào. Tạo gói mới ở trên.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-[#0d0d13]">
                          <th className="text-left px-3 py-2 text-xs font-bold text-slate-400 uppercase">Gói</th>
                          <th className="text-left px-3 py-2 text-xs font-bold text-slate-400 uppercase">Giá</th>
                          <th className="text-left px-3 py-2 text-xs font-bold text-slate-400 uppercase">Thời hạn</th>
                          <th className="text-left px-3 py-2 text-xs font-bold text-slate-400 uppercase">Quyền lợi</th>
                          <th className="text-left px-3 py-2 text-xs font-bold text-slate-400 uppercase">Trạng thái</th>
                          <th className="text-right px-3 py-2 text-xs font-bold text-slate-400 uppercase">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans.map(plan => (
                          <tr key={plan.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-3 py-2">
                              <div className="font-mono text-xs text-slate-300">{plan.id}</div>
                              <div className="text-sm text-white">{plan.name}</div>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-300">{plan.price.toLocaleString('vi-VN')}đ</td>
                            <td className="px-3 py-2 text-xs text-slate-300">{plan.duration_days} ngày</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {plan.features.map(f => (
                                  <span key={f} className="px-1.5 py-0.5 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full">{f}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {plan.is_active ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">ACTIVE</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">ẨN</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => handleEditPlan(plan)} className="px-2.5 py-1 text-[11px] font-semibold text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-colors">Sửa</button>
                                <button onClick={() => handleDeletePlan(plan.id)} className="px-2.5 py-1 text-[11px] font-semibold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">Xóa</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Grant membership ── */}
            <form onSubmit={handleGrantMembership} className="mb-6 p-4 rounded-xl border border-white/10 bg-[#0d0d13]">
              <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">➕ Grant membership cho user</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    value={grantForm.email}
                    onChange={e => setGrantForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="user@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Gói *</label>
                  <select
                    value={grantForm.planId}
                    onChange={e => setGrantForm(p => ({ ...p, planId: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Chọn gói...</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ghi chú</label>
                  <input
                    type="text"
                    value={grantForm.note}
                    onChange={e => setGrantForm(p => ({ ...p, note: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="VD: Tặng 1 tháng"
                  />
                </div>
                <button type="submit" disabled={grantSubmitting} className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors">
                  {grantSubmitting ? '...' : 'Grant'}
                </button>
              </div>
            </form>

            {/* ── Search subscriptions ── */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Tìm theo email hoặc gói..."
                value={subsSearch}
                onChange={e => setSubsSearch(e.target.value)}
                className="w-full max-w-md px-4 py-2 bg-[#0d0d13] border border-white/10 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {subsError && <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300">{subsError}</div>}

            {/* ── Subscriptions table ── */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0d0d13]">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Gói</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase hidden md:table-cell">Hết hạn</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase hidden md:table-cell">Ghi chú</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {subsLoading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Đang tải...</td></tr>
                  ) : subscriptions.filter(s =>
                      !subsSearch ||
                      s.user_email.toLowerCase().includes(subsSearch.toLowerCase()) ||
                      s.membership_plans?.name.toLowerCase().includes(subsSearch.toLowerCase())
                    ).length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Chưa có subscription nào</td></tr>
                  ) : (
                    subscriptions.filter(s =>
                      !subsSearch ||
                      s.user_email.toLowerCase().includes(subsSearch.toLowerCase()) ||
                      s.membership_plans?.name.toLowerCase().includes(subsSearch.toLowerCase())
                    ).map(sub => (
                      <tr key={sub.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{sub.user_email}</td>
                        <td className="px-4 py-3 text-xs text-amber-300">{sub.membership_plans?.name ?? sub.plan_id}</td>
                        <td className="px-4 py-3">
                          {sub.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">ACTIVE</span>
                          ) : sub.status === 'expired' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">EXPIRED</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">CANCELLED</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                          {new Date(sub.expires_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell max-w-[150px] truncate">{sub.note || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleRevokeSub(sub)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              Thu hồi
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Add Mod Panel (collapsible) ── */}
        {modOpen && (
          <section className="mb-12 border border-[var(--color-primary)]/20 rounded-2xl bg-[#111117] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Thêm Mod mới</h2>
                <p className="text-sm text-slate-400 mt-1">Slug sẽ được tự động tạo từ tên mod</p>
              </div>
              <button onClick={() => setModOpen(false)} className="text-slate-400 hover:text-white text-sm">✕ Đóng</button>
            </div>

            <form onSubmit={handleModSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Tên mod *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })) }}
                  className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  placeholder="MIX MODS FC 26"
                  required
                />
                {form.name && <p className="text-xs text-slate-500 mt-1">Slug: {generateSlug(form.name)}</p>}
              </div>

              {/* Author + Category + Version */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Author *</label>
                  <input type="text" value={form.author} onChange={(e) => handleChange('author', e.target.value)} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)]" placeholder="DungDiBinhLuan" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Category *</label>
                  <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--color-primary)]">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Version *</label>
                  <input type="text" value={form.version} onChange={(e) => handleChange('version', e.target.value)} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)]" placeholder="v1.0" required />
                </div>
              </div>

              {/* Updated At + Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Updated At *</label>
                  <input type="date" value={form.updatedAt} onChange={(e) => handleChange('updatedAt', e.target.value)} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--color-primary)]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Tags (comma-separated)</label>
                  <input type="text" value={form.tags} onChange={(e) => handleChange('tags', e.target.value)} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)]" placeholder="Faces, Kits, Gameplay" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] resize-none" placeholder="Mô tả ngắn..." />
              </div>

              {/* Long Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Long Description</label>
                <textarea value={form.longDescription} onChange={(e) => handleChange('longDescription', e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)] resize-none" placeholder="Mô tả chi tiết..." />
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Thumbnail</label>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="px-4 py-2 bg-[#111111] border border-white/10 text-white text-sm rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                      {isUploadingThumbnail ? 'Đang upload...' : 'Chọn ảnh'}
                      <input type="file" accept="image/*" onChange={handleThumbnailChange} disabled={isUploadingThumbnail} className="hidden" />
                    </label>
                    {blobUrlRef.current && (
                      <button type="button" onClick={() => { revokeBlobUrl(); setThumbnailPreview(null); setForm(prev => ({ ...prev, thumbnail: '' })) }} className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors">Xóa ảnh upload</button>
                    )}
                  </div>
                  <input type="text" value={form.thumbnail} onChange={(e) => { setForm(prev => ({ ...prev, thumbnail: e.target.value })); if (!blobUrlRef.current) setThumbnailPreview(e.target.value || null) }} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)]" placeholder="/mods/thumbnail.jpg hoặc URL" />
                  {thumbnailPreview && (
                    <div className="relative w-full max-w-sm aspect-video bg-[#111111] border border-white/10 rounded-lg overflow-hidden">
                      <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Download URL */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Download URL</label>
                <input type="url" value={form.downloadUrl} onChange={(e) => handleChange('downloadUrl', e.target.value)} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)]" placeholder="https://drive.google.com/..." />
              </div>

              {/* Orientation + Featured + Video */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Orientation</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="thumbOrient" value="portrait" checked={form.thumbnailOrientation === 'portrait'} onChange={() => handleChange('thumbnailOrientation', 'portrait')} className="w-4 h-4 accent-[var(--color-primary)]" /><span className="text-sm">Portrait</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="thumbOrient" value="landscape" checked={form.thumbnailOrientation === 'landscape'} onChange={() => handleChange('thumbnailOrientation', 'landscape')} className="w-4 h-4 accent-[var(--color-primary)]" /><span className="text-sm">Landscape</span></label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Options</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2"><input type="checkbox" checked={form.featured} onChange={(e) => handleChange('featured', e.target.checked)} className="w-4 h-4 accent-[var(--color-primary)]" /><span className="text-sm">Featured</span></label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Video ID</label>
                  <input type="text" value={form.videoId} onChange={(e) => handleChange('videoId', e.target.value)} className="w-full px-4 py-2.5 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[var(--color-primary)]" placeholder="Vimeo ID" />
                </div>
              </div>

              {/* Error */}
              {modError && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300">{modError}</div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={modLoading} className="px-6 py-2.5 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[#b44c5c] disabled:opacity-50 transition-colors">
                  {modLoading ? 'Đang lưu...' : 'Lưu mod'}
                </button>
                <button type="button" onClick={() => setModOpen(false)} className="px-6 py-2.5 bg-[#111111] border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">Hủy</button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
