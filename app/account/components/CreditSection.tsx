"use client";

// =====================================================
// Credit — Ví credit user
// - CreditBalanceHero: số dư + thống kê (focal point)
// - Nạp nhanh: gói nạp từ /api/credit/prices
// - Lịch sử giao dịch từ /api/credit/transactions
// B09: wallet / packages / transactions có loading-error-empty RIÊNG;
// không suy loading từ length === 0, lỗi không giả là "chưa có dữ liệu" (T19).
// Token credit (amber semantic): --color-credit*, không dùng amber-* cứng.
// =====================================================

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/components/useAuth";
import { createClient } from "@/utils/supabase/client";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  Icon,
} from "./ui";
import {
  EmptyState,
  ErrorState,
  InlineError,
  VND,
  formatDateTime,
} from "./states";

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

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

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

  // Số dư lỗi → "Chưa tải được" + retry, KHÔNG hiển thị 0
  if (!wallet) {
    return (
      <ErrorState
        message={error || "Chưa tải được ví credit"}
        onRetry={onRetry}
      />
    );
  }

  return (
    <section
      aria-label="Ví credit"
      className="rounded-2xl overflow-hidden surface-raised border border-credit-border"
    >
      <div className="p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <span className="shrink-0 w-12 h-12 rounded-xl bg-credit-subtle text-credit-strong flex items-center justify-center">
              <Icon name="coins" className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-title tracking-tight">
                  Ví Credit
                </h2>
                <Badge tone="credit">
                  <Icon name="coins" className="w-3 h-3" />
                  {fmt(wallet.balance)} credit
                </Badge>
              </div>
              <p className="text-sm text-body mt-1.5 leading-relaxed max-w-xl">
                1.000đ = 1 credit · Nạp từ 100.000đ được tặng thêm{" "}
                <span className="font-bold text-credit-strong">+10%</span> credit.
              </p>
            </div>
          </div>
          <div className="shrink-0 sm:text-right flex sm:flex-col items-center gap-2 sm:items-end">
            <p className="text-3xl sm:text-4xl font-black text-credit-strong tracking-tight tabular-nums">
              {fmt(wallet.balance)}
              <span className="ml-1.5 text-sm font-bold text-muted">credit</span>
            </p>
            <Button variant="primary" size="sm" onClick={onTopUp}>
              <Icon name="coins" className="w-4 h-4" />
              Nạp Credit
            </Button>
          </div>
        </div>

        {/* §17.1: có dữ liệu cũ mà refresh lỗi → giữ dữ liệu, đánh dấu, cho retry */}
        {error && (
          <div className="mt-4">
            <InlineError
              message="Chưa cập nhật được số dư mới nhất. Dữ liệu đang hiển thị có thể đã cũ."
              onRetry={onRetry}
            />
          </div>
        )}

        {/* Thống kê */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="Đã nạp" value={`${fmt(wallet.totalEarned)} credit`} />
          <MiniStat label="Đã tiêu" value={`${fmt(wallet.totalSpent)} credit`} />
          <MiniStat label="Số lần nạp" value={`${wallet.stats.topupCount} lần`} />
          <MiniStat label="Mod đã mở" value={`${wallet.stats.unlockCount} mod`} />
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

// ─── Nạp nhanh: chọn gói → mở trang topup ───
function QuickTopUp({
  packages,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  packages: TopupPackage[];
  loading: boolean;
  error: string;
  onRetry: () => void;
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
        ) : error && packages.length === 0 ? (
          <InlineError message={error} onRetry={onRetry} />
        ) : packages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center">
            <p className="text-sm text-body">Chưa có gói nạp nào.</p>
            <p className="text-xs text-muted mt-1">
              Bạn vẫn có thể nạp số tiền tùy chọn tại trang nạp credit.
            </p>
            <ButtonLink
              href="/credit"
              variant="secondary"
              size="sm"
              className="mt-4"
            >
              Mở trang nạp credit
              <Icon name="chevron-right" className="w-4 h-4" />
            </ButtonLink>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Có dữ liệu cũ nhưng refresh lỗi → giữ danh sách, báo stale */}
            {error && (
              <InlineError
                message="Chưa cập nhật được danh sách gói mới nhất."
                onRetry={onRetry}
              />
            )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {packages.map((p) => (
              <button
                key={p.amountVnd}
                type="button"
                onClick={() => onSelect(p.amountVnd)}
                className="group relative text-left rounded-xl surface-card p-4 hover:surface-raised transition-colors border border-transparent hover:border-credit-border"
              >
                {p.popular && (
                  <Badge tone="credit" className="absolute top-2.5 right-2.5">
                    Phổ biến
                  </Badge>
                )}
                <p className="text-base font-black text-title tabular-nums">{VND(p.amountVnd)}</p>
                <p className="text-sm font-bold text-credit-strong mt-1 flex items-center gap-1">
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
  hasMore,
  loadingMore,
  onLoadMore,
  onRetry,
}: {
  transactions: TransactionItem[];
  loading: boolean;
  error: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
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
      <div className="p-5 sm:p-6 space-y-3">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-surface-2/60 h-14" />
            ))}
          </div>
        ) : error && transactions.length === 0 ? (
          // T19: lỗi API lịch sử ≠ "chưa có giao dịch" — có retry riêng
          <InlineError message={error} onRetry={onRetry} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="coins"
            title="Chưa có giao dịch nào"
            description="Khi bạn nạp credit hoặc mở khóa mod, lịch sử giao dịch sẽ hiển thị tại đây."
          />
        ) : (
          <>
            {error && (
              <InlineError
                message="Chưa cập nhật được lịch sử mới nhất."
                onRetry={onRetry}
              />
            )}
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
                        {fmt(t.amount)} credit
                      </p>
                      <p className="text-[11px] text-muted">
                        dư {fmt(t.balance_after)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {hasMore && (
              <div className="pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="w-full"
                >
                  {loadingMore ? "Đang tải..." : "Xem thêm giao dịch"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

// ─── Section chính ───
export function CreditSection() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");

  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [pkgError, setPkgError] = useState("");

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState("");
  const [txHasMore, setTxHasMore] = useState(false);
  const [txMoreLoading, setTxMoreLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError("");
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch("/api/credit/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Chưa tải được ví credit");
      const d = await res.json();
      // /api/credit/wallet trả field ở root (không bọc `data`)
      const w = (d.data ?? d) as WalletData | null;
      if (!w || typeof w.balance !== "number") {
        throw new Error("Dữ liệu ví không hợp lệ");
      }
      setWallet(w);
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : "Chưa tải được ví credit");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const TX_PAGE = 10;
  const fetchTransactions = useCallback(
    async (offset = 0, append = false) => {
      if (append) setTxMoreLoading(true);
      else setTxLoading(true);
      setTxError("");
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch(
          `/api/credit/transactions?limit=${TX_PAGE}&offset=${offset}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Chưa tải được lịch sử giao dịch");
        const d = await res.json();
        const items = (d.transactions ?? []) as TransactionItem[];
        setTransactions((prev) => (append ? [...prev, ...items] : items));
        setTxHasMore(Boolean(d.hasMore));
      } catch (e) {
        // Lỗi lịch sử là trạng thái riêng — không giả "chưa có giao dịch" (T19)
        setTxError(
          e instanceof Error ? e.message : "Chưa tải được lịch sử giao dịch"
        );
      } finally {
        setTxLoading(false);
        setTxMoreLoading(false);
      }
    },
    []
  );

  const fetchPrices = useCallback(async () => {
    setPkgLoading(true);
    setPkgError("");
    try {
      const res = await fetch("/api/credit/prices");
      if (!res.ok) throw new Error("Chưa tải được danh sách gói nạp");
      const d = await res.json();
      setPackages(d.packages ?? d.data?.packages ?? []);
    } catch (e) {
      setPkgError(e instanceof Error ? e.message : "Chưa tải được danh sách gói nạp");
    } finally {
      setPkgLoading(false);
    }
  }, []);

  // T12: đổi user cùng tab → xoá dữ liệu ví cũ trước khi nạp lại
  useEffect(() => {
    setWallet(null);
    setTransactions([]);
    setTxHasMore(false);
    setPackages([]);
    void fetchWallet();
    void fetchTransactions();
    void fetchPrices();
  }, [userId, fetchWallet, fetchTransactions, fetchPrices]);

  const handleTopUp = (amountVnd?: number) => {
    const qs = amountVnd ? `?amount=${amountVnd}` : "";
    window.location.href = `/credit${qs}`;
  };

  return (
    <div className="space-y-6">
      <CreditBalanceHero
        wallet={wallet}
        loading={walletLoading}
        error={walletError}
        onRetry={fetchWallet}
        onTopUp={() => handleTopUp()}
      />
      <QuickTopUp
        packages={packages}
        loading={pkgLoading}
        error={pkgError}
        onRetry={fetchPrices}
        onSelect={handleTopUp}
      />
      <TransactionHistory
        transactions={transactions}
        loading={txLoading}
        error={txError}
        hasMore={txHasMore}
        loadingMore={txMoreLoading}
        onLoadMore={() => void fetchTransactions(transactions.length, true)}
        onRetry={() => void fetchTransactions()}
      />
      <p className="text-[11px] text-muted/70 text-center">
        Credit không có hạn sử dụng. Thanh toán qua QR ngân hàng.
      </p>
    </div>
  );
}
