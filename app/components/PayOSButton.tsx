"use client";

import { useState } from "react";

interface PayOSButtonProps {
  productId: string;
  price: string;
  color?: string;
}

export default function PayOSButton({ productId, price, color = "#ce5a67" }: PayOSButtonProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setError("");

    if (!email.trim()) {
      setError("Vui lòng nhập email để nhận code");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email không đúng định dạng");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Lỗi tạo thanh toán");
        setLoading(false);
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("Lỗi kết nối, thử lại sau");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Nhập email nhận code
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="your-email@gmail.com"
          className="w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/30 transition-all"
        />
        {error && (
          <p className="text-[11px] text-red-400">{error}</p>
        )}
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black tracking-widest text-sm text-white transition-all disabled:opacity-50"
        style={{ background: color }}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            ĐANG XỬ LÝ...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
            </svg>
            THANH TOÁN {price} QUA PAYOS
          </>
        )}
      </button>
    </div>
  );
}
