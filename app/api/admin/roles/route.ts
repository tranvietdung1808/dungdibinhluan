import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, parseJsonBody, runRoute, successResponse } from "@/lib/server/api-response";
import { ensureAdmin } from "@/lib/server/auth";

type RolePayload = {
  email?: string;
  role?: string;
  note?: string;
  id?: string;
};

const VALID_ROLES: Set<string> = new Set(["admin", "vip", "moderator", "user"]);

// GET /api/admin/roles — list ALL registered users + their roles
export async function GET(request: NextRequest) {
  return runRoute(async () => {
    const adminUser = await ensureAdmin(request);
    if (!adminUser) {
      return errorResponse("Forbidden", 403);
    }

    // 1. Get ALL registered users from Auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) {
      return errorResponse("Không tải được danh sách người dùng", 500);
    }

    // 2. Get ALL role assignments from user_roles
    const { data: roleAssignments, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .limit(1000);

    if (roleError) {
      return errorResponse("Không tải được danh sách phân quyền", 500);
    }

    // 3. Index roles by email for O(1) lookup
    const rolesByEmail = new Map<string, typeof roleAssignments>();
    for (const ra of roleAssignments || []) {
      const email = (ra.email || "").toLowerCase();
      if (!rolesByEmail.has(email)) rolesByEmail.set(email, []);
      rolesByEmail.get(email)!.push(ra);
    }

    // 4. Merge: each user appears with all their roles, or "member" badge if none
    const members: Record<string, unknown>[] = [];

    for (const u of authUsers.users) {
      const email = (u.email || "").toLowerCase();
      const userRoles = rolesByEmail.get(email) || [];

      if (userRoles.length === 0) {
        // User has no explicit roles → show as "member" only
        members.push({
          id: u.id,
          email,
          roles: [],
          roleNames: [],
          note: null,
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at,
        });
      } else {
        // User has one or more roles → one row per role
        for (const r of userRoles) {
          members.push({
            id: u.id,
            email,
            roles: [r.role],
            roleNames: [r.role],
            roleEntryId: r.id,
            note: r.note,
            created_at: r.created_at,
            last_sign_in: u.last_sign_in_at,
          });
        }
      }
    }

    // Sort: users with roles first, then by email
    members.sort((a, b) => {
      const aHas = (a as any).roleNames?.length > 0 ? 0 : 1;
      const bHas = (b as any).roleNames?.length > 0 ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      return String(a.email).localeCompare(String(b.email));
    });

    return successResponse(members);
  });
}

// POST /api/admin/roles — add a role for an email
export async function POST(request: NextRequest) {
  return runRoute(async () => {
    const adminUser = await ensureAdmin(request);
    if (!adminUser) {
      return errorResponse("Forbidden", 403);
    }

    const payload = await parseJsonBody<RolePayload>(request);
    if (!payload) {
      return errorResponse("Body không hợp lệ", 400);
    }

    const email = (payload.email || "").trim().toLowerCase();
    const role = (payload.role || "").trim().toLowerCase();
    const note = (payload.note || "").trim();

    if (!email || !role) {
      return errorResponse("Email và role là bắt buộc", 400);
    }

    if (!VALID_ROLES.has(role)) {
      return errorResponse(
        `Role không hợp lệ. Các role cho phép: ${[...VALID_ROLES].join(", ")}`,
        400
      );
    }

    // Check if this email+role combo already exists
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("email", email)
      .eq("role", role)
      .maybeSingle();

    if (existing) {
      return errorResponse(`Email "${email}" đã có role "${role}"`, 409);
    }

    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .insert({
        email,
        role,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      return errorResponse(`Không thêm được role: ${error.message}`, 500);
    }

    return successResponse(data, 201);
  });
}

// PATCH /api/admin/roles — update a role (note or role)
export async function PATCH(request: NextRequest) {
  return runRoute(async () => {
    const adminUser = await ensureAdmin(request);
    if (!adminUser) {
      return errorResponse("Forbidden", 403);
    }

    const payload = await parseJsonBody<RolePayload>(request);
    if (!payload) {
      return errorResponse("Body không hợp lệ", 400);
    }

    const id = (payload.id || "").trim();
    if (!id) {
      return errorResponse("ID là bắt buộc", 400);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.role !== undefined) {
      const role = (payload.role || "").trim().toLowerCase();
      if (!VALID_ROLES.has(role)) {
        return errorResponse(
          `Role không hợp lệ. Các role cho phép: ${[...VALID_ROLES].join(", ")}`,
          400
        );
      }
      updateData.role = role;
    }

    if (payload.note !== undefined) {
      updateData.note = payload.note.trim() || null;
    }

    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return errorResponse(`Không cập nhật được role: ${error.message}`, 500);
    }

    return successResponse(data);
  });
}

// DELETE /api/admin/roles?id=xxx — delete a role by id
export async function DELETE(request: NextRequest) {
  return runRoute(async () => {
    const adminUser = await ensureAdmin(request);
    if (!adminUser) {
      return errorResponse("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id) {
      return errorResponse("Thiếu ID", 400);
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("id", id);

    if (error) {
      return errorResponse(`Không xóa được role: ${error.message}`, 500);
    }

    return successResponse({ id, deleted: true });
  });
}
