import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MODS } from "../../data/mods";
import { FACES } from "../../data/faces";
import { notFound } from "next/navigation";

const TAG_COLORS: Record<string, string> = {
  Faces: "#3b82f6",
  Kits: "#8b5cf6",
  Gameplay: "#10b981",
  "Đồ họa": "#f59e0b",
  "Cơ chế game": "#ce5a67",
};

const ALL_MODS = [...FACES, ...MODS];

export async function generateStaticParams() {
  return ALL_MODS.map((mod) => ({ slug: mod.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mod = ALL_MODS.find((m) => m.slug === slug);
  if (!mod) return { title: "Mod không tồn tại" };

  return {
    title: mod.name,
    description: mod.description,
    openGraph: {
      title: `${mod.name} | DungDiBinhLuan`,
      description: mod.description,
      images: [{ url: `https://dungdibinhluan.com${mod.thumbnail}` }],
    },
  };
}

export default async function ModDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mod = ALL_MODS.find((m) => m.slug === slug);
  if (!mod) return notFound();

  const isMixMods = mod.slug === "mix-mods-fc26";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-4 md:px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">← Trang chủ</Link>
        <span className="text-slate-700">/</span>
        <Link href="/mods" className="text-slate-500 hover:text-white transition-colors text-sm">Mod Hub</Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm font-bold text-white truncate max-w-[200px]">{mod.name}</span>
      </div>

      {mod.thumbnailOrientation === "portrait" ? (
        // ===== FACES LAYOUT: 2 cột =====
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">

            {/* Cột trái — Ảnh */}
            <div className="w-full md:w-[340px] flex-shrink-0">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-[3/4]">
                <Image
                  src={mod.thumbnail}
                  alt={mod.name}
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>

            {/* Cột phải — Thông tin */}
            <div className="flex-1 space-y-6">

              {/* Breadcrumb tags */}
              <div className="flex items-center gap-2 flex-wrap">
                {mod.featured && (
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-[#ce5a67] text-white">
                    ⭐ FEATURED
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-white/10 text-white border border-white/20">
                  {mod.category}
                </span>
              </div>

              {/* Tên */}
              <div>
                <h1 className="text-2xl md:text-3xl font-black leading-tight">{mod.name}</h1>
              </div>

              {/* Info row */}
              <div className="flex items-center gap-3 flex-wrap text-xs border-b border-white/5 pb-5">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                  👤 <span className="font-bold">{mod.author}</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                  📦 <span className="font-bold">{mod.version}</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                  🔄 <span className="font-bold">{mod.updatedAt}</span>
                </span>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                {mod.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-[11px] font-black"
                    style={{
                      background: `${TAG_COLORS[tag]}20`,
                      color: TAG_COLORS[tag],
                      border: `1px solid ${TAG_COLORS[tag]}30`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="bg-[#111] rounded-2xl border border-white/5 p-5 space-y-2">
                <h2 className="text-xs font-black tracking-widest uppercase text-slate-400">Mô tả</h2>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {mod.longDescription}
                </p>
              </div>

              {/* Download CTA */}
              <div className="bg-gradient-to-br from-[#ce5a67]/10 to-transparent border border-[#ce5a67]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Sẵn sàng cài đặt</p>
                  <p className="text-lg font-black mt-0.5">Tải xuống miễn phí</p>
                  <p className="text-slate-500 text-xs mt-0.5">An toàn · Miễn phí</p>
                </div>
                <a
                  href={mod.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-[#ce5a67] rounded-xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all shadow-[0_8px_30px_rgba(206,90,103,0.3)] whitespace-nowrap"
                >
                  ⬇️ TẢI XUỐNG
                </a>
              </div>

              <p className="text-xs text-slate-600 italic text-center">
                Lưu ý: Bản mod chỉ dành cho anh em đã có game.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // ===== MOD THƯỜNG: giữ layout cũ =====
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">

          {/* Thumbnail hero */}
          <div
            className={`relative rounded-3xl overflow-hidden border border-white/10 ${
              mod.thumbnailOrientation === "portrait"
                ? "h-[420px] md:h-[560px]"
                : "h-56 md:h-96"
            }`}
          >
            <Image
              src={mod.thumbnail}
              alt={mod.name}
              fill
              className={`opacity-70 object-cover ${
                mod.thumbnailOrientation === "portrait" ? "object-center" : "object-center"
              }`}
              priority
            />
            <div className={`absolute inset-0 ${
                mod.thumbnailOrientation === "portrait"
                  ? "bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent"
                  : "bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"
              }`} />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {mod.featured && (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-[#ce5a67] text-white">
                      ⭐ FEATURED
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-white/10 text-white border border-white/20">
                    {mod.category}
                  </span>
                </div>
                <h1 className="text-xl md:text-3xl font-black leading-tight drop-shadow-lg">{mod.name}</h1>
              </div>
            </div>
          </div>

          {/* Info row */}
          <div className="flex items-center gap-3 flex-wrap text-xs border-b border-white/5 pb-5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              👤 <span className="font-bold">{mod.author}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              📦 <span className="font-bold">{mod.version}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              🔄 Cập nhật: <span className="font-bold">{mod.updatedAt}</span>
            </span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {mod.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-[11px] font-black"
                style={{
                  background: `${TAG_COLORS[tag]}20`,
                  color: TAG_COLORS[tag],
                  border: `1px solid ${TAG_COLORS[tag]}30`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <div className="bg-[#111] rounded-2xl border border-white/5 p-5 md:p-7 space-y-3">
            <h2 className="text-sm font-black tracking-widest uppercase text-slate-400">Mô tả</h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {mod.longDescription}
            </p>
          </div>

          {/* Download CTA */}
          <div className="bg-gradient-to-br from-[#ce5a67]/10 to-transparent border border-[#ce5a67]/20 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Sẵn sàng cài đặt</p>
              <p className="text-lg md:text-xl font-black mt-1">
                {isMixMods ? "169.000đ — Hỗ trợ update miễn phí" : "Tải xuống miễn phí"}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {isMixMods ? "An toàn · Hỗ trợ 1:1" : "An toàn · Miễn phí"}
              </p>
            </div>
            {isMixMods ? (
              <Link
                href="/mods/mix-mods-fc26/payment"
                className="flex items-center gap-2 px-8 py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all shadow-[0_8px_30px_rgba(206,90,103,0.3)] whitespace-nowrap"
              >
                💳 LIÊN HỆ MUA
              </Link>
            ) : (
              <a
                href={mod.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all shadow-[0_8px_30px_rgba(206,90,103,0.3)] whitespace-nowrap"
              >
                ⬇️ TẢI XUỐNG
              </a>
            )}
          </div>

          <p className="text-xs text-slate-600 italic text-center">
            Lưu ý: Bản mod chỉ dành cho anh em đã có game. Chưa có game có thể inbox page để mua nhé!
          </p>
        </div>
      )}
    </main>
  );
}
