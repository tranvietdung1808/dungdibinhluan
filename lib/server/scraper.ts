// =====================================================
// Scraper engine tổng quát — cấu hình theo từng nguồn
// Mỗi website có selector riêng, lưu trong bảng scraper_sources
// =====================================================
import { supabaseAdmin } from '@/lib/supabase'
import { createR2Client } from '@/utils/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import OpenAI from 'openai'
import { load } from 'cheerio'
import {
  createMod,
  getModSlugBySlug,
  normalizeCreateModPayload,
} from '@/lib/server/mods'

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'dungdibinhluan-images'

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0 Safari/537.36',
}

// Tags hợp lệ (đồng bộ với site)
const VALID_TAGS = ['Kits', 'Gameplay', 'Đồ họa', 'Cơ chế game']

// ── Types ──
export interface ScraperSourceInput {
  name?: string
  base_url?: string
  list_urls?: string[]
  link_allow_pattern?: string
  blocked_slugs?: string[]
  title_selector?: string
  image_selector?: string
  content_selectors?: string[]
  download_selector?: string
  download_exclude_selector?: string
  download_exclude_pattern?: string
  enabled?: boolean
}

export interface ScraperSourceRow {
  id: string
  name: string
  base_url: string
  list_urls: string[]
  link_allow_pattern: string
  blocked_slugs: string[]
  title_selector: string
  image_selector: string
  content_selectors: string[]
  download_selector: string
  download_exclude_selector: string
  download_exclude_pattern: string
  enabled: boolean
  created_at: string
  updated_at: string
}

// ── Utils ──
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const hasCyrillic = (text?: string | null) => Boolean(text && /[\u0400-\u04FF]/.test(text))

function slugFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const parts = pathname.split('/').filter(Boolean)
    return parts[parts.length - 1] || ''
  } catch {
    return ''
  }
}

function generateFileName(ext: string) {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
}

// ── OpenAI (DeepSeek) singleton ──
let openaiClient: OpenAI | null = null
function getOpenAI(): OpenAI | null {
  if (!process.env.DEEPSEEK_API_KEY) return null
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    })
  }
  return openaiClient
}

// ── Dịch fallback bằng Google Translate (không cần key) ──
async function translateFallback(text: string, targetLang = 'en') {
  if (!text || text.trim().length < 3) return text
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url, { headers: FETCH_HEADERS })
    if (!res.ok) return text
    const data = await res.json()
    return data[0]?.map((seg: string[]) => seg[0]).join('') || text
  } catch {
    return text
  }
}

// ── Dịch tiêu đề bằng DeepSeek (fallback khi Google bị 429) ──
async function translateTitleViaAI(title: string): Promise<string | null> {
  const client = getOpenAI()
  if (!client || !title) return null
  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `Dịch tiêu đề bài viết sau sang tiếng Anh (giữ nguyên tên riêng, số phiên bản, thẻ tag mod). Chỉ trả về bản dịch, không thêm giải thích:\n\n${title}`,
        },
      ],
      temperature: 0.3,
    })
    return response.choices[0]?.message?.content?.trim() || null
  } catch (err) {
    console.error('[scraper] AI title translate error:', (err as Error).message)
    return null
  }
}

