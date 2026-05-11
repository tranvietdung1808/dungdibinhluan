"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CancelContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderCode = params.get("orderCode");

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
          ✕
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-red-400">ĐÃ HỦY THANH TOÁN</h1>
          <p className="text-slate-400 text-sm">
            Bạn đã hủy giao dịch thanh toán.
          </p>
          {orderCode && (
            <p className="text-[10px] text-slate-600">Mã đơn: #{orderCode}</p>
          )}
        </div>
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all"
          >
            ← THỬ LẠI
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 rounded-2xl text-xs text-slate-500 border border-white/10 hover:border-white/20 hover:text-white transition-all"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </main>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  );
}
