'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type PendingComment = {
  id: string
  scope_type: string
  scope_id: string
  parent_id: string | null
  author_name: string
  author_avatar: string | null
  content: string
  is_admin_comment: boolean
  is_pinned: boolean
  status: string
  created_at: string
}

export default function AdminCommunityPage() {
  const [items, setItems] = useState<PendingComment[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const buildAuthHeaders = async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return null
    return { Authorization: `Bearer ${token}` }
  }

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const authHeaders = await buildAuthHeaders()
      if (!authHeaders) {
        setError('Bạn cần đăng nhập admin để kiểm duyệt')
        return
      }
      const response = await fetch('/api/admin/community', {
        cache: 'no-store',
        headers: authHeaders,
      })
      if (!response.ok) {
        setError('Không tải được danh sách kiểm duyệt')
        return
      }
      const data = await response.json()
      setItems(data || [])
    } catch {
      setError('Không tải được danh sách kiểm duyệt')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const pendingByScope = useMemo(() => {
    const pendingItems = items.filter((item) => item.status === 'pending')
    const guide = pendingItems.filter((item) => item.scope_type === 'guide').length
    const mods = pendingItems.filter((item) => item.scope_type === 'mods').length
    return { guide, mods }
  }, [items])

  const pendingItems = useMemo(() => items.filter((item) => item.status === 'pending'), [items])
  const approvedItems = useMemo(() => items.filter((item) => item.status === 'approved'), [items])

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdatingId(id)
    try {
      const authHeaders = await buildAuthHeaders()
      if (!authHeaders) {
        setError('Bạn cần đăng nhập admin để kiểm duyệt')
        return
      }
      const response = await fetch('/api/admin/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id, status }),
      })

      if (!response.ok) {
        setError('Không cập nhật được trạng thái')
        return
      }
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch {
      setError('Không cập nhật được trạng thái')
    } finally {
      setUpdatingId(null)
    }
  }

  const updatePin = async (id: string, isPinned: boolean) => {
    setUpdatingId(id)
    try {
      const authHeaders = await buildAuthHeaders()
      if (!authHeaders) {
        setError('Bạn cần đăng nhập admin để kiểm duyệt')
        return
      }
      const response = await fetch('/api/admin/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id, isPinned }),
      })

      if (!response.ok) {
        setError('Không cập nhật được trạng thái ghim')
        return
      }
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_pinned: isPinned } : item)))
    } catch {
      setError('Không cập nhật được trạng thái ghim')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="bg-[#111111] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-slate-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
            <h1 className="text-xl font-bold">Kiểm duyệt bình luận</h1>
          </div>
          <button
            type="button"
            onClick={loadItems}
            className="px-3 py-2 rounded-lg border border-white/15 text-xs text-slate-200 hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
            <p className="text-xs text-slate-400">Bình luận bài viết chờ duyệt</p>
            <p className="text-2xl font-black text-white mt-1">{pendingByScope.guide}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
            <p className="text-xs text-slate-400">Chia sẻ mod chờ duyệt</p>
            <p className="text-2xl font-black text-white mt-1">{pendingByScope.mods}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-slate-400">Đang tải dữ liệu...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#111111] p-6 text-slate-400">
            Không có bình luận nào chờ duyệt.
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-widest">Chờ duyệt</h2>
              <div className="space-y-3">
                {pendingItems.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-[#111111] p-4 text-sm text-slate-500">
                    Không có bình luận chờ duyệt.
                  </div>
                )}
                {pendingItems.map((item) => (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-[#111111] p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="rounded-full border border-white/15 px-2 py-0.5">
                        {item.scope_type === 'guide' ? 'Bài viết' : 'Chia sẻ mod'}
                      </span>
                      <span>ID scope: {item.scope_id}</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleString('vi-VN')}</span>
                      {item.parent_id && <span>• Trả lời bình luận</span>}
                    </div>
                    <p className="mt-2 text-sm text-white">
                      <span className="font-semibold">{item.author_name}: </span>
                      {item.content}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => updateStatus(item.id, 'approved')}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        Duyệt
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => updateStatus(item.id, 'rejected')}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-widest">Đã duyệt / Ghim</h2>
              <div className="space-y-3">
                {approvedItems.length === 0 && (
                  <div className="rounded-xl border border-white/10 bg-[#111111] p-4 text-sm text-slate-500">
                    Chưa có bình luận đã duyệt.
                  </div>
                )}
                {approvedItems.map((item) => (
                  <article key={item.id} className="rounded-xl border border-white/10 bg-[#111111] p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="rounded-full border border-white/15 px-2 py-0.5">
                        {item.scope_type === 'guide' ? 'Bài viết' : 'Chia sẻ mod'}
                      </span>
                      {item.is_pinned && (
                        <span className="rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 text-amber-300">
                          Đã ghim
                        </span>
                      )}
                      <span>ID scope: {item.scope_id}</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="mt-2 text-sm text-white">
                      <span className="font-semibold">{item.author_name}: </span>
                      {item.content}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={updatingId === item.id}
                        onClick={() => updatePin(item.id, !item.is_pinned)}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 disabled:opacity-50"
                      >
                        {item.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
