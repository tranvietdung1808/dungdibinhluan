import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, parseJsonBody, runRoute, successResponse } from "@/lib/server/api-response";
import { ensureAdmin } from "@/lib/server/auth";
import type { UserRole } from "@/lib/admin";

type RolePayload = {
  email?: string;
  role?: string;
  note?: string;
  id?: string;
};

const VALID_ROLES: Set<string> = new Set(["admin", "vip", "moderator", "user"]);

// GET /api/admin/roles — list all user roles
export async function GET(request: NextRequest) {
  return runRoute(async () => {
    const adminUser = await ensureAdmin(request);
    if (!adminUser) {
      return errorResponse("Forbidden", 403);
    }

    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return errorResponse("Không tải được danh sách roles", 500);
    }

    return successResponse(data || []);
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
