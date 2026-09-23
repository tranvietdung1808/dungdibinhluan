import type { ReactNode } from "react";
import { Button, ButtonLink } from "./Button";

// =====================================================
// EmptyState / ErrorState / Spinner / Notice
// Quy tắc: mỗi resource có idle/loading/success/empty/error riêng
// =====================================================

export function EmptyState({
  title,
  description,
  action,
  actionHref,
  onAction,
  icon,
}: {
  title: string;
  description?: string;
  action?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface-1)] px-6 py-12 text-center">
      {icon && <div className="mb-4 text-[var(--color-muted)]">{icon}</div>}
      <p className="text-base font-semibold text-[var(--color-title)]">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-[var(--color-muted)]">
          {description}
        </p>
      )}
      {(action && actionHref) || (action && onAction) ? (
        <div className="mt-5">
          {actionHref ? (
            <ButtonLink href={actionHref} variant="secondary" size="sm">
              {action}
            </ButtonLink>
          ) : (
            <Button variant="secondary" size="sm" onClick={onAction}>
              {action}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Chưa tải được dữ liệu",
  description,
  onRetry,
  retryLabel = "Thử lại",
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-danger)]/25 bg-[var(--color-danger-subtle)] px-6 py-10 text-center"
    >
      <p className="text-base font-semibold text-[var(--color-title)]">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-[var(--color-muted)]">
          {description}
        </p>
      )}
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function Spinner({
  size = 20,
  label = "Đang tải",
  className = "",
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span role="status" aria-label={label} className={`inline-flex ${className}`}>
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin text-[var(--color-muted)]"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
        />
      </svg>
    </span>
  );
}

// InlineNotice — trạng thái tiền/quyền dùng khối bền vững, không chỉ toast
export function InlineNotice({
  tone = "neutral",
  title,
  children,
  className = "",
}: {
  tone?: "neutral" | "accent" | "credit" | "success" | "warning" | "danger";
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-[var(--color-line)] bg-[var(--color-surface-1)]",
    accent: "border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)]",
    credit: "border-[var(--color-credit-border)] bg-[var(--color-credit-subtle)]",
    success: "border-[var(--color-ok)]/30 bg-[var(--color-ok-subtle)]",
    warning: "border-[var(--color-warn)]/30 bg-[var(--color-warn-subtle)]",
    danger: "border-[var(--color-danger)]/30 bg-[var(--color-danger-subtle)]",
  };
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm text-[var(--color-body)] ${tones[tone]} ${className}`}
    >
      {title && (
        <p className="mb-0.5 font-semibold text-[var(--color-title)]">{title}</p>
      )}
      {children}
    </div>
  );
}
