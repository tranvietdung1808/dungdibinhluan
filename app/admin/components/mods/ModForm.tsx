'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { adminFetch, adminJson, adminErrorMessage, isAdminAuthError } from '../admin-api'
import { slugFromTitle } from '@/utils/slug'
import { useAdminToast } from '../AdminShell'
import { ImageUploadField } from '../ImageUploadField'
import { ConfirmDialog } from '../ConfirmDialog'
import { Button, ErrorState, Field, InlineNotice, inputClass, textareaClass } from '@/app/components/ui'

// =====================================================
// ModForm — form tạo/sửa mod dùng chung (§16.4)
// 6 nhóm: Thông tin · Phiên bản · Nội dung · Media ·
// Phân phối · Hiển thị. Sticky footer + dirty guard.
// =====================================================

const CATEGORIES = ['All-in-One', 'Faces', 'Kits', 'Gameplay', 'Đồ họa', 'Cơ chế game'] as const

export interface ModFormState {
  slug: string
  name: string
  author: string
  category: string
  tags: string
  version: string
  updatedAt: string
  description: string
  longDescription: string
  thumbnail: string
  thumbnailOrientation: 'portrait' | 'landscape'
  videoId: string
  downloadUrl: string
  creditEnabled: boolean
  creditCost: string
  featured: boolean
}

const EMPTY_FORM: ModFormState = {
  slug: '',
  name: '',
  author: '',
  category: 'Faces',
  tags: '',
  version: '',
  updatedAt: '',
  description: '',
  longDescription: '',
  thumbnail: '',
  thumbnailOrientation: 'portrait',
  videoId: '',
  downloadUrl: '',
  creditEnabled: false,
  creditCost: '5',
  featured: false,
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function snapshotOf(f: ModFormState): string {
  return JSON.stringify(f)
}

type FieldErrors = Partial<Record<keyof ModFormState, string>>

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5">
      <h2 className="text-base font-bold text-[var(--color-title)]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>}
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  )
}

