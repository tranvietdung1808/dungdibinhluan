import { NextResponse } from 'next/server'
import { listModsPublic } from '@/lib/server/mods'
import { getCreditPricesMap } from '@/lib/server/credit'
import { errorResponse, runRoute } from '@/lib/server/api-response'

export async function GET() {
  return runRoute(async () => {
    const { data, error } = await listModsPublic()

    if (error) {
      return errorResponse('Failed to fetch mods', 500)
    }

    // Gắn credit_cost + che download_url cho mod yêu cầu credit
    // (tránh leak dữ liệu sau paywall qua API công khai)
    const prices = await getCreditPricesMap()
    const mods = (data ?? []).map((m) => {
      const cost = prices[m.id as string]
      const isLocked = cost != null
      return {
        ...m,
        credit_cost: cost ?? null,
        download_url: isLocked ? null : m.download_url,
      }
    })

    // Cache ngắn (60s) để khi admin bật/tắt credit, card mods phản ánh nhanh
    return NextResponse.json(mods, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  })
}
