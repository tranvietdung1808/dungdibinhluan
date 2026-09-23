"use client";

// =====================================================
// Membership — VIP card/hero là focal point của trang
// - MembershipHero: trạng thái gói hiện tại (đang dùng / được cấp / chưa có)
// - MembershipSection: plans từ API + CTA liên hệ (A05: chưa có checkout
//   membership → mọi CTA mở fanpage hỗ trợ, không link sang checkout Mix Mods)
// Coral = primary accent (VIP)
// =====================================================

import type { MembershipPlan, SubscriptionInfo } from "../types";
import { SUPPORT_URL } from "../types";
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  Icon,
} from "./ui";
import {
  EmptyState,
  InlineError,
  VND,
  daysLeft,
  formatDate,
  subProgressPct,
} from "./states";

type HeroCta = { href: string; label: string };

// ─── Hero (focal point): trạng thái VIP hiện tại ───
// Ba trạng thái riêng biệt (§14.3):
//   1) Subscription đang hoạt động → hạn dùng + thanh thời gian thật
//   2) VIP do role, không subscription → "Được cấp quyền" (không hiển thị
//      đồng thời VIP + "Chưa có VIP")
//   3) Chưa có gói → upsell dẫn tới danh sách gói / kênh liên hệ
export function MembershipHero({
  hasVip,
  hasVipRole = false,
  planName,
  startsAt,
  expiresAt,
  now,
  cta,
}: {
  hasVip: boolean;
  hasVipRole?: boolean;
  planName?: string;
  startsAt?: string;
  expiresAt?: string;
  now: number;
  // CTA cho trạng thái "chưa có gói" — mỗi section truyền đích phù hợp
  cta: HeroCta;
}) {
  const expired = expiresAt ? new Date(expiresAt).getTime() <= now : false;

  // ── 1) Subscription còn hạn ──
  if (hasVip && planName && expiresAt && !expired) {
    const left = daysLeft(expiresAt, now);
    const pct = subProgressPct(startsAt, expiresAt, now);
    return (
      <section aria-label="Membership hiện tại" className="rounded-2xl surface-raised overflow-hidden border border-accent/25">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <span className="shrink-0 w-12 h-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                <Icon name="crown" filled className="w-6 h-6" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-title tracking-tight">
                    {planName}
                  </h2>
                  <Badge tone="ok">
                    <Icon name="check" className="w-3 h-3" />
                    Đang hoạt động
                  </Badge>
                </div>
                <p className="text-sm text-body mt-1.5 leading-relaxed max-w-xl">
                  Quyền lợi của gói đang được áp dụng cho tài khoản. Hết hạn{" "}
                  <span className="font-bold text-title">{formatDate(expiresAt)}</span>
                  {" "}
                  <span className="text-muted">({left === 0 ? "hôm nay" : `còn ${left} ngày`})</span>.
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:text-right flex sm:flex-col items-center gap-2 sm:items-end">
              <p className="text-3xl font-black text-accent tracking-tight tabular-nums">
                {left} <span className="text-sm font-bold text-muted">ngày</span>
              </p>
              <ButtonLink variant="ghost" size="sm" href={SUPPORT_URL}>
                Liên hệ gia hạn
              </ButtonLink>
            </div>
          </div>

          {/* Thanh thời hạn — tỷ lệ từ starts_at/expires_at thật (§14.3) */}
          {pct !== null && (
            <div className="mt-5">
              <div
                className="h-2 rounded-full bg-surface-1 overflow-hidden relative"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Thời gian còn lại của gói"
              >
                <div
                  className="h-full bg-accent/80 rounded-full relative overflow-hidden"
                  style={{ width: `${pct}%` }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-progress-sheen"
                  />
                </div>
              </div>
            </div>
          )}
          <p className="text-[11px] text-muted mt-2">
            {startsAt ? `Hiệu lực ${formatDate(startsAt)} → ` : ""}Hết hạn{" "}
            {formatDate(expiresAt)} · Gói này không tự gia hạn định kỳ
          </p>
        </div>
      </section>
    );
  }

  // ── 2) VIP do role, không có subscription đang chạy ──
  if (hasVip) {
    return (
      <section aria-label="Membership hiện tại" className="rounded-2xl surface-raised overflow-hidden border border-accent/25">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <span className="shrink-0 w-12 h-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                <Icon name="crown" filled className="w-6 h-6" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-title tracking-tight">
                    Tài khoản VIP
                  </h2>
                  <Badge tone="ok">
                    <Icon name="check" className="w-3 h-3" />
                    Được cấp quyền
                  </Badge>
                </div>
                <p className="text-sm text-body mt-1.5 leading-relaxed max-w-xl">
                  Quyền VIP đang được cấp trực tiếp cho tài khoản này
                  {hasVipRole ? " qua hạng thành viên" : ""}, không gắn với một
                  gói có thời hạn.
                </p>
              </div>
            </div>
            <ButtonLink
              variant="ghost"
              size="sm"
              href={SUPPORT_URL}
              className="shrink-0 self-start sm:self-auto"
            >
              Liên hệ hỗ trợ
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  // ── 3) Từng có gói nhưng đã hết hạn (hiếm: subscription quá hạn) ──
  if (planName && expiresAt && expired) {
    return (
      <section aria-label="Membership đã hết hạn" className="rounded-2xl surface-raised overflow-hidden border border-line">
        <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <span className="shrink-0 w-12 h-12 rounded-xl bg-surface-2 text-muted flex items-center justify-center">
              <Icon name="crown" className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-title tracking-tight">
                  {planName}
                </h2>
                <Badge tone="neutral">Đã hết hạn</Badge>
              </div>
              <p className="text-sm text-body mt-1.5 leading-relaxed max-w-xl">
                Gói của bạn đã hết hạn vào {formatDate(expiresAt)}. Liên hệ fanpage
                để gia hạn hoặc đổi sang gói phù hợp.
              </p>
            </div>
          </div>
          <ButtonLink variant="primary" size="lg" href={SUPPORT_URL} className="shrink-0 w-full sm:w-auto">
            Liên hệ gia hạn
            <Icon name="chevron-right" className="w-4 h-4" />
          </ButtonLink>
        </div>
      </section>
    );
  }

  // ── 4) Chưa có gói → CTA về danh sách gói / kênh liên hệ ──
  return (
    <section aria-label="Gói membership" className="rounded-2xl surface-raised overflow-hidden border border-accent/30">
      <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <span className="shrink-0 w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(110,242,160,0.6)]">
            <Icon name="crown" filled className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-title tracking-tight">
              Chưa có gói membership
            </h2>
            <p className="text-sm text-body mt-1.5 leading-relaxed max-w-xl">
              Xem quyền lợi từng gói bên dưới. Chưa có thanh toán trực tuyến cho
              membership — liên hệ fanpage để được tư vấn và kích hoạt.
            </p>
          </div>
        </div>
        <ButtonLink
          variant="primary"
          size="lg"
          href={cta.href}
          className="shrink-0 w-full sm:w-auto"
        >
          <Icon name="crown" className="w-4 h-4" />
          {cta.label}
          <Icon name="chevron-right" className="w-4 h-4" />
        </ButtonLink>
      </div>
    </section>
  );
}

// ─── Section chính: hero + danh sách gói ───
export function MembershipSection({
  plans,
  fetchPlans,
  plansLoading,
  plansError,
  hasVip,
  hasVipRole,
  activeSub,
  now,
}: {
  plans: MembershipPlan[];
  fetchPlans: () => void;
  plansLoading: boolean;
  plansError: string;
  hasVip: boolean;
  hasVipRole?: boolean;
  activeSub: SubscriptionInfo | null;
  now: number;
}) {
  const visiblePlans = plans.filter((p) => p.is_active);

  return (
    <div className="space-y-6">
      <MembershipHero
        hasVip={hasVip}
        hasVipRole={hasVipRole}
        planName={activeSub?.plan_name}
        startsAt={activeSub?.starts_at}
        expiresAt={activeSub?.expires_at}
        now={now}
        cta={{ href: SUPPORT_URL, label: "Liên hệ tư vấn gói" }}
      />

      {/* Danh sách gói */}
      <Card>
        <CardHeader
          icon="crown"
          iconTone="accent"
          title="Gói membership"
          subtitle={
            visiblePlans.length === 0
              ? "Danh sách gói đang được cập nhật"
              : `${visiblePlans.length} gói · đơn vị VND`
          }
        />
        <div className="p-5 sm:p-6 space-y-4">
          {plansLoading ? (
            <div className="grid sm:grid-cols-2 gap-4" aria-busy="true">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-surface-2/70 h-48" />
              ))}
            </div>
          ) : plansError ? (
            <InlineError message={plansError} onRetry={fetchPlans} />
          ) : visiblePlans.length === 0 ? (
            <EmptyState
              icon="crown"
              title="Chưa có gói VIP nào"
              description="Danh sách gói membership chưa được bật. Quay lại sau khi cửa hàng cập nhật, hoặc liên hệ fanpage để được tư vấn."
              ctaLabel="Liên hệ hỗ trợ"
              ctaHref={SUPPORT_URL}
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {visiblePlans.map((p) => {
                const isCurrent = hasVip && activeSub?.plan_name === p.name;
                return (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    isCurrent={Boolean(isCurrent)}
                  />
                );
              })}
            </div>
          )}
          <p className="text-[11px] text-muted leading-relaxed">
            Đã thanh toán hoặc cần gia hạn gói? Liên hệ{" "}
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-strong underline underline-offset-2"
            >
              fanpage DungDiBinhLuan
            </a>{" "}
            để được kích hoạt cho tài khoản của bạn.
          </p>
        </div>
      </Card>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
}: {
  plan: MembershipPlan;
  isCurrent: boolean;
}) {
  return (
    <Card
      as="article"
      className={`p-5 flex flex-col ${
        isCurrent ? "border border-accent/25 surface-raised" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-title text-base leading-tight">{plan.name}</h3>
          {plan.description && (
            <p className="text-xs text-muted mt-1 leading-relaxed">{plan.description}</p>
          )}
        </div>
        {isCurrent && (
          <Badge tone="accent">
            <Icon name="check" className="w-3 h-3" />
            Đang dùng
          </Badge>
        )}
      </div>

      <p className="mt-4">
        <span className="text-2xl font-black text-accent tracking-tight">{VND(plan.price)}</span>
        <span className="text-xs text-muted"> / {plan.duration_days} ngày</span>
      </p>

      {plan.features.length > 0 && (
        <ul className="mt-4 space-y-2">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-body">
              <span className="mt-0.5 text-ok shrink-0">
                <Icon name="check" className="w-3.5 h-3.5" />
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {/* A05/T17: chưa có checkout membership → CTA mở fanpage hỗ trợ,
          không chuyển nhầm sang checkout sản phẩm khác */}
      <ButtonLink
        variant={isCurrent ? "secondary" : "primary"}
        className="mt-5 w-full"
        href={SUPPORT_URL}
      >
        {isCurrent ? "Liên hệ gia hạn" : "Liên hệ về gói này"}
      </ButtonLink>
    </Card>
  );
}
