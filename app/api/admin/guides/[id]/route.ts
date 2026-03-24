import { NextRequest } from 'next/server'
import {
  deleteGuide,
  findGuideBySlugExcludingId,
  getGuideById,
  missingRequiredGuideFields,
  normalizeGuideUpdatePayload,
  type GuidePayload,
  updateGuide,
} from '@/lib/server/guides'
import { errorResponse, parseJsonBody, runRoute, successResponse } from '@/lib/server/api-response'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await params
    const { data, error } = await getGuideById(id)

    if (error || !data) {
      return errorResponse('Guide not found', 404)
    }

    return successResponse({ data })
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await params
    const body = await parseJsonBody<GuidePayload>(request)
    if (!body) {
      return errorResponse('Invalid request body', 400)
    }

    const missingFields = missingRequiredGuideFields(body)
    if (missingFields.length > 0) {
      return errorResponse('Title, slug, and content are required', 400)
    }

    const { data: existingGuide, error: existingError } = await findGuideBySlugExcludingId(
      body.slug!,
      id
    )

    if (existingError) {
      return errorResponse('Failed to verify slug', 500)
    }
    if (existingGuide) {
      return errorResponse('Slug already exists for another guide', 409)
    }

    const payload = normalizeGuideUpdatePayload(body)
    const { data, error } = await updateGuide(id, payload)
    if (error) {
      return errorResponse(`Failed to update guide: ${error.message}`, 500)
    }
    if (!data) {
      return errorResponse('Guide not found or update returned no row', 404)
    }

    return successResponse({ data })
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return runRoute(async () => {
    const { id } = await params
    const { data: existingGuide, error: existingError } = await getGuideById(id)
    if (existingError) {
      return errorResponse('Failed to find guide', 500)
    }
    if (!existingGuide) {
      return errorResponse('Guide not found', 404)
    }

    const { error } = await deleteGuide(id)
    if (error) {
      return errorResponse(`Failed to delete guide: ${error.message}`, 500)
    }

    return successResponse({ success: true })
  })
}
