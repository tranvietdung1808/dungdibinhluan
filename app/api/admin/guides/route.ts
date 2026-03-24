import { NextRequest } from 'next/server'
import {
  createGuide,
  findGuideBySlug,
  listGuides,
  missingRequiredGuideFields,
  normalizeGuideInsertPayload,
  type GuidePayload,
} from '@/lib/server/guides'
import { errorResponse, parseJsonBody, runRoute, successResponse } from '@/lib/server/api-response'

export async function GET() {
  return runRoute(async () => {
    const { data, error } = await listGuides()

    if (error) {
      return errorResponse('Failed to fetch guides', 500)
    }

    return successResponse(data)
  })
}

export async function POST(request: NextRequest) {
  return runRoute(async () => {
    const body = await parseJsonBody<GuidePayload>(request)
    if (!body) {
      return errorResponse('Invalid request body', 400)
    }

    const missingFields = missingRequiredGuideFields(body)
    if (missingFields.length > 0) {
      return errorResponse('Title, slug, and content are required', 400)
    }

    const { data: existingGuide, error: existingError } = await findGuideBySlug(body.slug!)
    if (existingError) {
      return errorResponse('Failed to verify slug', 500)
    }
    if (existingGuide) {
      return errorResponse('Slug already exists', 409)
    }

    const payload = normalizeGuideInsertPayload(body)
    const { data, error } = await createGuide(payload)
    if (error) {
      return errorResponse(`Failed to create guide: ${error.message}`, 500)
    }

    return successResponse({ data })
  })
}
