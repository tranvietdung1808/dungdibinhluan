import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { getModCreditConfigBySlug } from "@/lib/server/credit";
import { privateResponse, runRoute, successResponse } from "@/lib/server/api-response";

// =====================================================
// /api/mods/[slug]/access — kiểm tra quyền mở khóa credit của user
// Trả về: { unlocked, modId, creditCost }
// Token tùy chọn (chưa đăng nhập → luôn bị khóa).
// Dữ liệu quyền theo user → privateResponse (không shared cache — §20.4).
// A02: quyền trong mod_access là VĨNH VIỄN — endpoint này chỉ đọc,
// không giả định quyền hết hạn theo tuổi bản ghi.
// =====================================================
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return runRoute(async () => {
    const { slug } = await params;

    const config = await getModCreditConfigBySlug(slug);

    if (!config.enabled || !config.modId) {
      // Mod không yêu cầu credit → hằng số public, cache được
      return successResponse({ unlocked: true, modId: config.modId, creditCost: null });
    }

    let unlocked = false;
    const token = extractToken(_request as never);
    if (token) {
      const user = await getUserFromToken(token);
      if (user) {
        const { data } = await supabaseAdmin
          .from("mod_access")
          .select("id")
          .eq("user_id", user.id)
          .eq("mod_id", config.modId)
          .maybeSingle();
        unlocked = Boolean(data);
      }
    }

    return privateResponse({
      unlocked,
      modId: config.modId,
      creditCost: config.creditCost,
    });
  });
}
