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

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint is active" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.webhookUrl) {
      return NextResponse.json({ message: "Webhook validated" });
    }

    const webhookData = await getPayOS().webhooks.verify(body);

    if (!webhookData || webhookData.code !== "00") {
      console.log("Webhook payment not successful:", webhookData);
      return NextResponse.json({ success: false, message: "Payment not successful" }, { status: 200 });
    }

    const { orderCode } = webhookData;
    const orderKey = `order:${orderCode}`;

    const order: { productId: string; email: string; status: string } | null = await kv.get(orderKey);
    if (!order) {
      console.error("Order not found:", orderCode);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "COMPLETED") {
      return NextResponse.json({ success: true, message: "Already processed" }, { status: 200 });
    }

    const product = getProduct(order.productId);
    if (!product) {
      console.error("Product not found:", order.productId);
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

    console.log(`Payment completed - order: ${orderCode}, email: ${emailSent ? "sent" : "failed"}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Webhook processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
