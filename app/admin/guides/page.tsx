'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Guide {
  id: string
  title: string
  slug: string
  created_at: string
  updated_at: string
}

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGuides()
  }, [])

  const fetchGuides = async () => {
    try {
      const response = await fetch('/api/admin/guides')
      if (response.ok) {
        const guides = await response.json()
        setGuides(guides || [])
      } else {
        setError('Failed to fetch guides')
      }
    } catch (err) {
      setError('Error fetching guides')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    console.log('Deleting guide ID:', id)
    console.log('Guide title:', title)
    
    if (!id || id === 'undefined') {
      alert('Lỗi: ID bài viết không hợp lệ')
      return
    }
    
    if (!confirm(`Bạn có chắc muốn xóa bài viết "${title}" không?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/guides/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from local state
        setGuides(guides.filter(guide => guide.id !== id))
      } else {
        const errorData = await response.json()
        alert('Xóa thất bại: ' + errorData.error)
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#ce5a67] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#111111] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Quản lý bài viết</h1>
              <p className="text-slate-400 mt-1">Tổng cộng: {guides.length} bài viết</p>
            </div>
            <Link
              href="/admin/guides/new"
              className="px-4 py-2 bg-[#ce5a67] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors"
            >
              + Tạo bài viết mới
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 rounded-xl border border-[#ce5a67]/35 bg-[#ce5a67]/10 px-4 py-4">
          <h2 className="text-sm font-semibold text-white">Hướng dẫn vận hành nội dung liên quan</h2>
          <p className="mt-1 text-xs text-slate-300">
            Khi tạo hoặc sửa bài, admin cần chọn tag: Hướng dẫn mods, Hướng dẫn Career Mode, hoặc Thông tin game.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Mục Bài viết liên quan sẽ lấy theo tag đã chọn và ưu tiên bài mới hơn.
          </p>
        </div>
        {error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Chưa có bài viết nào</h3>
            <p className="text-slate-400 mb-6">
              Bắt đầu tạo bài viết đầu tiên của bạn
            </p>
            <Link
              href="/admin/guides/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ce5a67] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo bài viết mới
            </Link>
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Cập nhật
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {guides.map((guide, index) => {
                  console.log(`Guide ${index}:`, guide)
                  console.log(`Guide ${index} ID:`, guide.id)
                  console.log(`Guide ${index} keys:`, Object.keys(guide))
                  return (
                    <tr key={guide.id || index} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{guide.title}</div>
                      <div className="text-slate-500 text-xs">ID: {guide.id || 'NO ID'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-400 text-sm">{guide.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-400 text-sm">
                        {new Date(guide.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-400 text-sm">
                        {new Date(guide.updated_at).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/huong-dan/${guide.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition-colors"
                        >
                          Xem
                        </a>
                        <Link
                          href={`/admin/guides/${guide.id}/edit`}
                          className="px-3 py-1 bg-[#ce5a67]/20 text-[#ce5a67] text-sm rounded hover:bg-[#ce5a67]/30 transition-colors"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDelete(guide.id, guide.title)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30 transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
