import Image from "next/image";
import Link from "next/link";
import { GAMES } from "./data/games";
import { MODS } from "./data/mods";
import { FACES } from "./data/faces";
import FeatureSlider from "./components/FeatureSlider";
import HeroSection from "./components/HeroSection";
import Navbar from "./components/Navbar";
import { createClient } from "@/utils/supabase/server";
import { resolveThumbnailSrc } from "@/utils/r2";

type HomeGuide = {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  thumbnail_url: string | null;
};

type HomeDbMod = {
  id: string;
  slug: string;
  name: string;
  updated_at: string;
  thumbnail: string | null;
  tags: string[];
};

type HomeModCard = {
  slug: string;
  name: string;
  updatedAt: string;
  thumbnail: string;
  tag: string;
};

// ========== QUICK FEATURES ==========
const features = [
  { icon: "🛒", title: "MUA HÀNG DỄ DÀNG", desc: "Nhanh chóng, thuận tiện. Với nhiều mẫu mã cho anh em lựa chọn." },
  { icon: "💬", title: "HỖ TRỢ NHANH CHÓNG", desc: "Đội ngũ admin luôn sẵn sàng xử lí những vấn đề anh em gặp phải." },
  { icon: "🛡️", title: "BẢO HÀNH TRỌN ĐỜI", desc: "Cam kết bảo hành trọn đời với những sản phẩm đã mua." },
  { icon: "⚙️", title: "DỄ DÀNG CÀI ĐẶT", desc: "Hỗ trợ cài đặt 1:1 qua Teamviewer bất cứ lúc nào." },
];

