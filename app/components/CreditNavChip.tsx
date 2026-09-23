"use client";

// ─── Credit chip trên navbar ───
// - Hiện số dư kèm đơn vị "credit"; bấm → /credit để nạp thêm.
// - Lỗi tải số dư → "Chưa tải được" + bấm để thử lại (KHÔNG hiển thị 0).
// - Không còn pulse đỏ khi số dư thấp (B07/§7.1) — thiếu credit báo trong ngữ cảnh mua mod.
// - Số dư đọc nhanh (cache 60s + Supabase REST) để chip hiện ngay.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearCachedCreditBalance,
  fetchCreditBalance,
} from "@/utils/credit-balance";

type Status = "loading" | "ok" | "error";

/** Icon coins xếp lớp */
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
  const [status, setStatus] = useState<Status>("loading");

  const applyBalance = useCallback((b: number | null) => {
    if (b !== null) {
      setBalance(b);
      setStatus("ok");
    } else {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // setState chỉ chạy trong callback async (.then / event listener),
    // không gọi trực tiếp trong body của effect.
    void fetchCreditBalance().then((b) => {
      if (!cancelled) applyBalance(b);
    });

    // Refresh khi balance thay đổi (mở khóa mod / nạp credit)
    const onBalanceChanged = () => {
      clearCachedCreditBalance();
      setStatus("loading");
      void fetchCreditBalance().then((b) => {
        if (!cancelled) applyBalance(b);
      });
    };
    window.addEventListener("credit-balance-changed", onBalanceChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("credit-balance-changed", onBalanceChanged);
    };
  }, [applyBalance]);

  const handleClick = () => {
    if (status === "error") {
      // Thử tải lại số dư trước; user vẫn vào được ví qua menu tài khoản.
      setStatus("loading");
      clearCachedCreditBalance();
      void fetchCreditBalance().then(applyBalance);
      return;
    }
    router.push("/credit");
  };

  const title =
    status === "error"
      ? "Chưa tải được số dư — bấm để thử lại"
      : status === "loading"
        ? "Đang tải số dư credit"
        : `Số dư: ${balance} credit — bấm để nạp thêm`;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      aria-label={title}
      className="group inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-amber-500 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 px-3 text-white shadow-sm shadow-amber-500/30 transition-colors hover:from-amber-500 hover:to-amber-700"
    >
      <span className="shrink-0 text-white/95">
        <StackedCoinsIcon />
      </span>
      {status === "loading" && (
        <span className="text-sm font-black tabular-nums tracking-tight">…</span>
      )}
      {status === "error" && (
        <span className="text-xs font-bold whitespace-nowrap">Chưa tải được</span>
      )}
      {status === "ok" && (
        <span className="text-sm md:text-base font-black tabular-nums tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
          {balance}
          <span className="ml-1 text-xs font-semibold text-white/85">credit</span>
        </span>
      )}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-white/80 group-hover:text-white transition-colors"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
