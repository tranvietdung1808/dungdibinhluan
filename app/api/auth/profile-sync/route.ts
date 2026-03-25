import { createClient } from "@/utils/supabase/server";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";

export async function POST() {
  return runRoute(async () => {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

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

    const { error } = await supabase
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
