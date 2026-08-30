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

export const ACCOUNT_TABS: DashTab[] = [
  { key: "overview", label: "Tổng quan", icon: "sparkles" },
  { key: "profile", label: "Hồ sơ", icon: "user" },
  { key: "orders", label: "Đơn hàng", icon: "bag" },
  { key: "unlocked", label: "Mod đã mở", icon: "unlock" },
  { key: "membership", label: "VIP / Membership", icon: "crown" },
  { key: "security", label: "Bảo mật", icon: "lock" },
];

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
      className="rounded-2xl surface-card p-2 flex flex-col gap-1"
    >
      {ACCOUNT_TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onNavigate(tab.key)}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 text-left ${
              isActive
                ? "bg-surface-2 text-title border border-line"
                : "text-body hover:text-title hover:bg-surface-2/60"
            }`}
          >
            <span className={isActive ? "text-coral" : "text-muted"}>
              <Icon name={tab.icon} className="w-[18px] h-[18px]" />
            </span>
            {tab.label}
          </button>
        );
      })}

      <div className="mt-3 pt-3 border-t border-line flex items-center gap-3 px-3.5 py-2.5">
        <span className="text-muted">
          <Icon name="shield" className="w-[18px] h-[18px]" />
        </span>
        <span className="text-[11px] text-muted leading-snug">
          Tài khoản được đồng bộ an toàn từ Supabase
        </span>
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