'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminFetch, adminFetchJson, adminErrorMessage, isAdminAuthError } from '../admin-api'
import { useAdminToast } from '../AdminShell'
import { AdminTable, AdminThead, AdminTh, AdminTr, AdminTd } from '../AdminTable'
import { ConfirmDialog } from '../ConfirmDialog'
import { Badge, Button, ErrorState, Field, InlineNotice, Spinner, inputClass, textareaClass } from '@/app/components/ui'

// =====================================================
// MembershipPanel — gói membership + subscription (§16.8)
// - Subscription: user, plan, bắt đầu/hết hạn, trạng thái
// - Plan: giá, duration, quyền lợi, đang bán, thứ tự
// - Lỗi "plan đang có người dùng" giải thích rõ
// =====================================================

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

const SUB_STATUS: Record<string, { label: string; tone: 'success' | 'neutral' | 'danger' }> = {
  active: { label: 'Đang hoạt động', tone: 'success' },
  expired: { label: 'Đã hết hạn', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', tone: 'danger' },
}

const initialPlanForm = {
  id: '',
  name: '',
  description: '',
  price: 0,
  duration_days: 30,
  features: '',
  is_active: false,
  sort_order: 0,
}

export function MembershipPanel() {
  const toast = useAdminToast()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authFailed, setAuthFailed] = useState(false)
  const [subsSearch, setSubsSearch] = useState('')
  const [grantForm, setGrantForm] = useState({ email: '', planId: '', note: '' })
  const [grantSubmitting, setGrantSubmitting] = useState(false)
  const [grantError, setGrantError] = useState('')
  const [grantResult, setGrantResult] = useState('')
  const [planForm, setPlanForm] = useState(initialPlanForm)
  const [planFormOpen, setPlanFormOpen] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planSubmitting, setPlanSubmitting] = useState(false)
  const [planError, setPlanError] = useState('')
  const [deletePlanTarget, setDeletePlanTarget] = useState<MembershipPlan | null>(null)
  const [pendingSubId, setPendingSubId] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<SubscriptionEntry | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [plansData, subsData] = await Promise.all([
        adminFetchJson<{ plans: MembershipPlan[] }>('/api/admin/plans'),
        adminFetchJson<{ subscriptions: SubscriptionEntry[] }>('/api/admin/memberships'),
      ])
      setPlans(plansData.plans || [])
      setSubscriptions(subsData.subscriptions || [])
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Chưa tải được dữ liệu membership'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grantForm.email.trim() || !grantForm.planId) {
      setGrantError('Cần nhập email và chọn gói')
      return
    }
    setGrantSubmitting(true)
    setGrantError('')
    setGrantResult('')
    try {
      const res = await adminFetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grantForm),
      })
      const d = (await res.json().catch(() => ({}))) as {
        subscription?: { expires_at?: string }
      }
      const plan = plans.find((p) => p.id === grantForm.planId)
      setGrantResult(
        `Đã cấp gói “${plan?.name ?? grantForm.planId}” cho ${grantForm.email}` +
          (d.subscription?.expires_at
            ? ` — hết hạn ${new Date(d.subscription.expires_at).toLocaleDateString('vi-VN')}`
            : '')
      )
      setGrantForm({ email: '', planId: '', note: '' })
      await fetchAll()
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setGrantError(adminErrorMessage(err, 'Cấp membership thất bại'))
    } finally {
      setGrantSubmitting(false)
    }
  }

  const handleRevoke = async () => {
    const sub = revokeTarget
    if (!sub) return
    setPendingSubId(sub.id)
    try {
      await adminFetch(`/api/admin/memberships/${sub.id}`, { method: 'DELETE' })
      toast(`Đã thu hồi membership của ${sub.user_email}`)
      setRevokeTarget(null)
      await fetchAll()
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Thu hồi thất bại'))
      setRevokeTarget(null)
    } finally {
      setPendingSubId(null)
    }
  }

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planForm.id.trim() || !planForm.name.trim()) {
      setPlanError('Cần nhập ID và tên gói')
      return
    }
    setPlanSubmitting(true)
    setPlanError('')
    const features = planForm.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
    try {
      if (editingPlanId) {
        await adminFetch(`/api/admin/plans?id=${encodeURIComponent(editingPlanId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...planForm, features }),
        })
        toast('Đã cập nhật gói')
      } else {
        await adminFetch('/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...planForm, features }),
        })
        toast('Đã tạo gói mới')
      }
      setPlanForm(initialPlanForm)
      setEditingPlanId(null)
      setPlanFormOpen(false)
      await fetchAll()
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setPlanError(adminErrorMessage(err, 'Không lưu được gói'))
    } finally {
      setPlanSubmitting(false)
    }
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
    setPlanError('')
    setPlanFormOpen(true)
  }

  const handleDeletePlan = async () => {
    const plan = deletePlanTarget
    if (!plan) return
    try {
      await adminFetch(`/api/admin/plans?id=${encodeURIComponent(plan.id)}`, { method: 'DELETE' })
      toast(`Đã xóa gói “${plan.name}”`)
      setDeletePlanTarget(null)
      await fetchAll()
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      // 409: gói đang có người dùng — giải thích thay vì chỉ báo lỗi
      setPlanError(adminErrorMessage(err, 'Xóa gói thất bại'))
      setDeletePlanTarget(null)
    }
  }

  const filteredSubs = subsSearch
    ? subscriptions.filter(
        (s) =>
          s.user_email.toLowerCase().includes(subsSearch.toLowerCase()) ||
          (s.membership_plans?.name ?? s.plan_id).toLowerCase().includes(subsSearch.toLowerCase())
      )
    : subscriptions

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
    <div className="space-y-8">
      {/* ── Cấp membership ── */}
      <form
        onSubmit={handleGrant}
        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] p-4"
      >
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-title)]">
          Cấp membership cho người dùng
        </h3>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
          <Field label="Email" required>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="email"
                value={grantForm.email}
                onChange={(e) => setGrantForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
                placeholder="user@gmail.com"
              />
            )}
          </Field>
          <Field label="Gói" required>
            {({ id }) => (
              <select
                id={id}
                value={grantForm.planId}
                onChange={(e) => setGrantForm((p) => ({ ...p, planId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Chọn gói…</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.duration_days} ngày)
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Ghi chú">
            {({ id }) => (
              <input
                id={id}
                type="text"
                value={grantForm.note}
                onChange={(e) => setGrantForm((p) => ({ ...p, note: e.target.value }))}
                className={inputClass}
                placeholder="VD: Tặng 1 tháng"
              />
            )}
          </Field>
          <Button type="submit" loading={grantSubmitting}>
            Cấp membership
          </Button>
        </div>
        {grantError && (
          <InlineNotice tone="danger" className="mt-3">
            {grantError}
          </InlineNotice>
        )}
        {grantResult && (
          <InlineNotice tone="success" className="mt-3">
            {grantResult}
          </InlineNotice>
        )}
      </form>

      {/* ── Danh sách subscription ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--color-title)]">
            Subscription ({filteredSubs.length}/{subscriptions.length})
          </h3>
          <input
            type="search"
            aria-label="Tìm subscription theo email hoặc gói"
            placeholder="Tìm theo email hoặc gói…"
            value={subsSearch}
            onChange={(e) => setSubsSearch(e.target.value)}
            className={`${inputClass} max-w-xs`}
          />
        </div>

        {error && (
          <InlineNotice tone="danger">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void fetchAll()}
                className="font-semibold text-[var(--color-title)] underline underline-offset-2"
              >
                Thử lại
              </button>
            </div>
          </InlineNotice>
        )}

        {loading ? (
          <div className="flex items-center gap-3 py-8 text-sm text-[var(--color-muted)]">
            <Spinner size={18} /> Đang tải subscription…
          </div>
        ) : (
          <AdminTable label="Danh sách subscription">
            <AdminThead>
              <tr>
                <AdminTh>Người dùng</AdminTh>
                <AdminTh>Gói</AdminTh>
                <AdminTh>Bắt đầu</AdminTh>
                <AdminTh>Hết hạn</AdminTh>
                <AdminTh>Trạng thái</AdminTh>
                <AdminTh className="hidden lg:table-cell">Ghi chú</AdminTh>
                <AdminTh className="text-right">Thao tác</AdminTh>
              </tr>
            </AdminThead>
            <tbody>
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                    {subsSearch
                      ? 'Không có subscription khớp từ khóa'
                      : 'Chưa có subscription nào'}
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const st = SUB_STATUS[sub.status] ?? SUB_STATUS.expired
                  return (
                    <AdminTr key={sub.id} pending={pendingSubId === sub.id}>
                      <AdminTd className="font-mono text-xs text-[var(--color-title)]">
                        {sub.user_email}
                      </AdminTd>
                      <AdminTd>{sub.membership_plans?.name ?? sub.plan_id}</AdminTd>
                      <AdminTd className="text-meta">
                        {new Date(sub.starts_at).toLocaleDateString('vi-VN')}
                      </AdminTd>
                      <AdminTd className="text-meta">
                        {new Date(sub.expires_at).toLocaleDateString('vi-VN')}
                      </AdminTd>
                      <AdminTd>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </AdminTd>
                      <AdminTd className="hidden max-w-[160px] truncate lg:table-cell">
                        {sub.note || '—'}
                      </AdminTd>
                      <AdminTd className="text-right">
                        {sub.status === 'active' && (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={pendingSubId === sub.id}
                            onClick={() => setRevokeTarget(sub)}
                          >
                            Thu hồi
                          </Button>
                        )}
                      </AdminTd>
                    </AdminTr>
                  )
                })
              )}
            </tbody>
          </AdminTable>
        )}
      </div>

      {/* ── Quản lý gói ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--color-title)]">Gói membership</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingPlanId(null)
              setPlanForm(initialPlanForm)
              setPlanError('')
              setPlanFormOpen((v) => !v)
            }}
          >
            {planFormOpen ? 'Đóng form' : 'Tạo gói mới'}
          </Button>
        </div>

        {planFormOpen && (
          <form
            onSubmit={handlePlanSubmit}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] p-4"
          >
            <h4 className="mb-3 text-sm font-semibold text-[var(--color-title)]">
              {editingPlanId ? `Sửa gói “${planForm.name}”` : 'Tạo gói mới'}
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="ID gói" required hint="VD: vip-1month — không đổi được sau khi tạo">
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    type="text"
                    value={planForm.id}
                    onChange={(e) => setPlanForm((p) => ({ ...p, id: e.target.value }))}
                    disabled={!!editingPlanId}
                    className={inputClass}
                    placeholder="vip-1month"
                  />
                )}
              </Field>
              <Field label="Tên gói" required hint="VD: VIP 1 Tháng">
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass}
                    placeholder="VIP 1 Tháng"
                  />
                )}
              </Field>
              <Field label="Giá (VND)">
                {({ id }) => (
                  <input
                    id={id}
                    type="number"
                    min={0}
                    value={planForm.price}
                    onChange={(e) => setPlanForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className={`${inputClass} tabular`}
                  />
                )}
              </Field>
              <Field label="Thời hạn (ngày)">
                {({ id }) => (
                  <input
                    id={id}
                    type="number"
                    min={1}
                    value={planForm.duration_days}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, duration_days: Number(e.target.value) }))
                    }
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Mô tả" className="md:col-span-2">
                {({ id }) => (
                  <input
                    id={id}
                    type="text"
                    value={planForm.description}
                    onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))}
                    className={inputClass}
                    placeholder="Mô tả ngắn về gói"
                  />
                )}
              </Field>
              <Field
                label="Quyền lợi"
                hint="Mỗi dòng một quyền lợi — chỉ ghi quyền hệ thống thực sự cấp"
                className="md:col-span-2"
              >
                {({ id, describedBy }) => (
                  <textarea
                    id={id}
                    aria-describedby={describedBy}
                    value={planForm.features}
                    onChange={(e) => setPlanForm((p) => ({ ...p, features: e.target.value }))}
                    rows={3}
                    className={textareaClass}
                    placeholder={'Tải mods VIP không giới hạn\nXem bài viết độc quyền'}
                  />
                )}
              </Field>
              <Field label="Thứ tự hiển thị" hint="Số nhỏ hiển thị trước">
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    type="number"
                    value={planForm.sort_order}
                    onChange={(e) =>
                      setPlanForm((p) => ({ ...p, sort_order: Number(e.target.value) }))
                    }
                    className={inputClass}
                  />
                )}
              </Field>
              <div className="flex items-end pb-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-body)]">
                  <input
                    type="checkbox"
                    checked={planForm.is_active}
                    onChange={(e) => setPlanForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  Đang mở bán
                </label>
              </div>
            </div>
            {planError && (
              <InlineNotice tone="danger" className="mt-3">
                {planError}
              </InlineNotice>
            )}
            <div className="mt-4 flex gap-3">
              <Button type="submit" loading={planSubmitting}>
                {editingPlanId ? 'Cập nhật gói' : 'Tạo gói'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPlanFormOpen(false)
                  setEditingPlanId(null)
                  setPlanForm(initialPlanForm)
                  setPlanError('')
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        )}

        {loading ? null : plans.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Chưa có gói nào. Tạo gói mới ở trên.</p>
        ) : (
          <AdminTable label="Danh sách gói membership" minWidth={680}>
            <AdminThead>
              <tr>
                <AdminTh>Gói</AdminTh>
                <AdminTh>Giá</AdminTh>
                <AdminTh>Thời hạn</AdminTh>
                <AdminTh>Quyền lợi</AdminTh>
                <AdminTh>Trạng thái</AdminTh>
                <AdminTh className="text-right">Thao tác</AdminTh>
              </tr>
            </AdminThead>
            <tbody>
              {plans.map((plan) => (
                <AdminTr key={plan.id}>
                  <AdminTd>
                    <div className="font-mono text-xs text-[var(--color-muted)]">{plan.id}</div>
                    <div className="text-sm font-medium text-[var(--color-title)]">{plan.name}</div>
                  </AdminTd>
                  <AdminTd className="tabular">{plan.price.toLocaleString('vi-VN')}đ</AdminTd>
                  <AdminTd className="tabular">{plan.duration_days} ngày</AdminTd>
                  <AdminTd>
                    <ul className="max-w-[260px] list-disc space-y-0.5 pl-4 text-xs">
                      {plan.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </AdminTd>
                  <AdminTd>
                    {plan.is_active ? (
                      <Badge tone="success">Đang bán</Badge>
                    ) : (
                      <Badge tone="neutral">Đang ẩn</Badge>
                    )}
                  </AdminTd>
                  <AdminTd className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEditPlan(plan)}>
                        Sửa
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeletePlanTarget(plan)}>
                        Xóa
                      </Button>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        title="Thu hồi membership"
        danger
        busy={!!pendingSubId}
        confirmLabel="Thu hồi"
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
        description={
          revokeTarget && (
            <>
              Thu hồi gói{' '}
              <strong className="text-[var(--color-title)]">
                “{revokeTarget.membership_plans?.name ?? revokeTarget.plan_id}”
              </strong>{' '}
              của{' '}
              <strong className="text-[var(--color-title)]">{revokeTarget.user_email}</strong>? Quyền
              VIP của tài khoản này sẽ mất ngay.
            </>
          )
        }
      />

      <ConfirmDialog
        open={!!deletePlanTarget}
        title="Xóa gói membership"
        danger
        confirmLabel="Xóa gói"
        onConfirm={handleDeletePlan}
        onCancel={() => setDeletePlanTarget(null)}
        description={
          deletePlanTarget && (
            <>
              Xóa gói{' '}
              <strong className="text-[var(--color-title)]">“{deletePlanTarget.name}”</strong> (
              {deletePlanTarget.id})? Không xóa được nếu gói đang có người dùng active.
            </>
          )
        }
      />
    </div>
  )
}
