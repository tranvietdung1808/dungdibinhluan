import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { PayOS } from "@payos/node";
import { getProduct } from "@/lib/payment/config";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

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

const ORDER_TTL = 60 * 60;

function generateOrderCode(): number {
  return (
    Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000)
  );
}

export async function POST(req: NextRequest) {
  try {
    if (await isRateLimited(`rl:payment-create:${clientIp(req)}`, 10, 600)) {
      return NextResponse.json(
        { error: "Bạn tạo quá nhiều yêu cầu thanh toán. Vui lòng thử lại sau." },
        { status: 429 },
      );
    }

    const { productId, email } = await req.json();

    if (!productId || !email) {
      return NextResponse.json(
        { error: "Thiếu productId hoặc email" },
        { status: 400 },
      );
    }

    const product = getProduct(productId);
    if (!product) {
      return NextResponse.json(
        { error: "Sản phẩm không hợp lệ" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email không hợp lệ" },
        { status: 400 },
      );
    }

    const orderCode = generateOrderCode();
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://dungdibinhluan.com";

    const paymentData = {
      orderCode,
      amount: product.price,
      description: `${product.name}`,
      cancelUrl: `${baseUrl}/payment/cancel?orderCode=${orderCode}&product=${productId}`,
      returnUrl: `${baseUrl}/payment/success?orderCode=${orderCode}&product=${productId}`,
      buyerEmail: email,
      items: [
        {
          name: product.name,
          quantity: 1,
          price: product.price,
        },
      ],
      expiredAt: Math.floor(Date.now() / 1000) + 1800,
    };

    const paymentLink = await getPayOS().paymentRequests.create(paymentData);

    await kv.set(
      `order:${orderCode}`,
      {
        productId,
        email,
        status: "PENDING",
        paymentLinkId: paymentLink.paymentLinkId,
        createdAt: Date.now(),
      },
      { ex: ORDER_TTL },
    );

    return NextResponse.json({
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode,
    });
  } catch (error: unknown) {
    console.error("Payment create error:", error);
    return NextResponse.json(
      {
        error:
          "Chưa tạo được yêu cầu thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
      },
      { status: 500 },
    );
  }
}
