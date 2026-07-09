'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin'
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false)
      return
    }

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
          router.replace('/admin')
        } else {
          setChecking(false)
        }
      }
    }

    void verify()
    return () => { cancelled = true }
  }, [isLoginPage, pathname, router])

  if (!isLoginPage && checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Đang kiểm tra...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {children}
    </div>
  )
}
