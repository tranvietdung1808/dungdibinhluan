"use client";

// =====================================================
// Trạng thái: Loading (skeleton) · Error · Empty
// Mọi list rỗng / số liệu 0 đều có copy + CTA tiếp theo
// =====================================================

import { Button, Card, Icon, type IconName } from "./ui";

// ─── Loading states ───
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Đang tải dữ liệu">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[92px]" />
        ))}
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-24" />
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className="rounded-2xl surface-card p-4">
      <div className={`animate-pulse rounded-xl bg-surface-2/80 ${className}`} />
    </div>
  );
}

// ─── Error state ───
export function ErrorState({
  message = "Không tải được dữ liệu",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="p-8 sm:p-10 text-center" as="section">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
        <Icon name="shield" className="w-7 h-7" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-title">Đã có lỗi xảy ra</h3>
      <p className="mt-1.5 text-sm text-muted max-w-md mx-auto">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="md" className="mt-5" onClick={onRetry}>
          <Icon name="refresh" className="w-4 h-4" />
          Thử lại
        </Button>
      )}
    </Card>
  );
}

// ─── Empty state (copy + CTA aware) ───
export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
  footnote,
}: {
  icon: IconName;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
  footnote?: string;
}) {
  return (
    <Card className="p-8 sm:p-10 text-center" as="section">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-muted">
        <Icon name={icon} className="w-7 h-7" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-title">{title}</h3>
      <p className="mt-1.5 text-sm text-body max-w-md mx-auto leading-relaxed">{description}</p>
      {ctaLabel && (ctaHref || onCta) && (
        <div className="mt-5">
          {ctaHref ? (
            <a href={ctaHref} className="inline-flex">
              <Button variant="primary" size="md">
                {ctaLabel}
                <Icon name="chevron-right" className="w-4 h-4" />
              </Button>
            </a>
          ) : (
            <Button variant="primary" size="md" onClick={onCta}>
              {ctaLabel}
              <Icon name="chevron-right" className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
      {footnote && (
        <p className="mt-4 text-[11px] text-muted/80 leading-relaxed">{footnote}</p>
      )}
    </Card>
  );
}

// ─── Formatting helpers ───
export const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n) + "đ";

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysLeft(expiresAt: string, now: number) {
  const diff = new Date(expiresAt).getTime() - now;
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function isSubscriptionActive(s: {
  status: string;
  expires_at: string;
}, now: number) {
  return s.status === "active" && new Date(s.expires_at).getTime() > now;
}