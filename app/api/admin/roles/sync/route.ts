import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, runRoute, successResponse } from "@/lib/server/api-response";
import { ensureAdmin } from "@/lib/server/auth";

// POST /api/admin/roles/sync — bulk assign default "user" role to all users without roles
export async function POST(request: NextRequest) {
  return runRoute(async () => {
    const adminUser = await ensureAdmin(request);
    if (!adminUser) {
      return errorResponse("Forbidden", 403);
    }

    // 1. Get all registered users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) {
      return errorResponse("Không tải được danh sách người dùng", 500);
    }

    // 2. Get all existing role assignments
    const { data: existingRoles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("email")
      .limit(1000);

    if (roleError) {
      return errorResponse("Không tải được danh sách phân quyền", 500);
    }

    // 3. Build set of emails that already have roles
    const emailsWithRoles = new Set(
      (existingRoles || []).map((r) => (r.email || "").toLowerCase())
    );

    // 4. Find users without any role assignment
    const usersWithoutRoles = authUsers.users.filter((u) => {
      const email = (u.email || "").toLowerCase();
      return email && !emailsWithRoles.has(email);
    });

    if (usersWithoutRoles.length === 0) {
      return successResponse({ added: 0, skipped: authUsers.users.length });
    }

    // 5. Batch insert default "user" roles
    const inserts = usersWithoutRoles.map((u) => ({
      email: u.email!.toLowerCase(),
      role: "user",
      note: "Tự động đồng bộ",
    }));

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert(inserts);

    if (insertError) {
      return errorResponse(`Lỗi đồng bộ: ${insertError.message}`, 500);
    }

    return successResponse({
      added: usersWithoutRoles.length,
      skipped: authUsers.users.length - usersWithoutRoles.length,
    });
  });
}
