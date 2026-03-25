import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/utils/supabase/database.types'
import { GUIDE_FIXED_TAGS } from '@/lib/related-content'

type GuideInsert = Database['public']['Tables']['guides']['Insert']
type GuideUpdate = Database['public']['Tables']['guides']['Update']

export type GuidePayload = {
  title?: string
  slug?: string
  content?: string
  thumbnail_url?: string | null
  tags?: string[]
}

const REQUIRED_GUIDE_FIELDS: Array<keyof GuidePayload> = ['title', 'slug', 'content']
export const ADMIN_AUTHOR_ID = '00000000-0000-0000-0000-000000000001'

function getSupabase() {
  return createClient()
}

export function missingRequiredGuideFields(payload: GuidePayload) {
  return REQUIRED_GUIDE_FIELDS.filter((field) => {
    const value = payload[field]
    if (typeof value === 'string') return value.trim().length === 0
    return value === null || value === undefined
  })
}

export function normalizeGuideInsertPayload(payload: GuidePayload): GuideInsert {
  const allowedTags = new Set<string>(GUIDE_FIXED_TAGS)
  const normalizedTags = [...new Set((payload.tags || []).filter((tag) => allowedTags.has(tag)))]
  return {
    title: payload.title!,
    slug: payload.slug!,
    content: payload.content!,
    thumbnail_url: payload.thumbnail_url || null,
    tags: normalizedTags,
    author_id: ADMIN_AUTHOR_ID,
  }
}

export function normalizeGuideUpdatePayload(payload: GuidePayload): GuideUpdate {
  const allowedTags = new Set<string>(GUIDE_FIXED_TAGS)
  const normalizedTags = [...new Set((payload.tags || []).filter((tag) => allowedTags.has(tag)))]
  return {
    title: payload.title!,
    slug: payload.slug!,
    content: payload.content!,
    thumbnail_url: payload.thumbnail_url || null,
    tags: normalizedTags,
    updated_at: new Date().toISOString(),
  }
}

export async function listGuides() {
  return getSupabase()
    .from('guides')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getGuideById(id: string) {
  return getSupabase().from('guides').select('*').eq('id', id).maybeSingle()
}

export async function findGuideBySlug(slug: string) {
  return getSupabase().from('guides').select('id').eq('slug', slug).maybeSingle()
}

export async function findGuideBySlugExcludingId(slug: string, id: string) {
  return getSupabase()
    .from('guides')
    .select('id')
    .eq('slug', slug)
    .neq('id', id)
    .maybeSingle()
}

export async function createGuide(payload: GuideInsert) {
  return getSupabase().from('guides').insert([payload]).select().single()
}

export async function updateGuide(id: string, payload: GuideUpdate) {
  return getSupabase().from('guides').update(payload).eq('id', id).select().maybeSingle()
}

export async function deleteGuide(id: string) {
  return getSupabase().from('guides').delete().eq('id', id)
}
