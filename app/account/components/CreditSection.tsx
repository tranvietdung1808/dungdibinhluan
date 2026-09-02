"use client";

// =====================================================
// Credit — Ví credit user
// - CreditBalanceHero: số dư + thống kê (focal point)
// - Nạp nhanh: gói nạp từ /api/credit/prices
// - Lịch sử giao dịch từ /api/credit/transactions
// Amber/gold = accent của credit (khác coral VIP)
// =====================================================

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/components/useAuth";
import { createClient } from "@/utils/supabase/client";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Icon,
} from "./ui";
import { EmptyState, ErrorState, VND, formatDateTime } from "./states";

// ─── Types ───
interface WalletData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastTopup: {
    amount_vnd: number;
    credit_total: number;
    created_at: string;
  } | null;
  stats: {
    topupCount: number;
    unlockCount: number;
  };
}

interface TopupPackage {
  amountVnd: number;
  creditBase: number;
  creditBonus: number;
  creditTotal: number;
  hasBonus: boolean;
  popular?: boolean;
}

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

// ─── Helper format số ───
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

// ─── Hero: số dư credit ───
function CreditBalanceHero({
  wallet,
  loading,
  error,
  onRetry,
  onTopUp,
}: {
  wallet: WalletData | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onTopUp: () => void;
}) {
  if (loading) {
    return (
      <section aria-busy="true" className="rounded-2xl surface-card p-5 sm:p-7">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-surface-2" />
          <div className="h-10 w-48 rounded bg-surface-2" />
          <div className="h-8 w-full rounded bg-surface-2" />
        </div>
      </section>
    );
  }

  if (error && !wallet) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <section
      aria-label="Ví credit"
      className="rounded-2xl overflow-hidden surface-raised border border-amber-500/25"
    >
      <div className="p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <span className="shrink-0 w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Icon name="coins" className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-title tracking-tight">
                  Ví Credit
                </h2>
                <Badge tone="warn">
                  <Icon name="coins" className="w-3 h-3" />
                  {wallet?.balance ?? 0} credit
                </Badge>
              </div>
              <p className="text-sm text-body mt-1.5 leading-relaxed max-w-xl">
                1.000đ = 1 credit · Nạp từ 100.000đ được tặng thêm{" "}
                <span className="font-bold text-amber-400">+10%</span> credit.
              </p>
            </div>
          </div>
          <div className="shrink-0 sm:text-right flex sm:flex-col items-center gap-2 sm:items-end">
            <p className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight tabular-nums">
              {fmt(wallet?.balance ?? 0)}
              <span className="ml-1.5 text-sm font-bold text-muted">credit</span>
            </p>
            <Button variant="primary" size="sm" onClick={onTopUp}>
              <Icon name="coins" className="w-4 h-4" />
              Nạp Credit
            </Button>
          </div>
        </div>

        {/* Thống kê */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="Đã nạp" value={`${fmt(wallet?.totalEarned ?? 0)} credit`} />
          <MiniStat label="Đã tiêu" value={`${fmt(wallet?.totalSpent ?? 0)} credit`} />
          <MiniStat label="Số lần nạp" value={`${wallet?.stats.topupCount ?? 0} lần`} />
          <MiniStat label="Mod đã mở" value={`${wallet?.stats.unlockCount ?? 0} mod`} />
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-0 border border-line px-3.5 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="text-sm font-black text-title mt-0.5 truncate">{value}</p>
    </div>
  );
}

