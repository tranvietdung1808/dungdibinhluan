'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [adminKey, setAdminKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Verify admin key with API
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Save to sessionStorage
        sessionStorage.setItem('admin_authenticated', 'true')
        // Redirect to dashboard
        router.push('/admin/dashboard')
      } else {
        setError(data.error || 'Sai admin key!')
      }
    } catch {
      setError('Lỗi kết nối server!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-black tracking-widest text-white">ADMIN PANEL</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">DUNGDIBINHLUAN</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <input
          type="password"
          placeholder="Nhập admin key..."
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#ce5a67] transition-colors text-white"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest hover:bg-[#b44c5c] transition-colors disabled:opacity-50"
        >
          {loading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
        </button>
      </form>
    </main>
  )
}
