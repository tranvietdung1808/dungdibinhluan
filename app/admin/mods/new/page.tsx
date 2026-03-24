'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = ['All-in-One', 'Faces', 'Kits', 'Gameplay', 'Đồ họa', 'Cơ chế game'] as const

interface ModForm {
  slug: string
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

const initialForm: ModForm = {
  slug: '',
  name: '',
  author: '',
  category: 'Faces',
  version: '',
  updatedAt: '',
  description: '',
  longDescription: '',
  thumbnail: '',
  downloadUrl: '',
  tags: '',
  thumbnailOrientation: 'portrait',
  featured: false,
  videoId: '',
}

export default function NewModPage() {
  const [form, setForm] = useState<ModForm>(initialForm)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const router = useRouter()
  const blobUrlRef = useRef<string | null>(null)

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }

  useEffect(() => () => revokeBlobUrl(), [])

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

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
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.url) {
          setForm(prev => ({ ...prev, thumbnail: data.url }))
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert('Upload failed: ' + (errorData.error || response.statusText))
      }
    } catch (error) {
      alert('Upload failed: ' + error)
    } finally {
      setIsUploadingThumbnail(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate required fields
    if (!form.slug || !form.name || !form.author || !form.version || !form.updatedAt) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc')
      setLoading(false)
      return
    }

    // Parse tags
    const tags = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    try {
      const response = await fetch('/api/admin/mods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: form.slug,
          name: form.name,
          author: form.author,
          category: form.category,
          version: form.version,
          updated_at: form.updatedAt,
          description: form.description,
          long_description: form.longDescription,
          thumbnail: form.thumbnail || null,
          download_url: form.downloadUrl || null,
          tags,
          thumbnail_orientation: form.thumbnailOrientation,
          featured: form.featured,
          video_id: form.videoId || null,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setToast('Thêm mod thành công!')
        setTimeout(() => {
          router.push('/admin/mods')
        }, 1000)
      } else {
        setError(data.error || 'Có lỗi xảy ra khi thêm mod')
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearThumbnail = () => {
    revokeBlobUrl()
    setForm(prev => ({ ...prev, thumbnail: '' }))
    setThumbnailPreview(null)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/mods"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Quay lại
              </Link>
              <h1 className="text-xl font-bold">Thêm Mod mới</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-6">
              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-white mb-2">
                  Slug *
                </label>
                <input
                  id="slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                  placeholder="mix-mods-fc26"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                  placeholder="MIX MODS FC 26"
                  required
                />
              </div>

              {/* Author */}
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-white mb-2">
                  Author *
                </label>
                <input
                  id="author"
                  type="text"
                  value={form.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                  placeholder="DungDiBinhLuan"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ce5a67] transition-colors"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Version */}
              <div>
                <label htmlFor="version" className="block text-sm font-medium text-white mb-2">
                  Version *
                </label>
                <input
                  id="version"
                  type="text"
                  value={form.version}
                  onChange={(e) => handleChange('version', e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                  placeholder="v1.0"
                  required
                />
              </div>

              {/* Updated At */}
              <div>
                <label htmlFor="updatedAt" className="block text-sm font-medium text-white mb-2">
                  Updated At *
                </label>
                <input
                  id="updatedAt"
                  type="text"
                  value={form.updatedAt}
                  onChange={(e) => handleChange('updatedAt', e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                  placeholder="dd/mm/yyyy"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors resize-none"
                  placeholder="Mô tả ngắn..."
                />
              </div>

              {/* Long Description */}
              <div>
                <label htmlFor="longDescription" className="block text-sm font-medium text-white mb-2">
                  Long Description
                </label>
                <textarea
                  id="longDescription"
                  value={form.longDescription}
                  onChange={(e) => handleChange('longDescription', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors resize-none"
                  placeholder="Mô tả chi tiết..."
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Thumbnail
                </label>
                <div className="space-y-4">
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
                        onClick={handleClearThumbnail}
                        className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {thumbnailPreview && (
                    <div className="relative w-full aspect-video bg-[#111111] border border-white/10 rounded-lg overflow-hidden">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {!thumbnailPreview && (
                    <input
                      type="url"
                      value={form.thumbnail}
                      onChange={(e) => {
                        handleChange('thumbnail', e.target.value)
                        setThumbnailPreview(e.target.value || null)
                      }}
                      className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                      placeholder="/mods/thumbnail.jpg hoặc URL"
                    />
                  )}
                </div>
              </div>

              {/* Download URL */}
              <div>
                <label htmlFor="downloadUrl" className="block text-sm font-medium text-white mb-2">
                  Download URL
                </label>
                <input
                  id="downloadUrl"
                  type="url"
                  value={form.downloadUrl}
                  onChange={(e) => handleChange('downloadUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-white mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  type="text"
                  value={form.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                  placeholder="Faces, Kits, Gameplay"
                />
              </div>

              {/* Thumbnail Orientation */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Thumbnail Orientation
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="thumbnailOrientation"
                      value="portrait"
                      checked={form.thumbnailOrientation === 'portrait'}
                      onChange={() => handleChange('thumbnailOrientation', 'portrait')}
                      className="w-4 h-4 accent-[#ce5a67]"
                    />
                    <span className="text-sm">Portrait (default)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="thumbnailOrientation"
                      value="landscape"
                      checked={form.thumbnailOrientation === 'landscape'}
                      onChange={() => handleChange('thumbnailOrientation', 'landscape')}
                      className="w-4 h-4 accent-[#ce5a67]"
                    />
                    <span className="text-sm">Landscape</span>
                  </label>
                </div>
              </div>

              {/* Featured */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => handleChange('featured', e.target.checked)}
                    className="w-4 h-4 accent-[#ce5a67]"
                  />
                  <span className="text-sm font-medium">Featured</span>
                </label>
              </div>

              {/* Video ID */}
              <div>
                <label htmlFor="videoId" className="block text-sm font-medium text-white mb-2">
                  Video ID (optional)
                </label>
                <input
                  id="videoId"
                  type="text"
                  value={form.videoId}
                  onChange={(e) => handleChange('videoId', e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                  placeholder="Vimeo video ID (e.g., 1176297958)"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#ce5a67] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang lưu...' : 'Lưu mod'}
            </button>
            <Link
              href="/admin/mods"
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
