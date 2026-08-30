"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/useAuth";
import { createClient } from "@/utils/supabase/client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type AccountData = {
  user: {
    id: string;
    email: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  roles: string[];
  subscription: {
    id: string;
    plan_name: string;
    expires_at: string;
    starts_at: string;
  } | null;
  subscriptions: Array<{
    id: string;
    status: "active" | "expired" | "cancelled";
    starts_at: string;
    expires_at: string;
    notes: string | null;
    plan_name: string;
    plan_price: number;
  }>;
  mods_unlocked: Array<{
    id: string;
    unlocked_at: string;
    mod: {
      id: string;
      slug: string;
      name: string;
      thumbnail: string | null;
      category: string;
      tags: string[];
    } | null;
  }>;
};

type Section = "overview" | "profile" | "orders" | "unlocked";

const NAV_ITEMS: Array<{ key: Section; label: string; icon: string }> = [
  { key: "overview", label: "Tổng quan", icon: "🏠" },
  { key: "profile", label: "Thông tin cá nhân", icon: "👤" },
  { key: "orders", label: "Lịch sử đơn hàng", icon: "🧾" },
  { key: "unlocked", label: "Mod đã mở", icon: "🔓" },
];

const VND = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysLeft(expiresAt: string, now: number) {
  const diff = new Date(expiresAt).getTime() - now;
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAccount = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      if (!res.ok) throw new Error("Không tải được dữ liệu");
      const d = await res.json();
      setData(d.data ?? d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading) void fetchAccount();
  }, [authLoading, fetchAccount]);

  // Chưa đăng nhập → chờ auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-2xl font-black">Bạn chưa đăng nhập</p>
          <p className="text-slate-400 text-sm">Đăng nhập để quản lý tài khoản, đơn hàng và mod đã mở.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[var(--color-primary)] rounded-xl font-black text-sm tracking-widest hover:bg-[#b44c5c] transition-colors"
          >
            ĐĂNG NHẬP
          </Link>
        </div>
      </div>
    );
  }

  const current = data?.user;
  const displayName = current?.username || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Tài khoản";
  const avatarUrl = current?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const now = Date.now();
  const isVip = data?.roles?.includes("vip") || (data?.subscription != null && daysLeft(data.subscription.expires_at, now) > 0);
  const activeSub = data?.subscription ?? null;

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[var(--color-primary)]/50">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1f] flex items-center justify-center text-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {isVip && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-[10px] border-2 border-[#050507]">
                  👑
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black">{displayName}</h1>
              <p className="text-slate-400 text-sm">{current?.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/5 border border-white/10">
                  {isVip ? "VIP" : "Thành viên"}
                </span>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/30 transition-colors"
                  >
                    ADMIN
                  </Link>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/mods"
            className="text-sm text-slate-400 hover:text-white transition-colors font-semibold"
          >
            ← Khám phá mods
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <nav className="bg-[#0c0c10] border border-white/5 rounded-2xl p-2 flex md:flex-col gap-1 overflow-x-auto">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSection(item.key)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                    section === item.key
                      ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
                      : "text-slate-300 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="text-slate-400 py-20 text-center">Đang tải dữ liệu...</div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-300 text-sm">
                {error}
              </div>
            ) : (
              <>
                {section === "overview" && (
                  <OverviewSection
                    displayName={displayName}
                    email={current?.email ?? ""}
                    isVip={isVip}
                    activeSub={activeSub}
                    now={now}
                    orderCount={data?.subscriptions?.length ?? 0}
                    unlockedCount={data?.mods_unlocked?.length ?? 0}
                    onNavigate={setSection}
                  />
                )}
                {section === "profile" && (
                  <ProfileSection
                    displayName={displayName}
                    email={current?.email ?? ""}
                    avatarUrl={avatarUrl}
                    onSaved={() => void fetchAccount()}
                  />
                )}
                {section === "orders" && (
                  <OrdersSection subscriptions={data?.subscriptions ?? []} now={now} />
                )}
                {section === "unlocked" && (
                  <UnlockedSection items={data?.mods_unlocked ?? []} />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────
function OverviewSection({
  displayName,
  email,
  isVip,
  activeSub,
  now,
  orderCount,
  unlockedCount,
  onNavigate,
}: {
  displayName: string;
  email: string;
  isVip: boolean;
  activeSub: AccountData["subscription"];
  now: number;
  orderCount: number;
  unlockedCount: number;
  onNavigate: (s: Section) => void;
}) {
  return (
    <div className="space-y-6">
      {/* VIP status card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 ${
          isVip
            ? "bg-gradient-to-br from-amber-500/10 via-transparent to-[var(--color-primary)]/10 border-amber-500/30"
            : "bg-[#0c0c10] border-white/5"
        }`}
      >
        <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-black">
              {isVip ? "👑 Thành viên VIP" : "Thành viên thường"}
            </p>
            {isVip && activeSub ? (
              <>
                <p className="text-lg font-black mt-1">{activeSub.plan_name}</p>
                <p className="text-sm text-slate-300 mt-0.5">
                  Còn <span className="font-black text-amber-400">{daysLeft(activeSub.expires_at, now)} ngày</span> · hết hạn {formatDate(activeSub.expires_at)}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-black mt-1">{displayName}</p>
                <p className="text-sm text-slate-400 mt-0.5">{email}</p>
              </>
            )}
          </div>
          {!isVip && (
            <Link
              href="/mods/mix-mods-fc26/payment"
              className="shrink-0 px-5 py-2.5 bg-[var(--color-primary)] rounded-xl font-black text-xs tracking-widest hover:bg-[#b44c5c] transition-colors text-center"
            >
              NÂNG CẤP VIP
            </Link>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Đơn hàng"
          value={String(orderCount)}
          icon="🧾"
          onClick={() => onNavigate("orders")}
          hint="Lịch sử mua"
        />
        <StatCard
          label="Mod đã mở"
          value={String(unlockedCount)}
          icon="🔓"
          onClick={() => onNavigate("unlocked")}
          hint="Trong 60 ngày"
        />
        <StatCard
          label="Trạng thái"
          value={isVip ? "VIP" : "Thường"}
          icon={isVip ? "👑" : "⭐"}
          onClick={() => onNavigate("profile")}
          hint={isVip ? "Đang kích hoạt" : "Chưa có gói"}
        />
      </div>

      {/* Quick links */}
      <div className="bg-[#0c0c10] border border-white/5 rounded-2xl p-5">
        <h3 className="text-sm font-black tracking-widest uppercase text-slate-400 mb-4">Truy cập nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickLink href="/mods" label="Chia sẻ mods" desc="Xem & tải các mod mới nhất" />
          <QuickLink href="/huong-dan" label="Hướng dẫn / Mẹo" desc="Bài viết hướng dẫn cài đặt" />
          <QuickLink href="/games/fc26" label="Game FC 26" desc="Hướng dẫn tải & cài game" />
          <QuickLink href="/dmca" label="DMCA" desc="Chính sách bản quyền" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  onClick,
  hint,
}: {
  label: string;
  value: string;
  icon: string;
  onClick: () => void;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-[#0c0c10] border border-white/5 rounded-2xl p-5 text-left hover:border-white/15 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] text-slate-500 group-hover:text-slate-400">Xem →</span>
      </div>
      <p className="text-2xl font-black mt-3">{value}</p>
      <p className="text-sm font-semibold text-slate-300">{label}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>
    </button>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{label}</p>
        <p className="text-[11px] text-slate-500 truncate">{desc}</p>
      </div>
      <span className="text-slate-500">→</span>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────
function ProfileSection({
  displayName,
  email,
  avatarUrl,
  onSaved,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: name.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg("Lỗi: " + (d.error || "không xác định"));
        return;
      }
      setMsg("Đã lưu thay đổi ✓");
      onSaved();
    } catch {
      setMsg("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0c0c10] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-black tracking-widest uppercase text-slate-400 mb-5">Thông tin cá nhân</h3>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1a1a1f] flex items-center justify-center text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold">Ảnh đại diện từ Google</p>
              <p className="text-[11px] text-slate-500">Ảnh được đồng bộ từ tài khoản Google của bạn</p>
            </div>
          </div>

          <label className="block">
            <span className="text-xs text-slate-400 mb-1 block">Tên hiển thị</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-slate-400 mb-1 block">Email (không đổi được)</span>
            <input
              value={email}
              disabled
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-500"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving || name.trim().length < 2}
              className="px-5 py-2.5 bg-[var(--color-primary)] rounded-xl font-black text-xs tracking-widest hover:bg-[#b44c5c] transition-colors disabled:opacity-40"
            >
              {saving ? "Đang lưu..." : "LƯU THAY ĐỔI"}
            </button>
            {msg && <p className="text-sm text-slate-300">{msg}</p>}
          </div>
        </div>
      </div>

      <div className="bg-[#0c0c10] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-black tracking-widest uppercase text-slate-400 mb-4">Liên kết tài khoản</h3>
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-black text-white">
              G
            </div>
            <div>
              <p className="text-sm font-bold">Google</p>
              <p className="text-[11px] text-slate-500">{email}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-green-500/15 text-green-400 border border-green-500/30">
            Đã liên kết
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Bạn đăng nhập bằng Google. Thông tin được đồng bộ tự động lần đầu đăng nhập.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────
function OrdersSection({ subscriptions, now }: { subscriptions: AccountData["subscriptions"]; now: number }) {
  if (subscriptions.length === 0) {
    return (
      <div className="bg-[#0c0c10] border border-white/5 rounded-2xl p-12 text-center space-y-3">
        <p className="text-4xl">📭</p>
        <p className="font-bold">Chưa có đơn hàng nào</p>
        <p className="text-sm text-slate-400">Mua gói membership để mở toàn bộ tính năng và mods.</p>
        <Link
          href="/mods/mix-mods-fc26/payment"
          className="inline-block mt-2 px-5 py-2.5 bg-[var(--color-primary)] rounded-xl font-black text-xs tracking-widest hover:bg-[#b44c5c] transition-colors"
        >
          XEM GÓI & MUA
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((s) => {
        const expired = s.status === "expired" || (s.status === "active" && new Date(s.expires_at).getTime() < now);
        const statusLabel =
          s.status === "cancelled" ? "Đã hủy" : expired ? "Hết hạn" : s.status === "active" ? "Đang hoạt động" : "Không rõ";
        return (
          <div key={s.id} className="bg-[#0c0c10] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-black">{s.plan_name}</p>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    s.status === "active" && !expired
                      ? "bg-green-500/15 text-green-400 border-green-500/30"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {formatDate(s.starts_at)} → {formatDate(s.expires_at)}
              </p>
              {s.notes && <p className="text-[11px] text-slate-500 mt-0.5 truncate">Ghi chú: {s.notes}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-[var(--color-primary)]">{VND(s.plan_price)}</p>
              <p className="text-[11px] text-slate-500">#{s.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Unlocked mods
// ─────────────────────────────────────────────
function UnlockedSection({ items }: { items: AccountData["mods_unlocked"] }) {
  if (items.length === 0) {
    return (
      <div className="bg-[#0c0c10] border border-white/5 rounded-2xl p-12 text-center space-y-3">
        <p className="text-4xl">🔓</p>
        <p className="font-bold">Chưa mở mod nào</p>
        <p className="text-sm text-slate-400">
          Khi bạn mở/mua một mod bằng credit, nó sẽ xuất hiện ở đây và được giữ trong 60 ngày.
        </p>
        <Link
          href="/mods"
          className="inline-block mt-2 px-5 py-2.5 bg-[var(--color-primary)] rounded-xl font-black text-xs tracking-widest hover:bg-[#b44c5c] transition-colors"
        >
          KHÁM PHÁ MODS
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">
          {items.length} mod đang được lưu · tự động xóa sau 60 ngày
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const mod = item.mod;
          return (
            <Link
              key={item.id}
              href={mod ? `/mods/${mod.slug}` : "/mods"}
              className="bg-[#0c0c10] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--color-primary)]/40 hover:bg-white/[0.03] transition-colors group"
            >
              {mod?.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mod.thumbnail}
                  alt={mod.name}
                  className="w-16 h-14 object-cover rounded-xl shrink-0 bg-black"
                />
              ) : (
                <div className="w-16 h-14 rounded-xl bg-white/5 shrink-0 flex items-center justify-center text-slate-600 text-xs">
                  Mod
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                  {mod?.name ?? "Mod không còn tồn tại"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {mod?.category ?? ""}
                  {mod?.tags?.length ? ` · ${mod.tags.slice(0, 3).join(", ")}` : ""}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">Mở lúc {formatDate(item.unlocked_at)}</p>
              </div>
              <span className="text-slate-500 shrink-0">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}