import type { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { errorResponse, parseJsonBody, runRoute, successResponse } from "@/lib/server/api-response";
import type { Database } from "@/utils/supabase/database.types";
import { supabaseAdmin } from "@/lib/supabase";
import { extractToken, getUserFromToken } from "@/lib/server/auth";
import { checkIsAdminEmail } from "@/lib/admin";
import { clientIp, isRateLimited } from "@/lib/server/rate-limit";

type CommunityInsert = Database["public"]["Tables"]["community_comments"]["Insert"];

type CreateCommentPayload = {
  scopeType?: string;
  scopeId?: string;
  content?: string;
  parentId?: string | null;
  website?: string; // honeypot chống spam bot (field ẩn — bot sẽ điền, người thật để trống)
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

    // ===== Honeypot: bot tự điền field ẩn "website" → chặn âm thầm =====
    if (typeof payload.website === "string" && payload.website.trim().length > 0) {
      return successResponse({ id: "pending-bot", status: "pending" }, 201);
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

    // ===== Chống spam: giới hạn theo IP (10 bình luận/phút) =====
    if (await isRateLimited(`rl:comment:ip:${clientIp(request)}`, 10, 60)) {
      return errorResponse("Bạn đang bình luận quá nhanh, vui lòng thử lại sau", 429);
    }

    const token = extractToken(request);
    if (!token) {
      return errorResponse("Bạn cần đăng nhập để bình luận", 401);
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return errorResponse("Bạn cần đăng nhập để bình luận", 401);
    }

    // ===== Chống spam: giới hạn theo user (20 bình luận/5 phút) =====
    if (await isRateLimited(`rl:comment:user:${user.id}`, 20, 300)) {
      return errorResponse("Bạn đã gửi quá nhiều bình luận trong thời gian ngắn, thử lại sau", 429);
    }

    // ===== Chống spam: chặn gửi trùng nội dung liên tiếp trong 10 phút =====
    const contentHash = createHash("sha1").update(content.toLowerCase()).digest("hex");
    if (await isRateLimited(`rl:comment:dup:${user.id}:${contentHash}`, 2, 600)) {
      return errorResponse("Nội dung trùng lặp, vui lòng chờ một lúc trước khi gửi lại", 429);
    }

    // ===== Chống spam link: tối đa 3 link/bình luận =====
    const linkCount = (content.match(/https?:\/\/|www\./gi) || []).length;
    if (linkCount > 3) {
      return errorResponse("Bình luận chứa quá nhiều liên kết", 400);
    }

    const isAdmin = await checkIsAdminEmail(supabaseAdmin, user.email);

    const authorName = isAdmin ? "ADMIN" : (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Người dùng"
    );

    const authorAvatar = isAdmin ? "/favicon.ico" : (
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null
    );

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
      // Admin comments auto-approved, regular users go to pending queue
      status: isAdmin ? "approved" : "pending",
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
