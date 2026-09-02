import { NextRequest, NextResponse } from "next/server";
import { getModBySlug } from "@/lib/server/mods";
import { clearModCreditConfig, getModCreditConfigBySlug, setModCreditConfig } from "@/lib/server/credit";
import { errorResponse, runRoute } from "@/lib/server/api-response";

// =====================================================
// /api/admin/mods/credit-config — bật/tắt + set giá credit
// cho 1 mod (dùng cho toggle nhanh ở danh sách admin)
// Body: { slug, enabled, creditCost }
// =====================================================
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return runRoute(async () => {
    // Bảo vệ tối thiểu: chỉ admin đã đăng nhập trên trình duyệt
    if (request.cookies.get("admin_user")?.value !== "1") {
      return errorResponse("Forbidden", 403);
    }

    const body = (await request.json().catch(() => null)) as {
      slug?: string;
      enabled?: boolean;
      creditCost?: number | null;
    } | null;

    if (!body || typeof body.slug !== "string" || !body.slug.trim()) {
      return errorResponse("slug không hợp lệ", 400);
    }
    const enabled = body.enabled === true;

    const { data: mod, error } = await getModBySlug(body.slug);
    if (error || !mod) return errorResponse("Mod không tồn tại", 404);

    const modId = mod.id as string;
    if (enabled) {
      const cost = Number(body.creditCost);
      if (!Number.isFinite(cost) || cost < 1) {
        return errorResponse("Số credit phải lớn hơn hoặc bằng 1", 400);
      }
      await setModCreditConfig(modId, cost);
    } else {
      await clearModCreditConfig(modId);
    }

    const config = await getModCreditConfigBySlug(body.slug);
    return NextResponse.json({
      success: true,
      credit_enabled: config.enabled,
      credit_cost: config.creditCost,
    });
  });
}
