import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MODS, type Mod } from "../../data/mods";
import { FACES } from "../../data/faces";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { extractTopicTerms, overlapScore, parseFlexibleDate, stripHtml } from "@/lib/related-content";

const TAG_COLORS: Record<string, string> = {
  Faces: "#3b82f6",
  Kits: "#8b5cf6",
  Gameplay: "#10b981",
  "Đồ họa": "#f59e0b",
  "Cơ chế game": "#ce5a67",
};

const ALL_STATIC_MODS: Mod[] = [...(FACES as Mod[]), ...MODS];
const SITE_URL = "https://dungdibinhluan.com";

// Database mod interface
interface DbMod {
  id: string;
  slug: string;
  name: string;
  author: string;
  category: string;
  version: string;
  updated_at: string;
  description: string | null;
  long_description: string | null;
  thumbnail: string | null;
  download_url: string | null;
  tags: string[];
  thumbnail_orientation: string;
  featured: boolean;
  video_id: string | null;
  created_at: string;
}

function mapDbModToMod(dbMod: DbMod): Mod {
  return {
    slug: dbMod.slug,
    name: dbMod.name,
    author: dbMod.author,
    category: dbMod.category,
    version: dbMod.version,
    updatedAt: dbMod.updated_at,
    description: dbMod.description || "",
    longDescription: dbMod.long_description || "",
    thumbnail: dbMod.thumbnail || "",
    downloadUrl: dbMod.download_url || "",
    tags: dbMod.tags || [],
    thumbnailOrientation: (dbMod.thumbnail_orientation as "portrait" | "landscape") || undefined,
    featured: dbMod.featured,
    videoId: dbMod.video_id || undefined,
  } as unknown as Mod;
}

async function fetchDbMod(slug: string): Promise<DbMod | null> {
  const { data, error } = await supabaseAdmin
    .from("mods")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as DbMod;
}

async function fetchDbMods(): Promise<DbMod[]> {
  const { data, error } = await supabaseAdmin.from("mods").select("*");
  if (error || !data) return [];
  return data as DbMod[];
}

type RelatedModCandidate = {
  mod: Mod;
  sortDate: number;
  score: number;
};

function getModTopicTerms(mod: Mod) {
  const fullText = `${mod.name} ${mod.description || ""} ${stripHtml(mod.longDescription || "")}`;
  return extractTopicTerms(fullText);
}

function getRelatedScore(currentMod: Mod, candidateMod: Mod) {
  const sharedTags = overlapScore(currentMod.tags || [], candidateMod.tags || []);
  const sameCategory = currentMod.category === candidateMod.category ? 1 : 0;
  const sharedTerms = overlapScore(getModTopicTerms(currentMod), getModTopicTerms(candidateMod));
  return sharedTags * 24 + sameCategory * 12 + sharedTerms * 3;
}

async function getRelatedMods(currentMod: Mod) {
  const dbMods = (await fetchDbMods()).map(mapDbModToMod);
  const merged = new Map<string, Mod>();
  for (const item of ALL_STATIC_MODS) merged.set(item.slug, item);
  for (const item of dbMods) merged.set(item.slug, item);
  merged.delete(currentMod.slug);

  const ranked: RelatedModCandidate[] = [...merged.values()]
    .map((candidateMod) => ({
      mod: candidateMod,
      sortDate: parseFlexibleDate(candidateMod.updatedAt),
      score: getRelatedScore(currentMod, candidateMod),
    }))
    .filter((item) => item.score > 0);

  ranked.sort((left, right) => right.score - left.score || right.sortDate - left.sortDate);
  return ranked.slice(0, 8).map((item) => item.mod);
}

