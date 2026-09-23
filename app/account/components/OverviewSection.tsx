"use client";

// =====================================================
// Overview — tổng quan tài khoản
// Membership card là focal point · stat cards empty-aware
// =====================================================

import type { SectionKey, SubscriptionInfo, UnlockedMod } from "../types";
import { Card, CardHeader, Icon, StatCard, type IconName } from "./ui";
import { MembershipHero } from "./MembershipSection";
import { formatDate, daysLeft } from "./states";

export function OverviewSection({
  isVip,
  hasVipRole,
  activeSub,
  now,
  subscriptionCount,
  unlockedItems,
  onNavigate,
}: {
  isVip: boolean;
  hasVipRole?: boolean;
  activeSub: SubscriptionInfo | null;
  now: number;
  subscriptionCount: number;
  unlockedItems: UnlockedMod[];
  onNavigate: (s: SectionKey) => void;
}) {
  const emptySubs = subscriptionCount === 0;
  const emptyMods = unlockedItems.length === 0;

  return (
    <div className="space-y-6">
      {/* Focal point: membership — CTA dẫn tới section gói trong trang này
          (chưa có checkout membership → không link sang sản phẩm khác, A05) */}
      <MembershipHero
        hasVip={isVip}
        hasVipRole={hasVipRole}
        planName={activeSub?.plan_name}
        startsAt={activeSub?.starts_at}
        expiresAt={activeSub?.expires_at}
        now={now}
        cta={{ href: "/account?section=membership", label: "Xem gói membership" }}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon="crown"
          value={emptySubs ? "0" : subscriptionCount}
          label="Gói đã đăng ký"
          hint={emptySubs ? "Chưa đăng ký gói nào" : daysLeftText(activeSub, now)}
          onClick={() => onNavigate("orders")}
        />
        <StatCard
          icon="unlock"
          value={emptyMods ? "0" : unlockedItems.length}
          label="Mod đã mở"
          hint={emptyMods ? "Thư viện trống" : `Mở vào ${formatDate(unlockedItems[0].unlocked_at)}`}
          accent={emptyMods ? "neutral" : "violet"}
          onClick={() => onNavigate("unlocked")}
        />
        <StatCard
          icon="sparkles"
          value={isVip ? "VIP" : "Thành viên"}
          label="Hạng thành viên"
          accent={isVip ? "accent" : "neutral"}
          hint={isVip ? "Quyền lợi đang hoạt động" : "Xem các gói"}
          onClick={() => onNavigate("membership")}
        />
        <StatCard
          icon="clock"
          value={
            isVip && activeSub
              ? daysLeft(activeSub.expires_at, now) + " ngày"
              : "—"
          }
          label="Còn lại"
          accent={isVip && activeSub ? "ok" : "neutral"}
          hint={
            isVip && activeSub
              ? `Hết hạn ${formatDate(activeSub.expires_at)}`
              : isVip
                ? "Quyền được cấp trực tiếp"
                : "Chưa có gói"
          }
          onClick={() => onNavigate("membership")}
        />
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader
          icon="sparkles"
          iconTone="violet"
          title="Truy cập nhanh"
          subtitle="Điều hướng các khu vực chính"
        />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <QuickLink
            label="Khám phá mods"
            desc="Xem & tải các mod mới nhất"
            icon="search"
            href="/mods"
          />
          <QuickLink
            label="Gói VIP / Membership"
            desc="Xem quyền lợi và gia hạn gói"
            icon="crown"
            onClick={() => onNavigate("membership")}
          />
          <QuickLink
            label="Hướng dẫn cài đặt"
            desc="Bài viết hướng dẫn chi tiết"
            icon="book"
            href="/huong-dan"
          />
          <QuickLink
            label="Game FC 26"
            desc="Hướng dẫn tải & cài game"
            icon="gamepad"
            href="/games/fc26"
          />
        </div>
      </Card>
    </div>
  );
}

function daysLeftText(activeSub: SubscriptionInfo | null, now: number) {
  if (!activeSub) return "Xem lịch sử đăng ký";
  const left = daysLeft(activeSub.expires_at, now);
  return left > 0 ? `Gói còn ${left} ngày` : "Gói vừa hết hạn";
}

function QuickLink({
  label,
  desc,
  icon,
  href,
  onClick,
}: {
  label: string;
  desc: string;
  icon: IconName;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    "flex items-center gap-3.5 p-3.5 rounded-md surface-0 border border-line text-left hover:surface-raised transition-colors duration-150 group";
  const content = (
    <>
      <span className="w-10 h-10 shrink-0 rounded-md bg-surface-2 border border-line flex items-center justify-center text-text-body group-hover:text-accent group-hover:border-accent/30 transition-colors duration-150">
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-sm text-title">{label}</span>
        <span className="block text-[11px] text-muted truncate">{desc}</span>
      </span>
      <Icon
        name="arrow-right"
        className="w-4 h-4 text-muted/50 shrink-0 transition-all duration-150 group-hover:text-accent group-hover:translate-x-0.5"
      />
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {content}
      </button>
    );
  }
  return (
    <a href={href} className={cls}>
      {content}
    </a>
  );
}
