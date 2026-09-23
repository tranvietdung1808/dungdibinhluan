'use client'

import type { ReactNode } from 'react'
import { Dialog } from '@/app/components/ui/Dialog'
import { Button } from '@/app/components/ui/Button'

// =====================================================
// ConfirmDialog — xác nhận hành động quan trọng/phá hủy
// Ghi rõ đối tượng bị ảnh hưởng trong description.
// =====================================================

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onClose={busy ? () => {} : onCancel} label={title}>
      <h2 className="text-h3 text-[var(--color-title)]">{title}</h2>
      {description && (
        <div className="mt-3 text-sm leading-relaxed text-[var(--color-body)]">{description}</div>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
