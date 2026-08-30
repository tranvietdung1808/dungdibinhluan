"use client";

// =====================================================
// Overview — tổng quan tài khoản
// Membership card là focal point · stat cards empty-aware
// =====================================================

import type { SectionKey, SubscriptionInfo, UnlockedMod } from "../types";
import { Card, CardHeader, Icon, StatCard } from "./ui";
import { MembershipHero } from "./MembershipSection";
import { formatDate, daysLeft } from "./states";

export function OverviewSection({
  displayName,
  isVip,
  activeSub,
  now,
  orderCount,
  unlockedItems,
  onNavigate,
  onUpgrade,
}: {
  displayName: string;
  isVip: boolean;
  activeSub: SubscriptionInfo | null;
  now: number;
  orderCount: number;
  unlockedItems: UnlockedMod[];
  onNavigate: (s: SectionKey) => void;
  onUpgrade: () => void;
}) {
  const emptyOrders = orderCount === 0;
  const emptyMods = unlockedItems.length === 0;

  return (
    <div className="space-y-6">
      {/* Focal point: membership */}
      <MembershipHero
        hasVip={isVip}
        planName={activeSub?.plan_name}
        expiresAt={activeSub?.expires_at}
        now={now}
        onUpgrade={onUpgrade}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon="bag"
          value={emptyOrders ? "0" : orderCount}
          label="Đơn hàng"
          hint={emptyOrders ? "Chưa có đơn nào" : daysLeftText(activeSub, now)}
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
          icon="crown"
          value={isVip ? "VIP" : "Member"}
          label="Hạng thành viên"
          accent={isVip ? "coral" : "neutral"}
          hint={isVip ? "Quyền lợi đang hoạt động" : "Nâng cấp ngay"}
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
          accent={isVip ? "ok" : "neutral"}
          hint={isVip && activeSub ? `Hết hạn ${formatDate(activeSub.expires_at)}` : "Chưa có gói"}
          onClick={() => onNavigate("membership")}
        />
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader
          title="Truy cập nhanh"
          subtitle="Điều hướng các khu vực chính"
        />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <QuickLink label="Khám phá mods" desc="Xem & tải các mod mới nhất" href="/mods" />
          <QuickLink
            label="Gói VIP / Membership"
            desc="Chọn gói, kích hoạt mã"
            onClick={() => onNavigate("membership")}
          />
          <QuickLink label="Hướng dẫn cài đặt" desc="Bài viết hướng dẫn chi tiết" href="/huong-dan" />
          <QuickLink label="Game FC 26" desc="Hướng dẫn tải & cài game" href="/games/fc26" />
        </div>
      </Card>
    </div>
  );
}

function daysLeftText(activeSub: SubscriptionInfo | null, now: number) {
  if (!activeSub) return "Mua gói để xem lịch sử";
  const left = daysLeft(activeSub.expires_at, now);
  return left > 0 ? `Gói còn ${left} ngày` : "Gói vừa hết hạn";
}

function QuickLink({
  label,
  desc,
  href,
  onClick,
}: {
  label: string;
  desc: string;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    "flex items-center gap-3.5 p-3.5 rounded-xl surface-0 border border-line text-left hover:surface-raised transition-colors duration-150 group";
  const content = (
    <>
      <Icon name="chevron-right" className="w-5 h-5 text-muted group-hover:text-coral transition-colors shrink-0" />
      <span className="min-w-0">
        <span className="block font-bold text-sm text-title">{label}</span>
        <span className="block text-[11px] text-muted truncate">{desc}</span>
      </span>
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