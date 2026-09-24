import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";
import {
  codeMatchesProduct,
  type StoredAccessCode,
} from "@/lib/payment/code-access";

const kv = Redis.fromEnv();

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    code?: unknown;
    productId?: unknown;
  } | null;
  const code =
    typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const expectedProductId =
    typeof body?.productId === "string" ? body.productId.trim() : null;

  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  // Chống brute-force/abuse: tối đa 20 lần thử / 5 phút / IP
  if (await isRateLimited(`rl:verify-code:${clientIp(req)}`, 20, 300)) {
    return NextResponse.json(
      {
        valid: false,
        message: "Bạn thử mã quá nhiều lần, vui lòng thử lại sau 5 phút.",
      },
      { status: 429 },
    );
  }

  const stored = await kv.get<StoredAccessCode>(`code:${code}`);

  if (!stored) {
    return NextResponse.json({ valid: false });
  }

  if (!codeMatchesProduct(stored, expectedProductId)) {
    return NextResponse.json({ valid: false });
  }

  const response = NextResponse.json({
    valid: true,
    type: stored.type ?? "normal",
    productId: stored.productId ?? null,
  });

  if (stored.productId === "fc27-standard") {
    response.cookies.set("fc27_access", code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    });
  }

  return response;
}
