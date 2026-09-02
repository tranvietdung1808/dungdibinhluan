import { NextRequest } from 'next/server'
import {
  deleteMod,
  getModBySlug,
  hasMod,
  missingRequiredModFields,
  normalizeUpdateModPayload,
  REQUIRED_UPDATE_MOD_FIELDS,
  type ModPayload,
  updateMod,
} from '@/lib/server/mods'
import { clearModCreditConfig, getModCreditConfigBySlug, setModCreditConfig } from '@/lib/server/credit'
import { errorResponse, parseJsonBody, runRoute, successResponse } from '@/lib/server/api-response'

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

    // Gắn cấu hình mở khóa credit
    const config = await getModCreditConfigBySlug(slug)
    return successResponse({
      ...data,
      credit_enabled: config.enabled,
      credit_cost: config.creditCost,
    })
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return runRoute(async () => {
    const { slug } = await params
    const body = await parseJsonBody<ModPayload>(request)
    if (!body) {
      return errorResponse('Invalid request body', 400)
    }
    const missingFields = missingRequiredModFields(body, REQUIRED_UPDATE_MOD_FIELDS)
    if (missingFields.length > 0) {
      return errorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        400
      )
    }

    const { data: existing, error: existingError } = await getModBySlug(slug)
    if (existingError) {
      return errorResponse('Failed to find mod', 500)
    }
    if (!hasMod(existing)) {
      return errorResponse(`Mod "${slug}" not found`, 404)
    }

    const payload = normalizeUpdateModPayload(body)
    const { data, error } = await updateMod(slug, payload)
    if (error) {
      return errorResponse(`Failed to update mod: ${error.message}`, 500)
    }
    if (!data) {
      return errorResponse(`Mod "${slug}" not found`, 404)
    }

    // Lưu cấu hình "mở khóa bằng credit" nếu được gửi lên
    if (typeof body.credit_enabled === 'boolean') {
      try {
        const modId = data.id as string
        if (body.credit_enabled) {
          await setModCreditConfig(modId, body.credit_cost ?? 5)
        } else {
          await clearModCreditConfig(modId)
        }
      } catch (e) {
        return errorResponse(e instanceof Error ? e.message : 'Không lưu được cấu hình credit', 500)
      }
    }

    return successResponse({ success: true, data })
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return runRoute(async () => {
    const { slug } = await params

    const { data: existing, error: existingError } = await getModBySlug(slug)
    if (existingError) {
      return errorResponse('Failed to find mod', 500)
    }
    if (!hasMod(existing)) {
      return errorResponse(`Mod "${slug}" not found`, 404)
    }

    const { error } = await deleteMod(slug)
    if (error) {
      return errorResponse(`Failed to delete mod: ${error.message}`, 500)
    }

    return successResponse({ success: true })
  })
}
