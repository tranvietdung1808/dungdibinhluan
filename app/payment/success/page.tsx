"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderCode = params.get("orderCode");
  const [status, setStatus] = useState<"checking" | "completed" | "pending">("checking");

  useEffect(() => {
    if (!orderCode) return;

    let attempts = 0;
    const maxAttempts = 30;

    const check = async () => {
      try {
        const res = await fetch(`/api/payment/order?orderCode=${orderCode}`);
        const data = await res.json();

        if (data.status === "COMPLETED" || data.status === "CODE_GENERATED") {
          setStatus("completed");
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 3000);
        } else {
          setStatus("pending");
        }
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 3000);
        } else {
          setStatus("pending");
        }
      }
    };

    const timer = setTimeout(check, 2000);
    return () => clearTimeout(timer);
  }, [orderCode]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {status === "checking" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-[#ce5a67] border-t-transparent rounded-full animate-spin" />
            <h1 className="text-2xl font-black">ĐANG XÁC NHẬN</h1>
            <p className="text-slate-500 text-sm">Đang kiểm tra thanh toán của bạn...</p>
          </div>
        )}

        {status === "completed" && (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
              ✅
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-emerald-400">THANH TOÁN THÀNH CÔNG!</h1>
              <p className="text-slate-400 text-sm">
                Code kích hoạt đã được gửi đến email của bạn.
              </p>
              <p className="text-xs text-slate-500">
                Vui lòng kiểm tra hộp thư (bao gồm cả spam).
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all"
            >
              ← VỀ TRANG CHỦ
            </button>
          </div>
        )}

        {status === "pending" && (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-3xl">
              ⏳
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-yellow-400">ĐANG CHỜ XÁC NHẬN</h1>
              <p className="text-slate-400 text-sm">
                Thanh toán của bạn đang được xử lý. Code sẽ được gửi qua email trong vài phút.
              </p>
              <p className="text-xs text-slate-500">
                Nếu sau 15 phút chưa nhận được, vui lòng liên hệ admin.
              </p>
            </div>
            <a
              href="https://web.facebook.com/dungbinhluan/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-yellow-500/20 border border-yellow-500/30 rounded-2xl font-black tracking-widest text-sm text-yellow-400 hover:bg-yellow-500/30 transition-all"
            >
              📸 LIÊN HỆ ADMIN
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
