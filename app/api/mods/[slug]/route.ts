import { NextRequest } from 'next/server'
import { getModBySlug } from '@/lib/server/mods'
import { getModCreditConfigBySlug } from '@/lib/server/credit'
import { errorResponse, runRoute, successResponse } from '@/lib/server/api-response'

// GET — chi tiết mod công khai
// Phân loại trường TƯỜNG MINH (§10.3, §20.4):
//  - PUBLIC: metadata/preview (name, description ngắn, thumbnail, tags...)
//  - PROTECTED: long_description, download_url — chỉ trả khi mod KHÔNG
//    yêu cầu credit; mod credit-locked luôn null (nội dung đi qua
//    /api/mods/[slug]/content với kiểm tra quyền server).
// Whitelist thay vì spread+null: cột mới thêm vào bảng mods sau này
// không tự lọt vào payload public.
const PUBLIC_FIELDS = [
  'id',
  'slug',
  'name',
  'author',
  'category',
  'version',
  'updated_at',
  'description',
  'thumbnail',
  'tags',
  'thumbnail_orientation',
  'featured',
  'video_id',
  'created_at',
] as const

const PROTECTED_FIELDS = ['long_description', 'download_url'] as const

type ModRow = Record<string, unknown>

function pickFields(row: ModRow, fields: readonly string[]) {
  const out: ModRow = {}
  for (const field of fields) {
    if (field in row) out[field] = row[field]
  }
  return out
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return runRoute(async () => {
    const { slug } = await params
    const { data, error } = await getModBySlug(slug)

    if (error || !data) {
      return errorResponse('Mod not found', 404)
    }

    const config = await getModCreditConfigBySlug(slug)
    const row = data as ModRow
    const publicPart = pickFields(row, PUBLIC_FIELDS)

    if (config.enabled) {
      // Trường protected bị rút hẳn — client không nhận được rồi che bằng CSS
      return successResponse({
        ...publicPart,
        long_description: null,
        download_url: null,
        credit_cost: config.creditCost,
      })
    }

    return successResponse({
      ...publicPart,
      ...pickFields(row, PROTECTED_FIELDS),
      credit_cost: null,
    })
  })
}
