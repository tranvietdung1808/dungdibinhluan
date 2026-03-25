'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const CATEGORIES = ['All-in-One', 'Faces', 'Kits', 'Gameplay', 'Đồ họa', 'Cơ chế game'] as const

interface ModForm {
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
  name: '',
  author: '',
  category: 'Faces',
  version: '',
  updatedAt: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  description: '',
  longDescription: '',
  thumbnail: '',
  downloadUrl: '',
  tags: '',
  thumbnailOrientation: 'portrait',
  featured: false,
  videoId: '',
}

// Function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim()
}

// Function to format date from YYYY-MM-DD to dd/mm/yyyy
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

export default function AdminDashboard() {
  const [form, setForm] = useState<ModForm>(initialForm)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
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

  const handleNameChange = (value: string) => {
    setForm(prev => ({ 
      ...prev, 
      name: value,
      // Auto-generate slug when name changes
      slug: generateSlug(value)
    }))
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
        setError('Upload failed: ' + (errorData.error || response.statusText))
      }
    } catch (err) {
      setError('Upload failed: ' + err)
    } finally {
      setIsUploadingThumbnail(false)
      e.target.value = ''
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    handleChange('thumbnail', url)
    // Only set preview if it's a valid URL and no file is uploaded
    if (url && !blobUrlRef.current) {
      setThumbnailPreview(url)
    } else if (!url && !blobUrlRef.current) {
      setThumbnailPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate required fields
    if (!form.name || !form.author || !form.version || !form.updatedAt) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc')
      setLoading(false)
      return
    }

    // Generate slug from name
    const slug = generateSlug(form.name)

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
          slug,
          name: form.name,
          author: form.author,
          category: form.category,
          version: form.version,
          updated_at: formatDateForDisplay(form.updatedAt),
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
        // Reset form
        setForm({
          ...initialForm,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        setThumbnailPreview(null)
        revokeBlobUrl()
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
                href="/"
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Trang chủ
              </Link>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <Link
              href="/admin/mods"
              className="px-4 py-2 bg-[#111111] border border-white/10 text-sm rounded-lg hover:bg-white/10 transition-colors"
            >
              Quản lý Mods
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Truy cập nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quản lý bài viết */}
            <Link
              href="/admin/guides"
              className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[#ce5a67]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#ce5a67]/20 rounded-lg flex items-center justify-center group-hover:bg-[#ce5a67]/30 transition-colors">
                  <svg className="w-6 h-6 text-[#ce5a67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Quản lý bài viết</h3>
                  <p className="text-slate-400 text-sm">Tạo và sửa bài hướng dẫn</p>
                </div>
              </div>
              <div className="flex items-center text-[#ce5a67] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">Quản lý ngay</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Generate Code */}
            <Link
              href="/admin/generate"
              className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[#ce5a67]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#ce5a67]/20 rounded-lg flex items-center justify-center group-hover:bg-[#ce5a67]/30 transition-colors">
                  <svg className="w-6 h-6 text-[#ce5a67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Generate Code</h3>
                  <p className="text-slate-400 text-sm">Tạo code unlock</p>
                </div>
              </div>
              <div className="flex items-center text-[#ce5a67] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">Tạo ngay</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Quản lý Mods List */}
            <Link
              href="/admin/mods"
              className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[#ce5a67]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#ce5a67]/20 rounded-lg flex items-center justify-center group-hover:bg-[#ce5a67]/30 transition-colors">
                  <svg className="w-6 h-6 text-[#ce5a67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Danh sách Mods</h3>
                  <p className="text-slate-400 text-sm">Xem, sửa, xóa mods</p>
                </div>
              </div>
              <div className="flex items-center text-[#ce5a67] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">Xem danh sách</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/admin/community"
              className="group bg-[#111111] border border-white/10 rounded-xl p-6 hover:border-[#ce5a67]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(206,90,103,0.15)]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#ce5a67]/20 rounded-lg flex items-center justify-center group-hover:bg-[#ce5a67]/30 transition-colors">
                  <svg className="w-6 h-6 text-[#ce5a67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Kiểm duyệt bình luận</h3>
                  <p className="text-slate-400 text-sm">Duyệt comment bài viết và chia sẻ mod</p>
                </div>
              </div>
              <div className="flex items-center text-[#ce5a67] group-hover:text-[#b44c5c] transition-colors">
                <span className="text-sm font-medium">Mở kiểm duyệt</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Add Mod Form */}
        <div className="border-t border-white/10 pt-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Thêm Mod mới</h2>
            <p className="text-slate-400">Slug sẽ được tự động tạo từ tên mod</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Single column mobile-optimized layout */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                placeholder="MIX MODS FC 26"
                required
              />
              {form.name && (
                <p className="text-xs text-slate-500 mt-1">
                  Slug: {generateSlug(form.name)}
                </p>
              )}
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

            {/* Category and Version - Two columns on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Updated At - Date picker */}
            <div>
              <label htmlFor="updatedAt" className="block text-sm font-medium text-white mb-2">
                Updated At *
              </label>
              <input
                id="updatedAt"
                type="date"
                value={form.updatedAt}
                onChange={(e) => handleChange('updatedAt', e.target.value)}
                className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ce5a67] transition-colors"
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

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Thumbnail
              </label>
              <div className="space-y-4">
                {/* File upload */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="px-4 py-2 bg-[#111111] border border-white/10 text-white text-sm rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-center">
                    {isUploadingThumbnail ? 'Đang upload...' : 'Chọn ảnh thumbnail'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      disabled={isUploadingThumbnail}
                      className="hidden"
                    />
                  </label>
                  {blobUrlRef.current && (
                    <button
                      type="button"
                      onClick={handleClearThumbnail}
                      className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Xóa ảnh upload
                    </button>
                  )}
                </div>

                {/* URL input - always show */}
                <input
                  type="text"
                  value={form.thumbnail}
                  onChange={handleUrlChange}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#ce5a67] transition-colors"
                  placeholder="/mods/thumbnail.jpg hoặc URL"
                />

                {/* Preview */}
                {thumbnailPreview && (
                  <div className="relative w-full aspect-video bg-[#111111] border border-white/10 rounded-lg overflow-hidden">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
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

            {/* Thumbnail Orientation and Featured - Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Thumbnail Orientation
                </label>
                <div className="space-y-3">
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

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Options
                </label>
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

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
              Xem danh sách
            </Link>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