function getAbsoluteImageUrl(image?: string) {
  if (!image) return `${SITE_URL}/og-image.jpg`;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`;
}

function getSoftwareApplicationSchema(mod: Mod) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: mod.name,
    description: mod.description || mod.longDescription,
    applicationCategory: "GameApplication",
    operatingSystem: "Windows",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
    },
    author: {
      "@type": "Person",
      name: mod.author || "DungDiBinhLuan",
    },
    publisher: {
      "@type": "Organization",
      name: "DungDiBinhLuan",
      url: SITE_URL,
    },
    softwareVersion: mod.version || "1.0",
    screenshot: getAbsoluteImageUrl(mod.thumbnail),
    downloadUrl: mod.downloadUrl,
    keywords: mod.tags?.join(", ") || "FC 26 mod, FIFA mod, game mod",
    url: `${SITE_URL}/mods/${mod.slug}`,
  };
}

export async function generateStaticParams() {
  // Only generate static params for static mods
  // Database mods will be dynamically rendered
  return ALL_STATIC_MODS.map((mod) => ({ slug: mod.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  
  // Try to find in static mods first
  let mod = ALL_STATIC_MODS.find((m) => m.slug === slug);
  
  // If not found, try database
  if (!mod) {
    const dbMod = await fetchDbMod(slug);
    if (dbMod) {
      mod = mapDbModToMod(dbMod);
    }
  }
  
  if (!mod) return { title: "Mod không tồn tại" };
  const canonical = `${SITE_URL}/mods/${mod.slug}`;
  const imageUrl = getAbsoluteImageUrl(mod.thumbnail);
  const description = mod.description || mod.longDescription;

  return {
    title: mod.name,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${mod.name} | DungDiBinhLuan`,
      description,
      url: canonical,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${mod.name} | DungDiBinhLuan`,
      description,
      images: [imageUrl],
    },
  };
}

async function getMod(slug: string): Promise<Mod | null> {
  // Try to find in static mods first
  let mod = ALL_STATIC_MODS.find((m) => m.slug === slug);
  
  // If not found, try database
  if (!mod) {
    const dbMod = await fetchDbMod(slug);
    if (dbMod) {
      mod = mapDbModToMod(dbMod);
    }
  }
  
  return (mod || null) as Mod | null;
}

export default async function ModDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mod = await getMod(slug);
  
  if (!mod) return notFound();

  const isMixMods = mod.slug === "mix-mods-fc26";
  const isPortrait = mod.thumbnailOrientation !== "landscape";
  const thumbnailSrc = mod.thumbnail?.trim() ? mod.thumbnail : null;
  const softwareApplicationSchema = getSoftwareApplicationSchema(mod);
  const relatedMods = await getRelatedMods(mod);
  
  // Luôn hiển thị ngày hôm nay cho MIX MODS
  const displayUpdatedAt = isMixMods
    ? new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : mod.updatedAt;

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />
      <div className="border-b border-white/5 px-4 md:px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">← Trang chủ</Link>
        <span className="text-slate-700">/</span>
        <Link href="/mods" className="text-slate-500 hover:text-white transition-colors text-sm">Mod Hub</Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm font-bold text-white truncate max-w-[200px]">{mod.name}</span>
      </div>

      {isMixMods ? (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 h-64 md:h-[420px]">
            {thumbnailSrc ? (
              <Image
                src={thumbnailSrc}
                alt={mod.name}
                fill
                className="object-cover opacity-50"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0a]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/60 via-transparent to-transparent" />

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

            <div className="absolute bottom-5 left-5 right-5">
              <h1 className="text-2xl md:text-4xl font-black leading-tight drop-shadow-lg">
                {mod.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs border-b border-white/5 pb-5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              👤 <span className="font-bold">{mod.author}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              🔄 Cập nhật: <span className="font-bold">{displayUpdatedAt}</span>
            </span>
          </div>

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

          <div className="bg-[#111] rounded-2xl border border-white/5 p-5 md:p-7 space-y-3">
            <h2 className="text-sm font-black tracking-widest uppercase text-slate-400">Mô tả</h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {mod.longDescription}
            </p>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#ce5a67]/20 via-[#0a0a0a] to-[#a855f7]/10 border border-[#ce5a67]/30 rounded-3xl p-6 md:p-8">
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
      ) : isPortrait ? (
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(206,90,103,0.22),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.14),transparent_55%)]" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14 flex flex-col items-center gap-8 md:gap-10">
            
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

            <div className="w-full flex flex-col md:flex-row md:items-center md:gap-10">
              <div className="w-full md:w-[360px] flex-shrink-0 flex justify-center">
                <div className="relative w-[260px] md:w-[320px] aspect-[3/4] rounded-[28px] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] bg-[#050507]">
                  {thumbnailSrc ? (
                    <Image
                      src={thumbnailSrc}
                      alt={mod.name}
                      fill
                      className="object-cover object-center"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      No thumbnail
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 md:mt-0 flex-1 flex flex-col gap-4">
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

                <div className="bg-[#0c0c10] rounded-2xl border border-white/5 p-5 md:p-6 space-y-3">
                  <h2 className="text-xs font-black tracking-widest uppercase text-slate-400">
                    Mô tả
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {mod.longDescription}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#ce5a67]/20 via-[#ce5a67]/5 to-transparent border border-[#ce5a67]/40 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">
                      Sẵn sàng cài đặt
                    </p>
                    <p className="text-base md:text-lg font-black mt-0.5">
                      Tải xuống miễn phí
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      An toàn · Miễn phí
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
      ) : (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 h-56 md:h-96">
            {thumbnailSrc ? (
              <Image
                src={thumbnailSrc}
                alt={mod.name}
                fill
                className="opacity-70 object-cover object-center"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0a]" />
            )}
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

          <div className="bg-[#111] rounded-2xl border border-white/5 p-5 md:p-7 space-y-3">
            <h2 className="text-sm font-black tracking-widest uppercase text-slate-400">Mô tả</h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {mod.longDescription}
            </p>
          </div>

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
      <section className="mx-auto max-w-6xl px-4 md:px-6 pb-14">
        <div className="rounded-3xl border border-white/10 bg-[#0f0f14] p-5 md:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">Mods liên quan</h2>
            </div>
            <Link href="/mods" className="text-[11px] uppercase tracking-widest text-[#ce5a67] hover:underline font-black">
              Xem tất cả
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {relatedMods.length > 0 ? (
              relatedMods.map((relatedMod) => (
                <Link
                  key={relatedMod.slug}
                  href={`/mods/${relatedMod.slug}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-colors hover:border-[#ce5a67]/50"
                >
                  <div className="h-36 bg-[#16161d]">
                    {relatedMod.thumbnail ? (
                      <img src={relatedMod.thumbnail} alt={relatedMod.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {relatedMod.tags.slice(0, 2).map((tag) => (
                        <span
                          key={`${relatedMod.slug}-${tag}`}
                          className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            color: TAG_COLORS[tag] || "#cbd5e1",
                            borderColor: `${TAG_COLORS[tag] || "#64748b"}66`,
                            background: `${TAG_COLORS[tag] || "#64748b"}1f`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-bold text-white">{relatedMod.name}</h3>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {relatedMod.category} · {relatedMod.updatedAt}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
                Chưa có mod liên quan phù hợp để hiển thị.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
