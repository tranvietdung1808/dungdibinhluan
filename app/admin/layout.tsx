'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import AdminShell from './components/AdminShell'
import { Spinner } from '@/app/components/ui/states'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin'
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isLoginPage) return

    let cancelled = false
    const verify = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      if (!token) {
        router.replace('/admin')
        return
      }

      const res = await fetch('/api/auth/admin-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!cancelled) {
        if (!res.ok) {
          // 403: user hợp lệ nhưng không phải admin — báo rõ ở trang đăng nhập
          router.replace(res.status === 403 ? '/admin?error=forbidden' : '/admin')
        } else {
          setChecking(false)
        }
      }
    }

    void verify()
    return () => {
      cancelled = true
    }
  }, [isLoginPage, pathname, router])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-0)]">
        <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
          <Spinner size={22} label="Đang kiểm tra quyền truy cập" />
          Đang kiểm tra quyền truy cập…
        </div>
      </div>
    )
  }

  return <AdminShell>{children}</AdminShell>
}
