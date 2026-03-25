'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin'
  const hasAuth = typeof window !== 'undefined' && Boolean(sessionStorage.getItem('admin_authenticated'))

  useEffect(() => {
    if (!isLoginPage && !hasAuth) {
      router.replace('/admin')
    }
  }, [hasAuth, isLoginPage, router])

  if (!isLoginPage && !hasAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#ce5a67] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
