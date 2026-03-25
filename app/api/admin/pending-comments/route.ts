import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";
import { isAdminEmail } from "@/lib/admin";

async function ensureAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) {
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user || !isAdminEmail(data.user.email)) {
    return null;
  }
  return data.user;
}

export async function GET(request: NextRequest) {
  return runRoute(async () => {
    const adminUser = await ensureAdmin(request);
    if (!adminUser) {
      return errorResponse("Forbidden", 403);
    }

    const { data, error, count } = await supabaseAdmin
      .from("community_comments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) {
      return errorResponse("Không tải được số lượng bình luận chờ duyệt", 500);
    }

    return successResponse({ count: count || 0 });
  });
}
