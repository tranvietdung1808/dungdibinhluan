"use client";
import { useState, useMemo, useEffect } from "react";
import { MODS } from "../data/mods";
import { FACES } from "../data/faces";
import FeaturedModCard from "./components/FeaturedModCard";
import FilterTags from "./components/FilterTags";
import SearchBar from "./components/SearchBar";
import ModCard from "./components/ModCard";
import Pagination from "./components/Pagination";

interface Mod {
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

const parseDate = (str: string) => {
  const [day, month, year] = str.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
};

const SOURCE = [...MODS, ...FACES];
const ALL_STATIC_MODS = [...SOURCE].sort((a, b) => {
  const dateDiff = parseDate(b.updatedAt) - parseDate(a.updatedAt);
  if (dateDiff !== 0) return dateDiff;
  return SOURCE.indexOf(b) - SOURCE.indexOf(a);
});

const PAGE_SIZE = 12;

interface ModsPageProps {
  initialDbMods?: Mod[];
}

export default function ModsPage({ initialDbMods = [] }: ModsPageProps) {
  const [activeTag, setActiveTag] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dbMods, setDbMods] = useState<Mod[]>(initialDbMods);
  const [loading, setLoading] = useState(initialDbMods.length === 0);

  // Fetch mods from database
  useEffect(() => {
    fetchMods();
  }, []);

  const fetchMods = async () => {
    try {
      const response = await fetch('/api/mods');
      if (response.ok) {
        const data = await response.json();
        setDbMods(data || []);
      }
    } catch (error) {
      console.error('Error fetching mods:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert DB mods to static format
  const convertedDbMods = useMemo(() => {
    return dbMods.map(mod => ({
      slug: mod.slug,
      name: mod.name,
      author: mod.author,
      category: mod.category,
      version: mod.version,
      updatedAt: mod.updated_at,
      description: mod.description || '',
      longDescription: mod.long_description || '',
      thumbnail: mod.thumbnail || '',
      downloadUrl: mod.download_url || '',
      tags: mod.tags,
      thumbnailOrientation: mod.thumbnail_orientation as 'portrait' | 'landscape',
      featured: mod.featured,
      videoId: mod.video_id || undefined,
    }));
  }, [dbMods]);

  // Combine static and database mods
  const ALL_MODS = useMemo(() => {
    return [...ALL_STATIC_MODS, ...convertedDbMods].sort((a, b) => {
      const dateDiff = parseDate(b.updatedAt) - parseDate(a.updatedAt);
      if (dateDiff !== 0) return dateDiff;
      return 0;
    });
  }, [convertedDbMods]);

  const filtered = useMemo(() => {
    return activeTag === "Tất cả"
      ? ALL_MODS
      : ALL_MODS.filter((m) => m.tags.includes(activeTag));
  }, [activeTag, ALL_MODS]);

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
  const gridItems = activeTag === "Tất cả" ? displayed.filter((m) => m.slug !== featured?.slug) : displayed;

  const totalPages = Math.ceil(gridItems.length / PAGE_SIZE);
  const paginated = gridItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Preload featured mod image and first page images
  useEffect(() => {
    if (featured?.thumbnail) {
      const img = new Image();
      img.src = featured.thumbnail;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ce5a67] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* Featured Mod - centered and compact */}
      {featured && activeTag === "Tất cả" && (
        <section className="mb-10">
          <div className="max-w-4xl mx-auto">
            <FeaturedModCard mod={featured} />
          </div>
        </section>
      )}

      {/* Search and Filter */}
      <div className="mb-8 space-y-6">
        {activeTag === "Faces" && (
          <SearchBar
            value={search}
            onChange={(value) => { setSearch(value); setPage(1); }}
            onClear={() => { setSearch(""); setPage(1); }}
          />
        )}
        <FilterTags
          activeTag={activeTag}
          onTagChange={handleTagChange}
          itemCount={gridItems.length}
        />
      </div>

      {/* Results Count */}
      <div className="mb-6 text-slate-400">
        {activeTag === "Tất cả" ? (
          <span>Tất cả mods ({ALL_MODS.length})</span>
        ) : (
          <span>
            {activeTag} ({displayed.length})
            {activeTag === "Faces" && search.trim() && (
              <span className="ml-2">cho &quot;{search}&quot;</span>
            )}
          </span>
        )}
      </div>

      {/* Grid */}
      {paginated.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {paginated.map((mod) => (
              <ModCard key={mod.slug} mod={mod} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {search.trim()
              ? `Không tìm thấy mod nào cho "${search}"`
              : `Không có mod nào trong danh mục ${activeTag}`}
          </p>
        </div>
      )}
    </>
  );
}
