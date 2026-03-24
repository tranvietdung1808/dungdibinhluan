import { NextRequest } from 'next/server'
import { getModBySlug } from '@/lib/server/mods'
import { errorResponse, runRoute, successResponse } from '@/lib/server/api-response'

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

    return successResponse(data)
  })
}
