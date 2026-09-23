'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/app/components/RichTextEditor'
import { slugFromTitle } from '@/utils/slug'
import { GUIDE_FIXED_TAGS } from '@/lib/related-content'
import { adminFetch, adminJson, adminErrorMessage, isAdminAuthError } from '../admin-api'
import { useAdminToast } from '../AdminShell'
import { ImageUploadField } from '../ImageUploadField'
import { ConfirmDialog } from '../ConfirmDialog'
import { Button, ErrorState, Field, InlineNotice, inputClass } from '@/app/components/ui'

// =====================================================
// GuideForm — form tạo/sửa bài hướng dẫn (§16.5)
// Tiêu đề · Slug (gợi ý chỉ khi tạo) · Tags · Ảnh bìa ·
// Nội dung (RichTextEditor). Sticky footer + dirty guard.
// =====================================================

export interface GuideFormState {
  title: string
  slug: string
  thumbnailUrl: string
  tags: string[]
  content: string
}

const EMPTY_GUIDE: GuideFormState = {
  title: '',
  slug: '',
  thumbnailUrl: '',
  tags: [],
  content: '',
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function snap(f: GuideFormState): string {
  return JSON.stringify(f)
}

type FieldErrors = Partial<Record<'title' | 'slug' | 'content', string>>

export function GuideForm({
  mode,
  guideId,
  initial,
}: {
  mode: 'create' | 'edit'
  guideId?: string
  initial?: GuideFormState
}) {
  const router = useRouter()
  const toast = useAdminToast()
  const [form, setForm] = useState<GuideFormState>(initial ?? EMPTY_GUIDE)
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [authFailed, setAuthFailed] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const snapshotRef = useRef(snap(initial ?? EMPTY_GUIDE))

  useEffect(() => {
    if (mode === 'edit' && initial) {
      setForm(initial)
      snapshotRef.current = snap(initial)
    }
  }, [mode, initial])

  const dirty = useMemo(() => snap(form) !== snapshotRef.current, [form])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const set = <K extends keyof GuideFormState>(key: K, value: GuideFormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (mode === 'create' && key === 'title' && !slugTouched) {
        next.slug = slugFromTitle(String(value))
      }
      return next
    })
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const toggleTag = (tag: string) => {
    set(
      'tags',
      form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: FieldErrors = {}
    if (!form.title.trim()) errs.title = 'Tiêu đề là bắt buộc'
    if (!form.slug.trim()) errs.slug = 'Slug là bắt buộc'
    else if (!SLUG_PATTERN.test(form.slug))
      errs.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch'
    if (!form.content.trim() || form.content === '<p></p>') errs.content = 'Nội dung là bắt buộc'
    setFieldErrors(errs)
    if (Object.values(errs).some(Boolean)) {
      setSubmitError('Vui lòng kiểm tra lại các trường bắt buộc')
      return
    }
    setSubmitError('')
    setSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content,
        thumbnail_url: form.thumbnailUrl || null,
        tags: form.tags,
      }
      if (mode === 'create') {
        await adminFetch('/api/admin/guides', adminJson('POST', payload))
        snapshotRef.current = snap(form)
        toast(`Đã tạo bài viết “${form.title}”`)
      } else {
        await adminFetch(`/api/admin/guides/${guideId}`, adminJson('PUT', payload))
        snapshotRef.current = snap(form)
        toast(`Đã lưu bài viết “${form.title}”`)
      }
      router.push('/admin/guides')
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      else setSubmitError(adminErrorMessage(err, 'Không lưu được bài viết. Vui lòng thử lại.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (dirty) setCancelConfirm(true)
    else router.push('/admin/guides')
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

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5">
        <div className="space-y-5">
          <Field label="Tiêu đề" required error={fieldErrors.title} hint='VD: "Cách cài mod FC 26 cho người mới"'>
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={!!fieldErrors.title}
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className={inputClass}
                placeholder="Nhập tiêu đề bài viết"
              />
            )}
          </Field>

          <Field
            label="Slug"
            required
            error={fieldErrors.slug}
            hint={
              mode === 'create'
                ? 'Tự gợi ý từ tiêu đề — sửa được trước khi lưu. VD: cach-cai-mod-fc26'
                : `Dùng trong URL: /huong-dan/${form.slug || '…'} — không tự đổi khi sửa tiêu đề`
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
                className={`${inputClass} font-mono`}
                placeholder="tieu-de-bai-viet"
              />
            )}
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-[var(--color-title)]">
              Tags cho mục Bài viết liên quan
            </legend>
            <p className="mb-2 text-xs text-[var(--color-muted)]">
              Chọn một hoặc nhiều tag — hệ thống gợi ý bài liên quan theo tag.
            </p>
            <div className="flex flex-wrap gap-2">
              {GUIDE_FIXED_TAGS.map((tag) => {
                const selected = form.tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-[var(--color-title)]'
                        : 'border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-body)] hover:border-[var(--color-accent-border)]'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <ImageUploadField
            label="Ảnh bìa"
            hint="Tùy chọn — hiển thị trên thẻ bài viết. JPEG/PNG/WebP, tối đa 5MB."
            value={form.thumbnailUrl}
            onChange={(url) => set('thumbnailUrl', url)}
          />

          <Field label="Nội dung" required error={fieldErrors.content}>
            {({ describedBy }) => (
              <div aria-describedby={describedBy} aria-invalid={!!fieldErrors.content}>
                <RichTextEditor
                  content={mode === 'edit' ? form.content : undefined}
                  onChange={(html) => set('content', html)}
                />
              </div>
            )}
          </Field>
        </div>
      </section>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-[var(--color-surface-0)]/95 backdrop-blur lg:left-[232px]">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p
            aria-live="polite"
            className={`text-sm ${dirty ? 'text-[var(--color-warn)]' : 'text-[var(--color-muted)]'}`}
          >
            {dirty ? 'Có thay đổi chưa lưu' : 'Mọi thay đổi đã được lưu'}
          </p>
          <div className="flex items-center gap-2">
            {mode === 'edit' && form.slug && (
              <Link
                href={`/huong-dan/${form.slug}`}
                target="_blank"
                className="hidden text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-title)] sm:block"
              >
                Xem bài viết ↗
              </Link>
            )}
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" loading={submitting}>
              {mode === 'create' ? 'Tạo bài viết' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cancelConfirm}
        title="Bỏ thay đổi?"
        confirmLabel="Bỏ thay đổi"
        danger
        onConfirm={() => router.push('/admin/guides')}
        onCancel={() => setCancelConfirm(false)}
        description="Các thay đổi chưa lưu sẽ mất. Bạn chắc chắn muốn rời trang này?"
      />
    </form>
  )
}
