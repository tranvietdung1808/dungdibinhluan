import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { getModCreditConfigBySlug } from "@/lib/server/credit";
import { getModBySlug } from "@/lib/server/mods";
import { errorResponse, privateResponse, runRoute, successResponse } from "@/lib/server/api-response";

// =====================================================
// /api/mods/[slug]/content — nội dung đầy đủ (mô tả + download_url)
// CHỈ trả về khi user ĐÃ mở khóa credit mod này.
// Chặn leak download_url/mô tả chi tiết của mod yêu cầu credit.
// A02: quyền mod_access là vĩnh viễn — chỉ kiểm tra tồn tại, không
// lọc theo tuổi bản ghi. Response chứa quyền/nội dung theo user
// → privateResponse (không shared cache — §20.4).
// =====================================================
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return runRoute(async () => {
    const { slug } = await params;

    const config = await getModCreditConfigBySlug(slug);

    if (!config.enabled) {
      // Mod công khai → nội dung public, cache được bằng shared cache
      const { data, error } = await getModBySlug(slug);
      if (error || !data) return errorResponse("Mod not found", 404);
      return successResponse(data);
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

    return privateResponse(mod);
  });
}
