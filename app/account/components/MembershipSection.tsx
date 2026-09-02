"use client";

// =====================================================
// Membership — VIP card/hero là focal point của trang
// - MembershipHero: thẻ nổi bật cho gói đang active
// - MembershipSection: plans từ API + kích hoạt mã code
// Coral = primary accent (VIP)
// =====================================================

import { useEffect, useState } from "react";
import type { MembershipPlan } from "../types";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Icon,
  Input,
  useFeedback,
} from "./ui";
import { EmptyState, ErrorState, VND, daysLeft, formatDate } from "./states";

// ─── Hero (focal point): trạng thái VIP hiện tại ───
export function MembershipHero({
  hasVip,
  planName,
  expiresAt,
  now,
  onUpgrade,
}: {
  hasVip: boolean;
  planName?: string;
  expiresAt?: string;
  now: number;
  onUpgrade: () => void;
}) {
  if (hasVip && planName && expiresAt) {
    const left = daysLeft(expiresAt, now);
    const pct = left <= 0 ? 0 : left >= 90 ? 100 : Math.round((left / 90) * 100);
    return (
      <section aria-label="Membership hiện tại" className="rounded-2xl surface-raised overflow-hidden border border-coral/25">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <span className="shrink-0 w-12 h-12 rounded-xl bg-coral/15 text-coral flex items-center justify-center">
                <Icon name="crown" filled className="w-6 h-6" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-title tracking-tight">
                    {planName}
                  </h2>
                  <Badge tone="coral">
                    <Icon name="check" className="w-3 h-3" />
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-body mt-1.5 leading-relaxed max-w-xl">
                  Quyền lợi VIP đang được kích hoạt. Hết hạn{" "}
                  <span className="font-bold text-title">{formatDate(expiresAt)}</span>
                  {" "}
                  <span className="text-muted">({left === 0 ? "hôm nay" : `${left} ngày`})</span>.
                </p>
              </div>
            </div>
            <div className="shrink-0 sm:text-right flex sm:flex-col items-center gap-2 sm:items-end">
              <p className="text-3xl font-black text-coral tracking-tight tabular-nums">
                {left} <span className="text-sm font-bold text-muted">ngày</span>
              </p>
              <Button variant="ghost" size="sm" onClick={onUpgrade}>
                Gia hạn
              </Button>
            </div>
          </div>

          {/* Thanh thời hạn */}
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
                className="h-full bg-coral/80 rounded-full relative overflow-hidden"
                style={{ width: `${pct}%` }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-progress-sheen"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted mt-2">
              Hết hạn {formatDate(expiresAt)} · Gói này không tự gia hạn định kỳ
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Chưa có gói → CTA focal
  return (
    <section aria-label="Nâng cấp VIP" className="rounded-2xl surface-raised overflow-hidden border border-coral/30">
      <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <span className="shrink-0 w-12 h-12 rounded-xl bg-coral text-white flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(240,96,120,0.6)]">
            <Icon name="crown" filled className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-title tracking-tight">
              Nâng cấp lên <span className="text-coral">VIP</span>
            </h2>
            <p className="text-sm text-body mt-1.5 leading-relaxed max-w-xl">
              Mở toàn bộ mod chất lượng cao, tải không giới hạn, nhận hỗ trợ ưu tiên
              và quyền lợi độc quyền.
            </p>
          </div>
        </div>
        <Button variant="primary" size="lg" className="shrink-0 w-full sm:w-auto" onClick={onUpgrade}>
          <Icon name="crown" className="w-4 h-4" />
          Chọn gói VIP
          <Icon name="chevron-right" className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}

// ─── Section chính: plans + kích hoạt code ───
export function MembershipSection({
  plans,
  fetchPlans,
  plansLoading,
  plansError,
  hasVip,
  activeSub,
  now,
  onUpgrade,
}: {
  plans: MembershipPlan[];
  fetchPlans: () => void;
  plansLoading: boolean;
  plansError: string;
  hasVip: boolean;
  activeSub: { plan_name: string; expires_at: string } | null;
  now: number;
  onUpgrade: () => void;
}) {
  const activate = useFeedback();
  const [code, setCode] = useState("");

  // Plans hidden nếu đã có VIP hết hạn? Ngược lại vẫn hiện để gia hạn nếu cần.
  const upgradable = hasVip ? "Gia hạn / đổi gói" : "Chọn gói";
  const visiblePlans = plans.filter((p) => p.is_active);

  return (
    <div className="space-y-6">
      <MembershipHero
        hasVip={hasVip}
        planName={activeSub?.plan_name}
        expiresAt={activeSub?.expires_at}
        now={now}
        onUpgrade={onUpgrade}
      />

      {/* Danh sách gói */}
      <Card>
        <CardHeader
          icon="crown"
          iconTone="coral"
          title="Gói membership"
          subtitle={
            visiblePlans.length === 0
              ? "Danh sách gói đang được cập nhật"
              : `${visiblePlans.length} gói · đơn vị VND`
          }
        />
        <div className="p-5 sm:p-6">
          {plansLoading ? (
            <div className="grid sm:grid-cols-2 gap-4" aria-busy="true">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-surface-2/70 h-48" />
              ))}
            </div>
          ) : plansError ? (
            <ErrorState message={plansError} onRetry={fetchPlans} />
          ) : visiblePlans.length === 0 ? (
            <EmptyState
              icon="crown"
              title="Chưa có gói VIP nào"
              description="Danh sách gói membership chưa được bật. Quay lại sau khi cửa hàng cập nhật, hoặc liên hệ hỗ trợ."
              ctaLabel="Liên hệ hỗ trợ"
              ctaHref="/lien-he"
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
                    actionLabel={upgradable}
                    onChoose={onUpgrade}
                  />
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Kích hoạt mã code */}
      <Card>
        <CardHeader
          icon="key"
          iconTone="warn"
          title="Kích hoạt mã code"
          subtitle="Nhập mã mua hàng để kích hoạt / gia hạn membership"
        />
        <div className="p-5 sm:p-6 space-y-4">
          <form
            className="flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim().length < 4) {
                activate.report("Mã code quá ngắn", "error");
                return;
              }
              // TODO: nối API /api/payment/redeem khi có
              activate.report("Tính năng kích hoạt mã sẽ sớm hoạt động trên trang mua hàng.", "error");
            }}
          >
            <div className="flex-1">
              <Input
                placeholder="VD: DUNG-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                prefixIcon="key"
                autoComplete="off"
                aria-label="Mã kích hoạt"
              />
            </div>
            <Button type="submit" variant="secondary" size="md" className="sm:w-auto w-full">
              Kích hoạt
            </Button>
          </form>
          {activate.msg && (
            <p
              className={`text-sm font-medium ${
                activate.kind === "ok" ? "text-ok" : "text-danger"
              }`}
              role="status"
            >
              {activate.msg}
            </p>
          )}
          <p className="text-[11px] text-muted leading-relaxed">
            Mã code được phát hành sau khi thanh toán thành công tại trang mua gói. Nếu bạn đã có mã mà không kích hoạt được, hãy liên hệ hỗ trợ.
          </p>
        </div>
      </Card>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  actionLabel,
  onChoose,
}: {
  plan: MembershipPlan;
  isCurrent: boolean;
  actionLabel: string;
  onChoose: () => void;
}) {
  return (
    <Card
      as="article"
      className={`p-5 flex flex-col ${
        isCurrent ? "border border-coral/25 surface-raised" : ""
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
          <Badge tone="coral">
            <Icon name="check" className="w-3 h-3" />
            Đang dùng
          </Badge>
        )}
      </div>

      <p className="mt-4">
        <span className="text-2xl font-black text-coral tracking-tight">{VND(plan.price)}</span>
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

      <Button
        variant={isCurrent ? "secondary" : "primary"}
        className="mt-5 w-full"
        onClick={onChoose}
      >
        {actionLabel}
      </Button>
    </Card>
  );
}