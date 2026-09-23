'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminPage } from '../components/AdminPage'
import { AdminTable, AdminThead, AdminTh, AdminTr, AdminTd } from '../components/AdminTable'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAdminToast } from '../components/AdminShell'
import { adminFetch, adminFetchJson, adminErrorMessage, isAdminAuthError } from '../components/admin-api'
import { Button, ButtonLink, EmptyState, ErrorState, Field, InlineNotice, Spinner, inputClass } from '@/app/components/ui'

// =====================================================
// /admin/guides — danh sách bài hướng dẫn
// =====================================================

interface Guide {
  id: string
  title: string
  slug: string
  created_at: string
  updated_at: string
}

export default function AdminGuidesPage() {
  const toast = useAdminToast()
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authFailed, setAuthFailed] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Guide | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchGuides = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetchJson<Guide[]>('/api/admin/guides')
      setGuides(Array.isArray(data) ? data : [])
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Chưa tải được danh sách bài viết'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchGuides()
  }, [fetchGuides])

  const handleDelete = async () => {
    const guide = deleteTarget
    if (!guide?.id) return
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/guides/${guide.id}`, { method: 'DELETE' })
      setGuides((prev) => prev.filter((g) => g.id !== guide.id))
      toast(`Đã xóa bài viết “${guide.title}”`)
      setDeleteTarget(null)
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      setError(adminErrorMessage(err, 'Xóa bài viết thất bại'))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = search
    ? guides.filter(
        (g) =>
          g.title.toLowerCase().includes(search.toLowerCase()) ||
          g.slug.toLowerCase().includes(search.toLowerCase())
      )
    : guides

  if (authFailed) {
    return (
      <AdminPage>
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

  return (
    <AdminPage>
      <InlineNotice tone="accent" title="Bài viết liên quan">
        Khi tạo hoặc sửa bài, chọn tag phù hợp (Hướng dẫn mods, Career Mode, Thông tin game…) để mục
        Bài viết liên quan gợi ý đúng nhóm.
      </InlineNotice>

      <Field label="Tìm kiếm" className="max-w-md">
        {({ id }) => (
          <input
            id={id}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
            placeholder="Tiêu đề hoặc slug…"
          />
        )}
      </Field>

      {error && (
        <InlineNotice tone="danger">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchGuides()}
              className="font-semibold text-[var(--color-title)] underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        </InlineNotice>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-sm text-[var(--color-muted)]">
          <Spinner size={20} /> Đang tải danh sách bài viết…
        </div>
      ) : filtered.length === 0 ? (
        guides.length === 0 ? (
          <EmptyState
            title="Chưa có bài viết nào"
            description="Viết bài hướng dẫn đầu tiên để hiển thị trên site."
            action="Tạo bài viết mới"
            actionHref="/admin/guides/new"
          />
        ) : (
          <EmptyState
            title="Không có bài viết khớp từ khóa"
            description="Thử từ khóa khác."
            action="Xóa tìm kiếm"
            onAction={() => setSearch('')}
          />
        )
      ) : (
        <>
          {/* Bảng desktop */}
          <div className="hidden md:block">
            <AdminTable label="Danh sách bài hướng dẫn" minWidth={720}>
              <AdminThead>
                <tr>
                  <AdminTh>Tiêu đề</AdminTh>
                  <AdminTh>Slug</AdminTh>
                  <AdminTh>Ngày tạo</AdminTh>
                  <AdminTh>Cập nhật</AdminTh>
                  <AdminTh className="text-right">Thao tác</AdminTh>
                </tr>
              </AdminThead>
              <tbody>
                {filtered.map((guide) => (
                  <AdminTr key={guide.id}>
                    <AdminTd>
                      <span className="font-medium text-[var(--color-title)]">{guide.title}</span>
                    </AdminTd>
                    <AdminTd className="font-mono text-xs text-[var(--color-muted)]">
                      {guide.slug}
                    </AdminTd>
                    <AdminTd className="text-meta">
                      {new Date(guide.created_at).toLocaleDateString('vi-VN')}
                    </AdminTd>
                    <AdminTd className="text-meta">
                      {new Date(guide.updated_at).toLocaleDateString('vi-VN')}
                    </AdminTd>
                    <AdminTd className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ButtonLink href={`/huong-dan/${guide.slug}`} variant="ghost" size="sm" external>
                          Xem
                        </ButtonLink>
                        <ButtonLink href={`/admin/guides/${guide.id}/edit`} variant="ghost" size="sm">
                          Sửa
                        </ButtonLink>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(guide)}>
                          <span className="text-[var(--color-danger)]">Xóa</span>
                        </Button>
                      </div>
                    </AdminTd>
                  </AdminTr>
                ))}
              </tbody>
            </AdminTable>
          </div>

          {/* Thẻ mobile */}
          <ul className="space-y-3 md:hidden" aria-label="Danh sách bài viết">
            {filtered.map((guide) => (
              <li
                key={guide.id}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-4"
              >
                <p className="font-semibold text-[var(--color-title)]">{guide.title}</p>
                <p className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">
                  /huong-dan/{guide.slug}
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Cập nhật {new Date(guide.updated_at).toLocaleDateString('vi-VN')}
                </p>
                <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-line)] pt-3">
                  <ButtonLink href={`/huong-dan/${guide.slug}`} variant="secondary" size="sm" external>
                    Xem
                  </ButtonLink>
                  <ButtonLink href={`/admin/guides/${guide.id}/edit`} variant="secondary" size="sm">
                    Sửa
                  </ButtonLink>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(guide)}>
                    Xóa
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-meta text-[var(--color-muted)]">
            Hiển thị {filtered.length}/{guides.length} bài viết
          </p>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa bài viết"
        danger
        busy={deleting}
        confirmLabel="Xóa vĩnh viễn"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        description={
          deleteTarget && (
            <>
              Xóa vĩnh viễn bài viết{' '}
              <strong className="text-[var(--color-title)]">“{deleteTarget.title}”</strong>? Bài viết
              sẽ biến mất khỏi trang công khai ngay, không hoàn tác được.
            </>
          )
        }
      />
    </AdminPage>
  )
}
