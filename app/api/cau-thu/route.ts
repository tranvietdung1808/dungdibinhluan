// =====================================================
// GET /api/cau-thu — danh sách catalog cầu thủ (bản active duy nhất)
// Blueprint §8: chỉ trả list DTO + phân trang + revision đích (release);
// validate/escape params qua parseCatalogParams; lỗi public tiếng Việt.
// =====================================================

import { parseCatalogParams } from "@/lib/players/params";
import {
  errorResponse,
  runRoute,
  successResponse,
} from "@/lib/server/api-response";
import { listCatalogPlayers } from "@/lib/server/players";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

export async function GET(req: Request) {
  return runRoute(async () => {
    // 60 req/phút/IP — đủ cho tìm kiếm debounce, chặn crawl vô tội vạ
    if (await isRateLimited(`players:${clientIp(req)}`, 60, 60)) {
      return errorResponse("Bạn thao tác quá nhanh. Thử lại sau ít phút.", 429);
    }

    const params = parseCatalogParams(new URL(req.url).searchParams);
    const result = await listCatalogPlayers(params);

    if (result.error) {
      return errorResponse("Chưa tải được danh sách. Thử lại nhé.", 500);
    }

    return successResponse({
      data: result.data,
      count: result.count,
      page: result.page,
      totalPages: result.totalPages,
      release: result.releaseId,
    });
  }, "Chưa tải được danh sách. Thử lại nhé.");
}
