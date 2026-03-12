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

// Gộp lại: mới nhất lên đầu theo từng mảng
const ALL_MODS = [...[...FACES].reverse(), ...[...MODS].reverse()];

export default function ModsPage() {
  const [activeTag, setActiveTag] = useState("Tất cả");
  const [search, setSearch] = useState("");

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
  const rest = displayed.filter((m) => !m.featured);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-4 md:px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">
          ← Trang chủ
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm font-bold tracking-widest uppercase text-white">Mod Hub</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10">

        {/* Page title */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            🎮 MOD <span className="text-[#ce5a67]">HUB</span>
          </h1>
          <p className="text-slate-500 text-sm">Các bản mod chất lượng cao được tuyển chọn bởi DungDiBinhLuan</p>
        </div>

        {/* Featured mod */}
        {featured && activeTag === "Tất cả" && (
          <Link href={`/mods/${featured.slug}`}>
            <div className="group relative rounded-3xl overflow-hidden border border-white/10 hover:border-[#ce5a67]/40 transition-all cursor-pointer">
              <div className="relative h-56 md:h-80">
                <Image
                  src={featured.thumbnail}
                  alt={featured.name}
                  fill
                  className="object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
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
              onClick={() => {
                setActiveTag(tag);
                setSearch("");
              }}
              className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-widest transition-all border ${
                activeTag === tag
                  ? "bg-[#ce5a67] text-white border-[#ce5a67]"
                  : "bg-white/5 text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {tag.toUpperCase()}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-600">{displayed.length} mod</span>
        </div>

        {/* Search bar — chỉ hiện khi tab Faces */}
        {activeTag === "Faces" && (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm faces... (tên cầu thủ, mô tả)"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {displayed.length === 0 && (
          <p className="text-slate-600 text-sm py-10 text-center">
            {search ? `Không tìm thấy faces nào với từ khoá "${search}"` : "Chưa có mod nào trong danh mục này."}
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {(activeTag === "Tất cả" ? rest : displayed).map((mod) => {
            const isPortrait = mod.thumbnailOrientation === "portrait";
            return (
              <Link key={mod.slug} href={`/mods/${mod.slug}`}>
                <div
                  className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#ce5a67]/40 transition-all bg-[#111] cursor-pointer ${
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
                    <div className={`absolute inset-0 ${isPortrait ? "bg-gradient-to-r from-transparent via-transparent to-[#111]" : "bg-gradient-to-t from-[#111] via-[#111]/20 to-transparent"}`} />
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
      </div>
    </main>
  );
}
