'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { adminFetch } from './admin-api'
import { inputClass } from '@/app/components/ui/Field'
import { InlineNotice } from '@/app/components/ui/states'
import { Spinner } from '@/app/components/ui/states'

// =====================================================
// ImageUploadField — upload ảnh dùng chung trong admin
// §16.4: giới hạn 5MB + MIME theo endpoint /api/admin/upload,
// preview, lỗi từng file, không reset form khi upload fail,
// nút bỏ ảnh, thử lại được.
// =====================================================

const MAX_UPLOAD_MB = 5
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])

type UploadState = 'idle' | 'uploading' | 'done' | 'failed'

export function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  aspect = 'aspect-video',
  id,
}: {
  label: string
  hint?: string
  /** URL remote đã lưu ('' = chưa có ảnh) */
  value: string
  onChange: (url: string) => void
  aspect?: string
  id?: string
}) {
  const autoId = useId()
  const inputId = id ?? `img-${autoId.replace(/[^a-zA-Z0-9]/g, '')}`
  const fileInputRef = useRef<HTMLInputElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const fileRef = useRef<File | null>(null)
  // Preview blob cục bộ khi user vừa chọn file; còn lại derive từ `value`
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const preview = localPreview ?? (value || null)
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState('')
  const [canRetry, setCanRetry] = useState(false)

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    },
    []
  )

  const clearBlob = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  const upload = async (file: File) => {
    setState('uploading')
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = (await res.json().catch(() => ({}))) as { url?: string; success?: boolean }
      const remoteUrl = typeof data?.url === 'string' ? data.url.trim() : ''
      if (remoteUrl && data?.success !== false) {
        onChange(remoteUrl)
        setState('done')
      } else {
        setState('failed')
        setCanRetry(true)
        setError('Ảnh chưa tải lên được. Nội dung bạn đã nhập vẫn được giữ nguyên.')
      }
    } catch (err) {
      setState('failed')
      setCanRetry(true)
      setError(
        err instanceof Error && err.message
          ? `Ảnh chưa tải lên được: ${err.message}`
          : 'Ảnh chưa tải lên được. Nội dung bạn đã nhập vẫn được giữ nguyên.'
      )
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_MIME.has(file.type)) {
      setState('failed')
      setError(`"${file.name}" không đúng định dạng. Chỉ nhận JPEG, PNG, GIF hoặc WebP.`)
      return
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setState('failed')
      setError(`"${file.name}" vượt quá ${MAX_UPLOAD_MB}MB. Chọn ảnh nhỏ hơn.`)
      return
    }

    clearBlob()
    const localUrl = URL.createObjectURL(file)
    blobUrlRef.current = localUrl
    fileRef.current = file
    setLocalPreview(localUrl)
    onChange('')
    void upload(file)
  }

  const handleRemove = () => {
    clearBlob()
    fileRef.current = null
    setLocalPreview(null)
    setState('idle')
    setError('')
    setCanRetry(false)
    onChange('')
  }

  const handleRetry = () => {
    if (fileRef.current) void upload(fileRef.current)
  }

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-[var(--color-title)]">{label}</span>
      {hint && <p className="text-sm text-[var(--color-muted)]">{hint}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 text-sm font-semibold text-[var(--color-title)] transition-colors hover:border-[var(--color-accent-border)]">
          {state === 'uploading' ? (
            <>
              <Spinner size={16} label="Đang tải ảnh lên" /> Đang tải lên…
            </>
          ) : (
            'Chọn ảnh'
          )}
          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFile}
            disabled={state === 'uploading'}
            className="sr-only"
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex h-11 items-center rounded-[10px] border border-[var(--color-danger)]/30 bg-[var(--color-danger-subtle)] px-4 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/20"
          >
            Bỏ ảnh
          </button>
        )}
        <span className="text-xs text-[var(--color-muted)]">
          JPEG / PNG / GIF / WebP, tối đa {MAX_UPLOAD_MB}MB
        </span>
      </div>

      {preview && (
        <div
          className={`relative w-full max-w-sm ${aspect} overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-1)]`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Xem trước ảnh đã chọn" className="h-full w-full object-cover" />
          {state === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Spinner size={24} label="Đang tải ảnh lên" />
            </div>
          )}
        </div>
      )}

      {state === 'failed' && (
        <InlineNotice tone="danger">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{error}</span>
            {canRetry && (
              <button
                type="button"
                onClick={handleRetry}
                className="font-semibold text-[var(--color-title)] underline underline-offset-2"
              >
                Thử tải lại
              </button>
            )}
          </div>
        </InlineNotice>
      )}

      {!preview && (
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
          className={inputClass}
          placeholder="/mods/anh-bia.jpg hoặc URL ảnh"
          aria-label={`${label} — nhập URL ảnh`}
        />
      )}
    </div>
  )
}
