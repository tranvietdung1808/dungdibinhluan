import { NextResponse } from "next/server";
import { PayOS, type Webhook, type WebhookData } from "@payos/node";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse } from "@/lib/server/api-response";

// =====================================================
// /api/credit/topup/webhook — nhận webhook từ PayOS, cộng credit
// =====================================================

// PayOS singleton (dùng checksumKey để verify chữ ký webhook)
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

// Webhook response KHÔNG được cache (CDN/Vercel)
function ok() {
  return NextResponse.json({ received: true }, { headers: { "Cache-Control": "no-store" } });
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-payos-signature",
    },
  });
}

// POST — xử lý webhook PayOS
export async function POST(request: Request) {
  try {
    // Parse body webhook
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return ok();

    // 1. Verify chữ ký PayOS TRƯỚC mọi DB access.
    //    Chỉ dữ liệu sau verify mới được tin dùng (orderCode, code).
    let verified: WebhookData;
    try {
      verified = await getPayOS().webhooks.verify(body as unknown as Webhook);
    } catch {
      console.error("Credit topup webhook: signature verification failed");
      return errorResponse("Invalid signature", 401);
    }

    // 2. Sau verify mới đọc dữ liệu từ payload
    if (verified.code !== "00" || !verified.orderCode) return ok();
    const orderCode = verified.orderCode;

    // Tìm order (chỉ cần id để gọi RPC)
    const { data: order } = await supabaseAdmin
      .from("credit_topup_orders")
      .select("id")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (!order) return ok();

    // 3. ATOMIC + IDEMPOTENT: claim order (pending → paid) + cộng credit
    //    trong một transaction DB. Webhook retry cùng orderCode sẽ thấy
    //    order đã paid → không cộng đúp.
    const { error: fulfillErr } = await supabaseAdmin.rpc("credit_fulfill_topup", {
      p_order_id: order.id,
      p_webhook_data: body,
    });

    if (fulfillErr) {
      console.error("Credit topup fulfill error:", fulfillErr);
      return errorResponse("Lỗi xử lý webhook", 500);
    }

    console.log(`Credit topup webhook done - order:${orderCode}`);
    return ok();
  } catch (error) {
    console.error("Credit topup webhook error:", error);
    return errorResponse("Lỗi xử lý webhook", 500);
  }
}