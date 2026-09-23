"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "./useAuth";
import {
  Badge,
  Button,
  Field,
  InlineNotice,
  Spinner,
  textareaClass,
} from "./ui";

type CommentItem = {
  id: string;
  scope_type: string;
  scope_id: string;
  parent_id: string | null;
  author_name: string;
  author_avatar: string | null;
  content: string;
  is_admin_comment: boolean;
  is_pinned: boolean;
  status: string;
  created_at: string;
};

type Props = {
  scopeType: "guide" | "mods";
  scopeId: string;
  title: string;
  emptyText: string;
};

type ListState = "loading" | "error" | "ready";
type Notice = { tone: "danger" | "warning" | "success" | "neutral"; text: string };
type ReplyTarget = { id: string; name: string };

const MIN_LEN = 2;
const MAX_LEN = 2000;
// Chỉ hiện counter khi gần giới hạn — tránh nhiễu thị giác (§15.3)
const COUNTER_THRESHOLD = 1800;

export default function CommunityComments({ scopeType, scopeId, title, emptyText }: Props) {
  const { user, isAdmin, loading: authLoading, login } = useAuth();

  const [items, setItems] = useState<CommentItem[]>([]);
  const [pendingItems, setPendingItems] = useState<CommentItem[]>([]);
  const [listState, setListState] = useState<ListState>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pinPendingId, setPinPendingId] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Honeypot chống spam: field ẩn, người thật không bao giờ điền
  const [website, setWebsite] = useState("");

  const loadComments = useCallback(async () => {
    setListState("loading");
    try {
      const response = await fetch(
        `/api/community?scopeType=${encodeURIComponent(scopeType)}&scopeId=${encodeURIComponent(scopeId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        setListState("error");
        return;
      }
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
      setListState("ready");
    } catch {
      setListState("error");
    }
  }, [scopeId, scopeType]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const allItems = useMemo(() => {
    const serverIds = new Set(items.map((i) => i.id));
    const extra = pendingItems.filter((p) => !serverIds.has(p.id));
    return [...items, ...extra];
  }, [items, pendingItems]);

  // Reply của reply → hiển thị phẳng dưới root (giới hạn 1 cấp thụt, §15.3)
  const { roots, repliesByRoot, byId } = useMemo(() => {
    const byId = new Map(allItems.map((i) => [i.id, i]));
    const byDateAsc = (a: CommentItem, b: CommentItem) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

    const rootList: CommentItem[] = [];
    const rootIds = new Set<string>();
    for (const item of allItems) {
      // Comment mồ côi (parent đã bị xóa) coi như root để không bị ẩn
      if (!item.parent_id || !byId.has(item.parent_id)) {
        rootList.push(item);
        rootIds.add(item.id);
      }
    }

    const rootOf = (item: CommentItem): CommentItem => {
      let cur = item;
      const seen = new Set<string>([cur.id]);
      while (
        cur.parent_id &&
        byId.has(cur.parent_id) &&
        !seen.has(cur.parent_id)
      ) {
        cur = byId.get(cur.parent_id)!;
        seen.add(cur.id);
      }
      return cur;
    };

    const repliesMap = new Map<string, CommentItem[]>();
    const placed = new Set<string>(rootIds);
    for (const item of allItems) {
      if (rootIds.has(item.id)) continue;
      const root = rootOf(item);
      if (rootIds.has(root.id)) {
        const arr = repliesMap.get(root.id) || [];
        arr.push(item);
        repliesMap.set(root.id, arr);
        placed.add(item.id);
      }
    }
    // An toàn: comment không resolve được root (vòng lặp lạ) vẫn hiển thị như root
    for (const item of allItems) {
      if (!placed.has(item.id)) {
        rootList.push(item);
        rootIds.add(item.id);
      }
    }

    rootList.sort(
      (a, b) => Number(b.is_pinned) - Number(a.is_pinned) || byDateAsc(a, b)
    );
    for (const arr of repliesMap.values()) arr.sort(byDateAsc);
    return { roots: rootList, repliesByRoot: repliesMap, byId };
  }, [allItems]);

  const handleLogin = async () => {
    await login();
  };

  const startReply = (item: CommentItem) => {
    setReplyTarget({ id: item.id, name: item.author_name });
    setNotice(null);
    textareaRef.current?.focus();
  };

  const submit = async () => {
    const trimmed = content.trim();
    if (trimmed.length < MIN_LEN) {
      setFieldError(`Nội dung cần ít nhất ${MIN_LEN} ký tự`);
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setFieldError(`Nội dung tối đa ${MAX_LEN} ký tự`);
      return;
    }
    setSubmitting(true);
    setNotice(null);
    setFieldError(null);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setNotice({ tone: "warning", text: "Vui lòng đăng nhập lại để tiếp tục" });
        return;
      }
      const response = await fetch("/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scopeType,
          scopeId,
          content: trimmed,
          parentId: replyTarget?.id ?? null,
          website,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        // Giữ nguyên draft — người dùng không mất nội dung đã nhập
        setNotice({
          tone: "danger",
          text: data?.error || "Không gửi được bình luận. Thử lại sau.",
        });
        return;
      }

      // Optimistic insert: người dùng thấy bình luận ngay với nhãn chờ duyệt
      const status = data?.status === "approved" ? "approved" : "pending";
      const newPending: CommentItem = {
        id: data?.id || `pending-${Date.now()}`,
        scope_type: scopeType,
        scope_id: scopeId,
        parent_id: replyTarget?.id ?? null,
        author_name: isAdmin
          ? "ADMIN"
          : user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.email?.split("@")[0] ||
            "Người dùng",
        author_avatar: isAdmin
          ? "/favicon.ico"
          : user?.user_metadata?.avatar_url ||
            user?.user_metadata?.picture ||
            null,
        content: trimmed,
        is_admin_comment: isAdmin,
        is_pinned: false,
        status,
        created_at: new Date().toISOString(),
      };
      setPendingItems((prev) => [...prev, newPending]);

      setContent("");
      setReplyTarget(null);
      setNotice(
        status === "approved"
          ? { tone: "success", text: "Bình luận đã được đăng." }
          : { tone: "neutral", text: "Bình luận đã gửi và đang chờ duyệt." }
      );
    } catch {
      setNotice({ tone: "danger", text: "Lỗi kết nối. Nội dung bạn nhập vẫn được giữ." });
    } finally {
      setSubmitting(false);
    }
  };

  const getToken = async () => {
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token ?? null;
  };

  const deleteComment = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    setDeletePendingId(id);
    setNotice(null);
    try {
      const token = await getToken();
      if (!token) {
        setNotice({ tone: "warning", text: "Vui lòng đăng nhập lại để tiếp tục" });
        return;
      }

      const response = await fetch(`/api/admin/community?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setNotice({ tone: "danger", text: data?.error || "Không xóa được bình luận" });
        return;
      }
      setPendingItems((prev) => prev.filter((p) => p.id !== id));
      await loadComments();
    } catch {
      setNotice({ tone: "danger", text: "Lỗi kết nối khi xóa" });
    } finally {
      setDeletePendingId(null);
    }
  };

  const togglePin = async (id: string, nextPinned: boolean) => {
    if (!isAdmin) return;
    setPinPendingId(id);
    setNotice(null);
    try {
      const token = await getToken();
      if (!token) {
        setNotice({ tone: "warning", text: "Bạn cần đăng nhập admin để ghim bình luận" });
        return;
      }
      const response = await fetch("/api/admin/community", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, isPinned: nextPinned }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setNotice({ tone: "danger", text: data?.error || "Không cập nhật được trạng thái ghim" });
        return;
      }
      await loadComments();
    } finally {
      setPinPendingId(null);
    }
  };

  const renderAuthorBadges = (item: CommentItem) => (
    <>
      {item.is_admin_comment && (
        <span
          aria-label="Quản trị viên"
          title="Quản trị viên"
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1877f2] px-1 text-[10px] font-black text-white"
        >
          ✓
        </span>
      )}
      {item.is_pinned && <Badge tone="accent">Đã ghim</Badge>}
      {item.status === "pending" && <Badge tone="warning">Đang chờ duyệt</Badge>}
    </>
  );

  const renderActions = (item: CommentItem) => {
    const busy = pinPendingId === item.id || deletePendingId === item.id;
    if (!user) return null;
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {user && (
          <button
            type="button"
            onClick={() => startReply(item)}
            className="inline-flex min-h-[32px] items-center text-xs font-semibold text-[var(--color-accent-strong)] hover:underline"
          >
            Trả lời
          </button>
        )}
        {isAdmin && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => togglePin(item.id, !item.is_pinned)}
              className="inline-flex min-h-[32px] items-center gap-1.5 text-xs font-semibold text-[var(--color-credit-strong)] hover:underline disabled:opacity-60"
            >
              {pinPendingId === item.id && <Spinner size={12} label="Đang cập nhật" />}
              {item.is_pinned ? "Bỏ ghim" : "Ghim"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => deleteComment(item.id)}
              className="inline-flex min-h-[32px] items-center gap-1.5 text-xs font-semibold text-[var(--color-danger)] hover:underline disabled:opacity-60"
            >
              {deletePendingId === item.id && <Spinner size={12} label="Đang xóa" />}
              Xóa
            </button>
          </>
        )}
      </div>
    );
  };

  const renderAvatar = (item: CommentItem, sizeClass: string) => (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-2)]`}
    >
      {item.author_avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.author_avatar}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="text-[11px] font-bold text-[var(--color-muted)]">
          {item.author_name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );

  const renderComment = (item: CommentItem, isReply = false, rootId?: string) => {
    // Reply trực tiếp của root không cần nhãn "Trả lời X" — chỉ reply của reply mới cần
    const parentName =
      isReply && item.parent_id && item.parent_id !== rootId
        ? byId.get(item.parent_id)?.author_name
        : undefined;
    return (
      <>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {renderAvatar(item, "h-7 w-7")}
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-title)]">
            {item.author_name}
          </p>
          {renderAuthorBadges(item)}
          <time
            dateTime={item.created_at}
            className="text-meta text-[var(--color-muted)]"
          >
            {new Date(item.created_at).toLocaleString("vi-VN")}
          </time>
        </div>
        {parentName && (
          <p className="mt-1 text-meta text-[var(--color-muted)]">
            ↳ Trả lời {parentName}
          </p>
        )}
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--color-body)] [overflow-wrap:anywhere]">
          {item.content}
        </p>
        {renderActions(item)}
      </>
    );
  };

  return (
    <section
      className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-4 sm:p-6"
      aria-labelledby="community-comments-title"
    >
      <h2 id="community-comments-title" className="text-h3 text-[var(--color-title)]">
        {title}
      </h2>

      <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-0)] p-3.5 sm:p-4">
        {authLoading ? (
          <div className="flex items-center gap-2.5 text-sm text-[var(--color-muted)]">
            <Spinner size={16} label="Đang kiểm tra phiên đăng nhập" />
            Đang kiểm tra phiên đăng nhập…
          </div>
        ) : user ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            {replyTarget && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] px-3 py-2 text-sm text-[var(--color-body)]">
                <span>
                  Đang trả lời{" "}
                  <span className="font-semibold text-[var(--color-title)]">
                    {replyTarget.name}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="font-semibold text-[var(--color-muted)] hover:text-[var(--color-title)]"
                >
                  Hủy trả lời
                </button>
              </div>
            )}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <Field
              label={replyTarget ? "Nội dung trả lời" : "Bình luận của bạn"}
              hint={`Từ ${MIN_LEN} đến ${MAX_LEN} ký tự`}
              error={fieldError}
            >
              {({ id, describedBy }) => (
                <textarea
                  ref={textareaRef}
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={fieldError ? true : undefined}
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                  maxLength={MAX_LEN}
                  placeholder="Chia sẻ kinh nghiệm hoặc câu hỏi của bạn…"
                  className={textareaClass}
                />
              )}
            </Field>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex items-center gap-3">
                <p className="text-meta text-[var(--color-muted)]">
                  Đăng nhập: {user.email}
                </p>
                {content.length >= COUNTER_THRESHOLD && (
                  <p
                    className={`text-meta tabular ${
                      content.length >= MAX_LEN
                        ? "font-semibold text-[var(--color-warn)]"
                        : "text-[var(--color-muted)]"
                    }`}
                    aria-live="polite"
                  >
                    {content.length}/{MAX_LEN}
                  </p>
                )}
              </div>
              <Button type="submit" size="sm" loading={submitting}>
                Gửi bình luận
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--color-body)]">
              Đăng nhập để bình luận và trả lời cộng đồng.
            </p>
            <Button type="button" onClick={handleLogin} variant="primary" size="sm">
              Đăng nhập bằng Google
            </Button>
          </div>
        )}
        {notice && (
          <div className="mt-3">
            <InlineNotice tone={notice.tone}>{notice.text}</InlineNotice>
          </div>
        )}
      </div>

      <div className="mt-5">
        {listState === "loading" && allItems.length === 0 ? (
          <div className="flex items-center gap-2.5 py-2 text-sm text-[var(--color-muted)]">
            <Spinner size={16} label="Đang tải bình luận" />
            Đang tải bình luận…
          </div>
        ) : listState === "error" && allItems.length === 0 ? (
          <InlineNotice tone="danger" title="Chưa tải được bình luận">
            <p>Kết nối đang gặp sự cố. Nội dung khác của trang vẫn hoạt động bình thường.</p>
            <div className="mt-3">
              <Button type="button" variant="secondary" size="sm" onClick={loadComments}>
                Thử lại
              </Button>
            </div>
          </InlineNotice>
        ) : roots.length === 0 ? (
          <p className="py-2 text-sm text-[var(--color-muted)]">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {listState === "error" && (
              <InlineNotice tone="warning" title="Chưa cập nhật được bình luận">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p>Danh sách dưới đây có thể chưa mới nhất.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={loadComments}>
                    Tải lại bình luận
                  </Button>
                </div>
              </InlineNotice>
            )}
            {listState === "loading" && (
              <p className="flex items-center gap-2 text-meta text-[var(--color-muted)]">
                <Spinner size={12} label="Đang cập nhật" />
                Đang cập nhật bình luận…
              </p>
            )}
            {roots.map((root) => {
              const replies = repliesByRoot.get(root.id) || [];
              const isPending = root.status === "pending";
              return (
                <article
                  key={root.id}
                  className={`rounded-xl border p-3.5 sm:p-4 ${
                    isPending
                      ? "border-dashed border-[var(--color-warn)]/40"
                      : "border-[var(--color-line)]"
                  } bg-[var(--color-surface-1)]`}
                >
                  {renderComment(root)}
                  {replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-l border-[var(--color-line)] pl-3 sm:pl-4">
                      {replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`rounded-lg border p-3 ${
                            reply.status === "pending"
                              ? "border-dashed border-[var(--color-warn)]/40 bg-[var(--color-surface-1)]"
                              : "border-[var(--color-line)] bg-[var(--color-surface-2)]"
                          }`}
                        >
                          {renderComment(reply, true, root.id)}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
