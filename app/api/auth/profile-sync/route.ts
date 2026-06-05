import type { NextRequest } from "next/server";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  return runRoute(async () => {
    const token = extractToken(request);
    if (!token) {
      return errorResponse("Unauthorized", 401);
    }

    const user = await getUserFromToken(token);
    if (!user) {
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

    // Sync profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          username: String(username).slice(0, 64),
          avatar_url: typeof avatar === "string" ? avatar : null,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return errorResponse("Không đồng bộ được profile", 500);
    }

    // Auto-assign default "user" role if none exists
    if (user.email) {
      const email = user.email.toLowerCase();
      const { data: existingRoles } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (!existingRoles || existingRoles.length === 0) {
        // First time — assign default "user" role
        await supabaseAdmin
          .from("user_roles")
          .insert({
            email,
            role: "user",
            note: "Tự động thêm khi đăng ký",
          });
      }
    }

    return successResponse({ ok: true });
  });
}
