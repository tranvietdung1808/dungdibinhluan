// =====================================================
// GET /api/cau-thu/bo-loc — tùy chọn dropdown lấy từ catalog active
// Blueprint §8: không kéo toàn bộ players về browser để build filter.
// =====================================================

import {
  errorResponse,
  runRoute,
  successResponse,
} from "@/lib/server/api-response";
import { getCatalogFilterOptions } from "@/lib/server/players";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

export async function GET(req: Request) {
  return runRoute(async () => {
    // Chung ngân sách với /api/cau-thu — trang danh sách gọi cả hai
    if (await isRateLimited(`players:${clientIp(req)}`, 60, 60)) {
      return errorResponse("Bạn thao tác quá nhanh. Thử lại sau ít phút.", 429);
    }

    const options = await getCatalogFilterOptions();
    return successResponse(options);
  }, "Chưa tải được bộ lọc. Thử lại nhé.");
}
