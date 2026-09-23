'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AdminPage } from '../components/AdminPage'
import { SourceManager, type Source } from '../components/scraper/SourceManager'
import { ScraperItems } from '../components/scraper/ScraperItems'
import { useAdminToast } from '../components/AdminShell'
import { adminFetch, adminFetchJson, adminJson, adminErrorMessage, isAdminAuthError } from '../components/admin-api'
import { ErrorState, InlineNotice } from '@/app/components/ui'

// =====================================================
// /admin/scraper — hai vùng rõ ràng (§16.9)
// 1) Nguồn thu thập  2) Nội dung đã thu thập
// Thu thập là đồng bộ → chỉ hiển thị "Đang thu thập…"
// + thời gian trôi, không vẽ % tiến độ giả.
// =====================================================

export default function AdminScraperPage() {
  const toast = useAdminToast()
  const [sources, setSources] = useState<Source[]>([])
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [authFailed, setAuthFailed] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [runningSource, setRunningSource] = useState<Source | null>(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [runError, setRunError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

  const fetchSources = useCallback(async () => {
    setSourcesLoading(true)
    try {
      const data = await adminFetchJson<{ sources: Source[] }>('/api/admin/scraper/sources')
      setSources(data.sources || [])
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
    } finally {
      setSourcesLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSources()
  }, [fetchSources])

  // Đồng hồ thời gian trôi khi đang thu thập
  useEffect(() => {
    if (runningSource) {
      setElapsedSec(0)
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [runningSource])

  const handleRun = async (source: Source) => {
    if (runningSource) return
    setRunError('')
    setRunningSource(source)
    try {
      const res = await adminFetch(
        '/api/admin/scraper/run',
        adminJson('POST', { sourceId: source.id })
      )
      const d = (await res.json().catch(() => ({}))) as {
        stats?: { new_items?: number; duplicates?: number; failed?: number }
      }
      if (d.stats) {
        toast(
          `“${source.name}”: ${d.stats.new_items ?? 0} mục mới, ${d.stats.duplicates ?? 0} trùng, ${d.stats.failed ?? 0} lỗi — trong ${elapsedSec}s`
        )
      } else {
        toast(`Đã thu thập xong “${source.name}” trong ${elapsedSec}s`)
      }
      // Chuyển bộ lọc nội dung về nguồn vừa chạy + refetch
      setSourceFilter(source.id)
      setRefreshToken((t) => t + 1)
      itemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      if (isAdminAuthError(err)) setAuthFailed(true)
      else setRunError(adminErrorMessage(err, `Thu thập từ “${source.name}” thất bại`))
    } finally {
      setRunningSource(null)
    }
  }

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
      {runError && <InlineNotice tone="danger">{runError}</InlineNotice>}

      <SourceManager
        sources={sources}
        loading={sourcesLoading}
        onRefresh={fetchSources}
        onAuthLost={() => setAuthFailed(true)}
        runningSourceId={runningSource?.id ?? null}
        elapsedSec={elapsedSec}
        onRun={handleRun}
      />

      <div ref={itemsRef} className="scroll-mt-24">
        <ScraperItems
          sources={sources}
          sourceFilter={sourceFilter}
          onSourceFilter={setSourceFilter}
          refreshToken={refreshToken}
          onAuthLost={() => setAuthFailed(true)}
        />
      </div>
    </AdminPage>
  )
}
