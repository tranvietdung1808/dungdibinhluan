'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if on login page - exempt from auth check
    if (pathname === '/admin') {
      setIsLoading(false)
      return
    }

    // Check authentication
    const adminAuth = sessionStorage.getItem('admin_authenticated')
    if (!adminAuth) {
      router.push('/admin')
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [pathname, router])

  // Show loading state
  if (isLoading && pathname !== '/admin') {
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
