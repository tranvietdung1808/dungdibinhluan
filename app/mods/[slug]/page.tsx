import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MODS, type Mod } from "../../data/mods";
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
  const mod = ALL_MODS.find((m) => m.slug === slug) as Mod;
  if (!mod) return notFound();

  const isMixMods = mod.slug === "mix-mods-fc26";
  const isPortrait = mod.thumbnailOrientation !== "landscape";
  
  // Luôn hiển thị ngày hôm nay cho MIX MODS
  const displayUpdatedAt = isMixMods 
    ? new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : mod.updatedAt;

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-4 md:px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">← Trang chủ</Link>
        <span className="text-slate-700">/</span>
        <Link href="/mods" className="text-slate-500 hover:text-white transition-colors text-sm">Mod Hub</Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm font-bold text-white truncate max-w-[200px]">{mod.name}</span>
      </div>

      {isPortrait ? (
        // ===== FACES LAYOUT =====
        <div className="relative">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(206,90,103,0.22),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.14),transparent_55%)]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14 flex flex-col items-center gap-8 md:gap-10">
            
            {/* Title + meta */}
            <div className="w-full text-center space-y-3">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/5 border border-white/10">
                  Faces
                </span>
                {mod.featured && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#ce5a67] text-white">
                    ⭐ FEATURED
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black leading-tight">
                {mod.name}
              </h1>
              <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-slate-300">
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  👤 {mod.author}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  📦 {mod.version}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  🔄 {mod.updatedAt}
                </span>
              </div>
            </div>

            {/* Hero section */}
            <div className="w-full flex flex-col md:flex-row md:items-center md:gap-10">
              {/* Ảnh */}
              <div className="w-full md:w-[360px] flex-shrink-0 flex justify-center">
                <div className="relative w-[260px] md:w-[320px] aspect-[3/4] rounded-[28px] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] bg-[#050507]">
                  <Image
                    src={mod.thumbnail}
                    alt={mod.name}
                    fill
                    className="object-cover object-center"
                    priority
                  />
                </div>
              </div>

              {/* Card info + download */}
              <div className="mt-6 md:mt-0 flex-1 flex flex-col gap-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
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

                {/* Mô tả */}
                <div className="bg-[#0c0c10] rounded-2xl border border-white/5 p-5 md:p-6 space-y-3">
                  <h2 className="text-xs font-black tracking-widest uppercase text-slate-400">
                    Mô tả
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {mod.longDescription}
                  </p>
                </div>

                {/* Download CTA */}
                <div className="bg-gradient-to-br from-[#ce5a67]/20 via-[#ce5a67]/5 to-transparent border border-[#ce5a67]/40 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                      Sẵn sàng cài đặt
                    </p>
                    <p className="text-base md:text-lg font-black mt-0.5">
                      Tải xuống miễn phí
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      An toàn · Miễn phí · Face cho EA FC 26
                    </p>
                  </div>
                  <a
                    href={mod.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-xs md:text-sm text-white hover:bg-[#b44c5c] transition-all shadow-[0_12px_40px_rgba(206,90,103,0.45)] whitespace-nowrap"
                  >
                    ⬇️ TẢI XUỐNG
                  </a>
                </div>

                <div className="text-[11px] text-slate-600 italic text-center sm:text-left space-y-1">
                  <p>Lưu ý: Bản mod chỉ dành cho anh em đã có game.</p>
                  <p>
                    Chưa có game?{" "}
                    <Link href="/games/fc26/select" className="text-[#ce5a67] hover:underline font-semibold">
                      Liên hệ admin mua ngay
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isMixMods ? (
        // ===== MIX MODS LAYOUT =====
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">

          {/* ===== HERO BANNER ===== */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 h-64 md:h-[420px]">
            <Image
              src={mod.thumbnail}
              alt={mod.name}
              fill
              className="object-cover opacity-50"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/60 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-5 left-5 flex items-center gap-2 flex-wrap">
              {mod.featured && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#ce5a67] text-white tracking-widest">
                  ⭐ FEATURED
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/10 text-white border border-white/20 tracking-widest">
                {mod.category}
              </span>
            </div>

            {/* Title overlay */}
            <div className="absolute bottom-5 left-5 right-5">
              <h1 className="text-2xl md:text-4xl font-black leading-tight drop-shadow-lg">
                {mod.name}
              </h1>
            </div>
          </div>

          {/* ===== META INFO ===== */}
          <div className="flex items-center gap-3 flex-wrap text-xs border-b border-white/5 pb-5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              👤 <span className="font-bold">{mod.author}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              🔄 Cập nhật: <span className="font-bold">{displayUpdatedAt}</span>
            </span>
          </div>

          {/* ===== TAGS ===== */}
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

          {/* ===== VIDEO PREVIEW ===== */}
          {mod.videoId && (
            <div className="space-y-3">
              <h2 className="text-xs font-black tracking-widest uppercase text-slate-400">
                🎬 Video ngắn về gameplay
              </h2>
              <div
                className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
                style={{ paddingBottom: "56.25%" }}
              >
                <iframe
                  src={`https://player.vimeo.com/video/${mod.videoId}?autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* ===== DESCRIPTION ===== */}
          <div className="bg-[#111] rounded-2xl border border-white/5 p-5 md:p-7 space-y-3">
            <h2 className="text-sm font-black tracking-widest uppercase text-slate-400">Mô tả</h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {mod.longDescription}
            </p>
          </div>

          {/* ===== PRICING + CTA ===== */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#ce5a67]/20 via-[#0a0a0a] to-[#a855f7]/10 border border-[#ce5a67]/30 rounded-3xl p-6 md:p-8">
            {/* Background glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#ce5a67]/20 blur-3xl" />
            
            <div className="relative flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1 text-center sm:text-left space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-widest">Sẵn sàng cài đặt</p>
                <p className="text-2xl md:text-3xl font-black text-white">
                  169.000đ
                </p>
                <p className="text-sm text-[#ce5a67] font-bold">Hỗ trợ update miễn phí trọn đời</p>
                <p className="text-slate-500 text-xs">An toàn · Hỗ trợ 1:1 · Cài đặt qua Teamviewer</p>
              </div>
              <Link
                href="/mods/mix-mods-fc26/payment"
                className="flex items-center gap-2 px-8 py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all shadow-[0_12px_40px_rgba(206,90,103,0.45)] whitespace-nowrap"
              >
                💳 LIÊN HỆ MUA
              </Link>
            </div>
          </div>

          <p className="text-xs text-slate-600 italic text-center">
            Lưu ý: Bản mod chỉ dành cho anh em đã có game. Chưa có game?{" "}
            <Link href="/games/fc26/select" className="text-[#ce5a67] hover:underline">
              Liên hệ admin mua ngay
            </Link>
          </p>
        </div>
      ) : (
        // ===== MOD LANDSCAPE (KHÔNG PHẢI MIX MODS) =====
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">

          {/* Thumbnail hero */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 h-56 md:h-96">
            <Image
              src={mod.thumbnail}
              alt={mod.name}
              fill
              className="opacity-70 object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
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
                Tải xuống miễn phí
              </p>
              <p className="text-slate-500 text-xs mt-1">
                An toàn · Miễn phí
              </p>
            </div>
            <a
              href={mod.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-sm text-white hover:bg-[#b44c5c] transition-all shadow-[0_8px_30px_rgba(206,90,103,0.3)] whitespace-nowrap"
            >
              ⬇️ TẢI XUỐNG
            </a>
          </div>

          <div className="text-xs text-slate-600 italic text-center space-y-1">
            <p>Lưu ý: Bản mod chỉ dành cho anh em đã có game.</p>
            <p>
              Chưa có game?{" "}
              <Link href="/games/fc26/select" className="text-[#ce5a67] hover:underline font-semibold">
                Liên hệ admin mua ngay
              </Link>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
