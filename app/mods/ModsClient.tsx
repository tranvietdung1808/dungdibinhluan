"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MODS } from "../data/mods";
import { FACES } from "../data/faces";

const ALL_TAGS = ["Tất cả", "Faces", "Kits", "Gameplay", "Đồ họa", "Cơ chế game"];

const TAG_COLORS: Record<string, string> = {
  Faces: "#3b82f6",
  Kits: "#8b5cf6",
  Gameplay: "#10b981",
  "Đồ họa": "#f59e0b",
  "Cơ chế game": "#ce5a67",
};

const parseDate = (str: string) => {
  const [day, month, year] = str.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
};

const SOURCE = [...MODS, ...FACES];
const ALL_MODS = [...SOURCE].sort((a, b) => {
  const dateDiff = parseDate(b.updatedAt) - parseDate(a.updatedAt);
  if (dateDiff !== 0) return dateDiff;
  return SOURCE.indexOf(b) - SOURCE.indexOf(a);
});

const PAGE_SIZE = 12;

export default function ModsPage() {
  const [activeTag, setActiveTag] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered =
    activeTag === "Tất cả"
      ? ALL_MODS
      : ALL_MODS.filter((m) => m.tags.includes(activeTag));

  const displayed =
    activeTag === "Faces" && search.trim()
      ? filtered.filter((m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.description?.toLowerCase().includes(search.toLowerCase())
        )
      : filtered;

  const featured = ALL_MODS.find((m) => m.featured);
  const gridItems = activeTag === "Tất cả" ? displayed.filter((m) => !m.featured) : displayed;

  const totalPages = Math.ceil(gridItems.length / PAGE_SIZE);
  const paginated = gridItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTagChange = (tag: string) => {
    setActiveTag(tag);
    setSearch("");
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#080810] text-white relative overflow-hidden">

      {/* ── Static gradient background ── */}

      {/* Glow đỏ góc trên trái */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "-8%", top: "-8%",
          width: "52%", height: "52%",
          background: "radial-gradient(ellipse, rgba(206,90,103,0.20) 0%, rgba(206,90,103,0.05) 50%, transparent 72%)",
          borderRadius: "50%",
          filter: "blur(50px)",
          zIndex: 0,
        }}
      />
      {/* Glow tím góc dưới phải */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: "-4%", bottom: "5%",
          width: "46%", height: "46%",
          background: "radial-gradient(ellipse, rgba(90,60,200,0.14) 0%, transparent 65%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />
      {/* Đường accent đỏ top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 5%, rgba(206,90,103,0.50) 50%, transparent 95%)", zIndex: 1 }}
      />

      {/* Header breadcrumb */}
      <div className="relative z-10 border-b border-white/5 px-4 md:px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">
          ← Trang chủ
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm font-bold tracking-widest uppercase text-white">Mod Hub</span>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">

        {/* Page title */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            🎮 MOD <span className="text-[#ce5a67]">HUB</span>
          </h1>
          <p className="text-slate-500 text-sm">Các bản mod chất lượng cao được tuyển chọn bởi DungDiBinhLuan</p>
        </div>

        {/* Featured mod */}
        {featured && activeTag === "Tất cả" && page === 1 && (
          <Link href={`/mods/${featured.slug}`}>
            <div className="group relative rounded-3xl overflow-hidden border border-white/10 hover:border-[#ce5a67]/40 transition-all cursor-pointer">
              <div className="relative h-56 md:h-80">
                <Image
                  src={featured.thumbnail}
                  alt={featured.name}
                  fill
                  className="object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, #080810 28%, rgba(8,8,16,0.55) 55%, transparent 100%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #080810 0%, rgba(8,8,16,0.4) 35%, transparent 65%)" }} />
                <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-[#ce5a67] text-white">
                    ⭐ FEATURED
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-white/10 text-white border border-white/20">
                    {featured.category}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                <h2 className="text-xl md:text-3xl font-black leading-tight">{featured.name}</h2>
                <p className="text-slate-400 text-sm mt-1 max-w-lg">{featured.description}</p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {featured.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold"
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
              </div>
            </div>
          </Link>
        )}

        {/* Filter tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-widest transition-all border ${
                activeTag === tag
                  ? "bg-[#ce5a67] text-white border-[#ce5a67]"
                  : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {tag.toUpperCase()}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-600">{gridItems.length} mod</span>
        </div>

        {/* Search bar — chỉ hiện khi tab Faces */}
        {activeTag === "Faces" && (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm kiếm faces... (tên cầu thủ, mô tả)"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-all"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {gridItems.length === 0 && (
          <p className="text-slate-600 text-sm py-10 text-center">
            {search ? `Không tìm thấy faces nào với từ khoá "${search}"` : "Chưa có mod nào trong danh mục này."}
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {paginated.map((mod) => {
            const isPortrait = mod.thumbnailOrientation === "portrait";
            return (
              <Link key={mod.slug} href={`/mods/${mod.slug}`}>
                <div
                  className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#ce5a67]/40 transition-all bg-[#0d0d18] cursor-pointer ${
                    isPortrait ? "flex flex-row h-36" : "flex flex-col"
                  }`}
                >
                  <div className={`relative flex-shrink-0 overflow-hidden ${isPortrait ? "w-28 h-full" : "h-40 w-full"}`}>
                    <Image
                      src={mod.thumbnail}
                      alt={mod.name}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500 object-center"
                    />
                    <div className={`absolute inset-0 ${isPortrait ? "bg-gradient-to-r from-transparent via-transparent to-[#0d0d18]" : "bg-gradient-to-t from-[#0d0d18] via-[#0d0d18]/20 to-transparent"}`} />
                    <span
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest"
                      style={{
                        background: `${TAG_COLORS[mod.tags[0]]}25`,
                        color: TAG_COLORS[mod.tags[0]],
                        border: `1px solid ${TAG_COLORS[mod.tags[0]]}40`,
                      }}
                    >
                      {mod.category}
                    </span>
                  </div>
                  <div className={`p-4 flex flex-col justify-center space-y-2 ${isPortrait ? "flex-1 min-w-0" : "w-full"}`}>
                    <h3 className="font-black text-[15px] leading-snug text-white group-hover:text-[#ce5a67] transition-colors break-words">
                      {mod.name}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 italic">{mod.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 whitespace-nowrap">
                        📦 {mod.version}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 whitespace-nowrap">
                        📅 {mod.updatedAt}
                      </span>
                    </div>
                    <div className="flex items-center pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-500 truncate">
                        by <span className="text-slate-300">{mod.author}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-xs font-black tracking-widest border border-white/10 bg-white/5 text-slate-400 hover:border-white/30 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isNear = Math.abs(p - page) <= 2 || p === 1 || p === totalPages;
              if (!isNear) {
                if (p === page - 3 || p === page + 3) {
                  return <span key={p} className="text-slate-600 text-xs px-1">…</span>;
                }
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 rounded-xl text-xs font-black border transition-all ${
                    p === page
                      ? "bg-[#ce5a67] text-white border-[#ce5a67]"
                      : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-xs font-black tracking-widest border border-white/10 bg-white/5 text-slate-400 hover:border-white/30 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Tiếp →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
