import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { PayOS } from "@payos/node";
import { createCode } from "@/lib/server/gen-code";
import { sendCodeEmail } from "@/lib/server/email";
import { getProduct } from "@/lib/payment/config";

const kv = Redis.fromEnv();

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

export async function GET() {
  return NextResponse.json({ success: true, message: "webhook alive" });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" });
  }

  if (!body.data || !body.signature) {
    if (body.webhookUrl) {
      return NextResponse.json({ success: true, message: "Webhook URL is valid" });
    }
    return NextResponse.json({ success: false, message: "Not a webhook payload" });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webhookData = await getPayOS().webhooks.verify(body as any);

    if (!webhookData || webhookData.code !== "00") {
      console.log("Payment not successful:", webhookData);
      return NextResponse.json({ success: false });
    }

    const { orderCode } = webhookData;
    const orderKey = `order:${orderCode}`;

    const order = await kv.get<{ productId: string; email: string; status: string }>(orderKey);
    if (!order) {
      console.log("Order not found (test or expired):", orderCode);
      return NextResponse.json({ success: true, message: "Order not found - test OK" });
    }

    if (order.status === "COMPLETED") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    const product = getProduct(order.productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }

    const code = await createCode(product.codePrefix);
    const emailSent = await sendCodeEmail(order.email, code, product.name);

    await kv.set(orderKey, {
      ...order,
      status: emailSent ? "COMPLETED" : "CODE_GENERATED",
      code,
      completedAt: Date.now(),
    });

    console.log(`Payment done - order:${orderCode}, email:${emailSent ? "sent" : "failed"}`);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}
