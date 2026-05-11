import Link from "next/link";
import Image from "next/image";
import CheckUyTinButton from "../../../components/CheckUyTinButton";
import CopyButton from "../../../components/CopyButton";
import PayOSButton from "../../../components/PayOSButton";

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 py-16">

      <div className="text-center space-y-2 mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Thanh toán</p>
        <h1 className="text-2xl md:text-3xl font-black">
          MIX MODS FC 26 <span className="text-[#ce5a67]">2025–2026</span>
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

        <div className="bg-[#111] border border-[#ce5a67]/30 rounded-3xl p-6 space-y-4">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-[#ce5a67]">Thanh toán tự động</p>
            <p className="text-[10px] text-slate-500 mt-1">Nhập email → Thanh toán → Nhận code ngay</p>
          </div>

          <PayOSButton productId="mix-mods" price="169.000đ" color="#ce5a67" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[10px] text-slate-600 uppercase tracking-widest">hoặc chuyển khoản thủ công</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest">Quét mã QR để thanh toán</p>
            <div className="relative w-52 h-52 rounded-2xl overflow-hidden border border-white/10">
              <Image
                src="/qrbidv.jpg"
                alt="QR BIDV"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Ngân hàng", value: "BIDV" },
              { label: "Số tài khoản", value: "5200501707", showCopy: true },
              { label: "Chủ tài khoản", value: "TRAN VIET DUNG" },
              { label: "Số tiền", value: "169.000đ" },
              { label: "Nội dung CK", value: "MIX MODS FC26 + SĐT của bạn" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[11px] text-slate-500">{item.label}</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-[11px] font-bold text-white">{item.value}</span>
                  {item.showCopy && <CopyButton text={item.value} />}
                </div>
              </div>
            ))}
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
              Chọn "Thanh toán tự động" để nhận code qua email ngay lập tức.
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
