import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { getActiveSubscription } from "@/lib/server/membership";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";

// =====================================================
// /api/account — dữ liệu cho trang tài khoản cá nhân
// =====================================================
export const maxDuration = 60;

// GET — trả về: profile, roles, subscription active, lịch sử đơn hàng, mod đã mở (60 ngày)
export async function GET(request: Request) {
  return runRoute(async () => {
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    const userId = user.id;
    const email = user.email?.toLowerCase() ?? "";

    // Profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Roles
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role, note, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });

    // Subscription active (hiển thị thẻ hạn dùng/credit)
    const activeSub = await getActiveSubscription(userId);

    // Lịch sử subscription
    const { data: subscriptions } = await supabaseAdmin
      .from("subscriptions")
      .select("*, membership_plans(id, name, description, price, duration_days, features)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Mod đã mở trong 60 ngày gần nhất
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data: modAccess } = await supabaseAdmin
      .from("mod_access")
      .select("*, mods(id, slug, name, thumbnail, category, tags)")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100);

    const modsUnlocked = (modAccess ?? []).map((row) => ({
      id: row.id,
      unlocked_at: row.created_at,
      mod: row.mods as {
        id: string;
        slug: string;
        name: string;
        thumbnail: string | null;
        category: string;
        tags: string[];
      } | null,
    }));

    if ((modAccess ?? []).length > 0) {
      // Dọn bản ghi > 60 ngày (sau khi đã lấy dữ liệu hiển thị)
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from("mod_access").delete().eq("user_id", userId).lt("created_at", cutoff);
    }

    return successResponse({
      user: {
        id: userId,
        email: user.email ?? "",
        username:
          profile?.username ??
          user.user_metadata?.preferred_username ??
          user.user_metadata?.full_name ??
          user.email?.split("@")[0] ??
          "User",
        full_name: user.user_metadata?.full_name ?? profile?.username ?? null,
        avatar_url:
          profile?.avatar_url ?? user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      },
      roles: (roles ?? []).map((r) => r.role as string),
      subscription: activeSub
        ? {
            id: activeSub.id,
            plan_name: activeSub.plan?.name ?? "Membership",
            expires_at: activeSub.expires_at,
            starts_at: activeSub.starts_at,
          }
        : null,
      subscriptions: (subscriptions ?? []).map((s) => ({
        id: s.id,
        status: s.status,
        starts_at: s.starts_at,
        expires_at: s.expires_at,
        notes: s.note,
        plan_name: s.membership_plans?.name ?? "Membership",
        plan_price: s.membership_plans?.price ?? 0,
      })),
      mods_unlocked: modsUnlocked,
      synced_at: new Date().toISOString(),
    });
  });
}

// PATCH — cập nhật profile cá nhân
// Body: { username?, avatar_url? }
export async function PATCH(request: Request) {
  return runRoute(async () => {
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = (await request.json().catch(() => null)) as {
      username?: string;
      avatar_url?: string | null;
    } | null;
    if (!body) return errorResponse("Body không hợp lệ", 400);

    const update: Record<string, unknown> = {};
    if (typeof body.username === "string" && body.username.trim()) {
      const name = body.username.trim().slice(0, 64);
      if (name.length < 2) return errorResponse("Tên hiển thị quá ngắn", 400);
      update.username = name;
    }
    if (body.avatar_url !== undefined) {
      update.avatar_url =
        typeof body.avatar_url === "string" && body.avatar_url.length > 0
          ? body.avatar_url
          : null;
    }

    if (Object.keys(update).length === 0) {
      return errorResponse("Không có gì để cập nhật", 400);
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: user.id, ...update, updated_at: new Date().toISOString() }, { onConflict: "id" });

    if (error) return errorResponse("Không lưu được profile: " + error.message, 500);

    return successResponse({ ok: true });
  });
}