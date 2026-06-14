"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import CheckUyTinButton from "../../../components/CheckUyTinButton";
import CopyButton from "../../../components/CopyButton";
import PayOSButton from "../../../components/PayOSButton";
import FlashSaleBanner from "../../../components/FlashSaleBanner";

const EDITIONS: Record<string, { label: string; price: string; oldPrice: string; discount: string; color: string; productId: string; ckContent: string }> = {
  normal: { label: "STANDARD EDITION", price: "69.000₫", oldPrice: "149.000₫", discount: "-54%", color: "#ce5a67", productId: "fc26-normal", ckContent: "quacuoi" },
  mods:   { label: "FULL MODS EDITION", price: "199.000₫", oldPrice: "269.000₫", discount: "-26%", color: "#a855f7", productId: "fc26-mods", ckContent: "quaque" },
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

        <div className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-black">
            THÔNG TIN <span style={{ color: ed.color }}>THANH TOÁN</span>
          </h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase">{ed.label}</p>
        </div>

        <div className="flex justify-center">
          <CheckUyTinButton />
        </div>

        <FlashSaleBanner />

        <div
          className="rounded-2xl border p-5 text-center space-y-2"
          style={{ borderColor: `${ed.color}30`, background: `${ed.color}10` }}
        >
          <p className="text-xs text-slate-400 tracking-widest uppercase">Tổng thanh toán</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-slate-600 line-through">{ed.oldPrice}</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">{ed.discount}</span>
          </div>
          <p className="text-4xl font-black" style={{ color: ed.color }}>{ed.price}</p>
        </div>

        {/* Auto Payment PayOS - nổi bật */}
        <div
          className="rounded-3xl border-2 p-6 space-y-5 relative overflow-hidden"
          style={{ borderColor: ed.color, background: `${ed.color}08` }}
        >
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20"
            style={{ background: ed.color }}
          />
          <div className="relative space-y-4">
            <div className="text-center space-y-2">
              <span
                className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: `${ed.color}20`, color: ed.color, border: `1px solid ${ed.color}40` }}
              >
                ⚡ Tự động — Nhận key ngay
              </span>
              <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: ed.color }}>
                Thanh toán QR nhận key tự động
              </h2>
              <p className="text-[11px] text-slate-400">
                Nhập email → Quét QR thanh toán → Nhận code qua email ngay lập tức
              </p>
            </div>

            <PayOSButton productId={ed.productId} price={ed.price} color={ed.color} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[9px] text-slate-700 uppercase tracking-widest">hoặc chuyển khoản thủ công</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        {/* Chuyển khoản thủ công - nhỏ hơn */}
        <div className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-4 space-y-4 opacity-70 hover:opacity-100 transition-opacity">
          <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Chuyển khoản ngân hàng</p>
          {[
            { label: "Ngân hàng", value: BANK_INFO.bank },
            { label: "Số tài khoản", value: BANK_INFO.accountNumber, showCopy: true },
            { label: "Chủ tài khoản", value: BANK_INFO.accountName },
            { label: "Số tiền", value: ed.price },
            { label: "Nội dung CK", value: ed.ckContent },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-slate-600 flex-shrink-0">{row.label}</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-[10px] font-bold text-slate-400 text-right">{row.value}</span>
                {row.showCopy && <CopyButton text={row.value} />}
              </div>
            </div>
          ))}

          <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/5">
            <p className="text-[9px] text-slate-600">Quét QR BIDV</p>
            <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-white/5">
              <Image src="/qrbidv.jpg" alt="QR BIDV" fill className="object-contain" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-5 space-y-3">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Các bước tiếp theo</p>
          <ol className="space-y-2.5">
            {[
              "Chuyển khoản đúng số tiền",
              "Nhắn tin cho admin kèm ảnh chụp màn hình giao dịch",
              "Admin xác nhận & gửi code kích hoạt cho bạn",
              "Nhập code để tải và cài đặt game",
              "Tải game, giải nén và nhắn tin cho admin để cài đặt",
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
