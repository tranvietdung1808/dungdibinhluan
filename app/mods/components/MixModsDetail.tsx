import Image from "next/image";
import Link from "next/link";
import ShowcaseGallery from "./ShowcaseGallery";
import StickyBuyBar from "./StickyBuyBar";

// =====================================================
// Trang chi tiết flagship MIX MODS FC 26
// (tách từ nhánh isMixMods trong [slug]/page.tsx)
// =====================================================

const TAG_COLORS: Record<string, string> = {
  Faces: "#3b82f6",
  Kits: "#8b5cf6",
  Gameplay: "#10b981",
  "Đồ họa": "#f59e0b",
  "Cơ chế game": "var(--color-primary)",
};

const PRICE = "169.000đ";
const PAYMENT_HREF = "/mods/mix-mods-fc26/payment";

interface MixModsDetailProps {
  mod: {
    slug: string;
    name: string;
    author: string;
    category: string;
    version: string;
    updatedAt: string;
    description: string;
    longDescription?: string;
    thumbnail: string | null;
    tags: string[];
    featured?: boolean;
    videoId?: string;
  };
}

// Các con số nổi bật — nội dung khớp với mô tả MIX MODS
const HIGHLIGHTS = [
  { value: "~2000", label: "Faces cầu thủ mới", hint: "Facemod chất lượng nhất" },
  { value: "4K", label: "Đồ họa tối ưu", hint: "Cân chỉnh theo từng máy" },
  { value: "AI", label: "Gameplay thông minh", hint: "Chân thực & mượt mà" },
  { value: "1:1", label: "Cài đặt qua Teamviewer", hint: "Admin hỗ trợ trực tiếp" },
  { value: "∞", label: "Update miễn phí", hint: "Trọn đời sau khi mua" },
] as const;

const SECTION_STYLE =
  "text-[11px] md:text-xs font-black tracking-[0.22em] uppercase text-slate-500 flex items-center gap-2.5";

