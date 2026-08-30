import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";

// =====================================================
// /api/account/unlocks — ghi lại mod user đã mở/đã tải
// (hiển thị trong "Mod đã mở", giữ tối đa 60 ngày)
// =====================================================
export const maxDuration = 60;

// POST — ghi nhận user vừa mở mod { modId }
// Chạy sau khi user unlock thành công (dùng credit/membership)
export async function POST(request: Request) {
  return runRoute(async () => {
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = (await request.json().catch(() => null)) as { modId?: string } | null;
    const modId = body?.modId;
    if (!modId || typeof modId !== "string") return errorResponse("Thiếu modId", 400);

    // Kiểm tra mod tồn tại
    const { data: mod, error: modErr } = await supabaseAdmin
      .from("mods")
      .select("id, slug, name, thumbnail, category, tags")
      .eq("id", modId)
      .maybeSingle();
    if (modErr || !mod) return errorResponse("Mod không tồn tại", 404);

    const userId = user.id;

    // Đã mở rồi thì chỉ update thời gian (đẩy lên đầu danh sách)
    const { data: existing } = await supabaseAdmin
      .from("mod_access")
      .select("id")
      .eq("user_id", userId)
      .eq("mod_id", modId)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabaseAdmin
        .from("mod_access")
        .update({ created_at: new Date().toISOString() })
        .eq("id", existing[0].id);
    } else {
      await supabaseAdmin.from("mod_access").insert({
        user_id: userId,
        mod_id: modId,
        created_at: new Date().toISOString(),
      });
    }

    // Dọn bản ghi > 60 ngày
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("mod_access").delete().eq("user_id", userId).lt("created_at", cutoff);

    return successResponse({ ok: true });
  });
}