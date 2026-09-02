import { NextResponse } from "next/server";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { getCreditWallet } from "@/lib/server/credit";
import { errorResponse, runRoute } from "@/lib/server/api-response";

// =====================================================
// /api/credit/balance — endpoint nhẹ chỉ trả số dư credit
// Dùng cho CreditNavChip trên navbar (1 query, tối ưu tốc độ)
// =====================================================
export const maxDuration = 60;

export async function GET(request: Request) {
  return runRoute(async () => {
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    const wallet = await getCreditWallet(user.id);

    // Dữ liệu riêng của user → không cache công khai (chống CDN leak)
    return NextResponse.json(
      { balance: wallet.balance },
      { headers: { "Cache-Control": "no-store" } }
    );
  });
}
