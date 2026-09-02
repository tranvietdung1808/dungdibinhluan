import { NextRequest } from 'next/server'
import { getModBySlug } from '@/lib/server/mods'
import { getModCreditConfigBySlug } from '@/lib/server/credit'
import { errorResponse, runRoute, successResponse } from '@/lib/server/api-response'

// GET — chi tiết mod công khai
// Mod yêu cầu credit: chỉ trả thông tin an toàn (thumbnail/name...),
// KHÔNG trả download_url & mô tả chi tiết (bảo vệ paywall).
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
    if (config.enabled) {
      return successResponse({
        ...data,
        download_url: null,
        long_description: null,
        credit_cost: config.creditCost,
      })
    }

    return successResponse({ ...data, credit_cost: null })
  })
}
