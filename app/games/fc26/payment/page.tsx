"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import CheckUyTinButton from "../../../components/CheckUyTinButton";
import CopyButton from "../../../components/CopyButton";

const EDITIONS: Record<string, { label: string; price: string; color: string }> = {
  normal: { label: "STANDARD EDITION", price: "149.000₫", color: "#ce5a67" },
  mods:   { label: "FULL MODS EDITION", price: "269.000₫", color: "#a855f7" },
};

const BANK_INFO = {
  bank: "BIDV",
  accountNumber: "5200501707",
  accountName: "TRAN VIET DUNG",
  adminFb: "https://web.facebook.com/dungbinhluan/",
};

function PaymentContent() {
  const params = useSearchParams();
  const edition = params.get("edition") ?? "normal";
  const ed = EDITIONS[edition] ?? EDITIONS.normal;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-black">
            THÔNG TIN <span style={{ color: ed.color }}>THANH TOÁN</span>
          </h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase">{ed.label}</p>
        </div>

        <div className="flex justify-center">
          <CheckUyTinButton />
        </div>

        {/* Giá */}
        <div
          className="rounded-2xl border p-5 text-center space-y-1"
          style={{ borderColor: `${ed.color}30`, background: `${ed.color}10` }}
        >
          <p className="text-xs text-slate-400 tracking-widest uppercase">Tổng thanh toán</p>
          <p className="text-4xl font-black" style={{ color: ed.color }}>{ed.price}</p>
        </div>

        {/* QR Code */}
        <div className="rounded-2xl border border-white/10 bg-[#111] p-5 flex flex-col items-center gap-3">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Quét QR để thanh toán</p>
          <div className="relative w-52 h-52 rounded-xl overflow-hidden border border-white/10">
            <Image src="/qrbidv.jpg" alt="QR BIDV" fill className="object-contain" />
          </div>
          <p className="text-[10px] text-slate-500">Hoặc chuyển khoản thủ công bên dưới</p>
        </div>

        {/* Thông tin ngân hàng */}
        <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-4">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Chuyển khoản ngân hàng</p>
          {[
            { label: "Ngân hàng", value: BANK_INFO.bank },
            { label: "Số tài khoản", value: BANK_INFO.accountNumber, showCopy: true },
            { label: "Chủ tài khoản", value: BANK_INFO.accountName },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500 flex-shrink-0">{row.label}</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-xs font-black text-white text-right">{row.value}</span>
                {row.showCopy && <CopyButton text={row.value} />}
              </div>
            </div>
          ))}
        </div>

        {/* Bước tiếp theo */}
        <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-3">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Các bước tiếp theo</p>
          <ol className="space-y-2.5">
            {[
              "Chuyển khoản đúng số tiền",
              "Nhắn tin cho admin kèm ảnh chụp màn hình giao dịch",
              "Admin xác nhận & gửi code kích hoạt cho bạn",
              "Nhập code để tải và cài đặt game",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-slate-300">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: `${ed.color}20`, color: ed.color, border: `1px solid ${ed.color}40` }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* IB Admin */}
        <a
          href={BANK_INFO.adminFb}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-xs tracking-widest text-white transition-all hover:opacity-80"
          style={{ background: ed.color }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          NHẮN TIN CHO ADMIN →
        </a>

        {/* Nhập code */}
        <Link
          href={`/games/fc26?edition=${edition}`}
          className="flex items-center justify-center w-full py-4 rounded-2xl font-black text-xs tracking-widest border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all"
        >
          ĐÃ CÓ CODE → NHẬP NGAY
        </Link>

        <Link href="/games/fc26/select" className="block text-center text-[10px] text-slate-600 hover:text-slate-400 transition-colors tracking-widest uppercase">
          ← Quay lại chọn phiên bản
        </Link>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  );
}
