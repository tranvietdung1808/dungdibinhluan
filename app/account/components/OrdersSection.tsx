"use client";

// =====================================================
// Orders — desktop dùng DataTable · mobile dùng compact cards
// Bấm 1 đơn để xem OrderDetail (drawer modal + nút ESC)
// =====================================================

import { useEffect, useRef, useState } from "react";
import type { SubscriptionHistory } from "../types";
import { Badge, Button, Card, Icon, type BadgeTone } from "./ui";
import {
  EmptyState,
  VND,
  formatDate,
  formatDateTime,
  isSubscriptionActive,
} from "./states";

export function OrdersSection({
  subscriptions,
  now,
}: {
  subscriptions: SubscriptionHistory[];
  now: number;
}) {
  const [selected, setSelected] = useState<SubscriptionHistory | null>(null);

  // ESC đóng drawer
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        icon="bag"
        title="Chưa có đơn hàng nào"
        description="Lịch sử mua membership và các giao dịch sẽ hiển thị tại đây khi bạn có đơn đầu tiên."
        ctaLabel="Xem gói & mua"
        ctaHref="/mods/mix-mods-fc26/payment"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          <span className="font-bold text-title">{subscriptions.length}</span> đơn hàng
        </p>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-hidden rounded-2xl surface-card">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
              <th scope="col" className="px-5 py-3.5 font-bold">Gói</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Trạng thái</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Hiệu lực</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Giá</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Đơn</th>
              <th scope="col" className="px-5 py-3.5"><span className="sr-only">Chi tiết</span></th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <OrderRow key={s.id} s={s} now={now} onOpen={() => setSelected(s)} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: compact cards */}
      <div className="md:hidden space-y-2.5">
        {subscriptions.map((s) => (
          <MobileOrderCard key={s.id} s={s} now={now} onOpen={() => setSelected(s)} />
        ))}
      </div>

      {selected && <OrderDetailModal order={selected} now={now} onClose={() => setSelected(null)} />}
    </div>
  );
}

function orderStatus(s: SubscriptionHistory, now: number) {
  const active = isSubscriptionActive(s, now);
  const expired =
    s.status === "expired" || (s.status === "active" && new Date(s.expires_at).getTime() <= now);
  if (s.status === "cancelled") return { label: "Đã hủy", tone: "neutral" as BadgeTone };
  if (active) return { label: "Hoạt động", tone: "ok" as BadgeTone };
  if (expired) return { label: "Hết hạn", tone: "neutral" as BadgeTone };
  return { label: s.status, tone: "neutral" as BadgeTone };
}

function statusChipTone(tone: BadgeTone) {
  return tone === "ok"
    ? "bg-ok/15 text-ok"
    : tone === "neutral"
      ? "bg-surface-2 text-text-body"
      : "bg-white/6 text-muted";
}

function OrderRow({
  s,
  now,
  onOpen,
}: {
  s: SubscriptionHistory;
  now: number;
  onOpen: () => void;
}) {
  const st = orderStatus(s, now);
  return (
    <tr className="border-b border-line last:border-0 hover:bg-surface-2/40 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${statusChipTone(st.tone)}`}
          >
            <Icon name="bag" className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-sm text-title truncate">{s.plan_name}</p>
            <p className="text-[11px] text-muted font-mono mt-0.5">
              #{s.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge tone={st.tone}>{st.label}</Badge>
      </td>
      <td className="px-5 py-4">
        <p className="text-xs text-body whitespace-nowrap">{formatDate(s.starts_at)}</p>
        <p className="text-[11px] text-muted mt-0.5 whitespace-nowrap">→ {formatDate(s.expires_at)}</p>
      </td>
      <td className="px-5 py-4">
        <p className="font-black text-coral whitespace-nowrap">{VND(s.plan_price)}</p>
      </td>
      <td className="px-5 py-4 text-xs text-muted whitespace-nowrap">
        {s.notes ? <span className="max-w-[140px] truncate block">{s.notes}</span> : "—"}
      </td>
      <td className="px-5 py-4 text-right">
        <Button variant="ghost" size="sm" onClick={onOpen}>
          Chi tiết
          <Icon name="chevron-right" className="w-3.5 h-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function MobileOrderCard({
  s,
  now,
  onOpen,
}: {
  s: SubscriptionHistory;
  now: number;
  onOpen: () => void;
}) {
  const st = orderStatus(s, now);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-2xl surface-card p-4 hover:surface-raised transition-colors duration-150"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${statusChipTone(st.tone)}`}
          >
            <Icon name="bag" className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-sm text-title truncate">{s.plan_name}</p>
            <p className="text-[11px] text-muted font-mono mt-0.5">#{s.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>
      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-line">
        <p className="text-[11px] text-muted">
          {formatDate(s.starts_at)} → {formatDate(s.expires_at)}
        </p>
        <p className="font-black text-coral text-sm whitespace-nowrap">{VND(s.plan_price)}</p>
      </div>
    </button>
  );
}

// ─── Order Detail (drawer) ───
function OrderDetailModal({
  order,
  now,
  onClose,
}: {
  order: SubscriptionHistory;
  now: number;
  onClose: () => void;
}) {
  const st = orderStatus(order, now);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết đơn hàng ${order.plan_name}`}
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/60 cursor-default"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-lg bg-surface-1 border border-line rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto outline-none"
      >
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-line flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] text-muted uppercase tracking-wider font-bold">Chi tiết đơn hàng</p>
            <h3 className="text-lg font-black text-title mt-0.5">{order.plan_name}</h3>
            <p className="text-[11px] text-muted font-mono mt-0.5">#{order.id.toUpperCase()}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-title hover:bg-surface-2 transition-colors"
            aria-label="Đóng chi tiết đơn hàng"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <Badge tone={st.tone}>{st.label}</Badge>
            <p className="font-black text-xl text-coral">{VND(order.plan_price)}</p>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">ID đơn hàng</dt>
              <dd className="text-body font-mono text-xs text-right break-all">{order.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Ngày tạo</dt>
              <dd className="text-body text-right">{formatDateTime(order.starts_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Hết hạn</dt>
              <dd className="text-body text-right">{formatDateTime(order.expires_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Ghi chú</dt>
              <dd className="text-body text-right">
                {order.notes || <span className="text-muted">—</span>}
              </dd>
            </div>
          </dl>

          <div className="pt-4 border-t border-line">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                onClose();
              }}
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}