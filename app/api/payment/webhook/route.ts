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
  return NextResponse.json({ message: "ok" });
}

export async function POST(req: NextRequest) {
  const respond = (data: unknown, status = 200) =>
    NextResponse.json(data, { status });

  try {
    const body = await req.json();

    if (!body || !body.data || !body.signature) {
      if (body && body.webhookUrl) {
        return respond({ message: "Webhook URL validated" });
      }
      return respond({ success: false, message: "Invalid webhook payload" });
    }

    const webhookData = await getPayOS().webhooks.verify(body);

    if (!webhookData || webhookData.code !== "00") {
      console.log("Payment not successful:", webhookData);
      return respond({ success: false });
    }

    const { orderCode } = webhookData;
    const orderKey = `order:${orderCode}`;

    const order: { productId: string; email: string; status: string } | null = await kv.get(orderKey);
    if (!order) {
      console.error("Order not found:", orderCode);
      return respond({ error: "Order not found" }, 404);
    }

    if (order.status === "COMPLETED") {
      return respond({ success: true, message: "Already processed" });
    }

    const product = getProduct(order.productId);
    if (!product) {
      console.error("Product not found:", order.productId);
      return respond({ error: "Product not found" }, 400);
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

    return respond({ success: true });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Webhook error";
    return respond({ error: message });
  }
}
