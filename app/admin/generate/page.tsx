'use client'

import { useRef, useState } from 'react'
import { AdminPage } from '../components/AdminPage'
import { useAdminToast } from '../components/AdminShell'
import { Button, Field, InlineNotice, inputClass } from '@/app/components/ui'
import {
  MANUAL_CODE_OPTIONS,
  type ManualCodeType,
} from '@/lib/payment/manual-code'

// =====================================================
// /admin/generate — tạo mã truy cập (§16.8)
// Giữ nguyên cơ chế admin-key riêng (endpoint /api/gen-code
// dùng adminKey, KHÔNG đổi auth). Hiển thị loại mã, số
// lượng, tiến trình; lỗi giữa chừng vẫn giữ mã đã tạo.
// =====================================================

const QUANTITIES = [1, 5, 10, 50, 100]

export default function GenerateCodePage() {
  const toast = useAdminToast()
  const [codes, setCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [codeType, setCodeType] = useState<ManualCodeType>('fc27')
  const [adminKey, setAdminKey] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const cancelRef = useRef(false)

  const genCode = async (count: number) => {
    if (!adminKey.trim()) {
      setError('Vui lòng nhập admin key trước')
      return
    }
    setError('')
    setLoading(true)
    cancelRef.current = false
    setProgress({ done: 0, total: count })

    let firstError = ''
    for (let i = 0; i < count; i++) {
      if (cancelRef.current) break
      try {
        const res = await fetch('/api/gen-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminKey: adminKey.trim(), type: codeType }),
        })
        const data = (await res.json().catch(() => ({}))) as { code?: string; error?: string }
        if (res.ok && data.code) {
          setCodes((prev) => [data.code as string, ...prev])
        } else {
          firstError =
            res.status === 401
              ? 'Admin key không đúng'
              : data.error || `Lỗi ${res.status}`
          break
        }
      } catch {
        firstError = 'Lỗi kết nối server'
        break
      }
      setProgress({ done: i + 1, total: count })
    }

    setLoading(false)
    setProgress(null)
    if (firstError) {
      setError(`${firstError} — các mã đã tạo vẫn được giữ lại bên dưới`)
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500)
    } catch {
      setError('Không copy được — hãy chọn và copy thủ công')
    }
  }

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      toast(`Đã copy ${codes.length} mã`)
    } catch {
      setError('Không copy được — hãy chọn và copy thủ công')
    }
  }

  return (
    <AdminPage size="form">
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5">
        <h2 className="text-base font-bold text-[var(--color-title)]">Tạo mã truy cập</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Mã có hiệu lực 24 giờ, dùng được nhiều lần. Endpoint này dùng admin key riêng — không liên
          quan tới phiên đăng nhập admin.
        </p>

        <div className="mt-5 space-y-5">
          <Field label="Admin key" required hint="Khóa riêng của endpoint tạo mã">
            {({ id, describedBy }) => (
              <input
                id={id}
                aria-describedby={describedBy}
                type="password"
                autoComplete="off"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className={inputClass}
                placeholder="Nhập admin key…"
              />
            )}
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-[var(--color-title)]">
              Loại mã
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(MANUAL_CODE_OPTIONS) as ManualCodeType[]).map((t) => {
                const active = codeType === t
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCodeType(t)}
                    className={`rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      active
                        ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)]'
                        : 'border-[var(--color-line)] bg-[var(--color-surface-2)] hover:border-[var(--color-accent-border)]'
                    }`}
                  >
                    <span
                      className={`block font-mono text-sm font-bold ${
                        active ? 'text-[var(--color-title)]' : 'text-[var(--color-body)]'
                      }`}
                    >
                      {MANUAL_CODE_OPTIONS[t].label}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--color-muted)]">
                      {MANUAL_CODE_OPTIONS[t].hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-[var(--color-title)]">
              Số lượng
            </legend>
            <div className="flex flex-wrap gap-2">
              {QUANTITIES.map((count) => (
                <Button
                  key={count}
                  type="button"
                  variant="secondary"
                  onClick={() => void genCode(count)}
                  disabled={loading}
                >
                  ×{count}
                </Button>
              ))}
            </div>
          </fieldset>

          {progress && (
            <InlineNotice tone="accent">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent"
                  aria-hidden="true"
                />
                <span>
                  Đang tạo {progress.done}/{progress.total} mã{' '}
                  {MANUAL_CODE_OPTIONS[codeType].label}…
                </span>
                <button
                  type="button"
                  onClick={() => {
                    cancelRef.current = true
                  }}
                  className="ml-auto text-xs font-semibold text-[var(--color-title)] underline underline-offset-2"
                >
                  Dừng
                </button>
              </div>
            </InlineNotice>
          )}

          {error && <InlineNotice tone="danger">{error}</InlineNotice>}
        </div>
      </section>

      {/* Kết quả */}
      {codes.length > 0 && (
        <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-title)]">
              Mã đã tạo <span className="tabular text-[var(--color-muted)]">({codes.length})</span>
            </h2>
            <Button variant="secondary" size="sm" onClick={copyAll}>
              Copy tất cả
            </Button>
          </div>
          <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto" aria-label="Danh sách mã đã tạo">
            {codes.map((code, i) => (
              <li
                key={`${code}-${i}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--color-surface-2)]"
              >
                <code className="font-mono text-sm font-semibold text-[var(--color-accent)]">
                  {code}
                </code>
                <button
                  type="button"
                  onClick={() => void copyCode(code)}
                  aria-label={`Copy mã ${code}`}
                  className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-title)]"
                >
                  {copied === code ? 'Đã copy ✓' : 'Copy'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AdminPage>
  )
}