// ─── Nạp nhanh: chọn gói → mở modal topup ───
function QuickTopUp({
  packages,
  loading,
  onSelect,
}: {
  packages: TopupPackage[];
  loading: boolean;
  onSelect: (amountVnd: number) => void;
}) {
  return (
    <Card>
      <CardHeader
        icon="coins"
        iconTone="warn"
        title="Nạp nhanh"
        subtitle="Chọn gói phù hợp · nạp từ 100k nhận thêm +10% credit"
      />
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-surface-2/70 h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {packages.map((p) => (
              <button
                key={p.amountVnd}
                type="button"
                onClick={() => onSelect(p.amountVnd)}
                className="group relative text-left rounded-xl surface-card p-4 hover:surface-raised transition-colors border border-transparent hover:border-amber-500/30"
              >
                {p.popular && (
                  <Badge tone="warn" className="absolute top-2.5 right-2.5">
                    Phổ biến
                  </Badge>
                )}
                <p className="text-base font-black text-title tabular-nums">{VND(p.amountVnd)}</p>
                <p className="text-sm font-bold text-amber-400 mt-1 flex items-center gap-1">
                  <Icon name="coins" className="w-4 h-4" />
                  {fmt(p.creditTotal)} credit
                </p>
                <p className="text-[11px] text-muted mt-1">
                  {p.creditBonus > 0 ? (
                    <span className="text-ok font-semibold">
                      Tặng +{fmt(p.creditBonus)} credit
                    </span>
                  ) : (
                    "Không bonus"
                  )}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Lịch sử giao dịch ───
function TransactionHistory({
  transactions,
  loading,
  error,
  onRetry,
}: {
  transactions: TransactionItem[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader
        icon="clock"
        iconTone="neutral"
        title="Lịch sử giao dịch"
        subtitle="Các lần nạp, tiêu credit gần đây"
      />
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-surface-2/60 h-14" />
            ))}
          </div>
        ) : error && transactions.length === 0 ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="coins"
            title="Chưa có giao dịch nào"
            description="Khi bạn nạp credit hoặc mở khóa mod, lịch sử giao dịch sẽ hiển thị tại đây."
          />
        ) : (
          <ul className="space-y-3">
            {transactions.map((t) => {
              const isCredit = t.amount >= 0;
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-surface-0 border border-line px-4 py-3"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span
                      className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                        isCredit
                          ? "bg-ok/12 text-ok"
                          : "bg-danger/12 text-danger"
                      }`}
                    >
                      <Icon name={isCredit ? "coins" : "unlock"} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-title truncate">
                        {t.description ?? (isCredit ? "Nạp credit" : "Tiêu credit")}
                      </p>
                      <p className="text-[11px] text-muted">{formatDateTime(t.created_at)}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-black tabular-nums ${
                        isCredit ? "text-ok" : "text-danger"
                      }`}
                    >
                      {isCredit ? "+" : ""}
                      {fmt(t.amount)} ⭐
                    </p>
                    <p className="text-[11px] text-muted">
                      dư {fmt(t.balance_after)} ⭐
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

// ─── Section chính ───
export function CreditSection() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWallet = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      setError("");
      const res = await fetch("/api/credit/wallet", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Không tải được ví credit");
      const d = await res.json();
      setWallet(d.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải ví credit");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch("/api/credit/transactions?limit=10", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Không tải được lịch sử giao dịch");
      const d = await res.json();
      setTransactions(d.transactions ?? []);
    } catch {
      // giữ danh sách hiện có
    } finally {
      setTxLoading(false);
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/credit/prices");
      if (!res.ok) return;
      const d = await res.json();
      setPackages(d.packages ?? []);
    } catch {
      // bỏ qua — giao diện sẽ trống nếu API lỗi
    }
  }, []);

  useEffect(() => {
    void fetchWallet();
    void fetchTransactions();
    void fetchPrices();
  }, [fetchWallet, fetchTransactions, fetchPrices]);

  const handleTopUp = (amountVnd?: number) => {
    const qs = amountVnd ? `?amount=${amountVnd}` : "";
    window.location.href = `/credit${qs}`;
  };

  const refresh = () => {
    setLoading(true);
    setTxLoading(true);
    void fetchWallet();
    void fetchTransactions();
  };

  return (
    <div className="space-y-6">
      <CreditBalanceHero
        wallet={wallet}
        loading={loading}
        error={error}
        onRetry={refresh}
        onTopUp={() => handleTopUp()}
      />
      <QuickTopUp packages={packages} loading={packages.length === 0} onSelect={handleTopUp} />
      <TransactionHistory
        transactions={transactions}
        loading={txLoading}
        error={error}
        onRetry={refresh}
      />
      {user && (
        <p className="text-[11px] text-muted/70 text-center" aria-hidden="true">
          Credit không có hạn sử dụng. Thanh toán an toàn qua PayOS.
        </p>
      )}
    </div>
  );
}