export default function MixModsDetail({ mod }: MixModsDetailProps) {
  const thumbnailSrc = mod.thumbnail?.trim() ? mod.thumbnail : null;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10 md:space-y-14">
        {/* ================= HERO ================= */}
        <section className="relative rounded-[28px] overflow-hidden border border-white/10">
          <div className="relative h-[440px] sm:h-[520px] md:h-[560px]">
            {thumbnailSrc ? (
              <>
                <Image
                  src={thumbnailSrc}
                  alt={mod.name}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-center opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/30 to-[#07070b]/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#07070b]/80 via-transparent to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a22] to-[#0a0a0c]" />
            )}

            {/* Lớp ánh sáng coral chìm */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 78% 18%, rgba(206,90,103,0.34), transparent 46%)",
                }}
              />
            </div>

            {/* Badge trên cùng */}
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {mod.featured && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[var(--color-primary)] text-white tracking-widest shadow-[0_4px_16px_rgba(206,90,103,0.45)]">
                    ⭐ FEATURED
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/10 text-white border border-white/20 tracking-widest backdrop-blur-sm">
                  {mod.category}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-black/50 text-slate-200 border border-white/15 tracking-widest backdrop-blur-sm">
                v{mod.version}
              </span>
            </div>

            {/* Nội dung chính dưới */}
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
              <p className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-[var(--color-primary)]/90 mb-2 md:mb-3">
                Bản mod tổng hợp hoàn chỉnh nhất
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.7)] max-w-4xl">
                {mod.name}
              </h1>
              <p className="mt-3 md:mt-4 text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-none">
                {mod.description}
              </p>

              {/* Tags */}
              {mod.tags.length > 0 && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  {mod.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-[10px] md:text-[11px] font-black backdrop-blur-sm"
                      style={{
                        background: `${TAG_COLORS[tag] || "#ce5a67"}1f`,
                        color: TAG_COLORS[tag] || "#f08a95",
                        border: `1px solid ${TAG_COLORS[tag] || "#ce5a67"}38`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta + CTA */}
              <div className="mt-5 md:mt-7 flex items-end justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 backdrop-blur-sm">
                    👤 <span className="font-bold text-white">{mod.author}</span>
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 backdrop-blur-sm">
                    🔄 Cập nhật: <span className="font-bold text-white">{mod.updatedAt}</span>
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[#f08a95] font-bold backdrop-blur-sm">
                    🛡️ Bảo hành trọn đời
                  </span>
                </div>
                <Link
                  href={PAYMENT_HREF}
                  className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-[var(--color-primary)] rounded-2xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all shadow-[0_12px_40px_rgba(206,90,103,0.45)] whitespace-nowrap"
                >
                  💳 LIÊN HỆ MUA — {PRICE}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= BỘ CHỈ SỐ ================= */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-[#0e0e13] p-4 md:p-5 hover:border-[var(--color-primary)]/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <p className="text-2xl md:text-[26px] font-black text-white tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text">
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] md:text-xs font-black uppercase tracking-wider text-[var(--color-primary)]/90">
                  {item.label}
                </p>
                <p className="mt-1 text-[10px] md:text-[11px] text-slate-500 leading-snug">{item.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SHOWCASE ================= */}
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className={SECTION_STYLE}>
                <span className="w-1 h-4 bg-[var(--color-primary)] rounded-full" />
                Showcase
              </p>
              <h2 className="mt-2 text-xl md:text-2xl font-black tracking-tight text-white">
                Hình ảnh thực tế trong game
              </h2>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Bấm vào ảnh để xem lớn
            </p>
          </div>
          <ShowcaseGallery slug={mod.slug} />
        </section>

        {/* ================= VIDEO DEMO ================= */}
        {mod.videoId && (
          <section className="space-y-5">
            <div>
              <p className={SECTION_STYLE}>
                <span className="w-1 h-4 bg-[var(--color-primary)] rounded-full" />
                Video demo
              </p>
              <h2 className="mt-2 text-xl md:text-2xl font-black tracking-tight text-white">
                Xem gameplay thực tế
              </h2>
            </div>
            <div
              className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-black shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                src={`https://player.vimeo.com/video/${mod.videoId}?autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Video demo MIX MODS FC 26"
              />
            </div>
          </section>
        )}

        {/* ================= MÔ TẢ CHI TIẾT ================= */}
        {mod.longDescription && (
          <section className="space-y-5">
            <div>
              <p className={SECTION_STYLE}>
                <span className="w-1 h-4 bg-[var(--color-primary)] rounded-full" />
                Mô tả chi tiết
              </p>
              <h2 className="mt-2 text-xl md:text-2xl font-black tracking-tight text-white">
                MIX MODS gồm những gì?
              </h2>
            </div>
            <div className="bg-[#0e0e13] rounded-3xl border border-white/5 p-6 md:p-10">
              <div
                className="text-slate-300 text-sm md:text-[15px] leading-[1.85] whitespace-pre-line max-w-3xl mx-auto"
                dangerouslySetInnerHTML={{ __html: mod.longDescription }}
              />
            </div>
          </section>
        )}

        {/* ================= CTA CHÍNH ================= */}
        <section
          id="mix-cta"
          className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/25 via-[#0c0c10] to-[#8b5cf6]/10 border border-[var(--color-primary)]/30 rounded-[28px] p-7 md:p-10"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full bg-[var(--color-primary)]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-7">
            <div className="flex-1 space-y-2 text-center lg:text-left">
              <p className="text-[10px] md:text-xs uppercase tracking-widest text-slate-400 font-black">
                Sẵn sàng cài đặt ngay
              </p>
              <p className="text-3xl md:text-4xl font-black text-white">{PRICE}</p>
              <p className="text-sm text-[var(--color-primary)] font-bold">
                Hỗ trợ update miễn phí trọn đời
              </p>
              <p className="text-xs text-slate-500">
                An toàn · Hỗ trợ 1:1 · Cài đặt qua Teamviewer · Nhận mod ngay sau khi thanh toán
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-72">
              <Link
                href={PAYMENT_HREF}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-primary)] rounded-2xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all shadow-[0_12px_40px_rgba(206,90,103,0.45)] whitespace-nowrap"
              >
                💳 LIÊN HỆ MUA NGAY
              </Link>
              <a
                href="#mods-related"
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-slate-200 border border-white/15 bg-white/5 hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                Xem mods liên quan ↓
              </a>
            </div>
          </div>
        </section>

        <p className="text-xs text-slate-600 italic text-center">
          Lưu ý: Bản mod chỉ dành cho anh em đã có game. Chưa có game?{" "}
          <Link href="/games/fc26/select" className="text-[var(--color-primary)] hover:underline font-semibold">
            Liên hệ admin mua ngay
          </Link>
        </p>
      </div>

      <StickyBuyBar price={PRICE} href={PAYMENT_HREF} />
    </>
  );
}
