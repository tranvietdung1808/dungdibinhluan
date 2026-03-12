import Link from "next/link";
import Image from "next/image";

export default function PaymentPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 py-16">

      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Thanh toán</p>
        <h1 className="text-2xl md:text-3xl font-black">
          MIX MODS FC 26 <span className="text-[#ce5a67]">2025–2026</span>
        </h1>
        <p className="text-slate-400 text-sm">Hỗ trợ cập nhật miễn phí sau khi mua</p>
      </div>

      <div className="w-full max-w-md space-y-5">

        {/* Giá */}
        <div className="bg-[#ce5a67]/10 border border-[#ce5a67]/30 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-slate-300">Tổng thanh toán</span>
          <span className="text-2xl font-black text-[#ce5a67]">169.000đ</span>
        </div>

        {/* QR + STK */}
        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 space-y-5">

          {/* QR */}
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

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">hoặc chuyển khoản thủ công</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          {/* STK */}
          <div className="space-y-2.5">
            {[
              { label: "Ngân hàng", value: "BIDV" },
              { label: "Số tài khoản", value: "5200501707" },
              { label: "Chủ tài khoản", value: "TRAN VIET DUNG" },
              { label: "Số tiền", value: "169.000đ" },
              { label: "Nội dung CK", value: "MIX MODS FC26 + SĐT của bạn" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[11px] text-slate-500">{item.label}</span>
                <span className="text-[11px] font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lưu ý */}
        <div className="bg-white/5 rounded-2xl p-4 space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lưu ý</p>
          <ul className="space-y-1">
            {[
              "Ghi đúng nội dung chuyển khoản để admin xác nhận nhanh hơn.",
              "Sau khi chuyển khoản, nhấn nút bên dưới để gửi bill cho page.",
              "Admin sẽ phản hồi và gửi link tải trong vòng 24h.",
            ].map((note, i) => (
              <li key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <span className="text-[#ce5a67] mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
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
