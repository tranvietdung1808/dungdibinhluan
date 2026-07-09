'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

function AdminLoginContent() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin/dashboard'

  const syncAndRedirectIfAdmin = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return false
    const response = await fetch('/api/auth/admin-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return false
    router.push(redirect)
    return true
  }, [redirect, router])

  useEffect(() => {
    void syncAndRedirectIfAdmin()
  }, [syncAndRedirectIfAdmin])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const done = await syncAndRedirectIfAdmin()
      if (done) return
      const supabase = createClient()
      const callback = `/auth/callback?next=${encodeURIComponent(redirect)}`
      const { error: loginError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${callback}`,
        },
      })
      if (loginError) {
        setError('Không thể khởi động đăng nhập Google.')
      }
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="bg-[#111111] border border-white/10 rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl font-black tracking-widest text-white">ADMIN PANEL</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">DUNGDIBINHLUAN</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <p className="text-sm text-slate-400 text-center mb-6">
          Đăng nhập bằng Google với email admin để truy cập trang quản trị
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 bg-[var(--color-primary)] rounded-2xl font-black tracking-widest text-white hover:bg-[#b44c5c] transition-colors disabled:opacity-50"
        >
          {loading ? 'ĐANG XỬ LÝ...' : 'LOGIN WITH GOOGLE'}
        </button>

        <div className="mt-6 text-center">
          <a href="/" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
            ← Về trang chủ
          </a>
        </div>
      </div>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}