export function ModForm({
  mode,
  initial,
  modSlug,
}: {
  mode: 'create' | 'edit'
  /** Dữ liệu đã tải (edit) — undefined nghĩa đang tải */
  initial?: ModFormState
  /** slug của mod đang sửa (edit) */
  modSlug?: string
}) {
  const router = useRouter()
  const toast = useAdminToast()
  const [form, setForm] = useState<ModFormState>(initial ?? EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [creditWarning, setCreditWarning] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [authFailed, setAuthFailed] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const snapshotRef = useRef<string>(snapshotOf(initial ?? EMPTY_FORM))

  // Khi dữ liệu edit vừa tải xong → chốt snapshot ban đầu
  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm(initial)
      snapshotRef.current = snapshotOf(initial)
    }
  }, [mode, initial])

  const dirty = useMemo(() => snapshotOf(form) !== snapshotRef.current, [form])

  // beforeunload khi dirty (§16.4)
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const set = <K extends keyof ModFormState>(key: K, value: ModFormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Slug gợi ý từ tên — chỉ khi tạo mới và user chưa tự sửa slug
      if (mode === 'create' && key === 'name' && !slugTouched) {
        next.slug = slugFromTitle(String(value))
      }
      return next
    })
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = useCallback((): FieldErrors => {
    const errs: FieldErrors = {}
    if (mode === 'create') {
      if (!form.slug.trim()) errs.slug = 'Slug là bắt buộc'
      else if (!SLUG_PATTERN.test(form.slug))
        errs.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch (VD: mix-mods-fc26)'
    }
    if (!form.name.trim()) errs.name = 'Tên mod là bắt buộc'
    if (!form.author.trim()) errs.author = 'Tác giả là bắt buộc'
    if (!form.version.trim()) errs.version = 'Phiên bản là bắt buộc'
    if (!form.updatedAt.trim()) errs.updatedAt = 'Ngày cập nhật là bắt buộc'
    if (form.creditEnabled) {
      const cost = Number(form.creditCost)
      if (!Number.isFinite(cost) || cost < 1)
        errs.creditCost = 'Số credit phải là số nguyên ≥ 1'
    }
    return errs
  }, [form, mode])

  const buildPayload = () => ({
    ...(mode === 'create' ? { slug: form.slug.trim() } : {}),
    name: form.name.trim(),
    author: form.author.trim(),
    category: form.category,
    version: form.version.trim(),
    updated_at: form.updatedAt.trim(),
    description: form.description,
    long_description: form.longDescription,
    thumbnail: form.thumbnail || null,
    download_url: form.downloadUrl || null,
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    thumbnail_orientation: form.thumbnailOrientation,
    featured: form.featured,
    video_id: form.videoId.trim() || null,
    ...(mode === 'edit'
      ? {
          credit_enabled: form.creditEnabled,
          credit_cost: form.creditEnabled ? Math.floor(Number(form.creditCost)) || null : null,
        }
      : {}),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setFieldErrors(errs)
    if (Object.values(errs).some(Boolean)) {
      setSubmitError('Vui lòng kiểm tra lại các trường bắt buộc bên dưới')
      return
    }
    setSubmitError('')
    setCreditWarning('')
    setSubmitting(true)
    try {
      if (mode === 'create') {
        await adminFetch('/api/admin/mods', adminJson('POST', buildPayload()))
        // POST /api/admin/mods không nhận credit fields — gọi credit-config sau khi tạo
        if (form.creditEnabled) {
          try {
            await adminFetch(
              '/api/admin/mods/credit-config',
              adminJson('POST', {
                slug: form.slug.trim(),
                enabled: true,
                creditCost: Math.floor(Number(form.creditCost)) || 5,
              })
            )
          } catch {
            setCreditWarning(
              'Mod đã được tạo nhưng chưa lưu được giá credit — sửa lại trong danh sách mods.'
            )
          }
        }
        snapshotRef.current = snapshotOf(form)
        toast(`Đã tạo mod “${form.name}”`)
        router.push('/admin/mods')
      } else {
        await adminFetch(
          `/api/admin/mods/${encodeURIComponent(modSlug ?? form.slug)}`,
          adminJson('PUT', buildPayload())
        )
        snapshotRef.current = snapshotOf(form)
        toast(`Đã lưu mod “${form.name}”`)
      }
    } catch (err) {
      if (isAdminAuthError(err)) {
        setAuthFailed(true)
      } else {
        setSubmitError(adminErrorMessage(err, 'Không lưu được mod. Vui lòng thử lại.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (dirty) setCancelConfirm(true)
    else router.push('/admin/mods')
  }

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
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {submitError && <InlineNotice tone="danger">{submitError}</InlineNotice>}
      {creditWarning && <InlineNotice tone="warning">{creditWarning}</InlineNotice>}

      {/* ── 1. Thông tin ── */}
      <FormSection title="Thông tin" description="Định danh và phân loại của mod">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Tên mod" required error={fieldErrors.name} hint='VD: "MIX MODS FC 26"'>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!fieldErrors.name}
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputClass}
                placeholder="MIX MODS FC 26"
              />
            )}
          </Field>
          <Field
            label="Slug"
            required
            error={fieldErrors.slug}
            hint={
              mode === 'create'
                ? 'Tự gợi ý từ tên mod — sửa được trước khi lưu. VD: mix-mods-fc26'
                : 'Slug không đổi được sau khi tạo'
            }
          >
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!fieldErrors.slug}
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', e.target.value)
                }}
                disabled={mode === 'edit'}
                className={`${inputClass} font-mono`}
                placeholder="mix-mods-fc26"
              />
            )}
          </Field>
          <Field label="Tác giả" required error={fieldErrors.author} hint='VD: "DungDiBinhLuan"'>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!fieldErrors.author}
                type="text"
                value={form.author}
                onChange={(e) => set('author', e.target.value)}
                className={inputClass}
                placeholder="DungDiBinhLuan"
              />
            )}
          </Field>
          <Field label="Danh mục" required>
            {({ id }) => (
              <select
                id={id}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            label="Tags"
            hint="Phân cách bằng dấu phẩy. VD: Faces, Kits, Gameplay"
            className="md:col-span-2"
          >
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="text"
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                className={inputClass}
                placeholder="Faces, Kits, Gameplay"
              />
            )}
          </Field>
        </div>
      </FormSection>

      {/* ── 2. Phiên bản ── */}
      <FormSection title="Phiên bản">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Phiên bản" required error={fieldErrors.version} hint='VD: "v1.2"'>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!fieldErrors.version}
                type="text"
                value={form.version}
                onChange={(e) => set('version', e.target.value)}
                className={inputClass}
                placeholder="v1.0"
              />
            )}
          </Field>
          <Field
            label="Ngày cập nhật"
            required
            error={fieldErrors.updatedAt}
            hint="Định dạng hiển thị trên site. VD: 20/02/2026"
          >
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!fieldErrors.updatedAt}
                type="text"
                value={form.updatedAt}
                onChange={(e) => set('updatedAt', e.target.value)}
                className={inputClass}
                placeholder="dd/mm/yyyy"
              />
            )}
          </Field>
        </div>
      </FormSection>

      {/* ── 3. Nội dung ── */}
      <FormSection title="Nội dung" description="Mô tả hiển thị trên trang mod công khai">
        <Field
          label="Mô tả ngắn"
          hint="1–2 câu, hiển thị ở thẻ mod và đầu trang chi tiết"
        >
          {({ id, describedBy }) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className={textareaClass}
              placeholder="Mod tổng hợp faces, kits và gameplay cho FC 26…"
            />
          )}
        </Field>
        <Field label="Mô tả chi tiết" hint="Nội dung đầy đủ — hướng dẫn cài đặt, changelog…">
          {({ id, describedBy }) => (
            <textarea
              id={id}
              aria-describedby={describedBy}
              value={form.longDescription}
              onChange={(e) => set('longDescription', e.target.value)}
              rows={8}
              className={textareaClass}
              placeholder="Mô tả chi tiết, hướng dẫn cài đặt…"
            />
          )}
        </Field>
      </FormSection>

      {/* ── 4. Media ── */}
      <FormSection
        title="Media"
        description="Ảnh bìa, video và thư viện ảnh showcase của mod"
      >
        <ImageUploadField
          label="Ảnh bìa (cover)"
          hint="Ảnh đại diện trên danh sách và trang chi tiết. JPEG/PNG/WebP, tối đa 5MB."
          value={form.thumbnail}
          onChange={(url) => set('thumbnail', url)}
          aspect={form.thumbnailOrientation === 'landscape' ? 'aspect-video' : 'aspect-[3/4]'}
        />
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-[var(--color-title)]">
            Tỉ lệ ảnh bìa
          </legend>
          <div className="flex gap-6">
            {(
              [
                { value: 'portrait', label: 'Dọc (portrait) — mặc định' },
                { value: 'landscape', label: 'Ngang (landscape)' },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-body)]"
              >
                <input
                  type="radio"
                  name="thumbnailOrientation"
                  value={opt.value}
                  checked={form.thumbnailOrientation === opt.value}
                  onChange={() => set('thumbnailOrientation', opt.value)}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          label="Video Vimeo"
          hint="Nhập ID video Vimeo (không phải link đầy đủ). VD: 1176297958"
        >
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              type="text"
              inputMode="numeric"
              value={form.videoId}
              onChange={(e) => set('videoId', e.target.value)}
              className={inputClass}
              placeholder="1176297958"
            />
          )}
        </Field>
        {mode === 'edit' && modSlug ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-title)]">Ảnh showcase</p>
              <p className="text-xs text-[var(--color-muted)]">
                Thư viện ảnh hiển thị trên trang mod
              </p>
            </div>
            <Link
              href={`/admin/mods/${modSlug}/showcase`}
              className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
            >
              Quản lý showcase →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">
            Ảnh showcase: lưu mod trước, sau đó quản lý từ trang danh sách.
          </p>
        )}
      </FormSection>

      {/* ── 5. Phân phối ── */}
      <FormSection title="Phân phối" description="Link tải và cách người dùng truy cập mod">
        <Field
          label="Link tải"
          hint="Link đầy đủ tới file mod. VD: https://drive.google.com/…"
        >
          {({ id, describedBy }) => (
            <input
              id={id}
              aria-describedby={describedBy}
              type="url"
              value={form.downloadUrl}
              onChange={(e) => set('downloadUrl', e.target.value)}
              className={inputClass}
              placeholder="https://drive.google.com/…"
            />
          )}
        </Field>
        <div className="rounded-xl border border-[var(--color-credit-border)] bg-[var(--color-credit-subtle)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-title)]">
                Mở khóa bằng credit
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                Bật để yêu cầu người dùng trả credit mới vào được trang mod
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.creditEnabled}
              aria-label="Bật/tắt mở khóa bằng credit"
              onClick={() => set('creditEnabled', !form.creditEnabled)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                form.creditEnabled ? 'bg-[var(--color-credit)]' : 'bg-[var(--color-line-strong)]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.creditEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {form.creditEnabled && (
            <Field
              label="Giá (credit)"
              required
              error={fieldErrors.creditCost}
              hint="Số credit người dùng phải trả. VD: 5"
              className="mt-3 max-w-40"
            >
              {({ id, describedBy }) => (
                <input
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={!!fieldErrors.creditCost}
                  type="number"
                  min={1}
                  value={form.creditCost}
                  onChange={(e) => set('creditCost', e.target.value)}
                  className={`${inputClass} tabular`}
                />
              )}
            </Field>
          )}
        </div>
      </FormSection>

      {/* ── 6. Hiển thị ── */}
      <FormSection title="Hiển thị">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
          />
          <span>
            <span className="block text-sm font-medium text-[var(--color-title)]">
              Mod nổi bật
            </span>
            <span className="block text-xs text-[var(--color-muted)]">
              Ưu tiên hiển thị trong mục nổi bật trên trang chủ
            </span>
          </span>
        </label>
        {mode === 'edit' && modSlug && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-title)]">Xem trước</p>
              <p className="text-xs text-[var(--color-muted)]">
                Mở trang công khai của mod trong tab mới
              </p>
            </div>
            <Link
              href={`/mods/${modSlug}`}
              target="_blank"
              className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
            >
              /mods/{modSlug} ↗
            </Link>
          </div>
        )}
      </FormSection>

      {/* ── Sticky footer ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-[var(--color-surface-0)]/95 backdrop-blur lg:left-[232px]">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p
            aria-live="polite"
            className={`text-sm ${dirty ? 'text-[var(--color-warn)]' : 'text-[var(--color-muted)]'}`}
          >
            {dirty ? 'Có thay đổi chưa lưu' : 'Mọi thay đổi đã được lưu'}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" loading={submitting}>
              {mode === 'create' ? 'Tạo mod' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelConfirm}
        title="Bỏ thay đổi?"
        confirmLabel="Bỏ thay đổi"
        danger
        onConfirm={() => router.push('/admin/mods')}
        onCancel={() => setCancelConfirm(false)}
        description="Các thay đổi chưa lưu sẽ mất. Bạn chắc chắn muốn rời trang này?"
      />
    </form>
  )
}

export function modToFormState(mod: {
  slug: string
  name: string
  author: string
  category: string
  version: string
  updated_at: string
  description: string | null
  long_description: string | null
  thumbnail: string | null
  download_url: string | null
  tags: string[] | null
  thumbnail_orientation: string | null
  featured: boolean | null
  video_id: string | null
  credit_enabled?: boolean
  credit_cost?: number | null
}): ModFormState {
  return {
    slug: mod.slug,
    name: mod.name ?? '',
    author: mod.author ?? '',
    category: mod.category || 'Faces',
    tags: Array.isArray(mod.tags) ? mod.tags.join(', ') : '',
    version: mod.version ?? '',
    updatedAt: mod.updated_at ?? '',
    description: mod.description ?? '',
    longDescription: mod.long_description ?? '',
    thumbnail: mod.thumbnail ?? '',
    thumbnailOrientation: mod.thumbnail_orientation === 'landscape' ? 'landscape' : 'portrait',
    videoId: mod.video_id ?? '',
    downloadUrl: mod.download_url ?? '',
    creditEnabled: mod.credit_enabled === true,
    creditCost: String(mod.credit_cost ?? 5),
    featured: mod.featured === true,
  }
}
