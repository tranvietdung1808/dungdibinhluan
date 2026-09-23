'use client'

import { use, useEffect, useState } from 'react'
import { AdminPage } from '../../../components/AdminPage'
import { ModForm, modToFormState, type ModFormState } from '../../../components/mods/ModForm'
import { adminFetchJson, adminErrorMessage, isAdminAuthError } from '../../../components/admin-api'
import { ErrorState, Spinner } from '@/app/components/ui'

interface ModDetail {
  slug: string
  name: string
  author: string
  category: string
  version: string
  updated_at: string
  description: string | null
  long_description: string | null
  thumbnail: string | null
  download_url: string | null
  tags: string[] | null
  thumbnail_orientation: string | null
  featured: boolean | null
  video_id: string | null
  credit_enabled?: boolean
  credit_cost?: number | null
}

export default function EditModPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [initial, setInitial] = useState<ModFormState | null>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [authFailed, setAuthFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await adminFetchJson<ModDetail>(
          `/api/admin/mods/${encodeURIComponent(slug)}`
        )
        if (!cancelled) setInitial(modToFormState(data))
      } catch (err) {
        if (cancelled) return
        if (isAdminAuthError(err)) setAuthFailed(true)
        else if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404)
          setNotFound(true)
        else setError(adminErrorMessage(err, 'Chưa tải được dữ liệu mod'))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (authFailed) {
    return (
      <AdminPage size="form">
        <ErrorState
          title="Không còn quyền quản trị"
          description="Phiên đăng nhập hết hạn hoặc tài khoản không còn quyền admin. Đăng nhập lại để tiếp tục."
          onRetry={() => {
            window.location.href = '/admin'
          }}
          retryLabel="Đăng nhập lại"
        />
      </AdminPage>
    )
  }

  if (notFound) {
    return (
      <AdminPage size="form">
        <ErrorState
          title={`Không tìm thấy mod “${slug}”`}
          description="Mod có thể đã bị xóa hoặc slug không đúng."
          onRetry={() => {
            window.location.href = '/admin/mods'
          }}
          retryLabel="Về danh sách mod"
        />
      </AdminPage>
    )
  }

  if (error) {
    return (
      <AdminPage size="form">
        <ErrorState
          title="Chưa tải được dữ liệu mod"
          description={error}
          onRetry={() => window.location.reload()}
        />
      </AdminPage>
    )
  }

  if (!initial) {
    return (
      <AdminPage size="form">
        <div className="flex items-center gap-3 py-10 text-sm text-[var(--color-muted)]">
          <Spinner size={20} /> Đang tải dữ liệu mod…
        </div>
      </AdminPage>
    )
  }

  return (
    <AdminPage size="form">
      <ModForm mode="edit" initial={initial} modSlug={slug} />
    </AdminPage>
  )
}
