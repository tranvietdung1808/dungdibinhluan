import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DMCA & Abuse | DungDiBinhLuan",
  description: "Báo cáo vi phạm bản quyền và lạm dụng trên website DungDiBinhLuan.",
};

export default function DMCAPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header breadcrumb */}
      <div className="border-b border-white/5 px-4 md:px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">
          ← Trang chủ
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm font-bold tracking-widest uppercase text-white">DMCA & Abuse</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16 space-y-8">
        {/* Page title */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            🛡️ DMCA <span className="text-[#ce5a67]">& ABUSE</span>
          </h1>
          <p className="text-slate-500 text-sm">Báo cáo vi phạm bản quyền và lạm dụng</p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className="text-[#ce5a67]">📋</span> Hướng dẫn report vi phạm bản quyền
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Nếu bạn phát hiện nội dung trên website vi phạm bản quyền hoặc sở hữu trí tuệ của bạn, 
              vui lòng gửi email báo cáo chi tiết đến địa chỉ liên hệ bên dưới. Chúng tôi cam kết 
              xem xét và xử lý nghiêm túc mọi báo cáo hợp lệ.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className="text-[#ce5a67]">📧</span> Email liên hệ
            </h2>
            <div className="bg-[#ce5a67]/10 border border-[#ce5a67]/20 rounded-lg p-4">
              <p className="text-white font-mono text-base md:text-lg">
                dungdibinhluan@gmail.com
              </p>
            </div>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Vui lòng gửi email với tiêu đề rõ ràng, ví dụ: <span className="text-white font-mono">[DMCA Report] - Tên nội dung vi phạm</span>
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className="text-[#ce5a67]">⏱️</span> Cam kết xử lý trong 48-72 giờ
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Chúng tôi cam kết phản hồi và xử lý mọi báo cáo hợp lệ trong vòng 48-72 giờ làm việc. 
              Bạn sẽ nhận được email xác nhận khi chúng tôi bắt đầu xem xét báo cáo của bạn.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className="text-[#ce5a67]">🔄</span> Quy trình xử lý
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ce5a67]/20 flex items-center justify-center text-[#ce5a67] font-black text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Nhận report</p>
                  <p className="text-slate-500 text-xs">Tiếp nhận email báo cáo từ người dùng</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ce5a67]/20 flex items-center justify-center text-[#ce5a67] font-black text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Xem xét</p>
                  <p className="text-slate-500 text-xs">Đánh giá tính hợp lệ và bằng chứng</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ce5a67]/20 flex items-center justify-center text-[#ce5a67] font-black text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Gỡ nếu vi phạm</p>
                  <p className="text-slate-500 text-xs">Xóa nội dung vi phạm và thông báo kết quả</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2 text-red-400">
              ⚠️ Nghiêm cấm lạm dụng hệ thống report
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Chúng tôi nghiêm cấm việc lạm dụng hệ thống report để báo cáo sai sự thật, quấy rối 
              hoặc gây phiền toái cho người khác. Mọi hành vi lạm dụng sẽ bị xử lý và có thể dẫn 
              đến việc chặn truy cập vĩnh viễn.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-[#ce5a67]/10 border border-[#ce5a67]/20 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black">📞 Liên hệ nhanh</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Bạn cũng có thể liên hệ qua Facebook để được hỗ trợ nhanh hơn:{" "}
              <a 
                href="https://web.facebook.com/dungbinhluan/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#ce5a67] hover:underline font-bold"
              >
                DungDiBinhLuan
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
