'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { InlineNotice } from '@/app/components/ui/states'

function AdminLoginContent() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin/dashboard'
  const forbidden = searchParams.get('error') === 'forbidden'

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
    if (!forbidden) void syncAndRedirectIfAdmin()
  }, [syncAndRedirectIfAdmin, forbidden])

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
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-0)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-black tracking-widest text-[var(--color-title)]">
            QUẢN TRỊ
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-[var(--color-muted)]">
            DungDiBinhLuan
          </p>
        </div>

        {forbidden && (
          <InlineNotice tone="danger" className="mb-4">
            Tài khoản này không có quyền quản trị. Hãy đăng nhập bằng email admin.
          </InlineNotice>
        )}
        {error && (
          <InlineNotice tone="danger" className="mb-4">
            {error}
          </InlineNotice>
        )}

        <p className="mb-6 text-center text-sm text-[var(--color-muted)]">
          Đăng nhập bằng Google với email admin để truy cập trang quản trị
        </p>

        <Button type="button" onClick={handleGoogleLogin} loading={loading} fullWidth size="lg">
          {loading ? 'Đang xử lý…' : 'Đăng nhập bằng Google'}
        </Button>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-title)]"
          >
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--color-surface-0)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        </main>
      }
    >
      <AdminLoginContent />
    </Suspense>
  )
}
