import { listMods } from '@/lib/server/mods'
import { errorResponse, runRoute, successResponse } from '@/lib/server/api-response'

export async function GET() {
  return runRoute(async () => {
    const { data, error } = await listMods()

    if (error) {
      return errorResponse('Failed to fetch mods', 500)
    }

    return successResponse(data || [])
  })
}
