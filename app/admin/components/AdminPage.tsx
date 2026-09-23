import type { ReactNode } from 'react'

// =====================================================
// AdminPage — vùng nội dung chuẩn trong AdminShell
// §16.1: danh sách rộng (tối đa ~1280px), form tối đa ~960px
// =====================================================

export function AdminPage({
  size = 'wide',
  className = '',
  children,
}: {
  /** wide: danh sách/bảng (~1280px) · form: biểu mẫu (~960px) */
  size?: 'wide' | 'form'
  className?: string
  children: ReactNode
}) {
  const maxW = size === 'form' ? 'max-w-[960px]' : 'max-w-[1280px]'
  return <div className={`mx-auto w-full ${maxW} space-y-6 ${className}`}>{children}</div>
}
