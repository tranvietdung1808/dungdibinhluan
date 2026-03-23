import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Content Policy | DungDiBinhLuan",
  description: "Chính sách nội dung cho website phân phối mod game FC26.",
};

export default function ContentPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header breadcrumb */}
      <div className="border-b border-white/5 px-4 md:px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">
          ← Trang chủ
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm font-bold tracking-widest uppercase text-white">Content Policy</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16 space-y-8">
        {/* Page title */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            📜 CONTENT <span className="text-[#ce5a67]">POLICY</span>
          </h1>
          <p className="text-slate-500 text-sm">Chính sách nội dung cho website phân phối mod game FC26</p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className="text-[#ce5a67]">1.</span> Mod chỉ dành cho người đã sở hữu game gốc
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Tất cả các mod trên website chỉ dành cho những người đã sở hữu bản game gốc EA Sports FC 26. 
              Chúng tôi không khuyến khích việc sử dụng mod cho các bản game lậu hoặc không chính thống. 
              Việc mua game gốc không chỉ hỗ trợ nhà phát triển mà còn đảm bảo trải nghiệm tốt nhất.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className="text-[#ce5a67]">2.</span> Không chịu trách nhiệm nếu vi phạm TOS của EA Sports
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Chúng tôi không chịu trách nhiệm nếu tài khoản của bạn bị khóa hoặc gặp vấn đề do vi phạm 
              Điều khoản dịch vụ (Terms of Service) của EA Sports. Việc sử dụng mod là hoàn toàn tự nguyện 
              và bạn cần tự chịu trách nhiệm về hành động của mình.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className="text-[#ce5a67]">3.</span> Nghiêm cấm chia sẻ lại file khi chưa được phép
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Nghiêm cấm việc chia sẻ lại, phân phối lại hoặc bán lại các file mod từ website mà chưa có 
              sự đồng ý từ DungDiBinhLuan. Mọi vi phạm sẽ bị xử lý nghiêm khắc và có thể dẫn đến việc 
              chặn truy cập vĩnh viễn.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className="text-[#ce5a67]">4.</span> Quyền xóa nội dung vi phạm bất cứ lúc nào
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              DungDiBinhLuan có quyền xóa bất kỳ nội dung nào bị coi là vi phạm bản quyền, vi phạm pháp luật 
              hoặc không phù hợp với tiêu chuẩn của website mà không cần báo trước. Chúng tôi cam kết duy 
              trì một môi trường chia sẻ mod lành mạnh và tuân thủ pháp luật.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
              <span className="text-[#ce5a67]">5.</span> Bảo hành chỉ áp dụng cho sản phẩm mua trực tiếp
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Chính sách bảo hành chỉ áp dụng cho các sản phẩm được mua trực tiếp từ website DungDiBinhLuan. 
              Các sản phẩm được chia sẻ lại từ nguồn thứ ba không được hưởng quyền bảo hành. Vui lòng liên 
              hệ qua Facebook để được hỗ trợ bảo hành.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-[#ce5a67]/10 border border-[#ce5a67]/20 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="text-lg md:text-xl font-black">📞 Liên hệ hỗ trợ</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Nếu bạn có câu hỏi về chính sách nội dung, vui lòng liên hệ qua Facebook:{" "}
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
