'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface ShowcaseImage {
  id: string
  slug: string
  image_url: string
  caption: string | null
  sort_order: number
  created_at: string
}

const MAX_UPLOAD_MB = 5

export default function AdminModShowcasePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const [slug, setSlug] = useState<string | null>(null)
  const [images, setImages] = useState<ShowcaseImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    params.then(({ slug }) => {
      if (!cancelled) setSlug(slug)
    })
    return () => {
      cancelled = true
    }
  }, [params])

  const fetchImages = useCallback(async (targetSlug: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/showcases?slug=${encodeURIComponent(targetSlug)}`)
      if (res.ok) {
        const data = await res.json()
        setImages(data.images || [])
      } else {
        const err = await res.json().catch(() => ({}))
        setError(err.error || 'Không tải được danh sách ảnh')
      }
    } catch {
      setError('Có lỗi xảy ra khi tải danh sách')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (slug) void fetchImages(slug)
  }, [slug, fetchImages])

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Upload thất bại: ${file.name}`)
    }
    const data = await res.json()
    return data.url
  }

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !slug) return

    setUploading(true)
    setError('')
    const added: string[] = []

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError(`"${file.name}" không phải ảnh — đã bỏ qua`)
          continue
        }
        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
          setError(`"${file.name}" quá ${MAX_UPLOAD_MB}MB — đã bỏ qua`)
          continue
        }
        const url = await uploadFile(file)
        const res = await fetch('/api/admin/showcases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, image_url: url }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Lưu "${file.name}" thất bại`)
        }
        added.push(file.name)
      }

      if (added.length) {
        setToast(`Đã thêm ${added.length} ảnh!`)
        await fetchImages(slug)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa ảnh này khỏi showcase?')) return
    try {
      const res = await fetch(`/api/admin/showcases/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id))
        setToast('Đã xóa ảnh')
      } else {
        const err = await res.json().catch(() => ({}))
        setError(err.error || 'Xóa thất bại')
      }
    } catch {
      setError('Có lỗi xảy ra khi xóa')
    }
  }

  const handleSaveCaption = async (id: string, caption: string) => {
    try {
      const res = await fetch(`/api/admin/showcases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      })
      if (res.ok) {
        setImages((prev) =>
          prev.map((img) => (img.id === id ? { ...img, caption } : img))
        )
        setToast('Đã lưu chú thích')
      }
    } catch {
      setError('Lưu chú thích thất bại')
    }
  }

  // Kéo-thả sắp xếp (HTML5 drag & drop)
  const persistOrder = async (ordered: ShowcaseImage[]) => {
    if (!slug) return
    try {
      const res = await fetch('/api/admin/showcases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          ids: ordered.map((img) => img.id),
        }),
      })
      if (res.ok) {
        setToast('Đã cập nhật thứ tự')
      } else {
        setError('Cập nhật thứ tự thất bại')
      }
    } catch {
      setError('Có lỗi xảy ra khi sắp xếp')
    }
  }

  const onDropAt = (targetIndex: number) => {
    if (draggedIndex === null) return
    if (draggedIndex === targetIndex) return

    const reordered = [...images]
    const [moved] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    setImages(reordered)
    setDraggedIndex(null)
    void persistOrder(reordered)
  }

  if (!slug) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/mods"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Quay lại
              </Link>
              <div>
                <h1 className="text-lg md:text-xl font-bold">Quản lý Showcase</h1>
                <p className="text-slate-500 text-xs mt-0.5 font-mono">/{slug}</p>
              </div>
            </div>
            <Link
              href={`/mods/${slug}`}
              target="_blank"
              className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:text-white hover:border-white/25 transition-colors"
            >
              Xem trang mod →
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Upload */}
        <section className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
          <p className="text-2xl mb-2">🖼️</p>
          <h2 className="text-base font-bold">Thêm ảnh showcase</h2>
          <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
            JPG / PNG / WebP, tối đa {MAX_UPLOAD_MB}MB mỗi ảnh. Chọn nhiều ảnh cùng lúc — ảnh đầu sẽ
            được dùng làm ảnh chính (nếu muốn đổi, hãy kéo-thả để đưa ảnh mong muốn lên đầu).
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {uploading ? 'Đang upload...' : '+ Chọn ảnh để upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddImages}
            disabled={uploading}
            className="hidden"
          />
        </section>

        {/* Danh sách ảnh hiện có */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">
              Ảnh hiện có{' '}
              <span className="text-slate-500 font-normal text-sm">({images.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              💡 Kéo-thả các thẻ để đổi thứ tự
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Đang tải...</div>
          ) : images.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <p className="text-slate-500 text-sm">
                Chưa có ảnh showcase. Hãy upload ảnh ở mục bên trên — chúng sẽ hiển thị ngay trên
                trang chi tiết MIX MODS.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropAt(index)}
                  onDragEnd={() => setDraggedIndex(null)}
                  className={`group rounded-xl border border-white/10 bg-[#111111] overflow-hidden transition-all ${
                    draggedIndex === index ? 'opacity-40' : ''
                  } cursor-grab active:cursor-grabbing`}
                >
                  <div className="relative aspect-video bg-[#0c0c0c]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.image_url}
                      alt={image.caption || `Showcase ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[var(--color-primary)] text-[9px] font-black tracking-wider text-white">
                        Ảnh chính
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/70 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-colors backdrop-blur-sm"
                      title="Xóa ảnh"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-2.5">
                    <input
                      type="text"
                      defaultValue={image.caption || ''}
                      placeholder="Chú thích (tùy chọn)"
                      onBlur={(e) => {
                        const value = e.target.value.trim()
                        if (value !== (image.caption || '')) handleSaveCaption(image.id, value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      }}
                      className="w-full px-2.5 py-1.5 bg-[#0c0c0c] border border-white/10 rounded-md text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
