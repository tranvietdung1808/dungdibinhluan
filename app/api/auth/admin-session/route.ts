import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkIsAdminEmail } from "@/lib/admin";

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
  console.log("[admin-session] POST request received");
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  console.log("[admin-session] Token present:", !!token);

  if (!token) {
    console.log("[admin-session] No token, returning 401");
    return buildCookieResponse(401, { error: "Unauthorized" }, false);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    console.error("[admin-session] getUser error:", error, "data:", data);
    return buildCookieResponse(401, { error: "Unauthorized" }, false);
  }

  console.log("[admin-session] User email:", data.user.email);
  const isAdmin = await checkIsAdminEmail(supabaseAdmin, data.user.email);
  console.log("[admin-session] isAdmin result:", isAdmin);

  if (!isAdmin) {
    console.log("[admin-session] User is not admin, returning 403");
    return buildCookieResponse(403, { error: "Forbidden" }, false);
  }

  console.log("[admin-session] User is admin, setting cookie");
  return buildCookieResponse(200, { ok: true }, true);
}

export async function DELETE() {
  return buildCookieResponse(200, { ok: true }, false);
}
