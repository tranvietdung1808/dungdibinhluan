import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { errorResponse, runRoute } from "@/lib/server/api-response";

// =====================================================
// /api/credit/transactions — lịch sử giao dịch credit có phân trang
// =====================================================
export const maxDuration = 60;

// GET — params: ?limit=30&offset=0&type=topup|spend
export async function GET(request: Request) {
  return runRoute(async () => {
    // Auth
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    const userId = user.id;

    // Parse searchParams
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") ?? "30", 10);
    const rawOffset = parseInt(searchParams.get("offset") ?? "0", 10);
    const typeFilter = searchParams.get("type");

    const limit = Math.min(Math.max(rawLimit || 30, 1), 100);
    const offset = Math.max(rawOffset || 0, 0);

    // Query phân trang
    let query = supabaseAdmin
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Lọc theo type nếu có
    if (typeFilter === "topup" || typeFilter === "spend") {
      query = query.eq("type", typeFilter);
    }

    const { data: transactions } = await query;

    // Dữ liệu riêng của user → không được cache công khai (chống CDN leak)
    return NextResponse.json(
      {
        transactions: transactions ?? [],
        hasMore: (transactions ?? []).length === limit,
        offset,
        limit,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  });
}