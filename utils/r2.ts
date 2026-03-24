import { S3Client } from '@aws-sdk/client-s3'

export function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  })
}

/** Key do upload tạo: `<timestamp>-<random>.<ext>` */
const UPLOADED_OBJECT_KEY = /^[0-9]+-[a-z0-9]+\.[a-z0-9]+$/i

/**
 * Ảnh lưu trong DB có thể là URL R2 không public → map sang proxy cùng origin.
 */
export function resolveThumbnailSrc(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const u = url.trim()
  if (u.startsWith('/api/media/')) return u
  if (u.startsWith('/')) return u

  try {
    const { pathname } = new URL(u)
    const key = pathname.split('/').filter(Boolean).pop() ?? ''
    if (UPLOADED_OBJECT_KEY.test(key)) {
      return `/api/media/${encodeURIComponent(key)}`
    }
  } catch {
    return u
  }
  return u
}

/**
 * Trong HTML bài viết, <img src="…"> có thể vẫn là URL R2 không public → map sang /api/media/...
 */
export function rewriteImageSrcInHtml(html: string): string {
  if (!html) return html
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const m = tag.match(/\bsrc\s*=\s*(["'])([^"']*)\1/i)
    if (!m) return tag
    const q = m[1]
    const src = m[2].trim().replace(/&amp;/g, '&')
    const resolved = resolveThumbnailSrc(src) || src
    return tag.replace(/\bsrc\s*=\s*(["'])([^"']*)\1/i, `src=${q}${resolved}${q}`)
  })
}
