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

const TABS: Array<{ key: Section; label: string }> = [
  { key: "overview", label: "Tổng quan" },
  { key: "profile", label: "Thông tin cá nhân" },
  { key: "orders", label: "Lịch sử đơn hàng" },
  { key: "unlocked", label: "Mod đã mở" },
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

// ─────────────────────────────────────────────
// Icons (inline SVG — no emoji dependency)
// ─────────────────────────────────────────────
function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V7l-9-5z" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconShoppingBag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconUnlock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconCrown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main Account Page
// ─────────────────────────────────────────────
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center px-4">
        <div className="text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#141418] border border-white/10 flex items-center justify-center">
            <IconUser className="w-10 h-10 text-slate-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">Bạn chưa đăng nhập</p>
            <p className="text-slate-400 text-sm mt-2">Đăng nhập để quản lý tài khoản, đơn hàng và mod đã mở.</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-primary)] rounded-xl font-black text-sm tracking-widest text-white hover:bg-[#b44c5c] transition-colors shadow-[0_4px_20px_rgba(206,90,103,0.35)]"
          >
            ĐĂNG NHẬP NGAY
            <IconChevronRight className="w-4 h-4" />
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
  const orderCount = data?.subscriptions?.length ?? 0;
  const unlockedCount = data?.mods_unlocked?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#050507]">
      {/* ── Hero header (plati.market style) ── */}
      <div className="relative overflow-hidden border-b border-white/5">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[500px] h-[300px] bg-[var(--color-primary)]/5 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-[var(--color-primary)]/3 blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-8 md:pb-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
            <Link href="/" className="hover:text-slate-300 transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-slate-300">Tài khoản của tôi</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar + Name block */}
            <div className="flex items-start gap-5 flex-1 min-w-0">
              <div className="relative shrink-0">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1a1a22] to-[#111116] flex items-center justify-center text-3xl font-black text-slate-500">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {isVip && (
                  <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <IconCrown className="w-3.5 h-3.5 text-white" />
                  </span>
                )}
              </div>

              <div className="min-w-0 pt-1">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">
                  {displayName}
                </h1>
                <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                  <IconMail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{current?.email ?? user.email}</span>
                </p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                    isVip
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-white/5 text-slate-400 border-white/10"
                  }`}>
                    {isVip ? (
                      <>
                        <IconCrown className="w-3 h-3" />
                        VIP
                      </>
                    ) : (
                      "Thành viên"
                    )}
                  </span>
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/25 transition-colors"
                    >
                      <IconShield className="w-3 h-3" />
                      ADMIN
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* VIP CTA (if not VIP) */}
            {!isVip && (
              <Link
                href="/mods/mix-mods-fc26/payment"
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[#b44c5c] rounded-xl font-black text-sm text-white tracking-wider hover:from-[#b44c5c] hover:to-[var(--color-primary)] transition-all shadow-[0_4px_25px_rgba(206,90,103,0.35)]"
              >
                <IconCrown className="w-4 h-4 text-amber-300" />
                NÂNG CẤP VIP
                <IconChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Stats row (plati.market "продано / отзывы" style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <StatBadge
              icon={<IconShoppingBag className="w-4 h-4" />}
              value={String(orderCount)}
              label="Đơn hàng"
              color="slate"
            />
            <StatBadge
              icon={<IconUnlock className="w-4 h-4" />}
              value={String(unlockedCount)}
              label="Mod đã mở"
              color="slate"
            />
            <StatBadge
              icon={<IconStar className="w-4 h-4" />}
              value={isVip ? "VIP" : "Thường"}
              label="Trạng thái"
              color={isVip ? "amber" : "slate"}
            />
            <StatBadge
              icon={<IconClock className="w-4 h-4" />}
              value={isVip && activeSub ? String(daysLeft(activeSub.expires_at, now)) + " ngày" : "—"}
              label="Còn lại"
              color={isVip ? "emerald" : "slate"}
            />
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="sticky top-14 md:top-16 z-30 bg-[#050507]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-0 overflow-x-auto -mb-px" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSection(tab.key)}
                role="tab"
                aria-selected={section === tab.key}
                className={`relative px-4 md:px-6 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                  section === tab.key
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
                {section === tab.key && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[var(--color-primary)] rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <p className="text-red-400 text-sm font-medium">{error}</p>
            <button
              onClick={() => { setError(""); void fetchAccount(); }}
              className="mt-3 text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {section === "overview" && (
              <OverviewSection
                displayName={displayName}
                isVip={isVip}
                activeSub={activeSub}
                now={now}
                orderCount={orderCount}
                unlockedCount={unlockedCount}
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
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Stat Badge (hero stats row)
// ─────────────────────────────────────────────
function StatBadge({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: "slate" | "amber" | "emerald";
}) {
  const colorMap = {
    slate: "bg-white/[0.03] border-white/5 text-slate-300 [&_svg]:text-slate-400",
    amber: "bg-amber-500/[0.04] border-amber-500/15 text-amber-300 [&_svg]:text-amber-400",
    emerald: "bg-emerald-500/[0.04] border-emerald-500/15 text-emerald-300 [&_svg]:text-emerald-400",
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colorMap[color]}`}>
      <div className="shrink-0 opacity-70">{icon}</div>
      <div className="min-w-0">
        <p className="text-lg font-black leading-tight">{value}</p>
        <p className="text-[10px] uppercase tracking-wider opacity-60">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Card wrapper
// ─────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0c0c12] border border-white/[0.06] rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 py-5 border-b border-white/5">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Overview Section
// ─────────────────────────────────────────────
function OverviewSection({
  displayName,
  isVip,
  activeSub,
  now,
  orderCount,
  unlockedCount,
  onNavigate,
}: {
  displayName: string;
  isVip: boolean;
  activeSub: AccountData["subscription"];
  now: number;
  orderCount: number;
  unlockedCount: number;
  onNavigate: (s: Section) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Active subscription card */}
      <Card>
        <CardHeader title="Gói hiện tại" subtitle={isVip ? "Gói đang kích hoạt" : "Bạn chưa có gói membership"} />
        <div className="p-6">
          {isVip && activeSub ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                    <IconCrown className="w-4 h-4 text-amber-400" />
                  </span>
                  <p className="text-lg font-black">{activeSub.plan_name}</p>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Còn <span className="font-bold text-amber-400">{daysLeft(activeSub.expires_at, now)} ngày</span> sử dụng · Hết hạn{" "}
                  <span className="text-slate-300">{formatDate(activeSub.expires_at)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wide">
                <IconCheck className="w-3.5 h-3.5" />
                Đang hoạt động
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-slate-400 text-sm">
                Nâng cấp lên <span className="text-white font-bold">VIP</span> để mở toàn bộ tính năng, tải mod không giới hạn và hỗ trợ ưu tiên.
              </p>
              <Link
                href="/mods/mix-mods-fc26/payment"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] rounded-xl font-black text-xs tracking-wider text-white hover:bg-[#b44c5c] transition-colors"
              >
                XEM GÓI VIP
                <IconChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* Quick stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickCard
          icon={<IconShoppingBag className="w-5 h-5" />}
          value={String(orderCount)}
          label="Đơn hàng"
          description="Lịch sử mua membership"
          onClick={() => onNavigate("orders")}
          accent="var(--color-primary)"
        />
        <QuickCard
          icon={<IconUnlock className="w-5 h-5" />}
          value={String(unlockedCount)}
          label="Mod đã mở"
          description="Mod đã mở trong 60 ngày"
          onClick={() => onNavigate("unlocked")}
          accent="var(--color-primary)"
        />
        <QuickCard
          icon={<IconUser className="w-5 h-5" />}
          value={displayName}
          label="Hồ sơ"
          description="Chỉnh sửa thông tin cá nhân"
          onClick={() => onNavigate("profile")}
          accent="var(--color-primary)"
        />
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader title="Truy cập nhanh" />
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickLink href="/mods" icon={<IconUnlock className="w-4 h-4" />} label="Khám phá mods" desc="Xem & tải các mod mới nhất" />
            <QuickLink href="/huong-dan" icon={<IconClock className="w-4 h-4" />} label="Hướng dẫn / Mẹo" desc="Bài viết hướng dẫn cài đặt" />
            <QuickLink href="/games/fc26" icon={<IconStar className="w-4 h-4" />} label="Game FC 26" desc="Hướng dẫn tải & cài game" />
            <QuickLink href="/dmca" icon={<IconShield className="w-4 h-4" />} label="DMCA" desc="Chính sách bản quyền" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function QuickCard({
  icon,
  value,
  label,
  description,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  description: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-[#0c0c12] border border-white/[0.06] rounded-2xl p-5 text-left hover:border-white/10 transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" style={{ background: accent }} />
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-[var(--color-primary)] transition-colors mb-4">
          {icon}
        </div>
        <p className="text-2xl font-black tracking-tight truncate">{value}</p>
        <p className="text-sm font-bold text-slate-300 mt-1">{label}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}

function QuickLink({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/[0.04] transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-400 group-hover:text-[var(--color-primary)] transition-colors shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-200">{label}</p>
        <p className="text-[11px] text-slate-500 truncate">{desc}</p>
      </div>
      <IconChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
    </Link>
  );
}

// ─────────────────────────────────────────────
// Profile Section
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
      setMsg("Đã lưu thay đổi");
      onSaved();
    } catch {
      setMsg("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal info */}
      <Card>
        <CardHeader title="Thông tin cá nhân" subtitle="Cập nhật tên hiển thị và xem thông tin tài khoản" />
        <div className="p-6 space-y-6">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 pb-5 border-b border-white/5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-lg">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a1a22] to-[#111116] flex items-center justify-center text-2xl font-black text-slate-500">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold">Ảnh đại diện</p>
              <p className="text-xs text-slate-500 mt-0.5">Tự động đồng bộ từ tài khoản Google</p>
            </div>
          </div>

          {/* Name field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Tên hiển thị
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-colors"
              placeholder="Nhập tên hiển thị..."
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Email
            </label>
            <div className="flex items-center gap-2 w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3">
              <IconMail className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-sm text-slate-500 select-all">{email}</span>
              <span className="ml-auto text-[10px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-md shrink-0">Google</span>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={save}
              disabled={saving || name.trim().length < 2}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] rounded-xl font-black text-xs tracking-wider text-white hover:bg-[#b44c5c] transition-colors disabled:opacity-40 shadow-[0_4px_15px_rgba(206,90,103,0.3)]"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <IconCheck className="w-3.5 h-3.5" />
                  LƯU THAY ĐỔI
                </>
              )}
            </button>
            {msg && (
              <span className={`text-xs font-medium ${msg.startsWith("Lỗi") ? "text-red-400" : "text-emerald-400"}`}>
                {msg}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Connected accounts */}
      <Card>
        <CardHeader title="Tài khoản liên kết" subtitle="Tài khoản dùng để đăng nhập" />
        <div className="p-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Google</p>
                <p className="text-xs text-slate-500">{email}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <IconCheck className="w-3 h-3" />
              Đã liên kết
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Bạn đăng nhập bằng Google. Tất cả thông tin được đồng bộ tự động khi đăng nhập lần đầu.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// Orders Section
// ─────────────────────────────────────────────
function OrdersSection({ subscriptions, now }: { subscriptions: AccountData["subscriptions"]; now: number }) {
  if (subscriptions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
          <IconShoppingBag className="w-7 h-7 text-slate-500" />
        </div>
        <p className="text-lg font-bold">Chưa có đơn hàng</p>
        <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
          Mua gói membership để mở toàn bộ tính năng, tải mod chất lượng cao và nhận hỗ trợ ưu tiên.
        </p>
        <Link
          href="/mods/mix-mods-fc26/payment"
          className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 bg-[var(--color-primary)] rounded-xl font-black text-xs tracking-wider text-white hover:bg-[#b44c5c] transition-colors shadow-[0_4px_15px_rgba(206,90,103,0.3)]"
        >
          XEM GÓI & MUA
          <IconChevronRight className="w-3.5 h-3.5" />
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-slate-400">
          <span className="font-bold text-white">{subscriptions.length}</span> đơn hàng
        </p>
      </div>
      {subscriptions.map((s) => {
        const expired = s.status === "expired" || (s.status === "active" && new Date(s.expires_at).getTime() < now);
        const isActive = s.status === "active" && !expired;
        const statusLabel = s.status === "cancelled" ? "Đã hủy" : expired ? "Hết hạn" : "Hoạt động";
        return (
          <Card key={s.id}>
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.03] text-slate-500"
                }`}>
                  <IconShoppingBag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-sm">{s.plan_name}</p>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-500/5 text-slate-400 border-slate-500/15"
                    }`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {formatDate(s.starts_at)} → {formatDate(s.expires_at)}
                  </p>
                  {s.notes && <p className="text-[11px] text-slate-600 mt-0.5 truncate">{s.notes}</p>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-[var(--color-primary)] text-lg">{VND(s.plan_price)}</p>
                <p className="text-[10px] text-slate-600 font-mono mt-0.5">#{s.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Unlocked Mods Section
// ─────────────────────────────────────────────
function UnlockedSection({ items }: { items: AccountData["mods_unlocked"] }) {
  if (items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
          <IconUnlock className="w-7 h-7 text-slate-500" />
        </div>
        <p className="text-lg font-bold">Chưa mở mod nào</p>
        <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
          Mod bạn đã mở bằng credit sẽ hiển thị ở đây. Dữ liệu được lưu tối đa <span className="text-white font-bold">60 ngày</span>.
        </p>
        <Link
          href="/mods"
          className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 bg-[var(--color-primary)] rounded-xl font-black text-xs tracking-wider text-white hover:bg-[#b44c5c] transition-colors shadow-[0_4px_15px_rgba(206,90,103,0.3)]"
        >
          KHÁM PHÁ MODS
          <IconChevronRight className="w-3.5 h-3.5" />
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">
          <span className="font-bold text-white">{items.length}</span> mod · tự động xóa sau 60 ngày
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const mod = item.mod;
          return (
            <Link
              key={item.id}
              href={mod ? `/mods/${mod.slug}` : "/mods"}
              className="group bg-[#0c0c12] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--color-primary)]/30 hover:bg-white/[0.03] transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 ring-1 ring-white/5">
                {mod?.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mod.thumbnail} alt={mod.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a1a22] to-[#111116] flex items-center justify-center">
                    <span className="text-slate-600 text-[10px] font-black">MOD</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                  {mod?.name ?? "Mod không còn tồn tại"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {mod?.category ?? ""}
                  {mod?.tags?.length ? ` · ${mod.tags.slice(0, 2).join(", ")}` : ""}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  <IconClock className="w-3 h-3 inline mr-1" />
                  {formatDate(item.unlocked_at)}
                </p>
              </div>
              <IconChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}