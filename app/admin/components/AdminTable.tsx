import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

// =====================================================
// AdminTable — bảng dữ liệu admin thống nhất
// - Cuộn ngang trong vùng có nhãn khi hẹp
// - Th/Td mật độ admin, chữ tối thiểu 12px (B06)
// =====================================================

export function AdminTable({
  label,
  minWidth = 760,
  children,
}: {
  /** Tên vùng cuộn cho screen reader */
  label: string
  minWidth?: number
  children: ReactNode
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-1)]"
    >
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function AdminThead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[var(--color-line)] bg-[var(--color-surface-2)]">
      {children}
    </thead>
  )
}

export function AdminTh({
  className = '',
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] ${className}`}
      {...rest}
    >
      {children}
    </th>
  )
}

export function AdminTr({
  className = '',
  pending = false,
  children,
}: {
  className?: string
  /** Hàng đang lưu — giảm nổi bật, giữ trong bảng */
  pending?: boolean
  children: ReactNode
}) {
  return (
    <tr
      className={`border-b border-[var(--color-line)] last:border-0 transition-colors hover:bg-[var(--color-surface-2)]/50 ${
        pending ? 'opacity-60' : ''
      } ${className}`}
    >
      {children}
    </tr>
  )
}

export function AdminTd({
  className = '',
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td className={`px-4 py-3 align-middle text-[var(--color-body)] ${className}`} {...rest}>
      {children}
    </td>
  )
}
