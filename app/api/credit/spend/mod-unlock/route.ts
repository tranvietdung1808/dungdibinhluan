import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { getCreditWallet, getModCreditCost, deductCredits } from "@/lib/server/credit";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";

// =====================================================
// /api/credit/spend/mod-unlock — trừ credit để mở khóa mod
// =====================================================
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST — trừ credit mở khóa mod { modId }
export async function POST(request: Request) {
  return runRoute(async () => {
    // Auth
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    const userId = user.id;

    // Parse body + validate UUID
    const body = (await request.json().catch(() => null)) as { modId?: string } | null;
    const modId = body?.modId;
    if (!modId || typeof modId !== "string" || !UUID_RE.test(modId)) {
      return errorResponse("modId không hợp lệ", 400);
    }

    // Kiểm tra mod tồn tại
    const { data: mod, error: modErr } = await supabaseAdmin
      .from("mods")
      .select("id, slug, name, download_url, thumbnail")
      .eq("id", modId)
      .maybeSingle();
    if (modErr || !mod) return errorResponse("Mod không tồn tại", 404);

    // Claim quyền truy cập TRƯỚC khi trừ tiền:
    // unique index mod_access(user_id, mod_id) chặn unlock trùng → không
    // thể bị trừ 2 lần cho cùng 1 mod (kể cả khi gửi request đồng thời).
    const { data: granted, error: grantErr } = await supabaseAdmin
      .from("mod_access")
      .insert({ user_id: userId, mod_id: modId })
      .select("id")
      .single();

    if (grantErr?.code === "23505") {
      // Đã mở khóa trước đó → không tính phí
      return successResponse({
        modId,
        modSlug: mod.slug,
        modName: mod.name,
        downloadUrl: mod.download_url,
        alreadyUnlocked: true,
        message: "Bạn đã mở khóa mod này rồi",
      });
    }
    if (grantErr || !granted) return errorResponse("Lỗi ghi quyền truy cập", 500);

    const modSlug = mod.slug ?? modId;
    const modName = mod.name ?? "không tên";

    // Trừ credit (atomic qua RPC; nếu fail → xóa access vừa claim để rollback)
    const creditCost = await getModCreditCost(modId);
    let balanceAfter: number;
    try {
      // Pre-check nhanh cho UX (402), check chính xác nằm trong RPC atomic
      const wallet = await getCreditWallet(userId);
      if (wallet.balance < creditCost) {
        await supabaseAdmin.from("mod_access").delete().eq("user_id", userId).eq("mod_id", modId);
        return errorResponse(
          `Không đủ credit. Cần ${creditCost} credit, bạn có ${wallet.balance} credit.`,
          402
        );
      }

      ({ balanceAfter } = await deductCredits({
        userId,
        amount: creditCost,
        referenceType: "mod_unlock",
        referenceId: modSlug,
        description: `Mở khóa mod "${modName}"`,
      }));
    } catch (err) {
      // Rollback access nếu trừ credit thất bại (vd không đủ do race)
      await supabaseAdmin.from("mod_access").delete().eq("user_id", userId).eq("mod_id", modId);
      if (err instanceof Error && err.message.includes("đủ credit")) {
        return errorResponse(err.message, 402);
      }
      throw err;
    }

    // Dọn bản ghi > 60 ngày
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("mod_access").delete().eq("user_id", userId).lt("created_at", cutoff);

    return successResponse({
      modId,
      modSlug: mod.slug,
      modName: mod.name,
      downloadUrl: mod.download_url,
      creditDeducted: creditCost,
      balanceRemaining: balanceAfter,
      alreadyUnlocked: false,
    });
  });
}