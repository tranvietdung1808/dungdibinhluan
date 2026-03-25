'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdminLogin() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'

  const syncAndRedirectIfAdmin = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return false
    const response = await fetch('/api/auth/admin-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      return false
    }
    router.push(redirect)
    return true
  }, [redirect, router])

  useEffect(() => {
    void syncAndRedirectIfAdmin()
  }, [syncAndRedirectIfAdmin])

  const handleGoogleAdminLogin = async () => {
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/10 rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-slate-400">Đăng nhập Google bằng email admin để truy cập trang quản trị</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={loading}
            className="w-full px-4 py-3 bg-[#ce5a67] text-white font-semibold rounded-lg hover:bg-[#b44c5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Login with Google (Admin)'}
          </button>
        </div>
      </div>
    </div>
  )
}
