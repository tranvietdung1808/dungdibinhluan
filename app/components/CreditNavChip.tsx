"use client";

// ─── Credit Chip đơn giản kiểu ví (giống image reference) ───
// 1 thẻ duy nhất: gradient vàng, icon coins xếp lớp, số dư, mũi tên xuống ở cuối
// Bấm cả chip → điều hướng đến /credit để nạp thêm
// Số dư đọc nhanh (cache 60s + Supabase REST trực tiếp) để chip hiện ngay.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearCachedCreditBalance,
  fetchCreditBalance,
} from "@/utils/credit-balance";

/** Icon coins xếp lớp (stacked) giống hình ref */
function StackedCoinsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="6" rx="9" ry="2.5" fill="currentColor" fillOpacity="0.25" />
      <path d="M3 6v5c0 1.385 4.03 2.5 9 2.5s9-1.115 9-2.5V6" />
      <path d="M3 11v5c0 1.385 4.03 2.5 9 2.5s9-1.115 9-2.5v-5" />
      <path d="M3 16v5c0 1.385 4.03 2.5 9 2.5s9-1.115 9-2.5v-5" />
    </svg>
  );
}

export default function CreditNavChip() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = useCallback(async () => {
    const b = await fetchCreditBalance();
    if (b !== null) setBalance(b);
  }, []);

  useEffect(() => {
    void fetchBalance();

    // Refresh khi balance thay đổi (mở khóa mod / nạp credit)
    const onBalanceChanged = () => {
      clearCachedCreditBalance();
      void fetchBalance();
    };
    window.addEventListener("credit-balance-changed", onBalanceChanged);
    return () => window.removeEventListener("credit-balance-changed", onBalanceChanged);
  }, [fetchBalance]);

  const isLow = balance !== null && balance < 10;
  const display = balance ?? "…";

  return (
    <button
      type="button"
      onClick={() => router.push("/credit")}
      title={isLow ? "Số dư sắp hết — nạp thêm" : "Số dư credit — bấm để nạp thêm"}
      aria-label="Số dư credit"
      className={`group inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 md:px-4 md:py-2 border transition-all shadow-sm ${
        isLow
          ? "bg-gradient-to-br from-red-500 to-orange-500 border-orange-400 text-white animate-pulse"
          : "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border-amber-500 hover:from-amber-500 hover:to-amber-700 text-white shadow-amber-500/30"
      }`}
    >
      <span className="shrink-0 text-white/95 -ml-0.5">
        <StackedCoinsIcon />
      </span>
      <span className="text-sm md:text-base font-black tabular-nums tracking-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
        {display}
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-white/80 group-hover:text-white transition-colors -mr-0.5"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