// ── Dịch + phân loại tags bằng DeepSeek ──
async function aiProcessContent(rawContent: string) {
  const fallback = {
    short_description: rawContent.substring(0, 150),
    long_description: rawContent,
    tags: ['Cơ chế game'],
  }
  const client = getOpenAI()
  if (!client || !rawContent) return fallback

  try {
    const prompt = `Bạn là một AI chuyên dịch thuật về game bóng đá (FC 24, FC 26, FIFA). Hãy đọc bài viết giới thiệu mod sau và thực hiện 2 việc:
1. Dịch bài viết sang tiếng Việt chuẩn xác và tự nhiên:
   - "long_description": Dịch toàn bộ nội dung này sang tiếng Việt rõ ràng, mượt mà.
   - "short_description": Viết đúng 1 câu mô tả ngắn tiếng Việt (dưới 150 ký tự) từ bài dịch.
2. Chọn thẻ (tags) chính xác: phân loại vào 1 hoặc tối đa 3 thẻ trong danh sách ĐƯỢC PHÉP: ["Kits", "Gameplay", "Đồ họa", "Cơ chế game"].
   * Tuyệt đối KHÔNG DÙNG thẻ "Faces".

Trả về đúng JSON (không markdown):
{"short_description":"...","long_description":"...","tags":["Tag1","Tag2"]}

Nội dung bài viết:
${rawContent.substring(0, 3000)}`

    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    })

    let rawText = response.choices[0]?.message?.content?.trim() || ''
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

    const parsed = JSON.parse(rawText)
    if (!parsed.short_description) parsed.short_description = fallback.short_description
    if (!parsed.long_description) parsed.long_description = fallback.long_description
    if (!Array.isArray(parsed.tags) || parsed.tags.length === 0) parsed.tags = fallback.tags

    parsed.tags = parsed.tags.filter((t: string) => VALID_TAGS.includes(t))
    if (parsed.tags.length === 0) parsed.tags = ['Cơ chế game']

    return parsed
  } catch (err) {
    console.error('[scraper] AI process error:', (err as Error).message)
    return fallback
  }
}

// ── Upload ảnh lên R2 ──
async function uploadImageFromUrl(imageUrl?: string | null): Promise<string | null> {
  if (!imageUrl) return null
  try {
    const res = await fetch(encodeURI(imageUrl), { headers: FETCH_HEADERS })
    if (!res.ok) return null

    const contentType = res.headers.get('content-type') || 'image/webp'
    const buffer = Buffer.from(await res.arrayBuffer())
    const ext = contentType.includes('jpeg') || contentType.includes('jpg')
      ? 'jpg'
      : contentType.includes('png')
        ? 'png'
        : 'webp'
    const fileName = generateFileName(ext)

    const r2 = createR2Client()
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
      })
    )

    return `/api/media/${fileName}`
  } catch (err) {
    console.error('[scraper] image upload error:', (err as Error).message)
    return null
  }
}

// ── Trích link tải (config-driven) ──
function extractDownloadLink(source: ScraperSourceRow, $: ReturnType<typeof load>): string | null {
  let link: string | null = null
  const excludePattern = source.download_exclude_pattern
    ? new RegExp(source.download_exclude_pattern, 'i')
    : null
  const excludeSelector = source.download_exclude_selector || ''

  $(source.download_selector || 'a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim()
    if (!href || href.startsWith('/')) return
    if (excludeSelector && $(el).closest(excludeSelector).length) return
    if (excludePattern && excludePattern.test(href)) return
    if (!link) link = href
  })
  return link
}

