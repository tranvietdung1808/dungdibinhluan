"use client";

// =====================================================
// Lịch sử membership (A06) — dữ liệu là `subscriptions`,
// không phải toàn bộ giao dịch → nhãn phải nói đúng tập dữ liệu.
// Desktop dùng DataTable · mobile dùng compact cards.
// Chi tiết dùng Dialog dùng chung (focus trap, Escape, return focus).
// =====================================================

import { useState } from "react";
import type { SubscriptionHistory } from "../types";
import { Dialog } from "@/app/components/ui";
import { Badge, Button, Icon, type BadgeTone } from "./ui";
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

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        icon="crown"
        title="Chưa có lịch sử membership"
        description="Các lần đăng ký hoặc được cấp gói membership sẽ hiển thị tại đây."
        ctaLabel="Xem gói membership"
        ctaHref="/account?section=membership"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">
          <span className="font-bold text-title">{subscriptions.length}</span>{" "}
          gói đã đăng ký
        </p>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-hidden rounded-lg surface-card">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
              <th scope="col" className="px-5 py-3.5 font-bold">Gói</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Trạng thái</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Hiệu lực</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Giá gói</th>
              <th scope="col" className="px-5 py-3.5 font-bold">Ghi chú</th>
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

      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        label={
          selected
            ? `Chi tiết đăng ký ${selected.plan_name}`
            : "Chi tiết đăng ký"
        }
      >
        {selected && (
          <SubDetail order={selected} now={now} onClose={() => setSelected(null)} />
        )}
      </Dialog>
    </div>
  );
}

function orderStatus(s: SubscriptionHistory, now: number) {
  const active = isSubscriptionActive(s, now);
  const expired =
    s.status === "expired" || (s.status === "active" && new Date(s.expires_at).getTime() <= now);
  if (s.status === "cancelled") return { label: "Đã hủy", tone: "neutral" as BadgeTone };
  if (active) return { label: "Đang hoạt động", tone: "ok" as BadgeTone };
  if (expired) return { label: "Đã hết hạn", tone: "neutral" as BadgeTone };
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
            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${statusChipTone(st.tone)}`}
          >
            <Icon name="crown" className="w-4 h-4" />
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
        <p className="font-black text-accent whitespace-nowrap">{VND(s.plan_price)}</p>
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
      className="w-full text-left rounded-lg surface-card p-4 hover:surface-raised transition-colors duration-150"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${statusChipTone(st.tone)}`}
          >
            <Icon name="crown" className="w-4 h-4" />
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
        <p className="font-black text-accent text-sm whitespace-nowrap">{VND(s.plan_price)}</p>
      </div>
    </button>
  );
}

// ─── Chi tiết đăng ký (nội dung trong Dialog dùng chung) ───
function SubDetail({
  order,
  now,
  onClose,
}: {
  order: SubscriptionHistory;
  now: number;
  onClose: () => void;
}) {
  const st = orderStatus(order, now);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] text-muted uppercase tracking-wider font-bold">
          Chi tiết đăng ký
        </p>
        <h3 className="text-lg font-black text-title mt-0.5">{order.plan_name}</h3>
        <p className="text-[11px] text-muted font-mono mt-0.5">
          #{order.id.toUpperCase()}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Badge tone={st.tone}>{st.label}</Badge>
        <p className="font-black text-xl text-accent">{VND(order.plan_price)}</p>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Mã đăng ký</dt>
          <dd className="text-body font-mono text-xs text-right break-all">{order.id}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Ngày bắt đầu</dt>
          <dd className="text-body text-right">{formatDateTime(order.starts_at)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Hết hạn</dt>
          <dd className="text-body text-right">{formatDateTime(order.expires_at)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Giá gói hiện tại</dt>
          <dd className="text-body text-right">{VND(order.plan_price)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Ghi chú</dt>
          <dd className="text-body text-right">
            {order.notes || <span className="text-muted">—</span>}
          </dd>
        </div>
      </dl>

      {/* §14.4: giá lưu theo plan hiện tại, không phải biên lai thanh toán */}
      <p className="text-[11px] text-muted/80 leading-relaxed">
        Giá hiển thị là giá gói tại thời điểm xem, không phải biên lai số tiền đã
        thanh toán.
      </p>

      <div className="pt-4 border-t border-line">
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}
