"use client";

// =====================================================
// /credit — Trang nạp credit công khai
// 1.000đ = 1 credit · nạp tối thiểu 50.000đ
// Nạp từ 100.000đ được tặng thêm +10% credit
// =====================================================

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/useAuth";
import { createClient } from "@/utils/supabase/client";
import { calculateCredit } from "@/lib/credit-core";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

// ─── Component gói nạp ───
function PackageCard({
  amount,
  credit,
  bonus,
  popular,
  selected,
  onSelect,
}: {
  amount: number;
  credit: number;
  bonus: number;
  popular?: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative rounded-2xl p-5 text-left transition-all border ${
        selected
          ? "border-amber-400 bg-amber-500/10 surface-raised"
          : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
      }`}
    >
      {popular && (
        <span className="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
          Phổ biến
        </span>
      )}
      <p className="text-xl font-black text-white tabular-nums">{fmt(amount)}đ</p>
      <div className="mt-2 flex items-center gap-1.5">
        <CoinIcon />
        <p className="text-lg font-black text-amber-400 tabular-nums">
          {fmt(credit)} credit
        </p>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {bonus > 0 ? (
          <span className="text-emerald-400 font-semibold">
            Tặng +{fmt(bonus)} credit ({fmt(Math.round((bonus / credit) * 100))}%)
          </span>
        ) : (
          "Không có bonus"
        )}
      </p>
    </button>
  );
}

function CoinIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-amber-400"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

export default function CreditPage() {
  return (
    <Suspense fallback={null}>
      <CreditPageContent />
    </Suspense>
  );
}

function CreditPageContent() {
  const searchParams = useSearchParams();
  const { user, login } = useAuth();
  const [packages, setPackages] = useState<Array<{
    amountVnd: number;
    creditBase: number;
    creditBonus: number;
    creditTotal: number;
    hasBonus: boolean;
    popular?: boolean;
  }>>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [needLogin, setNeedLogin] = useState(false);

  // Đọc packages từ API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/credit/prices");
        if (!res.ok) return;
        const d = await res.json();
        if (d.packages?.length) {
          setPackages(d.packages);
          // Preselect gói 100k nếu có ?amount= trên URL (từ account section)
          const preset = Number(searchParams.get("amount"));
          if (preset) {
            setSelected(preset);
          } else {
            const popular = d.packages.find((p: { popular?: boolean }) => p.popular);
            setSelected(popular?.amountVnd ?? d.packages[0].amountVnd);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  // Số tiền hiệu lực: gói chọn hoặc custom hợp lệ
  const customAmount = Number(custom.replace(/[^\d]/g, ""));
  const amountVnd = selected ?? (customAmount >= 50000 ? customAmount : 0);
  const credit = useMemo(
    () => (amountVnd > 0 ? calculateCredit(amountVnd) : null),
    [amountVnd]
  );

  const handleTopUp = useCallback(async () => {
    if (!amountVnd) return;
    if (!user) {
      setNeedLogin(true);
      return;
    }
    setCreating(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setNeedLogin(true);
        return;
      }
      const res = await fetch("/api/credit/topup/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amountVnd }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Không tạo được đơn nạp");
      // Redirect sang PayOS
      window.location.href = d.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đã có lỗi xảy ra, thử lại sau");
    } finally {
      setCreating(false);
    }
  }, [amountVnd, user]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="pt-16 pb-10 px-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
          <CoinIcon /> 1.000đ = 1 credit
        </span>
        <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight">
          Nạp Credit{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            nhanh chóng
          </span>
        </h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto text-sm md:text-base">
          Nạp tối thiểu 50.000đ. Từ 100.000đ trở lên được tặng thêm{" "}
          <span className="text-amber-400 font-bold">+10%</span> credit. Thanh toán an toàn qua PayOS.
        </p>
      </section>

      {/* Packages */}
      <section className="px-4 pb-16 max-w-5xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white/[0.04] h-36" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {packages.map((p) => (
              <PackageCard
                key={p.amountVnd}
                amount={p.amountVnd}
                credit={p.creditTotal}
                bonus={p.creditBonus}
                popular={p.popular}
                selected={selected === p.amountVnd}
                onSelect={() => {
                  setSelected(p.amountVnd);
                  setCustom("");
                }}
              />
            ))}
          </div>
        )}

        {/* Custom amount */}
        <div className="mt-6 rounded-2xl bg-white/[0.03] border border-white/10 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Hoặc nhập số tiền tùy chỉnh
          </p>
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Nhập số tiền (tối thiểu 50.000đ)"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setSelected(null);
              }}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
            />
            <button
              type="button"
              onClick={() => {
                const v = Number(custom.replace(/[^\d]/g, ""));
                if (v >= 50000) {
                  setCustom(fmt(v));
                  setSelected(v);
                }
              }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              Áp dụng
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Số tiền phải là bội số của 10.000đ và tối thiểu 50.000đ.
          </p>
        </div>

        {/* Summary + CTA */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/25 p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-sm text-slate-400">Bạn sẽ nhận được</p>
            {credit ? (
              <>
                <p className="mt-1 text-3xl font-black text-amber-400 tabular-nums">
                  {fmt(credit.totalCredit)} credit
                  {credit.hasBonus && (
                    <span className="ml-2 text-sm font-bold text-emerald-400">
                      (gồm +{fmt(credit.bonusCredit)} bonus)
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Thanh toán {fmt(amountVnd)}đ qua PayOS
                </p>
              </>
            ) : (
              <p className="mt-1 text-slate-500 text-sm">Chọn gói hoặc nhập số tiền</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleTopUp}
            disabled={!amountVnd || creating}
            className="flex-shrink-0 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 font-black tracking-widest text-sm text-white shadow-[0_8px_30px_-8px_rgba(245,158,11,0.6)] hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            {creating ? "ĐANG TẠO..." : user ? "NẠP NGAY 💰" : "ĐĂNG NHẬP ĐỂ NẠP"}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center" role="alert">
            {error}
          </p>
        )}

        {needLogin && (
          <div className="mt-4 rounded-2xl bg-white/[0.04] border border-white/10 p-6 text-center">
            <p className="text-sm text-slate-300">
              Bạn cần đăng nhập để nạp credit và lưu số dư.
            </p>
            <button
              type="button"
              onClick={() => login()}
              className="mt-4 px-6 py-3 rounded-xl bg-white text-black text-sm font-black tracking-widest hover:bg-slate-200 transition"
            >
              ĐĂNG NHẬP BẰNG GOOGLE
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