// ── Trích danh sách link bài từ trang danh sách ──
function extractPostLinks(source: ScraperSourceRow, html: string): string[] {
  const $ = load(html)
  const allow = source.link_allow_pattern ? new RegExp(source.link_allow_pattern) : null
  const blocked = new Set(source.blocked_slugs || [])
  const links: string[] = []
  const base = (source.base_url || '').replace(/\/$/, '')

  $('a[href]').each((_, el) => {
    let href = ($(el).attr('href') || '').trim()
    if (!href || href.startsWith('#')) return
    if (href.startsWith('/')) href = base + href
    if (!/^https?:\/\//i.test(href)) return
    href = href.split('#')[0]
    if (allow && !allow.test(href)) return
    const slug = slugFromUrl(href)
    if (!slug || blocked.has(slug)) return
    if (!links.includes(href)) links.push(href)
  })

  return links
}

// ── Cào 1 bài viết ──
async function scrapePost(source: ScraperSourceRow, url: string) {
  try {
    const res = await fetch(encodeURI(url), { headers: FETCH_HEADERS })
    if (!res.ok) return null
    const html = await res.text()
    const $ = load(html)

    const title = $(source.title_selector || 'h1').first().text().trim() || ''
    let imageUrl =
      $(source.image_selector || 'meta[property="og:image"]').attr('content') ||
      $(source.image_selector || 'meta[property="og:image"]').attr('src') ||
      null
    if (!imageUrl) imageUrl = $('article img').first().attr('src') || null

    let content = ''
    const contentSelector = (source.content_selectors || []).filter(Boolean).join(', ')
    if (contentSelector) {
      $(contentSelector).each((_, el) => {
        const text = $(el).text().trim()
        if (text && text.length > 5 && !text.includes('No Comments')) {
          content += text + '\n\n'
        }
      })
    }
    if (!content.trim()) content = $('article').text().trim().substring(0, 2000)

    return {
      title,
      imageUrl,
      content,
      downloadLink: extractDownloadLink(source, $),
      slug: slugFromUrl(url),
    }
  } catch {
    return null
  }
}

// =====================================================
// SOURCE CRUD
// =====================================================
export function listSources() {
  return supabaseAdmin.from('scraper_sources').select('*').order('created_at', { ascending: false })
}

export function getSource(id: string) {
  return supabaseAdmin.from('scraper_sources').select('*').eq('id', id).maybeSingle()
}

export async function createSource(input: ScraperSourceInput) {
  return supabaseAdmin.from('scraper_sources').insert(input).select().single()
}

export async function updateSource(id: string, input: ScraperSourceInput) {
  return supabaseAdmin.from('scraper_sources').update(input).eq('id', id).select().single()
}

export function deleteSource(id: string) {
  return supabaseAdmin.from('scraper_sources').delete().eq('id', id)
}

// =====================================================
// ITEMS (bài chờ duyệt)
// =====================================================
export function listItems(status?: string, sourceId?: string) {
  let query = supabaseAdmin
    .from('scraper_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  if (sourceId) query = query.eq('source_id', sourceId)
  return query
}

export function getItem(id: string) {
  return supabaseAdmin.from('scraper_items').select('*').eq('id', id).maybeSingle()
}

const EDITABLE_ITEM_FIELDS = [
  'name',
  'author',
  'category',
  'version',
  'description',
  'tags',
  'thumbnail_orientation',
] as const

export function updateItem(id: string, fields: Record<string, unknown>) {
  const updates: Record<string, unknown> = {}
  for (const key of EDITABLE_ITEM_FIELDS) {
    if (key in fields) updates[key] = fields[key]
  }
  return supabaseAdmin.from('scraper_items').update(updates).eq('id', id).select().single()
}

export function deleteItem(id: string) {
  return supabaseAdmin.from('scraper_items').delete().eq('id', id)
}

export async function setItemsStatus(ids: string[], status: string) {
  return supabaseAdmin.from('scraper_items').update({ status }).in('id', ids)
}

// =====================================================
// CHẠY CÀO cho 1 nguồn
// =====================================================
export async function scrapeSource(source: ScraperSourceRow) {
  const stats = { scanned: 0, new_items: 0, duplicates: 0, failed: 0 }

  for (const listUrl of source.list_urls || []) {
    if (!listUrl) continue
    let res: Response
    try {
      res = await fetch(encodeURI(listUrl), { headers: FETCH_HEADERS })
    } catch {
      continue
    }
    if (!res.ok) continue

    const html = await res.text()
    const links = extractPostLinks(source, html)

    for (const url of links) {
      stats.scanned++
      const slug = slugFromUrl(url)
      if (!slug) {
        stats.failed++
        continue
      }

      // Chống trùng: đã có trong mods?
      const { data: existingMod } = await getModSlugBySlug(slug)
      if (existingMod) {
        stats.duplicates++
        continue
      }

      // Chống trùng: đã có trong scraper_items (pending/published)?
      const { data: existingItem } = await supabaseAdmin
        .from('scraper_items')
        .select('id')
        .eq('slug', slug)
        .in('status', ['pending', 'published'])
        .maybeSingle()
      if (existingItem) {
        stats.duplicates++
        continue
      }

      const post = await scrapePost(source, url)
      if (!post || !post.downloadLink) {
        stats.failed++
        continue
      }

      // Dịch tiêu đề
      let finalTitle = post.title
      if (hasCyrillic(post.title)) {
        finalTitle = await translateFallback(post.title, 'en')
        if (!finalTitle || hasCyrillic(finalTitle)) {
          const aiTitle = await translateTitleViaAI(post.title)
          if (aiTitle) finalTitle = aiTitle
        }
      }

      const ai = await aiProcessContent(post.content)
      const longDescriptionHtml = ai.long_description
        ? ai.long_description
            .split('\n\n')
            .map((p: string) => `<p class="my-3 text-gray-200 leading-relaxed">${p}</p>`)
            .join('\n')
        : ''

      const thumbnail = await uploadImageFromUrl(post.imageUrl)

      const { error } = await supabaseAdmin.from('scraper_items').insert({
        source_id: source.id,
        source_name: source.name,
        url,
        slug,
        name: finalTitle,
        original_title: post.title,
        author: 'FIFA MODS',
        category: ai.tags[0] || 'Cơ chế game',
        version: '1.0',
        description: ai.short_description || finalTitle,
        long_description: ai.long_description || '',
        long_description_html: longDescriptionHtml,
        thumbnail: thumbnail || '',
        download_url: post.downloadLink,
        tags: ai.tags,
        thumbnail_orientation: 'landscape',
        status: 'pending',
        raw: { title: post.title, imageUrl: post.imageUrl },
      })

      if (error) stats.failed++
      else stats.new_items++

      await delay(400)
    }
  }

  return stats
}

// =====================================================
// PUBLISH — đưa bài chờ duyệt vào bảng mods (đúng format)
// =====================================================
export async function publishItems(ids: string[]) {
  const summary = { published: 0, duplicates: 0, failed: 0 }

  const { data: items } = await supabaseAdmin
    .from('scraper_items')
    .select('*')
    .in('id', ids)

  if (!items || items.length === 0) return summary

  for (const item of items) {
    // Chống trùng: slug đã có trong mods?
    const { data: existingMod } = await getModSlugBySlug(item.slug)
    if (existingMod) {
      await supabaseAdmin
        .from('scraper_items')
        .update({ status: 'duplicate', duplicate_reason: 'Slug đã tồn tại trong mods' })
        .eq('id', item.id)
      summary.duplicates++
      continue
    }

    // Chống trùng: trùng link tải?
    if (item.download_url) {
      const { data: dup } = await supabaseAdmin
        .from('mods')
        .select('id')
        .eq('download_url', item.download_url)
        .maybeSingle()
      if (dup) {
        await supabaseAdmin
          .from('scraper_items')
          .update({ status: 'duplicate', duplicate_reason: 'Trùng link tải (download_url)' })
          .eq('id', item.id)
        summary.duplicates++
        continue
      }
    }

    const now = new Date()
    const updatedAt = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()}`

    // Đồng bộ đúng format bảng mods (ảnh, mô tả, tags, orientation...)
    const payload = normalizeCreateModPayload({
      slug: item.slug,
      name: item.name,
      author: item.author || 'FIFA MODS',
      category: item.category || 'Cơ chế game',
      version: item.version || '1.0',
      updated_at: updatedAt,
      description: item.description || '',
      long_description: item.long_description_html || item.long_description || '',
      thumbnail: item.thumbnail || null,
      download_url: item.download_url || null,
      tags: item.tags || [],
      thumbnail_orientation: item.thumbnail_orientation || 'landscape',
    })

    const { error } = await createMod(payload)
    if (error) {
      if (error.code === '23505') {
        await supabaseAdmin
          .from('scraper_items')
          .update({ status: 'duplicate', duplicate_reason: 'Trùng slug (unique constraint)' })
          .eq('id', item.id)
        summary.duplicates++
      } else {
        summary.failed++
      }
      continue
    }

    await supabaseAdmin.from('scraper_items').update({ status: 'published' }).eq('id', item.id)
    summary.published++
  }

  return summary
}
