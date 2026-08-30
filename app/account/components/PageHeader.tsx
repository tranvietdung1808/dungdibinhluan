"use client";

// =====================================================
// PageHeader — đầu trang account dashboard
// Avatar + tên + email, badge trạng thái, CTA VIP
// =====================================================

import { Badge, Icon } from "./ui";

export function PageHeader({
  displayName,
  email,
  avatarUrl,
  isVip,
  isAdmin,
  vipDaysLeft,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  isVip: boolean;
  isAdmin: boolean;
  vipDaysLeft?: number;
}) {
  return (
    <div className="border-b border-line bg-surface-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-6">
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
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl surface-raised overflow-hidden">
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
              {isVip && (
                <span
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-coral flex items-center justify-center text-white"
                  title="Thành viên VIP"
                >
                  <Icon name="crown" filled className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-title tracking-tight truncate">
                {displayName}
              </h1>
              <p className="text-sm text-muted mt-0.5 flex items-center gap-1.5 min-w-0">
                <Icon name="mail" className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </p>
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
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

          <div className="sm:ml-auto shrink-0"></div>
        </div>
      </div>
    </div>
  );
}