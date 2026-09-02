import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { PayOS, type Webhook } from "@payos/node";
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
    return NextResponse.json({ success: true });
  }

  if (body.webhookUrl) {
    return NextResponse.json({ success: true });
  }

  // Xác minh chữ ký PayOS TRƯỚC khi xử lý — không tin body chưa verify
  try {
    await getPayOS().webhooks.verify(body as unknown as Webhook);
  } catch {
    console.error("Payment webhook: signature verification failed");
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  const data = body.data as Record<string, unknown> | undefined;
  const code = data?.code as string | undefined;
  const orderCode = data?.orderCode as number | undefined;

  if (!orderCode || code !== "00") {
    return NextResponse.json({ success: true });
  }

  try {
    const orderKey = `order:${orderCode}`;

    const order = await kv.get<{ productId: string; email: string; status: string }>(orderKey);
    if (!order) {
      return NextResponse.json({ success: true });
    }

    if (order.status === "COMPLETED") {
      return NextResponse.json({ success: true });
    }

    const product = getProduct(order.productId);
    if (!product) {
      return NextResponse.json({ success: true });
    }

    let generatedCode = "";
    let emailSent = false;

    if (product.noCode) {
      emailSent = await sendCodeEmail(order.email, "", product.name, product.codeEntryUrl, product.directDownloadUrl);
    } else {
      generatedCode = await createCode(product.codePrefix);
      emailSent = await sendCodeEmail(order.email, generatedCode, product.name, product.codeEntryUrl);
    }

    await kv.set(orderKey, {
      ...order,
      status: emailSent ? "COMPLETED" : "CODE_GENERATED",
      code: generatedCode,
      completedAt: Date.now(),
    });

    console.log(`Payment done - order:${orderCode}, email:${emailSent ? "sent" : "failed"}`);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: true });
  }
}
