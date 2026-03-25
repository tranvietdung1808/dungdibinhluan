import type { NextRequest } from "next/server";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  return runRoute(async () => {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) {
      return errorResponse("Unauthorized", 401);
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const user = authData.user;

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const username =
      user.user_metadata?.preferred_username ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      `user-${user.id.slice(0, 8)}`;

    const avatar =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          username: String(username).slice(0, 64),
          avatar_url: typeof avatar === "string" ? avatar : null,
        },
        { onConflict: "id" }
      );

    if (error) {
      return errorResponse("Không đồng bộ được profile", 500);
    }

    return successResponse({ ok: true });
  });
}
