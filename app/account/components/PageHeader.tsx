"use client";

// =====================================================
// PageHeader — đầu trang account dashboard
// Avatar ring theo hạng (coral = VIP / neutral = member)
// Greeting theo giờ + meta chips (email, thời điểm)
// =====================================================

import { Badge, Icon } from "./ui";
import { formatDateTime } from "./states";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function PageHeader({
  displayName,
  email,
  avatarUrl,
  isVip,
  isAdmin,
  vipDaysLeft,
  memberSince,
  lastSignIn,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  isVip: boolean;
  isAdmin: boolean;
  vipDaysLeft?: number;
  memberSince?: string | null;
  lastSignIn?: string | null;
}) {
  return (
    <div className="border-b border-line bg-surface-0 overflow-hidden relative">
      {/* ambient glow theo hạng — không phải decoration trên card content */}
      <div
        aria-hidden="true"
        className={`absolute -top-24 right-0 w-[420px] h-[300px] rounded-full pointer-events-none ${
          isVip
            ? "animate-pulse-glow-2"
            : ""
        }`}
        style={{
          background: isVip
            ? "radial-gradient(closest-side, rgba(240,96,120,0.14), transparent)"
            : "radial-gradient(closest-side, rgba(143,123,247,0.10), transparent)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-6">
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex items-center gap-1.5 text-xs text-muted font-medium">
            <li>
              <a href="/" className="hover:text-title transition-colors">
                Trang chủ
              </a>
            </li>
            <li aria-hidden="true" className="text-muted/60">
              /
            </li>
            <li aria-current="page" className="text-text-body">
              Tài khoản của tôi
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar + ring theo hạng */}
            <div className="relative shrink-0">
              <div
                className={`rounded-2xl p-[2.5px] ${
                  isVip
                    ? "bg-gradient-to-br from-coral via-coral-strong to-violet/60"
                    : "bg-surface-2 border border-line"
                }`}
              >
                <div className="w-14 h-14 sm:w-[70px] sm:h-[70px] rounded-[13px] bg-surface-1 overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={`Ảnh đại diện của ${displayName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-2 flex items-center justify-center text-2xl font-black text-muted">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              {isVip && (
                <span
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-coral flex items-center justify-center text-white shadow-[0_8px_24px_-12px_rgba(240,96,120,0.55)]"
                  title="Thành viên VIP"
                >
                  <Icon name="crown" filled className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p
                className={`text-[11px] font-black uppercase tracking-wider ${
                  isVip ? "text-coral" : "text-muted"
                }`}
              >
                {greeting()}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-title tracking-tight truncate">
                {displayName}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {isVip ? (
                  <Badge tone="coral">
                    <Icon name="crown" filled className="w-3 h-3" />
                    VIP
                    {typeof vipDaysLeft === "number" && vipDaysLeft > 0 && (
                      <span className="opacity-80 font-semibold">· {vipDaysLeft} ngày</span>
                    )}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Member</Badge>
                )}
                {isAdmin && (
                  <Badge tone="violet">
                    <Icon name="shield" className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Meta chips */}
          <div className="sm:ml-auto shrink-0 w-full sm:w-auto">
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted truncate max-w-full">
                <Icon name="mail" className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </span>
              {(memberSince || lastSignIn) && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted/80">
                  <Icon name="clock" className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {memberSince && `Từ ${formatDateTime(memberSince)}`}
                    {memberSince && lastSignIn && " · "}
                    {lastSignIn && `Đăng nhập ${formatDateTime(lastSignIn)}`}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}