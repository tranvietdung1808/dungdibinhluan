'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Mod {
  id: string
  slug: string
  name: string
  author: string
  category: string
  version: string
  updated_at: string
  featured: boolean
  created_at: string
}

export default function AdminModsPage() {
  const [mods, setMods] = useState<Mod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMods()
  }, [])

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mod "${name}" không?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/mods/${slug}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMods(mods.filter(mod => mod.slug !== slug))
      } else {
        const errorData = await response.json()
        alert('Xóa thất bại: ' + errorData.error)
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa')
    }
  }

  const fetchMods = async () => {
    try {
      const response = await fetch('/api/admin/mods')
      if (response.ok) {
        const data = await response.json()
        setMods(data || [])
      } else {
        setError('Failed to fetch mods')
      }
    } catch (err) {
      setError('Error fetching mods')
    } finally {
      setLoading(false)
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
              <h1 className="text-2xl font-bold">Quản lý Mods</h1>
              <p className="text-slate-400 mt-1">Tổng cộng: {mods.length} mods</p>
            </div>
            <Link
              href="/admin/mods/new"
              className="px-4 py-2 bg-[#ce5a67] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors"
            >
              + Thêm mod mới
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {mods.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">Chưa có mod nào.</p>
            <Link
              href="/admin/mods/new"
              className="inline-block mt-4 px-4 py-2 bg-[#ce5a67] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors"
            >
              Thêm mod đầu tiên
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Slug</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Author</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Version</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Updated</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Featured</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mods.map((mod) => (
                  <tr key={mod.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <span className="font-medium">{mod.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{mod.slug}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs">{mod.category}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{mod.author}</td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{mod.version}</td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{mod.updated_at}</td>
                    <td className="py-3 px-4">
                      {mod.featured ? (
                        <span className="text-yellow-400">⭐</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/mods/${mod.slug}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                          target="_blank"
                        >
                          Xem
                        </Link>
                        <span className="text-slate-600">|</span>
                        <Link
                          href={`/admin/mods/${mod.slug}/edit`}
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          Sửa
                        </Link>
                        <span className="text-slate-600">|</span>
                        <button
                          onClick={() => handleDelete(mod.slug, mod.name)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
