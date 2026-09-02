"use client";

// ─── Credit Chip trên Navbar ───
// Hiển thị số dư credit thật (fetch từ /api/credit/balance) + nút "+" nạp thêm.
// - Số dư < 10 sẽ nhấp nháy và chuyển đỏ để thu hút chú ý.
// - Số dư được cache ngắn trong sessionStorage (60s) để tránh refetch mỗi lần điều hướng.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const CACHE_KEY = "credit_balance_cache";
const CACHE_TTL_MS = 60_000;

function readCachedBalance(): number | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { balance: number; ts: number };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.balance;
  } catch {
    return null;
  }
}

function writeCachedBalance(balance: number) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ balance, ts: Date.now() }));
  } catch {
    // bỏ qua (private mode / quota)
  }
}

/** Icon đồng xu SVG inline 18x18 */
function CoinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

export default function CreditNavChip() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = useCallback(async () => {
    const cached = readCachedBalance();
    if (cached !== null) {
      setBalance(cached);
      return;
    }
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/credit/balance", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const d = await res.json();
      if (typeof d.balance === "number") {
        setBalance(d.balance);
        writeCachedBalance(d.balance);
      }
    } catch {
      // bỏ qua — giữ số dư hiện có nếu fetch lỗi
    }
  }, []);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const isLow = balance !== null && balance < 10;
  const openTopUp = () => router.push("/credit");

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={openTopUp}
        title={isLow ? "Số dư sắp hết, nạp ngay!" : "Xem và nạp credit"}
        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
          isLow
            ? "animate-pulse bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-red-500/20"
            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-orange-500/20"
        }`}
      >
        <CoinIcon />
        <span className="tabular-nums">⭐ {balance ?? "…"}</span>
      </button>
      <button
        onClick={openTopUp}
        aria-label="Nạp thêm credit"
        title="Nạp thêm credit"
        className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-base leading-none flex items-center justify-center hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/30 cursor-pointer"
      >
        +
      </button>
    </div>
  );
}
