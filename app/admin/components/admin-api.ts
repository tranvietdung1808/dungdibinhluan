'use client'

import { createClient } from '@/utils/supabase/client'

// =====================================================
// admin-api — helpers fetch cho khu vực quản trị
// - Tự gắn Bearer token Supabase khi có session
// - Ném AdminApiError có status để UI phân biệt 401/403/404/409/500
// - T20: mất quyền admin giữa phiên → báo lỗi quyền, không render như tải thành công
// =====================================================

export class AdminApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
  }
}

/** Lấy access token Supabase hiện tại (null nếu chưa đăng nhập) */
export async function getAdminToken(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/** Headers xác thực cho các endpoint ensureAdmin (Bearer token) */
export async function getAdminAuthHeaders(): Promise<Record<string, string> | null> {
  const token = await getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : null
}

async function readErrorMessage(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}))
  const msg = (data as { error?: string })?.error
  return typeof msg === 'string' && msg.trim() ? msg : res.statusText
}

/**
 * Fetch có gắn Bearer token (khi có) và ném AdminApiError khi !res.ok.
 * Endpoint cookie-based (mods, upload, showcases…) vẫn hoạt động bình thường.
 */
export async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = await getAdminToken().catch(() => null)
  const headers = new Headers(init?.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    throw new AdminApiError(res.status, await readErrorMessage(res))
  }
  return res
}

/** adminFetch + parse JSON body */
export async function adminFetchJson<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  const res = await adminFetch(input, init)
  return (await res.json()) as T
}

/** POST/PATCH/DELETE JSON tiện dụng */
export function adminJson(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

/** true khi lỗi là mất quyền / hết phiên (401/403) */
export function isAdminAuthError(err: unknown): boolean {
  return err instanceof AdminApiError && (err.status === 401 || err.status === 403)
}

/** Thông điệp tiếng Việt cho lỗi API admin, phân biệt mã trạng thái */
export function adminErrorMessage(err: unknown, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (err instanceof AdminApiError) {
    if (err.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    if (err.status === 403) return 'Tài khoản của bạn không còn quyền quản trị.'
    if (err.status === 404) return err.message && err.message !== 'Not Found' ? err.message : 'Không tìm thấy dữ liệu.'
    if (err.status === 409) return err.message || 'Dữ liệu bị xung đột (đã tồn tại hoặc đang được sử dụng).'
    if (err.status === 429) return 'Thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.'
    return err.message || fallback
  }
  return fallback
}
