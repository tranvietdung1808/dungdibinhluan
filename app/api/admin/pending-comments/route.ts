import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";
import { ensureAdmin } from "@/lib/server/auth";

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
