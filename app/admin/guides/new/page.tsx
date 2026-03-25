'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/app/components/RichTextEditor'
import { slugFromTitle } from '@/utils/slug'
import { GUIDE_FIXED_TAGS } from '@/lib/related-content'

export default function NewGuidePage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
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

  // Auto-generate slug from title (bỏ dấu tiếng Việt trước)
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setSlug(slugFromTitle(newTitle))
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    revokeBlobUrl()
    const localUrl = URL.createObjectURL(file)
    blobUrlRef.current = localUrl
    setThumbnailPreview(localUrl)
    setThumbnailUrl('')

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
        const looksOk =
          remoteUrl !== '' && data.success !== false

        if (looksOk) {
          // Chỉ lưu URL gửi API; giữ preview = blob để <img> không phụ thuộc URL public (403/sai path).
          setThumbnailUrl(remoteUrl)
        } else if (data.success === true && !remoteUrl) {
          setThumbnailUrl('')
        } else {
          setError(
            'Upload failed: ' + (data?.error || 'Invalid response')
          )
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
    setLoading(true)
    setError('')

    if (!title || !slug || !content) {
      setError('Vui lòng điền đầy đủ tiêu đề, slug và nội dung')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/guides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          thumbnail_url: thumbnailUrl || null,
          tags: selectedTags,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/guides`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Có lỗi xảy ra khi tạo bài viết')
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#111111] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/guides"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Quay lại
              </Link>
              <h1 className="text-xl font-bold">Tạo bài viết mới</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-[#ce5a67]/35 bg-[#ce5a67]/10 px-4 py-4">
            <h2 className="text-sm font-semibold text-white">Vận hành mục Bài viết liên quan</h2>
            <p className="mt-1 text-xs text-slate-300">
              Chọn tag thủ công để hệ thống hiển thị bài viết liên quan đúng nhóm.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Có thể chọn một hoặc nhiều tag tùy nội dung bài.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#ce5a67] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang lưu...' : 'Lưu bài viết'}
            </button>
          </div>
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
              Tiêu đề *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
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
              Slug sẽ được tự động tạo từ tiêu đề
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tags cho bài viết liên quan
            </label>
            <div className="flex flex-wrap gap-2">
              {GUIDE_FIXED_TAGS.map((tag) => {
                const selected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected ? 'border-[#ce5a67] bg-[#ce5a67]/20 text-white' : 'border-white/20 bg-white/5 text-slate-300 hover:border-white/40'}`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
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
                    onChange={handleThumbnailChange}
                    disabled={isUploadingThumbnail}
                    className="hidden"
                  />
                </label>
                
                {thumbnailPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      revokeBlobUrl()
                      setThumbnailUrl('')
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
                    value={thumbnailUrl}
                    onChange={(e) => {
                      const v = e.target.value
                      setThumbnailUrl(v)
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
            <RichTextEditor content={content} onChange={setContent} />
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
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#ce5a67] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang lưu...' : 'Lưu bài viết'}
            </button>
            <Link
              href="/admin/guides"
              className="px-6 py-3 bg-[#111111] border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-center"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
