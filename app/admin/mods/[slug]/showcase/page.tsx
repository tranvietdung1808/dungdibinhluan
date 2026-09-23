'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AdminPage } from '../../../components/AdminPage'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { useAdminToast } from '../../../components/AdminShell'
import {
  adminFetch,
  adminFetchJson,
  adminJson,
  adminErrorMessage,
  isAdminAuthError,
} from '../../../components/admin-api'
import { Button, EmptyState, ErrorState, InlineNotice, Spinner, inputClass } from '@/app/components/ui'

// =====================================================
// /admin/mods/[slug]/showcase — thư viện ảnh (§16.6, T18)
// - Lưới ảnh: caption, thứ tự, xóa
// - Nút Lên/Xuống làm phương án bàn phím cho kéo-thả
// - Sắp xếp lỗi → rollback + thông báo
// - Upload nhiều ảnh: báo kết quả từng file
// =====================================================

const MAX_UPLOAD_MB = 5
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])

interface ShowcaseImage {
  id: string
  slug: string
  image_url: string
  caption: string | null
  sort_order: number
}

interface UploadResult {
  name: string
  ok: boolean
  message?: string
}

export default function AdminModShowcasePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const toast = useAdminToast()
  const [images, setImages] = useState<ShowcaseImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authFailed, setAuthFailed] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadReport, setUploadReport] = useState<UploadResult[] | null>(null)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({})
  const [sortError, setSortError] = useState('')
  const [sorting, setSorting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ShowcaseImage | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setPending = (id: string, on: boolean) =>
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const fetchImages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetchJson<{ images: ShowcaseImage[] }>(
        `/api/admin/showcases?slug=${encodeURIComponent(slug)}`
      )
      setImages(data.images || [])
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Chưa tải được danh sách ảnh'))
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void fetchImages()
  }, [fetchImages])

  // ── Upload nhiều file — báo kết quả từng file ──
  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return

    setUploading(true)
    setError('')
    const report: UploadResult[] = []

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        report.push({
          name: file.name,
          ok: false,
          message: 'Không đúng định dạng (chỉ JPEG, PNG, GIF, WebP)',
        })
        continue
      }
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        report.push({ name: file.name, ok: false, message: `Vượt quá ${MAX_UPLOAD_MB}MB` })
        continue
      }
      try {
        const fd = new FormData()
        fd.append('file', file)
        const upRes = await adminFetch('/api/admin/upload', { method: 'POST', body: fd })
        const upData = (await upRes.json()) as { url?: string }
        if (!upData.url) throw new Error('Không nhận được URL ảnh')

        await adminFetch(
          '/api/admin/showcases',
          adminJson('POST', { slug, image_url: upData.url })
        )
        report.push({ name: file.name, ok: true })
      } catch (err) {
        if (isAdminAuthError(err)) {
          setAuthFailed(true)
          break
        }
        report.push({
          name: file.name,
          ok: false,
          message: adminErrorMessage(err, 'Upload hoặc lưu thất bại'),
        })
      }
    }

    setUploadReport(report)
    const okCount = report.filter((r) => r.ok).length
    if (okCount > 0) {
      toast(`Đã thêm ${okCount}/${report.length} ảnh`)
      await fetchImages()
    }
    setUploading(false)
  }

  // ── Xóa ảnh ──
  const handleDelete = async () => {
    const img = deleteTarget
    if (!img) return
    setPending(img.id, true)
    try {
      await adminFetch(`/api/admin/showcases/${img.id}`, { method: 'DELETE' })
      setImages((prev) => prev.filter((i) => i.id !== img.id))
      toast('Đã xóa ảnh khỏi showcase')
      setDeleteTarget(null)
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Xóa ảnh thất bại'))
      setDeleteTarget(null)
    } finally {
      setPending(img.id, false)
    }
  }

  // ── Caption: draft → Lưu → pending → rollback khi lỗi ──
  const handleSaveCaption = async (img: ShowcaseImage) => {
    const caption = (captionDrafts[img.id] ?? img.caption ?? '').trim()
    setPending(img.id, true)
    try {
      await adminFetch(`/api/admin/showcases/${img.id}`, adminJson('PATCH', { caption }))
      setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, caption } : i)))
      toast('Đã lưu chú thích')
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      // Rollback draft về caption đã lưu
      setCaptionDrafts((prev) => ({ ...prev, [img.id]: img.caption ?? '' }))
      setError(adminErrorMessage(err, 'Lưu chú thích thất bại'))
    } finally {
      setPending(img.id, false)
    }
  }

  // ── Sắp xếp: optimistic + rollback khi lỗi ──
  const persistOrder = async (ordered: ShowcaseImage[], previous: ShowcaseImage[]) => {
    setSorting(true)
    setSortError('')
    try {
      await adminFetch(
        '/api/admin/showcases',
        adminJson('PATCH', { slug, ids: ordered.map((i) => i.id) })
      )
      toast('Đã cập nhật thứ tự ảnh')
    } catch (err) {
      if (isAdminAuthError(err)) {
        setAuthFailed(true)
      } else {
        setImages(previous) // rollback
        setSortError(adminErrorMessage(err, 'Đổi thứ tự thất bại — đã khôi phục thứ tự cũ'))
      }
    } finally {
      setSorting(false)
    }
  }

  const moveImage = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= images.length || sorting) return
    const previous = images
    const reordered = [...images]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    setImages(reordered)
    void persistOrder(reordered, previous)
  }

  const onDropAt = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex || sorting) return
    const previous = images
    const reordered = [...images]
    const [moved] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    setImages(reordered)
    setDraggedIndex(null)
    void persistOrder(reordered, previous)
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

  return (
    <AdminPage>
      <p className="text-sm text-[var(--color-muted)]">
        Thư viện ảnh của mod{' '}
        <Link
          href={`/mods/${slug}`}
          target="_blank"
          className="font-mono font-semibold text-[var(--color-accent)] hover:underline"
        >
          /mods/{slug}
        </Link>
      </p>

      {error && (
        <InlineNotice tone="danger">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchImages()}
              className="font-semibold text-[var(--color-title)] underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        </InlineNotice>
      )}
      {sortError && <InlineNotice tone="danger">{sortError}</InlineNotice>}

      {/* Upload */}
      <section className="rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface-1)] p-6 text-center sm:p-8">
        <h2 className="text-base font-bold text-[var(--color-title)]">Thêm ảnh showcase</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-muted)]">
          JPEG / PNG / GIF / WebP, tối đa {MAX_UPLOAD_MB}MB mỗi ảnh. Chọn được nhiều ảnh cùng lúc —
          kết quả từng file sẽ báo bên dưới.
        </p>
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          loading={uploading}
          className="mt-5"
        >
          {uploading ? 'Đang tải lên…' : '+ Chọn ảnh để upload'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleAddImages}
          disabled={uploading}
          className="sr-only"
          aria-label="Chọn ảnh showcase để upload"
        />

        {/* Báo kết quả từng file — không chỉ lỗi cuối */}
        {uploadReport && (
          <div className="mx-auto mt-5 max-w-lg text-left">
            <p className="mb-2 text-sm font-semibold text-[var(--color-title)]">
              Kết quả: {uploadReport.filter((r) => r.ok).length}/{uploadReport.length} ảnh thành công
            </p>
            <ul className="space-y-1">
              {uploadReport.map((r, i) => (
                <li
                  key={`${r.name}-${i}`}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    r.ok
                      ? 'border-[var(--color-ok)]/30 bg-[var(--color-ok-subtle)] text-[var(--color-ok)]'
                      : 'border-[var(--color-danger)]/30 bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'
                  }`}
                >
                  <span aria-hidden="true">{r.ok ? '✓' : '✕'}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                  <span className="shrink-0">{r.ok ? 'Đã thêm' : r.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Lưới ảnh */}
      <section aria-label="Ảnh showcase hiện có">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--color-title)]">
            Ảnh hiện có{' '}
            <span className="text-sm font-normal tabular text-[var(--color-muted)]">
              ({images.length})
            </span>
          </h2>
          <p className="hidden text-xs text-[var(--color-muted)] sm:block">
            Kéo-thả hoặc dùng nút Lên/Xuống để đổi thứ tự — ảnh đầu tiên là ảnh chính
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 py-10 text-sm text-[var(--color-muted)]">
            <Spinner size={20} /> Đang tải ảnh…
          </div>
        ) : images.length === 0 ? (
          <EmptyState
            title="Chưa có ảnh showcase"
            description="Upload ảnh ở mục trên — chúng sẽ hiển thị trên trang chi tiết mod."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map((image, index) => {
              const pending = pendingIds.has(image.id) || sorting
              const captionDraft = captionDrafts[image.id] ?? image.caption ?? ''
              const captionDirty = captionDraft.trim() !== (image.caption ?? '')
              return (
                <div
                  key={image.id}
                  draggable={!pending}
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropAt(index)}
                  onDragEnd={() => setDraggedIndex(null)}
                  className={`overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-1)] transition-opacity ${
                    draggedIndex === index ? 'opacity-40' : ''
                  } ${pending ? 'opacity-60' : ''}`}
                >
                  <div className="relative aspect-video bg-[var(--color-surface-0)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt={image.caption || `Ảnh showcase ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute left-2 top-2 rounded-md bg-[var(--color-accent)] px-2 py-0.5 text-xs font-bold text-[var(--color-on-accent)]">
                        Ảnh chính
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-xs tabular text-white">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={captionDraft}
                        aria-label={`Chú thích ảnh ${index + 1}`}
                        placeholder="Chú thích (tùy chọn)"
                        disabled={pending}
                        onChange={(e) =>
                          setCaptionDrafts((prev) => ({ ...prev, [image.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && captionDirty) {
                            e.preventDefault()
                            void handleSaveCaption(image)
                          }
                        }}
                        className={`${inputClass} h-9 px-2.5 text-xs`}
                      />
                      {captionDirty && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={pendingIds.has(image.id)}
                          onClick={() => void handleSaveCaption(image)}
                        >
                          Lưu
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(index, -1)}
                          disabled={index === 0 || pending}
                          aria-label={`Đưa ảnh ${index + 1} lên trước`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-40"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                            <path d="M18 15l-6-6-6 6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 1)}
                          disabled={index === images.length - 1 || pending}
                          aria-label={`Đưa ảnh ${index + 1} xuống sau`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-40"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        <span className="ml-1 hidden text-xs text-[var(--color-muted)] lg:inline">
                          Lên / Xuống
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(image)}
                        disabled={pending}
                        aria-label={`Xóa ảnh ${index + 1}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-subtle)] px-3 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/20 disabled:opacity-40"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa ảnh showcase"
        danger
        busy={deleteTarget ? pendingIds.has(deleteTarget.id) : false}
        confirmLabel="Xóa ảnh"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        description={
          deleteTarget && (
            <>
              Xóa ảnh này khỏi showcase của mod{' '}
              <strong className="text-[var(--color-title)]">“{slug}”</strong>? Ảnh sẽ biến mất khỏi
              trang mod công khai ngay.
            </>
          )
        }
      />
    </AdminPage>
  )
}
