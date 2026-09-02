"use client";

// =====================================================
// DashboardLayout: page background (surface-0) + sidebar
// Sidebar desktop cố định · mobile dạng horizontal tabs
// Có keyboard accessibility (role tablist/tab, arrow keys)
// =====================================================

import { useEffect, useState } from "react";
import type { SectionKey } from "../types";
import { Icon, type IconName } from "./ui";

export interface DashTab {
  key: SectionKey;
  label: string;
  icon: IconName;
}

// Nhóm tab theo chức năng cho sidebar desktop
const ACCOUNT_GROUPS: { label: string; tabs: DashTab[] }[] = [
  {
    label: "Tài khoản",
    tabs: [
      { key: "overview", label: "Tổng quan", icon: "sparkles" },
      { key: "profile", label: "Hồ sơ", icon: "user" },
      { key: "security", label: "Bảo mật", icon: "lock" },
    ],
  },
  {
    label: "Giao dịch",
    tabs: [
      { key: "credit", label: "Ví Credit", icon: "coins" },
      { key: "orders", label: "Đơn hàng", icon: "bag" },
      { key: "membership", label: "VIP / Membership", icon: "crown" },
    ],
  },
  {
    label: "Thư viện",
    tabs: [{ key: "unlocked", label: "Mod đã mở", icon: "unlock" }],
  },
];

export const ACCOUNT_TABS: DashTab[] = ACCOUNT_GROUPS.flatMap((g) => g.tabs);

export function DashboardLayout({
  active,
  onNavigate,
  header,
  children,
}: {
  active: SectionKey;
  onNavigate: (s: SectionKey) => void;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-0 min-h-screen">
      {header}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 items-start">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            <Sidebar active={active} onNavigate={onNavigate} />
          </aside>

          {/* Mobile horizontal tabs */}
          <div className="lg:hidden mb-5 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
            <MobileTabs active={active} onNavigate={onNavigate} />
          </div>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar (desktop) ───
function Sidebar({
  active,
  onNavigate,
}: {
  active: SectionKey;
  onNavigate: (s: SectionKey) => void;
}) {
  return (
    <nav
      aria-label="Menu tài khoản"
      className="rounded-2xl surface-card p-3 flex flex-col gap-4"
    >
      {ACCOUNT_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-[11px] font-black uppercase tracking-widest text-muted/70">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.tabs.map((tab) => {
              const isActive = tab.key === active;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onNavigate(tab.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center gap-3 pl-3 pr-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 text-left ${
                    isActive
                      ? "bg-surface-2 text-title border border-line"
                      : "text-body hover:text-title hover:bg-surface-2/60 border border-transparent"
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-md bg-coral"
                    />
                  )}
                  <span className={isActive ? "text-coral" : "text-muted"}>
                    <Icon name={tab.icon} className="w-[18px] h-[18px]" />
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-3 border-t border-line">
        <div className="flex items-center gap-3 px-3 py-2">
          <span className="text-muted">
            <Icon name="shield" className="w-[18px] h-[18px]" />
          </span>
          <span className="text-[11px] text-muted leading-snug">
            Tài khoản được đồng bộ an toàn từ Supabase
          </span>
        </div>
      </div>
    </nav>
  );
}

// ─── Mobile horizontal tabs (swipe với keyboard) ───
function MobileTabs({
  active,
  onNavigate,
}: {
  active: SectionKey;
  onNavigate: (s: SectionKey) => void;
}) {
  const [focusedIndex, setFocusedIndex] = useState(() =>
    Math.max(
      0,
      ACCOUNT_TABS.findIndex((t) => t.key === active)
    )
  );

  useEffect(() => {
    setFocusedIndex(ACCOUNT_TABS.findIndex((t) => t.key === active));
  }, [active]);

  const focusButton = (index: number) => {
    const el = document.getElementById(`mobile-tab-${ACCOUNT_TABS[index]?.key}`);
    el?.focus();
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Menu tài khoản"
      role="tablist"
      className="flex gap-1.5 min-w-max"
      onKeyDown={(e) => {
        const current = Math.max(0, focusedIndex);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const next = Math.min(ACCOUNT_TABS.length - 1, current + 1);
          setFocusedIndex(next);
          focusButton(next);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          const prev = Math.max(0, current - 1);
          setFocusedIndex(prev);
          focusButton(prev);
        }
      }}
    >
      {ACCOUNT_TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            id={`mobile-tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onNavigate(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors duration-150 ${
              isActive
                ? "bg-coral/15 text-coral border-coral/30"
                : "bg-surface-1 text-body border-line hover:text-title"
            }`}
          >
            <Icon name={tab.icon} className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}