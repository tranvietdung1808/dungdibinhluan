import { NextRequest } from 'next/server'
import {
  createMod,
  getModSlugBySlug,
  listMods,
  missingRequiredModFields,
  normalizeCreateModPayload,
  REQUIRED_CREATE_MOD_FIELDS,
  type ModPayload,
} from '@/lib/server/mods'
import { errorResponse, parseJsonBody, runRoute, successResponse } from '@/lib/server/api-response'

export async function GET() {
  return runRoute(async () => {
    const { data, error } = await listMods()
    if (error) {
      return errorResponse('Failed to fetch mods', 500)
    }

    return successResponse(data)
  })
}

export async function POST(request: NextRequest) {
  return runRoute(async () => {
    const body = await parseJsonBody<ModPayload>(request)
    if (!body) {
      return errorResponse('Invalid request body', 400)
    }

    const missingFields = missingRequiredModFields(body, REQUIRED_CREATE_MOD_FIELDS)
    if (missingFields.length > 0) {
      return errorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        400
      )
    }

    const { data: existing, error: existingError } = await getModSlugBySlug(body.slug!)
    if (existingError) {
      return errorResponse('Failed to verify slug', 500)
    }
    if (existing) {
      return errorResponse(`Slug "${body.slug}" already exists`, 409)
    }

    const payload = normalizeCreateModPayload(body)
    const { data, error } = await createMod(payload)
    if (error) {
      return errorResponse(`Failed to create mod: ${error.message}`, 500)
    }

    return successResponse({ success: true, data })
  })
}
