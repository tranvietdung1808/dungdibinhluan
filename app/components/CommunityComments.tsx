"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { checkIsAdminEmail, isStaticAdminEmail } from "@/lib/admin";

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

export default function CommunityComments({ scopeType, scopeId, title, emptyText }: Props) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [pendingItems, setPendingItems] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [content, setContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pinPendingId, setPinPendingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;
      const session = sessionData.session;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        if (isStaticAdminEmail(currentUser.email)) {
          setIsAdmin(true);
        } else {
          const token = session?.access_token;
          if (token) {
            const res = await fetch("/api/auth/admin-session", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (active) setIsAdmin(res.ok);
          } else {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
    };

    loadUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        if (isStaticAdminEmail(currentUser.email)) {
          setIsAdmin(true);
        } else {
          const token = session?.access_token;
          if (token) {
            const res = await fetch("/api/auth/admin-session", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (active) setIsAdmin(res.ok);
          } else {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/community?scopeType=${encodeURIComponent(scopeType)}&scopeId=${encodeURIComponent(scopeId)}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const data = await response.json();
        setItems(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [scopeId, scopeType]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const allItems = useMemo(() => {
    // Merge server items + optimistic pending items (deduplicate by id)
    const serverIds = new Set(items.map((i) => i.id));
    const extra = pendingItems.filter((p) => !serverIds.has(p.id));
    return [...items, ...extra];
  }, [items, pendingItems]);

  const roots = useMemo(() => allItems.filter((item) => !item.parent_id), [allItems]);
  const repliesByParent = useMemo(() => {
    const map = new Map<string, CommentItem[]>();
    for (const item of allItems) {
      if (!item.parent_id) continue;
      const prev = map.get(item.parent_id) || [];
      prev.push(item);
      map.set(item.parent_id, prev);
    }
    return map;
  }, [allItems]);

  const handleLogin = async () => {
    const supabase = createClient();
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const submit = async () => {
    const trimmed = content.trim();
    if (trimmed.length < 2) {
      setMessage("Nội dung quá ngắn");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setMessage("Bạn cần đăng nhập để bình luận");
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
          parentId: replyToId,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "Không gửi được bình luận");
        return;
      }

      // Optimistically insert the comment so user sees it immediately
      const newPending: CommentItem = {
        id: data?.id || `pending-${Date.now()}`,
        scope_type: scopeType,
        scope_id: scopeId,
        parent_id: replyToId,
        author_name: isAdmin ? "ADMIN" : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Người dùng"),
        author_avatar: isAdmin ? "/favicon.ico" : (user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null),
        content: trimmed,
        is_admin_comment: isAdmin,
        is_pinned: false,
        status: isAdmin ? "approved" : "pending",
        created_at: new Date().toISOString(),
      };
      setPendingItems((prev) => [...prev, newPending]);

      setContent("");
      setReplyToId(null);
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    setMessage("");
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/admin/community?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.error || "Không xóa được bình luận");
        return;
      }
      // Remove from pending list too in case it was optimistic
      setPendingItems((prev) => prev.filter((p) => p.id !== id));
      await loadComments();
    } catch (error) {
      setMessage("Lỗi kết nối khi xóa");
    }
  };

  const togglePin = async (id: string, nextPinned: boolean) => {
    if (!isAdmin) return;
    setPinPendingId(id);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setMessage("Bạn cần đăng nhập admin để ghim bình luận");
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
        setMessage(data?.error || "Không cập nhật được trạng thái ghim");
        return;
      }
      await loadComments();
    } finally {
      setPinPendingId(null);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-[#111117] p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-[#0d0d13] p-3">
        {user ? (
          <>
            {replyToId && (
              <div className="mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300">
                <span>Đang trả lời bình luận</span>
                <button
                  type="button"
                  onClick={() => setReplyToId(null)}
                  className="text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
              </div>
            )}
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Nhập bình luận của bạn..."
              className="w-full min-h-[90px] resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#ce5a67]"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">Đăng nhập: {user.email}</p>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
              >
                {submitting ? "Đang gửi..." : "Gửi bình luận"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-300">Đăng nhập để bình luận và trả lời.</p>
            <button
              type="button"
              onClick={handleLogin}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/10"
            >
              Login with Google
            </button>
          </div>
        )}
        {message && <p className="mt-2 text-xs text-[#ce5a67]">{message}</p>}
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="text-sm text-slate-400">Đang tải bình luận...</div>
        ) : roots.length === 0 ? (
          <div className="text-sm text-slate-500">{emptyText}</div>
        ) : (
          roots.map((root) => {
            const replies = repliesByParent.get(root.id) || [];
            const isPendingRoot = root.status === "pending";
            return (
              <article key={root.id} className={`rounded-xl border p-3 ${
                isPendingRoot
                  ? "border-white/5 bg-white/[0.01] opacity-60"
                  : "border-white/10 bg-white/[0.02]"
              }`}>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 overflow-hidden rounded-full bg-[#1e1e2b]">
                    {root.author_avatar ? (
                      <img src={root.author_avatar} alt={root.author_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
                        {root.author_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {root.author_name}
                    {root.is_admin_comment && (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1877f2] px-1 text-[10px] font-black text-white">
                        ✓
                      </span>
                    )}
                  </p>
                  {root.is_pinned && (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      Ghim
                    </span>
                  )}
                  <p className="text-[11px] text-slate-500">
                    {new Date(root.created_at).toLocaleString("vi-VN")}
                  </p>
                  {isPendingRoot && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
                      Đang chờ duyệt
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{root.content}</p>
                <div className="mt-2 flex items-center gap-3">
                  {user && (
                    <button
                      type="button"
                      onClick={() => setReplyToId(root.id)}
                      className="text-[11px] font-semibold text-[#ce5a67] hover:underline"
                    >
                      Trả lời
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        disabled={pinPendingId === root.id}
                        onClick={() => togglePin(root.id, !root.is_pinned)}
                        className="text-[11px] font-semibold text-amber-300 hover:underline disabled:opacity-60"
                      >
                        {pinPendingId === root.id ? "..." : root.is_pinned ? "Bỏ ghim" : "Ghim"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteComment(root.id)}
                        className="text-[11px] font-semibold text-[#ce5a67] hover:underline"
                      >
                        Xóa
                      </button>
                    </>
                  )}
                </div>
                {replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-l border-white/10 pl-3">
                    {replies.map((reply) => (
                      <div key={reply.id} className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                            {reply.author_name}
                            {reply.is_admin_comment && (
                              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1877f2] px-1 text-[10px] font-black text-white">
                                ✓
                              </span>
                            )}
                          </p>
                          {reply.is_pinned && (
                            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              Ghim
                            </span>
                          )}
                          <p className="text-[10px] text-slate-500">
                            {new Date(reply.created_at).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">{reply.content}</p>
                        {isAdmin && (
                          <div className="mt-1.5 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => deleteComment(reply.id)}
                              className="text-[10px] font-semibold text-[#ce5a67] hover:underline"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
