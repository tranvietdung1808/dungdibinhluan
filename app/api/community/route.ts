import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { errorResponse, parseJsonBody, runRoute, successResponse } from "@/lib/server/api-response";
import type { Database } from "@/utils/supabase/database.types";
import { isAdminEmail } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";

type CommunityInsert = Database["public"]["Tables"]["community_comments"]["Insert"];

type CreateCommentPayload = {
  scopeType?: string;
  scopeId?: string;
  content?: string;
  parentId?: string | null;
};

const ALLOWED_SCOPE_TYPES = new Set(["guide", "mods"]);

export async function GET(request: NextRequest) {
  return runRoute(async () => {
    const scopeType = request.nextUrl.searchParams.get("scopeType") || "";
    const scopeId = request.nextUrl.searchParams.get("scopeId") || "";

    if (!ALLOWED_SCOPE_TYPES.has(scopeType) || scopeId.trim().length === 0) {
      return errorResponse("Thiếu scope hợp lệ", 400);
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("community_comments")
      .select("id, scope_type, scope_id, parent_id, author_name, author_avatar, content, is_admin_comment, is_pinned, status, created_at")
      .eq("scope_type", scopeType)
      .eq("scope_id", scopeId)
      .eq("status", "approved")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      return errorResponse("Không tải được bình luận", 500);
    }

    return successResponse(data || []);
  });
}

export async function POST(request: NextRequest) {
  return runRoute(async () => {
    const payload = await parseJsonBody<CreateCommentPayload>(request);

    if (!payload) {
      return errorResponse("Body không hợp lệ", 400);
    }

    const scopeType = payload.scopeType?.trim() || "";
    const scopeId = payload.scopeId?.trim() || "";
    const content = payload.content?.trim() || "";
    const parentId = payload.parentId || null;

    if (!ALLOWED_SCOPE_TYPES.has(scopeType) || scopeId.length === 0) {
      return errorResponse("Scope không hợp lệ", 400);
    }

    if (content.length < 2 || content.length > 2000) {
      return errorResponse("Nội dung bình luận phải từ 2 đến 2000 ký tự", 400);
    }

    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!token) {
      return errorResponse("Bạn cần đăng nhập để bình luận", 401);
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const user = authData.user;

    if (authError || !user) {
      return errorResponse("Bạn cần đăng nhập để bình luận", 401);
    }

    const authorName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Người dùng";

    const authorAvatar =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;
    const isAdmin = isAdminEmail(user.email);

    const insertPayload: CommunityInsert = {
      scope_type: scopeType,
      scope_id: scopeId,
      parent_id: parentId,
      user_id: user.id,
      author_name: String(authorName),
      author_avatar: typeof authorAvatar === "string" ? authorAvatar : null,
      content,
      is_admin_comment: isAdmin,
      is_pinned: false,
      status: "pending",
    };

    const { data, error } = await supabaseAdmin
      .from("community_comments")
      .insert(insertPayload)
      .select("id, status")
      .single();

    if (error) {
      console.error("Insert comment error:", error);
      return errorResponse("Không gửi được bình luận", 500);
    }

    return successResponse(
      {
        id: data.id,
        status: data.status,
      },
      201
    );
  });
}
