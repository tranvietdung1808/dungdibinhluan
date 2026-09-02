import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { errorResponse } from "@/lib/server/api-response";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

// =====================================================
// /api/credit/topup/order — kiểm tra trạng thái đơn nạp
// Dùng cho trang /credit/success poll sau khi thanh toán
// Bắt buộc auth + chỉ trả đơn thuộc user hiện tại (chống IDOR)
// =====================================================

// GET — ?orderCode=xxx → trả trạng thái đơn hàng nạp credit
export async function GET(request: Request) {
  try {
    // Rate limit chống brute-force/abuse
    if (await isRateLimited(`rl:credit-order:${clientIp(request)}`, 90, 60)) {
      return errorResponse("Quá nhiều yêu cầu, thử lại sau", 429);
    }

    // Bắt buộc auth
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const rawOrderCode = searchParams.get("orderCode");
    if (!rawOrderCode) return errorResponse("Thiếu orderCode", 400);

    const orderCode = Number(rawOrderCode);
    if (!Number.isSafeInteger(orderCode) || orderCode <= 0) {
      return errorResponse("orderCode không hợp lệ", 400);
    }

    const { data: order, error } = await supabaseAdmin
      .from("credit_topup_orders")
      .select("order_code, amount_vnd, credit_base, credit_bonus, credit_total, status, paid_at, created_at")
      .eq("user_id", user.id)
      .eq("order_code", orderCode)
      .maybeSingle();

    if (error) return errorResponse("Lỗi truy vấn đơn hàng", 500);
    if (!order) return errorResponse("Không tìm thấy đơn hàng", 404);

    // Dữ liệu riêng của user → không được cache công khai
    return NextResponse.json(
      {
        status: order.status,
        paid: order.status === "paid",
        breakdown: {
          amountVnd: order.amount_vnd,
          creditBase: order.credit_base,
          creditBonus: order.credit_bonus,
          creditTotal: order.credit_total,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Credit order check error:", error);
    return errorResponse("Lỗi kiểm tra đơn hàng", 500);
  }
}
