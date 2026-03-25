import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin";

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
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    return buildCookieResponse(401, { error: "Unauthorized" }, false);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return buildCookieResponse(401, { error: "Unauthorized" }, false);
  }

  if (!isAdminEmail(data.user.email)) {
    return buildCookieResponse(403, { error: "Forbidden" }, false);
  }

  return buildCookieResponse(200, { ok: true }, true);
}

export async function DELETE() {
  return buildCookieResponse(200, { ok: true }, false);
}
