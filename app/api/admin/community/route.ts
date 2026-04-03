import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { errorResponse, parseJsonBody, runRoute, successResponse } from "@/lib/server/api-response";
import { checkIsAdminEmail } from "@/lib/admin";

type ModerationPayload = {
  id?: string;
  status?: string;
  isPinned?: boolean;
};

const ALLOWED_STATUSES = new Set(["approved", "rejected"]);

async function ensureAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) {
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user || !(await checkIsAdminEmail(supabaseAdmin, data.user.email))) {
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

    const { data, error } = await supabaseAdmin
      .from("community_comments")
      .select("id, scope_type, scope_id, parent_id, author_name, author_avatar, content, is_admin_comment, is_pinned, status, created_at")
      .in("status", ["pending", "approved"])
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(300);

    if (error) {
      return errorResponse("Không tải được danh sách kiểm duyệt", 500);
    }

    return successResponse(data || []);
  });
}

export async function PATCH(request: NextRequest) {
  return runRoute(async () => {
    const adminUser = await ensureAdmin(request);
    if (!adminUser) {
      return errorResponse("Forbidden", 403);
    }

    const payload = await parseJsonBody<ModerationPayload>(request);
    if (!payload) {
      return errorResponse("Body không hợp lệ", 400);
    }

    const id = payload.id?.trim() || "";
    const status = payload.status?.trim() || "";
    const hasStatus = status.length > 0;
    const hasPinnedFlag = typeof payload.isPinned === "boolean";

    if (!id || (!hasStatus && !hasPinnedFlag)) {
      return errorResponse("Dữ liệu duyệt không hợp lệ", 400);
    }
    if (hasStatus && !ALLOWED_STATUSES.has(status)) {
      return errorResponse("Dữ liệu duyệt không hợp lệ", 400);
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (hasStatus) {
      updatePayload.status = status;
    }
    if (hasPinnedFlag) {
      updatePayload.is_pinned = payload.isPinned === true;
    }

    const { data, error } = await supabaseAdmin
      .from("community_comments")
      .update(updatePayload)
      .eq("id", id)
      .select("id, status, is_pinned")
      .single();

    if (error) {
      return errorResponse("Không cập nhật được trạng thái bình luận", 500);
    }

    return successResponse(data);
  });
}

export async function DELETE(request: NextRequest) {
  return runRoute(async () => {
    const adminUser = await ensureAdmin(request);
    if (!adminUser) {
      return errorResponse("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id) {
      return errorResponse("Thiếu ID bình luận", 400);
    }

    const { error } = await supabaseAdmin
      .from("community_comments")
      .delete()
      .eq("id", id);

    if (error) {
      return errorResponse("Không xóa được bình luận", 500);
    }

    return successResponse({ id });
  });
}
