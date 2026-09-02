import { supabaseAdmin } from "@/lib/supabase";
import { PayOS } from "@payos/node";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { calculateCredit, validateTopupAmount } from "@/lib/server/credit";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

// =====================================================
// /api/credit/topup/create — tạo link nạp credit qua PayOS
// =====================================================

// PayOS singleton
let payos: PayOS | null = null;
function getPayOS(): PayOS {
  if (!payos) {
    payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID!,
      apiKey: process.env.PAYOS_API_KEY!,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
    });
  }
  return payos;
}

// Tạo mã đơn hàng duy nhất
function generateOrderCode(): number {
  return Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000);
}

// POST — tạo link nạp credit
export async function POST(request: Request) {
  return runRoute(async () => {
    // Rate limit chống spam tạo đơn nạp
    if (await isRateLimited(`rl:credit-create:${clientIp(request)}`, 20, 60)) {
      return errorResponse("Quá nhiều yêu cầu, thử lại sau", 429);
    }

    // Xác thực user
    const token = extractToken(request as never);
    if (!token) return errorResponse("Unauthorized", 401);

    const user = await getUserFromToken(token);
    if (!user) return errorResponse("Unauthorized", 401);

    // Parse body
    const body = (await request.json().catch(() => null)) as { amountVnd: number } | null;
    if (!body || typeof body.amountVnd !== "number") {
      return errorResponse("Thiếu amountVnd hoặc không hợp lệ", 400);
    }
    const amountVnd = body.amountVnd;

    // Validate số tiền nạp
    const validationError = validateTopupAmount(amountVnd);
    if (validationError) return errorResponse(validationError, 400);

    // Tính credit
    const credit = calculateCredit(amountVnd);

    // Tạo order code + PayOS payment link
    const orderCode = generateOrderCode();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dungdibinhluan.com";

    const paymentData = {
      orderCode,
      amount: amountVnd,
      description: `Nạp ${credit.totalCredit} credit (${credit.bonusCredit} bonus)`,
      cancelUrl: `${baseUrl}/credit/cancel?orderCode=${orderCode}`,
      returnUrl: `${baseUrl}/credit/success?orderCode=${orderCode}`,
      items: [{ name: "Nạp Credit DungDiBinhLuan", quantity: 1, price: amountVnd }],
      expiredAt: Math.floor(Date.now() / 1000) + 1800,
    };

    const paymentLink = await getPayOS().paymentRequests.create(paymentData);

    // Lưu order vào DB
    await supabaseAdmin.from("credit_topup_orders").insert({
      user_id: user.id,
      email: user.email ?? "",
      order_code: orderCode,
      amount_vnd: amountVnd,
      credit_base: credit.baseCredit,
      credit_bonus: credit.bonusCredit,
      credit_total: credit.totalCredit,
      payment_link: paymentLink.checkoutUrl,
      status: "pending",
    });

    return successResponse({
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode,
      breakdown: {
        amountVnd,
        creditBase: credit.baseCredit,
        creditBonus: credit.bonusCredit,
        creditTotal: credit.totalCredit,
      },
    });
  });
}