const Features = () => (
  <section className="bg-[#080810] border-y border-white/5 py-10 md:py-14">
    <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
      {features.map((f) => (
        <div key={f.title} className="text-center space-y-2 md:space-y-3">
          <div className="w-11 h-11 md:w-14 md:h-14 mx-auto rounded-xl md:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl md:text-2xl">
            {f.icon}
          </div>
          <p className="text-[9px] md:text-[10px] font-black tracking-widest text-white uppercase">{f.title}</p>
          <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const parseDate = (str: string) => {
  const [day, month, year] = str.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
};

const sortModsByUpdated = (a: HomeModCard, b: HomeModCard) => {
  const diff = parseDate(b.updatedAt) - parseDate(a.updatedAt);
  return Number.isNaN(diff) ? 0 : diff;
};

const LatestModsSection = ({ mods }: { mods: HomeModCard[] }) => {
  if (mods.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 -mt-6 md:-mt-8 relative z-20">
      <div className="rounded-3xl border border-white/10 bg-[#0d0d14]/95 backdrop-blur-xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">CHIA SẺ MODS MIỄN PHÍ</p>
            <h2 className="text-xl md:text-2xl font-black mt-1">MOD MỚI CẬP NHẬT</h2>
          </div>
          <Link href="/mods" className="text-[10px] md:text-xs text-[#ce5a67] font-black tracking-widest hover:underline uppercase">
            Xem tất cả
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {mods.slice(0, 8).map((mod) => (
            <Link
              key={mod.slug}
              href={`/mods/${mod.slug}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-[#ce5a67]/45 transition-colors"
            >
              <div className="relative h-32 bg-[#111]">
                {mod.thumbnail ? (
                  <img src={mod.thumbnail} alt={mod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0a]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[9px] font-black tracking-widest bg-[#ce5a67]/20 text-[#ce5a67] border border-[#ce5a67]/30">
                  {mod.tag}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-[#ce5a67] transition-colors">{mod.name}</p>
                <p className="mt-2 text-[10px] text-slate-500">Cập nhật: {mod.updatedAt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const MobileLatestGuidesSection = ({
  guides,
}: {
  guides: Array<{ id: string; slug: string; title: string; createdAt: string; thumbnail?: string }>;
}) => {
  if (guides.length === 0) return null;

  return (
    <section className="xl:hidden max-w-6xl mx-auto px-4 md:px-6 mt-4">
      <div className="rounded-2xl border border-white/10 bg-[#0d0d14]/90 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-300">BÀI VIẾT MỚI</p>
          <Link href="/huong-dan" className="text-[10px] text-[#ce5a67] font-black tracking-widest hover:underline uppercase">
            Xem tất cả
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/huong-dan/${guide.slug}`}
              className="snap-start min-w-[210px] max-w-[210px] rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
            >
              <div className="relative h-36 bg-[#13131b]">
                {guide.thumbnail ? (
                  <img src={guide.thumbnail} alt={guide.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-[#ce5a67]/25 to-transparent" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-white line-clamp-2 leading-snug">{guide.title}</p>
                <p className="mt-2 text-[10px] text-slate-500">{guide.createdAt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ========== GAME GRID ==========
const GameGrid = () => {
  const others = GAMES.filter((g) => !g.spotlight);

  return (
    <section id="games" className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16 space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">CÁC GAME KHÁC</h2>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Liên hệ để mua</p>
        </div>
        <a
          href="https://web.facebook.com/dungbinhluan/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#ce5a67] font-bold tracking-widest hover:underline uppercase"
        >
          Xem tất cả →
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        {others.map((game) => (
          <div
            key={game.slug}
            className="group relative overflow-hidden rounded-2xl border transition-all hover:scale-[1.01] duration-300"
            style={{
              borderColor: `${game.coverColor}20`,
              background: `radial-gradient(ellipse at top right, ${game.coverColor}10, transparent 60%), #111`,
            }}
          >
            <div className="relative h-36 md:h-44 overflow-hidden">
              <Image
                src={game.thumbnail ?? `/games/${game.slug}-thumb.jpg`}

                alt={game.name}
                fill
                className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
              <span
                className="absolute top-3 left-3 md:top-4 md:left-4 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest"
                style={{
                  background: `${game.coverColor}20`,
                  color: game.coverColor,
                  border: `1px solid ${game.coverColor}30`,
                }}
              >
                {game.tag}
              </span>
            </div>

            <div className="p-4 md:p-5 space-y-3 md:space-y-4">
              <div>
                <h3 className="text-base md:text-lg font-black">{game.name}</h3>
                <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: game.coverColor }}>
                  {game.subtitle}
                </p>
                <p className="text-slate-500 text-xs mt-1">{game.description}</p>
              </div>
              <a
                href={game.fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl text-xs font-black tracking-widest border transition-all hover:opacity-80"
                style={{ borderColor: `${game.coverColor}40`, color: game.coverColor }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                LIÊN HỆ MUA
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ========== PAGE ==========
export default async function HomePage() {
  const supabase = createClient();
  const [guidesRes, dbModsRes] = await Promise.all([
    supabase.from("guides").select("id,title,slug,created_at,thumbnail_url").order("created_at", { ascending: false }).limit(6),
    supabase.from("mods").select("id,slug,name,updated_at,thumbnail,tags").order("created_at", { ascending: false }).limit(8),
  ]);

  const latestGuides: HomeGuide[] = guidesRes.data || [];
  const heroGuides = latestGuides.slice(0, 6).map((guide) => ({
    id: guide.id,
    slug: guide.slug,
    title: guide.title,
    createdAt: new Date(guide.created_at).toLocaleDateString("vi-VN"),
    thumbnail: resolveThumbnailSrc(guide.thumbnail_url) || "",
  }));

  const staticMods: HomeModCard[] = [...MODS, ...FACES].map((mod) => ({
    slug: mod.slug,
    name: mod.name,
    updatedAt: mod.updatedAt,
    thumbnail: mod.thumbnail || "",
    tag: mod.tags?.[0] || "MOD",
  }));

  const dbMods: HomeModCard[] = ((dbModsRes.data || []) as HomeDbMod[]).map((mod) => ({
    slug: mod.slug,
    name: mod.name,
    updatedAt: mod.updated_at,
    thumbnail: resolveThumbnailSrc(mod.thumbnail) || "",
    tag: mod.tags?.[0] || "MOD",
  }));

  const latestMods = [...dbMods, ...staticMods].sort(sortModsByUpdated);

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <Navbar />
      <div className="pt-14 md:pt-16">
        <HeroSection latestGuides={heroGuides} />
        <MobileLatestGuidesSection guides={heroGuides} />
        <LatestModsSection mods={latestMods} />
        <section id="tinh-nang" className="-mt-10 relative z-10">
          <FeatureSlider />
        </section>
        <Features />
        <GameGrid />
      </div>
      <footer className="border-t border-white/5 px-4 md:px-6 py-5 md:py-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-4 md:gap-6 text-[10px] md:text-xs">
          <Link href="/dmca" className="text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
            DMCA & Abuse
          </Link>
        </div>
        <p className="text-[9px] text-slate-600 uppercase tracking-widest">
          © 2026 DUNGDIBINHLUAN — Powered by Google Antivirus
        </p>
      </footer>
    </main>
  );
}
