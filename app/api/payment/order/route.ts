import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

const kv = Redis.fromEnv();

// orderCode lấy từ PayOS redirect (timestamp + 3 số random) → dễ đoán,
// rate-limit chặt theo IP để chặn dò mã đơn hàng loạt.
export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  if (await isRateLimited(`rl:payment-order:${ip}`, 20, 60)) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
      { status: 429, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const orderCode = req.nextUrl.searchParams.get("orderCode");
  if (!orderCode || !/^\d{1,20}$/.test(orderCode)) {
    return NextResponse.json({ error: "Missing orderCode" }, { status: 400 });
  }

  const order = await kv.get(`order:${orderCode}`);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
