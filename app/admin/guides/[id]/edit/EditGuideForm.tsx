'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/app/components/RichTextEditor'

interface Guide {
  id: string
  title: string
  slug: string
  content: string
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export default function EditGuideForm({ guide }: { guide: Guide }) {
  const [title, setTitle] = useState(guide.title)
  const [slug, setSlug] = useState(guide.slug)
  const [storedThumbnailUrl, setStoredThumbnailUrl] = useState(
    guide.thumbnail_url || ''
  )
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    guide.thumbnail_url || null
  )
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [content, setContent] = useState(guide.content)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const blobUrlRef = useRef<string | null>(null)

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  useEffect(() => () => revokeBlobUrl(), [])

  useEffect(() => {
    setTitle(guide.title)
    setSlug(guide.slug)
    setContent(guide.content)
    revokeBlobUrl()
    setStoredThumbnailUrl(guide.thumbnail_url || '')
    setThumbnailPreview(guide.thumbnail_url || null)
  }, [
    guide.id,
    guide.title,
    guide.slug,
    guide.content,
    guide.thumbnail_url,
  ])

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    revokeBlobUrl()
    const localUrl = URL.createObjectURL(file)
    blobUrlRef.current = localUrl
    setThumbnailPreview(localUrl)
    setStoredThumbnailUrl('')

    setIsUploadingThumbnail(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const remoteUrl =
          typeof data?.url === 'string' ? data.url.trim() : ''
        const ok = remoteUrl !== '' && data.success !== false
        if (ok) {
          setStoredThumbnailUrl(remoteUrl)
        } else if (data.success !== false) {
          setError('Upload failed: ' + (data?.error || 'No URL returned'))
        } else {
          setError('Upload failed: ' + (data?.error || 'Invalid response'))
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError('Upload failed: ' + (errorData.error || response.statusText))
      }
    } catch (error) {
      setError('Upload failed: ' + error)
    } finally {
      setIsUploadingThumbnail(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!title || !slug || !content) {
      setError('Vui lòng điền đầy đủ tiêu đề, slug và nội dung')
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/guides/${guide.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          thumbnail_url: storedThumbnailUrl || null,
        }),
      })

      if (response.ok) {
        router.push('/admin/guides')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Có lỗi xảy ra khi cập nhật bài viết')
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
          Tiêu đề *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
          placeholder="Nhập tiêu đề bài viết"
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-white mb-2">
          Slug *
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
          placeholder="tieu-de-bai-viet"
          required
        />
        <p className="text-slate-500 text-sm mt-1">
          Slug sẽ được dùng trong URL: /huong-dan/{slug}
        </p>
      </div>

      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Thumbnail (tùy chọn)
        </label>
        
        <div className="space-y-4">
          {/* Upload button */}
          <div className="flex items-center gap-4">
            <label className="px-4 py-2 bg-[#111111] border border-white/10 text-white text-sm rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              {isUploadingThumbnail ? 'Đang upload...' : 'Chọn ảnh thumbnail'}
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={isUploadingThumbnail}
                className="hidden"
              />
            </label>
            
            {thumbnailPreview && (
              <button
                type="button"
                onClick={() => {
                  revokeBlobUrl()
                  setStoredThumbnailUrl('')
                  setThumbnailPreview(null)
                }}
                className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Preview */}
          {thumbnailPreview && (
            <div className="relative w-full h-48 bg-[#111111] border border-white/10 rounded-lg overflow-hidden">
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Manual URL input (backup) */}
          {!thumbnailPreview && (
            <div className="text-center">
              <p className="text-slate-500 text-sm mb-2">Hoặc nhập URL thủ công:</p>
              <input
                type="url"
                value={storedThumbnailUrl}
                onChange={(e) => {
                  const v = e.target.value
                  setStoredThumbnailUrl(v)
                  setThumbnailPreview(v ? v : null)
                }}
                className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Nội dung *
        </label>
        <RichTextEditor initialContent={content} onChange={setContent} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-6 py-3 bg-[#ce5a67] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
        <Link
          href="/admin/guides"
          className="px-6 py-3 bg-[#111111] border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-center"
        >
          Hủy
        </Link>
      </div>
    </form>
  )
}
