import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { getModCreditConfigBySlug } from "@/lib/server/credit";
import { getModBySlug } from "@/lib/server/mods";
import { errorResponse, runRoute } from "@/lib/server/api-response";

// =====================================================
// /api/mods/[slug]/content — nội dung đầy đủ (mô tả + download_url)
// CHỈ trả về khi user ĐÃ mở khóa credit mod này.
// Chặn leak download_url/mô tả chi tiết của mod yêu cầu credit.
// =====================================================
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return runRoute(async () => {
    const { slug } = await params;

    const config = await getModCreditConfigBySlug(slug);
    const json = (payload: object, status = 200) =>
      NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });

    if (!config.enabled) {
      // Mod công khai → ai cũng lấy được
      const { data, error } = await getModBySlug(slug);
      if (error || !data) return errorResponse("Mod not found", 404);
      return json(data);
    }

    // Mod yêu cầu credit → bắt buộc phải có quyền
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);
    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    const { data: mod, error: modErr } = await getModBySlug(slug);
    if (modErr || !mod) return errorResponse("Mod not found", 404);

    const { data: granted } = await supabaseAdmin
      .from("mod_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("mod_id", mod.id as string)
      .maybeSingle();
    if (!granted) return errorResponse("Bạn chưa mở khóa mod này", 403);

    return json(mod);
  });
}
