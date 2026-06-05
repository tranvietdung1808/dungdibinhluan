import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkIsAdminEmail } from "@/lib/admin";
import { extractToken, getUserFromToken } from "@/lib/server/auth";

function buildCookieResponse(status: number, body: Record<string, unknown>, isAdmin: boolean) {
  const response = NextResponse.json(body, { status });
  response.cookies.set("admin_user", isAdmin ? "1" : "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: isAdmin ? 60 * 60 * 24 * 7 : 0,
  });
  return response;
}

export async function POST(request: NextRequest) {
  const token = extractToken(request);

  if (!token) {
    return buildCookieResponse(401, { error: "Unauthorized" }, false);
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return buildCookieResponse(401, { error: "Unauthorized" }, false);
  }

  // checkIsAdminEmail now has built-in caching — safe to call
  const isAdmin = await checkIsAdminEmail(supabaseAdmin, user.email);

  if (!isAdmin) {
    return buildCookieResponse(403, { error: "Forbidden" }, false);
  }

  return buildCookieResponse(200, { ok: true }, true);
}

export async function DELETE() {
  return buildCookieResponse(200, { ok: true }, false);
}
