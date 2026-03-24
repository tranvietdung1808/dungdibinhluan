import { supabaseAdmin } from '@/lib/supabase'
import type { Database } from '@/utils/supabase/database.types'

type ModInsert = Database['public']['Tables']['mods']['Insert']
type ModUpdate = Database['public']['Tables']['mods']['Update']
type ModRow = Database['public']['Tables']['mods']['Row']

export type ModPayload = {
  slug?: string
  name?: string
  author?: string
  category?: string
  version?: string
  updated_at?: string
  description?: string | null
  long_description?: string | null
  thumbnail?: string | null
  download_url?: string | null
  tags?: string[]
  thumbnail_orientation?: string
  featured?: boolean
  video_id?: string | null
}

export const REQUIRED_CREATE_MOD_FIELDS: Array<keyof ModPayload> = [
  'slug',
  'name',
  'author',
  'version',
  'updated_at',
]

export const REQUIRED_UPDATE_MOD_FIELDS: Array<keyof ModPayload> = [
  'name',
  'author',
  'version',
  'updated_at',
]

function normalizeTags(tags: ModPayload['tags']) {
  if (!Array.isArray(tags)) return []
  return tags.filter((tag): tag is string => typeof tag === 'string')
}

export function missingRequiredModFields(
  payload: ModPayload,
  requiredFields: Array<keyof ModPayload>
) {
  return requiredFields.filter((field) => {
    const value = payload[field]
    if (typeof value === 'string') return value.trim().length === 0
    return value === null || value === undefined
  })
}

function baseNormalizedModPayload(payload: ModPayload): ModUpdate {
  return {
    name: payload.name,
    author: payload.author,
    category: payload.category || 'Faces',
    version: payload.version,
    updated_at: payload.updated_at,
    description: payload.description || '',
    long_description: payload.long_description || '',
    thumbnail: payload.thumbnail || null,
    download_url: payload.download_url || null,
    tags: normalizeTags(payload.tags),
    thumbnail_orientation: payload.thumbnail_orientation || 'portrait',
    featured: payload.featured === true,
    video_id: payload.video_id || null,
  }
}

export function normalizeCreateModPayload(payload: ModPayload): ModInsert {
  const base = baseNormalizedModPayload(payload)
  return {
    slug: payload.slug!,
    name: payload.name!,
    author: payload.author!,
    version: payload.version!,
    updated_at: payload.updated_at!,
    category: base.category,
    description: base.description,
    long_description: base.long_description,
    thumbnail: base.thumbnail,
    download_url: base.download_url,
    tags: base.tags,
    thumbnail_orientation: base.thumbnail_orientation,
    featured: base.featured,
    video_id: base.video_id,
  }
}

export function normalizeUpdateModPayload(payload: ModPayload): ModUpdate {
  return baseNormalizedModPayload(payload)
}

export async function listMods() {
  return supabaseAdmin
    .from('mods')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getModBySlug(slug: string) {
  return supabaseAdmin.from('mods').select('*').eq('slug', slug).maybeSingle()
}

export async function getModSlugBySlug(slug: string) {
  return supabaseAdmin.from('mods').select('slug').eq('slug', slug).maybeSingle()
}

export async function createMod(payload: ModInsert) {
  return supabaseAdmin.from('mods').insert(payload).select().single()
}

export async function updateMod(slug: string, payload: ModUpdate) {
  return supabaseAdmin
    .from('mods')
    .update(payload)
    .eq('slug', slug)
    .select()
    .maybeSingle()
}

export async function deleteMod(slug: string) {
  return supabaseAdmin.from('mods').delete().eq('slug', slug)
}

export function hasMod(data: ModRow | null) {
  return Boolean(data)
}
