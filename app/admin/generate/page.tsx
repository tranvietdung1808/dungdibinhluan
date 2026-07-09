'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function GenerateCodePage() {
  const [codes, setCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [codeType, setCodeType] = useState<'normal' | 'mods'>('normal')
  const [adminKey, setAdminKey] = useState('')

  const genCode = async (count = 1) => {
    if (!adminKey) {
      alert('Vui lòng nhập admin key!')
      return
    }

    setLoading(true)
    const newCodes: string[] = []
    for (let i = 0; i < count; i++) {
      try {
        const res = await fetch('/api/gen-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminKey, type: codeType }),
        })
        const data = await res.json()
        if (data.code) {
          newCodes.push(data.code)
        } else {
          alert('Sai admin key hoặc lỗi!')
          break
        }
      } catch {
        alert('Lỗi kết nối server!')
        break
      }
    }
    setCodes(prev => [...newCodes, ...prev])
    setLoading(false)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(codes.join('\n'))
    alert('Đã copy tất cả!')
  }

  const logout = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/admin-session', { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = '/admin';
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <div className="bg-[#111111] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="text-slate-400 hover:text-white transition-colors">
                ← Dashboard
              </Link>
              <h1 className="text-lg font-bold">Generate Access Code</h1>
            </div>
            <Link
              href="/admin/guides"
              className="px-3 py-1 bg-[var(--color-primary)] text-white text-sm rounded-lg hover:bg-[#b44c5c] transition-colors"
            >
              Quản lý bài viết
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">

          {/* Admin Key Input */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 tracking-widest uppercase text-center">Nhập Admin Key</p>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-xl font-black tracking-widest">GENERATE CODE</h1>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">
              Code hiệu lực 24h & không giới hạn
            </p>
          </div>

          {/* Chọn loại code */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 tracking-widest uppercase text-center">Chọn loại code</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCodeType('normal')}
                className={`py-4 rounded-xl font-black text-xs tracking-widest border transition-all ${
                  codeType === 'normal'
                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                    : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                }`}
              >
                DUNG-xxxx
                <br />
                <span className="text-[9px] opacity-70 font-normal">Bản thường</span>
              </button>
              <button
                type="button"
                onClick={() => setCodeType('mods')}
                className={`py-4 rounded-xl font-black text-xs tracking-widest border transition-all ${
                  codeType === 'mods'
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                }`}
              >
                MODS-xxxx
                <br />
                <span className="text-[9px] opacity-70 font-normal">Full Mods</span>
              </button>
            </div>
          </div>

          {/* Gen buttons */}
          <div className="grid grid-cols-5 gap-3">
            {[1, 5, 10, 50, 100].map(count => (
              <button
                key={count}
                type="button"
                onClick={() => genCode(count)}
                disabled={loading}
                className="py-3 rounded-xl font-bold border border-white/10 text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                {loading ? '...' : `x${count}`}
              </button>
            ))}
          </div>

          {/* Results */}
          {codes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 tracking-widest uppercase">
                  Codes đã tạo ({codes.length})
                </p>
                <button
                  type="button"
                  onClick={copyAll}
                  className="px-3 py-1 text-[10px] font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
                >
                  COPY ALL
                </button>
              </div>
              <div className="bg-[#111111] border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto space-y-1">
                {codes.map((code, i) => (
                  <div
                    key={`${code}-${i}`}
                    className="flex items-center justify-between group hover:bg-white/[0.02] px-2 py-1 rounded"
                  >
                    <code className="text-xs font-mono text-[var(--color-primary)]">{code}</code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(code); alert('Đã copy!') }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-white transition-all"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={logout}
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
