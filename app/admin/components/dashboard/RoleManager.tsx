'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  adminFetch,
  adminFetchJson,
  adminErrorMessage,
  isAdminAuthError,
} from '../admin-api'
import { useAdminToast } from '../AdminShell'
import { AdminTable, AdminThead, AdminTh, AdminTr, AdminTd } from '../AdminTable'
import { ConfirmDialog } from '../ConfirmDialog'
import { Badge, Button, ErrorState, Field, InlineNotice, Spinner, inputClass } from '@/app/components/ui'

// =====================================================
// RoleManager — quản lý thành viên & phân quyền (§16.8)
// Email · roles · ghi chú · thao tác. Xóa role nêu rõ loại
// role, không phải xóa tài khoản.
// =====================================================

const VALID_ROLES = ['admin', 'vip', 'moderator', 'user'] as const
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  vip: 'VIP',
  moderator: 'Kiểm duyệt',
  user: 'Thành viên',
}
const ROLE_TONES: Record<string, 'danger' | 'credit' | 'violet' | 'neutral'> = {
  admin: 'danger',
  vip: 'credit',
  moderator: 'violet',
  user: 'neutral',
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

const emptyMemberForm = { email: '', role: 'vip', note: '' }

export function RoleManager() {
  const toast = useAdminToast()
  const [roles, setRoles] = useState<UserRoleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authFailed, setAuthFailed] = useState(false)
  const [search, setSearch] = useState('')
  const [memberForm, setMemberForm] = useState(emptyMemberForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserRoleEntry | null>(null)
  const [syncConfirm, setSyncConfirm] = useState(false)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetchJson<UserRoleEntry[]>('/api/admin/roles')
      setRoles(data || [])
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Chưa tải được danh sách thành viên'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRoles()
  }, [fetchRoles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = memberForm.email.trim().toLowerCase()
    if (!email) {
      setFormError('Email là bắt buộc')
      return
    }
    if (!VALID_ROLES.includes(memberForm.role as (typeof VALID_ROLES)[number])) {
      setFormError('Role không hợp lệ')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      if (editingId) {
        await adminFetch('/api/admin/roles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, role: memberForm.role, note: memberForm.note }),
        })
        toast('Đã cập nhật role')
      } else {
        await adminFetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role: memberForm.role, note: memberForm.note }),
        })
        toast(`Đã thêm role "${ROLE_LABELS[memberForm.role] ?? memberForm.role}" cho ${email}`)
      }
      setMemberForm(emptyMemberForm)
      setEditingId(null)
      await fetchRoles()
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setFormError(adminErrorMessage(err, 'Không lưu được role'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (entry: UserRoleEntry) => {
    if (entry.roleEntryId) setEditingId(entry.roleEntryId)
    setMemberForm({ email: entry.email, role: entry.roleNames[0] || 'vip', note: entry.note || '' })
    setFormError('')
  }

  const handleDelete = async () => {
    const entry = deleteTarget
    if (!entry?.roleEntryId) return
    setPendingId(entry.roleEntryId)
    try {
      await adminFetch(`/api/admin/roles?id=${entry.roleEntryId}`, { method: 'DELETE' })
      toast(`Đã xóa role "${ROLE_LABELS[entry.roleNames[0]] ?? entry.roleNames[0]}" của ${entry.email}`)
      setDeleteTarget(null)
      await fetchRoles()
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Xóa role thất bại'))
      setDeleteTarget(null)
    } finally {
      setPendingId(null)
    }
  }

  const handleBulkSync = async () => {
    setSyncing(true)
    setError('')
    try {
      const res = await adminFetch('/api/admin/roles/sync', { method: 'POST' })
      const d = (await res.json().catch(() => ({}))) as { added?: number; skipped?: number }
      toast(`Đã đồng bộ: thêm ${d.added ?? 0} role, bỏ qua ${d.skipped ?? 0}`)
      await fetchRoles()
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Đồng bộ thất bại'))
    } finally {
      setSyncing(false)
      setSyncConfirm(false)
    }
  }

  const filtered = search
    ? roles.filter((r) => {
        const s = search.toLowerCase()
        return r.email.includes(s) || r.roleNames.some((rn) => rn.toLowerCase().includes(s))
      })
    : roles

  if (authFailed) {
    return (
      <ErrorState
        title="Không còn quyền quản trị"
        description="Phiên đăng nhập hết hạn hoặc tài khoản không còn quyền admin. Đăng nhập lại để tiếp tục."
        onRetry={() => {
          window.location.href = '/admin'
        }}
        retryLabel="Đăng nhập lại"
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Form thêm/sửa role */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] p-4"
      >
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-title)]">
          {editingId ? 'Sửa role' : 'Thêm role mới'}
        </h3>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
          <Field label="Email" required>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))}
                disabled={!!editingId}
                className={inputClass}
                placeholder="user@gmail.com"
              />
            )}
          </Field>
          <Field label="Role" required hint={undefined}>
            {({ id }) => (
              <select
                id={id}
                value={memberForm.role}
                onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))}
                className={inputClass}
              >
                {VALID_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Ghi chú" hint={undefined}>
            {({ id }) => (
              <input
                id={id}
                type="text"
                value={memberForm.note}
                onChange={(e) => setMemberForm((p) => ({ ...p, note: e.target.value }))}
                className={inputClass}
                placeholder="VD: VIP đến 31/12/2026"
              />
            )}
          </Field>
          <div className="flex gap-2">
            <Button type="submit" loading={submitting} className="flex-1">
              {editingId ? 'Cập nhật' : 'Thêm'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null)
                  setMemberForm(emptyMemberForm)
                  setFormError('')
                }}
              >
                Hủy
              </Button>
            )}
          </div>
        </div>
        {formError && (
          <InlineNotice tone="danger" className="mt-3">
            {formError}
          </InlineNotice>
        )}
      </form>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          aria-label="Tìm thành viên theo email hoặc role"
          placeholder="Tìm theo email hoặc role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} max-w-md`}
        />
        <Button variant="secondary" size="sm" onClick={() => setSyncConfirm(true)} loading={syncing}>
          Đồng bộ tất cả
        </Button>
      </div>

      {error && (
        <InlineNotice tone="danger">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchRoles()}
              className="font-semibold text-[var(--color-title)] underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        </InlineNotice>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-8 text-sm text-[var(--color-muted)]">
          <Spinner size={18} /> Đang tải danh sách thành viên…
        </div>
      ) : (
        <>
          <AdminTable label="Danh sách thành viên và role">
            <AdminThead>
              <tr>
                <AdminTh>Email</AdminTh>
                <AdminTh>Role</AdminTh>
                <AdminTh className="hidden md:table-cell">Ghi chú</AdminTh>
                <AdminTh className="hidden md:table-cell">Đăng nhập cuối</AdminTh>
                <AdminTh className="text-right">Thao tác</AdminTh>
              </tr>
            </AdminThead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    {search
                      ? 'Không tìm thấy thành viên phù hợp với từ khóa này'
                      : 'Chưa có người dùng nào đăng ký'}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const hasRoles = entry.roleNames.length > 0
                  const busy = pendingId === entry.roleEntryId
                  return (
                    <AdminTr key={`${entry.id}-${entry.roleNames.join('-') || 'none'}`} pending={busy}>
                      <AdminTd className="font-mono text-xs text-[var(--color-title)]">
                        {entry.email}
                      </AdminTd>
                      <AdminTd>
                        {hasRoles ? (
                          <span className="flex flex-wrap gap-1">
                            {entry.roleNames.map((r) => (
                              <Badge key={r} tone={ROLE_TONES[r] ?? 'neutral'}>
                                {ROLE_LABELS[r] ?? r}
                              </Badge>
                            ))}
                          </span>
                        ) : (
                          <Badge tone="neutral">Chưa phân quyền</Badge>
                        )}
                      </AdminTd>
                      <AdminTd className="hidden max-w-[200px] truncate md:table-cell">
                        {entry.note || '—'}
                      </AdminTd>
                      <AdminTd className="hidden text-meta md:table-cell">
                        {entry.last_sign_in
                          ? new Date(entry.last_sign_in).toLocaleDateString('vi-VN')
                          : '—'}
                      </AdminTd>
                      <AdminTd className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasRoles ? (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleEdit(entry)}
                                disabled={busy}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeleteTarget(entry)}
                                loading={busy}
                              >
                                Xóa role
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingId(null)
                                setMemberForm({ email: entry.email, role: 'vip', note: '' })
                                setFormError('')
                              }}
                            >
                              Thêm role
                            </Button>
                          )}
                        </div>
                      </AdminTd>
                    </AdminTr>
                  )
                })
              )}
            </tbody>
          </AdminTable>
          <p className="text-meta text-[var(--color-muted)]">
            Hiển thị {filtered.length}/{roles.length} thành viên
          </p>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa role"
        danger
        busy={!!pendingId}
        confirmLabel="Xóa role"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        description={
          deleteTarget && (
            <>
              Xóa role{' '}
              <strong className="text-[var(--color-title)]">
                “{ROLE_LABELS[deleteTarget.roleNames[0]] ?? deleteTarget.roleNames[0]}”
              </strong>{' '}
              của tài khoản{' '}
              <strong className="text-[var(--color-title)]">{deleteTarget.email}</strong>? Tài khoản
              vẫn tồn tại — chỉ quyền này bị thu hồi.
            </>
          )
        }
      />

      <ConfirmDialog
        open={syncConfirm}
        title="Đồng bộ role cho tất cả người dùng"
        busy={syncing}
        confirmLabel="Đồng bộ"
        onConfirm={handleBulkSync}
        onCancel={() => setSyncConfirm(false)}
        description='Mọi người dùng chưa có role sẽ được gán role "Thành viên". Việc này có thể mất vài giây.'
      />
    </div>
  )
}

