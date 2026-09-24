import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { PayOS } from "@payos/node";

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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dungdibinhluan.com";

function hasValidAdminKey(request: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET;
  const provided = request.headers.get("x-admin-key");
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export async function POST(request: NextRequest) {
  if (!hasValidAdminKey(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const webhookUrl = `${BASE_URL}/api/payment/webhook`;
    const result = await getPayOS().webhooks.confirm(webhookUrl);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error("Webhook setup error:", error);
    return NextResponse.json(
      { error: "Chưa cấu hình được webhook thanh toán." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
