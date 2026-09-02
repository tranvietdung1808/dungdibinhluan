import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { getCreditWallet } from "@/lib/server/credit";
import { errorResponse, runRoute } from "@/lib/server/api-response";

// =====================================================
// /api/credit/wallet — tổng quan ví credit của user
// =====================================================
export const maxDuration = 60;

// GET — trả về: số dư, tổng kiếm/tổng tiêu, thống kê topup/spend, lần nạp gần nhất
export async function GET(request: Request) {
  return runRoute(async () => {
    // Auth
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    const userId = user.id;

    // ── Chạy song song tất cả query để loại bỏ độ trễ N+1 tuần tự ──
    const [wallet, lastTopupRes, topupCountRes, unlockCountRes] = await Promise.all([
      // Ví credit
      getCreditWallet(userId),
      // Lần nạp gần nhất
      supabaseAdmin
        .from("credit_topup_orders")
        .select("amount_vnd, credit_total, created_at")
        .eq("user_id", userId)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(1),
      // Thống kê số lần nạp
      supabaseAdmin
        .from("credit_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("type", "topup"),
      // Thống kê số lần mở khóa
      supabaseAdmin
        .from("credit_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("type", "spend"),
    ]);

    const { balance, totalEarned, totalSpent } = wallet;
    const lastTopup = lastTopupRes.data;
    const topupCount = topupCountRes.count;
    const unlockCount = unlockCountRes.count;

    // Dữ liệu riêng của user → không được cache công khai (chống CDN leak)
    return NextResponse.json(
      {
        balance,
        totalEarned,
        totalSpent,
        lastTopup: lastTopup?.[0] ?? null,
        stats: {
          topupCount: topupCount ?? 0,
          unlockCount: unlockCount ?? 0,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  });
}