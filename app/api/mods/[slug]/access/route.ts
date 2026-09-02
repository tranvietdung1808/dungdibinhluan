import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { getModCreditConfigBySlug } from "@/lib/server/credit";
import { errorResponse, runRoute } from "@/lib/server/api-response";

// =====================================================
// /api/mods/[slug]/access — kiểm tra quyền mở khóa credit của user
// Trả về: { unlocked, modId, creditCost }
// Token tùy chọn (chưa đăng nhập → luôn bị khóa)
// =====================================================
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return runRoute(async () => {
    const { slug } = await params;

    const config = await getModCreditConfigBySlug(slug);
    const json = (payload: object) =>
      NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });

    if (!config.enabled || !config.modId) {
      // Mod không yêu cầu credit → luôn xem được
      return json({ unlocked: true, modId: config.modId, creditCost: null });
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

    return json({
      unlocked,
      modId: config.modId,
      creditCost: config.creditCost,
    });
  });
}
