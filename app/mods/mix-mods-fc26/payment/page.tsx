import Link from "next/link";
import Image from "next/image";
import CheckUyTinButton from "../../../components/CheckUyTinButton";
import CopyButton from "../../../components/CopyButton";
import PayOSButton from "../../../components/PayOSButton";

const COLOR = "#ce5a67";

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 py-16">

      <div className="text-center space-y-2 mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Thanh toán</p>
        <h1 className="text-2xl md:text-3xl font-black">
          MIX MODS FC 26 <span style={{ color: COLOR }}>2025–2026</span>
        </h1>
        <p className="text-slate-400 text-sm">Hỗ trợ cập nhật miễn phí sau khi mua</p>
      </div>

      <div className="mb-8">
        <CheckUyTinButton />
      </div>

      <div className="w-full max-w-md space-y-5">

        <div className="bg-[#ce5a67]/10 border border-[#ce5a67]/30 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-slate-300">Tổng thanh toán</span>
          <span className="text-2xl font-black text-[#ce5a67]">169.000đ</span>
        </div>

        {/* Auto Payment PayOS - nổi bật */}
        <div
          className="rounded-3xl border-2 p-6 space-y-5 relative overflow-hidden"
          style={{ borderColor: COLOR, background: `${COLOR}08` }}
        >
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20"
            style={{ background: COLOR }}
          />
          <div className="relative space-y-4">
            <div className="text-center space-y-2">
              <span
                className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: `${COLOR}20`, color: COLOR, border: `1px solid ${COLOR}40` }}
              >
                ⚡ Tự động — Nhận key ngay
              </span>
              <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: COLOR }}>
                Thanh toán QR nhận key tự động
              </h2>
              <p className="text-[11px] text-slate-400">
                Nhập email → Quét QR thanh toán → Nhận code qua email ngay lập tức
              </p>
            </div>

            <PayOSButton productId="mix-mods" price="169.000đ" color={COLOR} />
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
            { label: "Ngân hàng", value: "BIDV" },
            { label: "Số tài khoản", value: "5200501707", showCopy: true },
            { label: "Chủ tài khoản", value: "TRAN VIET DUNG" },
            { label: "Số tiền", value: "169.000đ" },
            { label: "Nội dung CK", value: "quaque" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-[10px] text-slate-600">{item.label}</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-[10px] font-bold text-slate-400">{item.value}</span>
                {item.showCopy && <CopyButton text={item.value} />}
              </div>
            </div>
          ))}

          <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/5">
            <p className="text-[9px] text-slate-600">Quét QR BIDV</p>
            <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-white/5">
              <Image
                src="/qrbidv.jpg"
                alt="QR BIDV"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 space-y-3">
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
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-[#ce5a67]/20 text-[#ce5a67] border border-[#ce5a67]/40">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lưu ý</p>
          <ul className="space-y-1">
            <li className="text-[11px] text-slate-500 flex items-start gap-1.5">
              <span className="text-[#ce5a67] mt-0.5">•</span>
              Chọn "Thanh toán QR tự động" để nhận code qua email ngay lập tức.
            </li>
            <li className="text-[11px] text-slate-500 flex items-start gap-1.5">
              <span className="text-[#ce5a67] mt-0.5">•</span>
              Nếu chuyển khoản thủ công, nhấn nút bên dưới để gửi bill.
            </li>
          </ul>
        </div>

        <a
          href="https://web.facebook.com/dungbinhluan/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all shadow-[0_8px_30px_rgba(206,90,103,0.3)]"
        >
          📸 ĐÃ CHUYỂN KHOẢN - GỬI BILL
        </a>

        <Link
          href="/mods/mix-mods-fc26"
          className="flex items-center justify-center w-full py-3 rounded-2xl text-xs text-slate-500 border border-white/10 hover:border-white/20 hover:text-white transition-all"
        >
          ← Quay lại
        </Link>
      </div>
    </main>
  );
}
