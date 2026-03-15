"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { MODS } from "../data/mods";
import { FACES } from "../data/faces";
import FeaturedModCard from "./components/FeaturedModCard";
import FilterTags from "./components/FilterTags";
import SearchBar from "./components/SearchBar";
import ModCard from "./components/ModCard";
import Pagination from "./components/Pagination";

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

  const filtered = useMemo(() => {
    return activeTag === "Tất cả"
      ? ALL_MODS
      : ALL_MODS.filter((m) => m.tags.includes(activeTag));
  }, [activeTag]);

  const displayed = useMemo(() => {
    if (activeTag === "Faces" && search.trim()) {
      return filtered.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [activeTag, search, filtered]);

  const featured = ALL_MODS.find((m) => m.featured);
  const gridItems = activeTag === "Tất cả" ? displayed.filter((m) => !m.featured) : displayed;

  const totalPages = Math.ceil(gridItems.length / PAGE_SIZE);
  const paginated = gridItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Preload featured mod image and first page images
  useEffect(() => {
    if (featured?.thumbnail) {
      const img = new Image();
      img.src = featured.thumbnail;
    }

    // Preload first page images
    paginated.slice(0, 6).forEach((mod) => {
      if (mod.thumbnail) {
        const img = new Image();
        img.src = mod.thumbnail;
      }
    });
  }, [featured?.thumbnail, paginated]);

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

        {/* Featured mod — hiện ở mọi trang */}
        {featured && activeTag === "Tất cả" && (
          <FeaturedModCard mod={featured} />
        )}

        {/* Filter tags */}
        <FilterTags 
          activeTag={activeTag} 
          onTagChange={handleTagChange} 
          itemCount={gridItems.length} 
        />

        {/* Search bar — chỉ hiện khi tab Faces */}
        {activeTag === "Faces" && (
          <SearchBar 
            value={search} 
            onChange={(value) => { setSearch(value); setPage(1); }}
            onClear={() => { setSearch(""); setPage(1); }}
          />
        )}

        {/* Empty state */}
        {gridItems.length === 0 && (
          <p className="text-slate-600 text-sm py-10 text-center">
            {search ? `Không tìm thấy faces nào với từ khoá "${search}"` : "Chưa có mod nào trong danh mục này."}
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {paginated.map((mod) => (
            <ModCard key={mod.slug} mod={mod} />
          ))}
        </div>

        {/* Pagination */}
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
        />
      </div>
    </main>
  );
}
