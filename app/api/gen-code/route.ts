import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getManualCodeOption } from "@/lib/payment/manual-code";
import { createCode } from "@/lib/server/gen-code";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

function hasValidAdminKey(provided: unknown): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || typeof provided !== "string") return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export async function POST(req: NextRequest) {
  if (await isRateLimited(`rl:gen-code:${clientIp(req)}`, 150, 600)) {
    return NextResponse.json(
      { error: "Tạo quá nhiều mã. Vui lòng thử lại sau." },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    adminKey?: unknown;
    type?: unknown;
  } | null;

  if (!hasValidAdminKey(body?.adminKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const option = getManualCodeOption(body?.type);
  if (!option) {
    return NextResponse.json(
      { error: "Loại mã không hợp lệ" },
      { status: 400 },
    );
  }

  const code = await createCode(option.prefix, option.productId);

  return NextResponse.json({ code, productId: option.productId });
}
