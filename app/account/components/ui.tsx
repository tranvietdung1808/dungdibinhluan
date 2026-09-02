"use client";

// =====================================================
// Core UI primitives — Premium Dark Gaming SaaS
// 3 lớp surface: page bg -> normal card -> raised/hover
// Coral = primary accent (CTA/VIP) · Violet = phụ (profile/mod)
// Không lạm dụng glow/glassmorphism/gradient/border/animation
// =====================================================

import { useState } from "react";

// ─── Icons (inline SVG, stroke-based) ───
export type IconName =
  | "shield"
  | "clock"
  | "user"
  | "bag"
  | "unlock"
  | "star"
  | "check"
  | "chevron-right"
  | "arrow-right"
  | "mail"
  | "crown"
  | "lock"
  | "settings"
  | "search"
  | "key"
  | "refresh"
  | "sparkles"
  | "logout"
  | "book"
  | "gamepad"
  | "download"
  | "coins";

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  shield: <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V7l-9-5z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </>
  ),
  user: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  bag: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 01-8 0" />
    </>
  ),
  unlock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
    </>
  ),
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />,
  check: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
  "chevron-right": <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />,
  "arrow-right": <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />,
  mail: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
  crown: <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z" />,
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
    </>
  ),
  key: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </>
  ),
  refresh: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 4v6h-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </>
  ),
  sparkles: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.9 5.8a2 2 0 001.3 1.3L21 12l-5.8 1.9a2 2 0 00-1.3 1.3L12 21l-1.9-5.8a2 2 0 00-1.3-1.3L3 12l5.8-1.9a2 2 0 001.3-1.3L12 3z" />
    </>
  ),
  logout: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  book: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </>
  ),
  gamepad: (
    <>
      <line x1="6" y1="11" x2="10" y2="11" />
      <line x1="8" y1="9" x2="8" y2="13" />
      <line x1="15" y1="12" x2="15.01" y2="12" />
      <line x1="18" y1="10" x2="18.01" y2="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.32 5H6.68a4 4 0 00-3.98 3.6c-.03.36-.06.72-.06 1.08V18a2 2 0 002 2h.32a2 2 0 001.7-.95L8 17h8l1.34 2.05a2 2 0 001.7.95h.32a2 2 0 002-2V9.68c0-.36-.03-.72-.06-1.08A4 4 0 0017.32 5z" />
    </>
  ),
  download: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  coins: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </>
  ),
};

export function Icon({
  name,
  className = "w-5 h-5",
  filled = false,
}: {
  name: IconName;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// ─── Card ───
export function Card({
  children,
  className = "",
  raised = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  raised?: boolean;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={`rounded-2xl ${raised ? "surface-raised" : "surface-card"} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  iconTone = "neutral",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: IconName;
  iconTone?: "neutral" | "coral" | "violet" | "ok" | "warn";
}) {
  const toneMap: Record<NonNullable<typeof iconTone>, string> = {
    neutral: "bg-surface-2 text-text-body",
    coral: "bg-coral/15 text-coral",
    violet: "bg-violet/15 text-violet",
    ok: "bg-ok/15 text-ok",
    warn: "bg-warn/15 text-warn",
  };
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 border-b border-line">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toneMap[iconTone]}`}
          >
            <Icon name={icon} className="w-5 h-5" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-title tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Button ───
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "violet";
type ButtonSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-wide transition-colors duration-150 select-none disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  // Coral = primary CTA
  primary:
    "bg-coral text-white hover:bg-coral-strong active:bg-coral-strong shadow-[0_8px_24px_-12px_rgba(240,96,120,0.55)]",
  secondary:
    "bg-surface-2 text-title border border-line hover:bg-surface-1 hover:border-white/20",
  ghost: "text-body hover:text-title hover:bg-surface-2",
  danger: "bg-danger/10 text-danger border border-danger/25 hover:bg-danger/20",
  violet:
    "bg-violet/15 text-violet border border-violet/25 hover:bg-violet/25",
};

const BTN_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={`${BTN_BASE} ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── Badge ───
export type BadgeTone =
  | "coral"
  | "violet"
  | "ok"
  | "warn"
  | "danger"
  | "neutral";

const BADGE_TONES: Record<BadgeTone, string> = {
  coral: "bg-coral/12 text-coral border-coral/25",
  violet: "bg-violet/12 text-violet border-violet/25",
  ok: "bg-ok/12 text-ok border-ok/25",
  warn: "bg-warn/12 text-warn border-warn/25",
  danger: "bg-danger/12 text-danger border-danger/25",
  neutral: "bg-white/6 text-text-body border-white/12",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide border ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ─── Input ───
export function Input({
  label,
  hint,
  error,
  prefixIcon,
  className = "",
  id,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  prefixIcon?: IconName;
}) {
  const inputId = id ?? (label ? `field-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-text-body">
          {label}
        </label>
      )}
      <div className="relative">
        {prefixIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <Icon name={prefixIcon} className="w-4 h-4" />
          </span>
        )}
        <input
          id={inputId}
          className={`w-full bg-surface-0 border rounded-xl px-4 py-2.5 text-sm text-title placeholder:text-muted transition-colors focus:outline-none ${
            prefixIcon ? "pl-10" : ""
          } ${
            error
              ? "border-danger/50 focus:border-danger focus:ring-danger/25"
              : "border-line focus:border-coral focus:ring-2 focus:ring-coral/20"
          } ${className}`}
          {...rest}
        />
      </div>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Skeleton ───
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-surface-2/80 ${className}`}
    />
  );
}

// ─── StatCard ───
export function StatCard({
  icon,
  value,
  label,
  hint,
  accent = "neutral",
  href,
  onClick,
}: {
  icon: IconName;
  value: string | number;
  label: string;
  hint?: string;
  accent?: "neutral" | "coral" | "violet" | "ok";
  href?: string;
  onClick?: () => void;
}) {
  const accentMap: Record<NonNullable<typeof accent>, string> = {
    neutral: "bg-surface-2 text-text-body",
    coral: "bg-coral/15 text-coral",
    violet: "bg-violet/15 text-violet",
    ok: "bg-ok/15 text-ok",
  };
  const clickable = Boolean(href || onClick);
  const content = (
    <>
      <span
        className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${accentMap[accent]}`}
      >
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-black text-title tracking-tight leading-tight truncate">
          {value}
        </span>
        <span className="block text-[11px] font-bold uppercase tracking-wider text-muted mt-0.5">
          {label}
        </span>
        {hint && <span className="block text-[11px] text-muted/80 mt-1">{hint}</span>}
      </span>
      {clickable && (
        <Icon
          name="chevron-right"
          className="w-4 h-4 text-muted/50 shrink-0 transition-colors duration-150 group-hover:text-coral"
        />
      )}
    </>
  );
  const cls =
    "w-full text-left flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl surface-card transition-colors duration-150 group";
  if (href) {
    return (
      <a href={href} className={`${cls} hover:surface-raised`}>
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} hover:surface-raised`}>
        {content}
      </button>
    );
  }
  return <div className={cls}>{content}</div>;
}

// ─── Util: clamp text ───
export function clamp(value: string, max = 64) {
  return value.length > max ? value.slice(0, max - 1) + "…" : value;
}

// ─── Hook: feedback message (lưu/tải) ───
export function useFeedback() {
  const [msg, setMsg] = useState("");
  const [kind, setKind] = useState<"ok" | "error">("ok");
  const report = (text: string, k: "ok" | "error" = "ok") => {
    setMsg(text);
    setKind(k);
  };
  return { msg, kind, report, clear: () => setMsg("") };
}