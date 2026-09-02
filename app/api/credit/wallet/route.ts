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

    // Ví credit
    const wallet = await getCreditWallet(userId);
    const { balance, totalEarned, totalSpent } = wallet;

    // Lần nạp gần nhất
    const { data: lastTopup } = await supabaseAdmin
      .from("credit_topup_orders")
      .select("amount_vnd, credit_total, created_at")
      .eq("user_id", userId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1);

    // Thống kê số lần nạp
    const { count: topupCount } = await supabaseAdmin
      .from("credit_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "topup");

    // Thống kê số lần mở khóa
    const { count: unlockCount } = await supabaseAdmin
      .from("credit_transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "spend");

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