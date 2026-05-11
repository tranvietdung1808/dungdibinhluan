import { NextResponse } from "next/server";
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

export async function POST() {
  try {
    const webhookUrl = `${BASE_URL}/api/payment/webhook`;
    const result = await getPayOS().webhooks.confirm(webhookUrl);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Setup failed";
    console.error("Webhook setup error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const webhookUrl = `${BASE_URL}/api/payment/webhook`;
    const result = await getPayOS().webhooks.confirm(webhookUrl);
    return NextResponse.json({ success: true, webhookUrl, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
