"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { MODS } from "../data/mods";
import { FACES } from "../data/faces";
import {
  buildCatalog,
  buildSearchText,
  compareViName,
  normalizeVi,
  DEFAULT_SORT,
  DEFAULT_TAG,
  MOD_FILTER_TAGS,
  type DbModRecord,
  type ModSortKey,
  type ModSummary,
  type StaticModInput,
} from "@/lib/catalog";
import {
  Badge,
  Breadcrumb,
  Container,
  EmptyState,
  InlineNotice,
} from "@/app/components/ui";
import FeaturedModCard from "./components/FeaturedModCard";
import FilterTags from "./components/FilterTags";
import SearchBar from "./components/SearchBar";
import ModCard from "./components/ModCard";
import Pagination from "./components/Pagination";
import CommunityComments from "../components/CommunityComments";

// Nguồn static gốc — dedupe/merge với DB qua buildCatalog (B02)
const STATIC_MODS: StaticModInput[] = [...MODS, ...FACES];

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 280;
const EMPTY_SET: ReadonlySet<string> = new Set();

// -----------------------------------------------------
// URL state — /mods?q=messi&tag=Faces&sort=updated&page=2
// (T02: reload/back khôi phục đúng từ URL)
// -----------------------------------------------------

function parsePageParam(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** tag param khớp taxonomy theo không dấu (tag=faces vẫn ra Faces) */
function parseTagParam(raw: string | null): string {
  if (!raw) return DEFAULT_TAG;
  const needle = normalizeVi(raw);
  return (
    MOD_FILTER_TAGS.find((tag) => normalizeVi(tag) === needle) ?? DEFAULT_TAG
  );
}

function parseSortParam(raw: string | null): ModSortKey {
  return raw === "name" ? "name" : DEFAULT_SORT;
}

function buildModsQuery(state: {
  q: string;
  tag: string;
  sort: ModSortKey;
  page: number;
}): string {
  const params = new URLSearchParams();
  const q = state.q.trim();
  if (q) params.set("q", q);
  if (state.tag !== DEFAULT_TAG) params.set("tag", state.tag);
  if (state.sort !== DEFAULT_SORT) params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// -----------------------------------------------------
// Dữ liệu — catalog dedupe theo slug (DB ưu tiên, static fallback)
// -----------------------------------------------------

function useCatalogData(initialDbMods: DbModRecord[]) {
  const [dbMods, setDbMods] = useState<DbModRecord[]>(initialDbMods);
  const [loading, setLoading] = useState(initialDbMods.length === 0);
  const [dbError, setDbError] = useState(false);

  // Server đã render sẵn (initialDbMods) → chỉ gọi API khi SSR trống (fallback),
  // tránh 1 vòng request + truy vấn DB trùng mỗi lần tải trang.
  const fetchMods = useCallback(async () => {
    setDbError(false);
    try {
      const response = await fetch("/api/mods");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as unknown;
      setDbMods(Array.isArray(data) ? (data as DbModRecord[]) : []);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialDbMods.length === 0) void fetchMods();
  }, [fetchMods, initialDbMods.length]);

  const catalog = useMemo(
    () => buildCatalog(STATIC_MODS, dbMods),
    [dbMods],
  );

  // Haystack normalizeVi tính 1 lần / slug — search toàn kho (B01)
  const searchIndex = useMemo(
    () => new Map(catalog.map((m) => [m.slug, buildSearchText(m)])),
    [catalog],
  );

  return { catalog, searchIndex, loading, dbError, retryDb: fetchMods };
}

/**
 * Ownership riêng theo user — không trộn vào public payload (§20.2):
 * fetch best-effort /api/account khi có session để hiển thị "Đã mở".
 */
function useOwnedSlugs(): ReadonlySet<string> {
  const [ownedSlugs, setOwnedSlugs] = useState<ReadonlySet<string>>(EMPTY_SET);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token || cancelled) return;
        const res = await fetch("/api/account", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          mods_unlocked?: { mod?: { slug?: string } | null }[];
        };
        const slugs = new Set<string>();
        for (const row of data?.mods_unlocked ?? []) {
          const slug = row?.mod?.slug;
          if (typeof slug === "string" && slug) slugs.add(slug);
        }
        if (!cancelled) setOwnedSlugs(slugs);
      } catch {
        /* best-effort: guest/mạng lỗi → chỉ hiển thị giá */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return ownedSlugs;
}

// -----------------------------------------------------
// View — markup dùng chung cho live state lẫn Suspense fallback
// -----------------------------------------------------

type CatalogViewProps = {
  searchInput: string;
  activeTag: string;
  sort: ModSortKey;
  qParam: string;
  totalItems: number;
  rangeStart: number;
  rangeEnd: number;
  featured: ModSummary | null;
  showFeatured: boolean;
  ownedSlugs: ReadonlySet<string>;
  items: ModSummary[];
  page: number;
  totalPages: number;
  dbError: boolean;
  commentsOpen: boolean;
  resultsRef?: RefObject<HTMLHeadingElement | null>;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onTagChange: (tag: string) => void;
  onSortChange: (sort: ModSortKey) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onRetryDb: () => void;
  onCommentsToggle: (open: boolean) => void;
};

function CatalogView({
  searchInput,
  activeTag,
  sort,
  qParam,
  totalItems,
  rangeStart,
  rangeEnd,
  featured,
  showFeatured,
  ownedSlugs,
  items,
  page,
  totalPages,
  dbError,
  commentsOpen,
  resultsRef,
  onSearchChange,
  onSearchClear,
  onTagChange,
  onSortChange,
  onPageChange,
  onClearFilters,
  onRetryDb,
  onCommentsToggle,
}: CatalogViewProps) {
  const hasActiveFilter = Boolean(qParam.trim()) || activeTag !== DEFAULT_TAG;

  return (
    <section className="relative">
      <Container wide className="py-6 md:py-10">
        <Breadcrumb
          items={[{ label: "Trang chủ", href: "/" }, { label: "Kho mod" }]}
          className="mb-4"
        />

        {/* Header: H1 + mô tả 1 dòng + search toàn kho (§9.1) */}
        <header className="mb-6 max-w-3xl md:mb-8">
          <h1 className="text-h1 text-[var(--color-title)]">Kho mod</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted)]">
            Faces, kits, gameplay và đồ họa cho FC 26 — tìm nhanh theo tên mod,
            cầu thủ hoặc tác giả.
          </p>
          <div className="mt-4 md:mt-5">
            <SearchBar
              value={searchInput}
              onChange={onSearchChange}
              onClear={onSearchClear}
            />
          </div>
        </header>

        {/* DB lỗi nhưng static còn → vẫn hiển thị + notice + retry (§9.4) */}
        {dbError && (
          <InlineNotice
            tone="warning"
            title="Một số mod mới chưa tải được"
            className="mb-6"
          >
            Danh sách có thể chưa đầy đủ.{" "}
            <button
              type="button"
              onClick={onRetryDb}
              className="font-semibold text-[var(--color-title)] underline underline-offset-2 hover:text-[var(--color-accent-strong)]"
            >
              Thử lại
            </button>
          </InlineNotice>
        )}

        {/* Featured — khối gợi ý sau công cụ tìm, không lặp slug trong grid */}
        {showFeatured && featured && (
          <section aria-label="Mod nổi bật" className="mb-8 md:mb-10">
            <div className="max-w-[1180px]">
              <FeaturedModCard mod={featured} owned={ownedSlugs.has(featured.slug)} />
            </div>
          </section>
        )}

        {/* Filter + sort */}
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <FilterTags activeTag={activeTag} onTagChange={onTagChange} />
          <div className="flex shrink-0 items-center gap-2">
            <label
              htmlFor="mods-sort"
              className="text-sm text-[var(--color-muted)]"
            >
              Sắp xếp
            </label>
            <select
              id="mods-sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as ModSortKey)}
              className="h-9 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-title)] transition-colors focus:border-[var(--color-accent-border)] focus:outline-none"
            >
              <option value="updated">Mới cập nhật</option>
              <option value="name">Tên A–Z</option>
            </select>
          </div>
        </div>

        {/* Bộ lọc đang chọn */}
        {hasActiveFilter && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--color-muted)]">
              Bộ lọc đang chọn:
            </span>
            {activeTag !== DEFAULT_TAG && (
              <Badge tone="accent">{activeTag}</Badge>
            )}
            {qParam.trim() && <Badge tone="accent">“{qParam.trim()}”</Badge>}
            <button
              type="button"
              onClick={onClearFilters}
              className="text-sm font-medium text-[var(--color-accent-strong)] underline underline-offset-2 hover:text-[var(--color-accent)]"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Heading kết quả — focus target khi đổi trang (§9.4) */}
        <h2
          ref={resultsRef}
          tabIndex={-1}
          aria-live="polite"
          className="mb-4 scroll-mt-24 text-sm text-[var(--color-muted)] outline-none"
        >
          <span className="sr-only">Kết quả: </span>
          {totalItems > 0
            ? `Đang hiển thị ${rangeStart}–${rangeEnd} / ${totalItems} mod`
            : "Không có mod nào khớp bộ lọc"}
        </h2>

        {items.length > 0 ? (
          <>
            <ul className="mb-8 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((mod) => (
                <li key={mod.slug} className="min-w-0">
                  <ModCard mod={mod} owned={ownedSlugs.has(mod.slug)} />
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}
          </>
        ) : (
          <EmptyState
            title={
              qParam.trim()
                ? `Không tìm thấy mod nào cho “${qParam.trim()}”`
                : `Chưa có mod nào trong “${activeTag}”`
            }
            description="Thử từ khóa khác, hoặc xóa bộ lọc để xem toàn bộ kho mod."
            action="Xóa bộ lọc"
            onAction={onClearFilters}
          />
        )}

        {/* Bình luận cộng đồng — section ít nổi bật hơn, mở mới tải (§15.3) */}
        <details
          className="group mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)]"
          onToggle={(e) => onCommentsToggle(e.currentTarget.open)}
        >
          <summary className="flex cursor-pointer select-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-[var(--color-title)] [&::-webkit-details-marker]:hidden">
            <span>Thảo luận cộng đồng</span>
            <svg
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform duration-200 group-open:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          {commentsOpen && (
            <div className="border-t border-[var(--color-line)] px-4 py-5 md:px-5">
              <CommunityComments
                scopeType="mods"
                scopeId="global"
                title="Chia sẻ mod chung"
                emptyText="Chưa có chia sẻ nào từ cộng đồng."
              />
            </div>
          )}
        </details>
      </Container>
    </section>
  );
}

// -----------------------------------------------------
// Fallback — render sẵn view mặc định trong HTML tĩnh
// (Suspense fallback cho useSearchParams): giữ nội dung
// catalog trong HTML thay vì màn trống.
// -----------------------------------------------------

function CatalogFallback({ dbMods }: { dbMods: DbModRecord[] }) {
  const { catalog, dbError } = useCatalogData(dbMods);
  const sorted = [...catalog].sort(
    (a, b) => b.updatedAtTs - a.updatedAtTs || compareViName(a.name, b.name),
  );
  // Cùng thứ tự find với ModsCatalog (catalog order) — tránh fallback/live lệch
  const featured = catalog.find((m) => m.featured) ?? null;
  const gridItems = featured
    ? sorted.filter((m) => m.slug !== featured.slug)
    : sorted;
  const total = gridItems.length;
  const noop = () => {};

  return (
    <CatalogView
      searchInput=""
      activeTag={DEFAULT_TAG}
      sort={DEFAULT_SORT}
      qParam=""
      totalItems={total}
      rangeStart={total > 0 ? 1 : 0}
      rangeEnd={Math.min(PAGE_SIZE, total)}
      featured={featured}
      showFeatured={Boolean(featured)}
      ownedSlugs={EMPTY_SET}
      items={gridItems.slice(0, PAGE_SIZE)}
      page={1}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      dbError={dbError}
      commentsOpen={false}
      onSearchChange={noop}
      onSearchClear={noop}
      onTagChange={noop}
      onSortChange={noop}
      onPageChange={noop}
      onClearFilters={noop}
      onRetryDb={noop}
      onCommentsToggle={noop}
    />
  );
}

// -----------------------------------------------------
// ModsCatalog — state từ URL (useSearchParams = source of truth)
// -----------------------------------------------------

function ModsCatalog({ initialDbMods }: { initialDbMods: DbModRecord[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL → state (đọc mỗi render → back/forward tự khôi phục)
  const qParam = searchParams.get("q") ?? "";
  const activeTag = parseTagParam(searchParams.get("tag"));
  const sort = parseSortParam(searchParams.get("sort"));
  const pageParam = parsePageParam(searchParams.get("page"));

  const { catalog, searchIndex, loading, dbError, retryDb } =
    useCatalogData(initialDbMods);
  const ownedSlugs = useOwnedSlugs();

  // Input gõ tức thì (local), URL cập nhật sau debounce
  const [searchInput, setSearchInput] = useState(qParam);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const resultsRef = useRef<HTMLHeadingElement>(null);
  const focusResultsPending = useRef(false);
  const debounceRef = useRef<number | undefined>(undefined);
  // Params mới nhất cho callback debounce (tránh closure cũ ghi đè tag/sort mới)
  const latestParams = useRef({ tag: activeTag, sort });
  useEffect(() => {
    latestParams.current = { tag: activeTag, sort };
  }, [activeTag, sort]);

  // q trên URL đổi → đồng bộ input — "adjust state during render"
  // (react.dev/learn/you-might-not-need-an-effect). So sánh normalizeVi
  // để debounce-write của chính mình (URL canonical đã trim) không xóa
  // dấu cách/khác biệt nhỏ user đang gõ dở.
  const [prevQParam, setPrevQParam] = useState(qParam);
  if (qParam !== prevQParam) {
    setPrevQParam(qParam);
    if (normalizeVi(qParam) !== normalizeVi(searchInput)) {
      setSearchInput(qParam);
    }
  }

  const navigate = useCallback(
    (
      next: { q?: string; tag?: string; sort?: ModSortKey; page?: number },
      mode: "push" | "replace",
    ) => {
      const url =
        pathname +
        buildModsQuery({
          q: next.q ?? qParam,
          tag: next.tag ?? activeTag,
          sort: next.sort ?? sort,
          page: next.page ?? pageParam,
        });
      // scroll:false — tự quản focus về heading kết quả, không cuộn đỉnh trang
      (mode === "push" ? router.push : router.replace)(url, {
        scroll: false,
      });
    },
    [pathname, router, qParam, activeTag, sort, pageParam],
  );

  useEffect(() => {
    const debounce = debounceRef;
    return () => window.clearTimeout(debounce.current);
  }, []);

  // --- Derived data: dedupe → filter → sort → paginate (thứ tự §9.4) ---

  const filtered = useMemo(() => {
    const needle = normalizeVi(qParam);
    return catalog.filter((mod) => {
      if (
        activeTag !== DEFAULT_TAG &&
        !mod.tags.includes(activeTag) &&
        mod.category !== activeTag
      ) {
        return false;
      }
      if (needle && !searchIndex.get(mod.slug)?.includes(needle)) return false;
      return true;
    });
  }, [catalog, activeTag, qParam, searchIndex]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    if (sort === "name") {
      items.sort(
        (a, b) =>
          compareViName(a.name, b.name) || a.slug.localeCompare(b.slug),
      );
    } else {
      items.sort(
        (a, b) =>
          b.updatedAtTs - a.updatedAtTs || compareViName(a.name, b.name),
      );
    }
    return items;
  }, [filtered, sort]);

  // Featured: khối gợi ý ở view mặc định (trang 1, không search/filter).
  // Quy ước count (§9.4): "N mod" đếm item trong grid — ở view mặc định
  // slug featured được rút khỏi grid để không lặp; khi đang lọc/tìm thì
  // mod đó tham gia grid bình thường.
  const isDefaultView = activeTag === DEFAULT_TAG && !qParam.trim();
  const featured = useMemo(
    () => catalog.find((m) => m.featured) ?? null,
    [catalog],
  );
  const gridItems = useMemo(() => {
    if (isDefaultView && featured) {
      return sorted.filter((m) => m.slug !== featured.slug);
    }
    return sorted;
  }, [sorted, isDefaultView, featured]);

  const totalItems = gridItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const page = Math.min(pageParam, totalPages);
  const showFeatured = isDefaultView && page === 1 && Boolean(featured);
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalItems);
  const paginated = gridItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // URL page vượt quá tổng trang → sửa về trang cuối hợp lệ (T02).
  // Chờ DB fetch xong để không clamp sai khi catalog còn thiếu DB mods.
  useEffect(() => {
    if (loading) return;
    if (pageParam > totalPages) {
      navigate({ page: totalPages }, "replace");
    }
  }, [loading, pageParam, totalPages, navigate]);

  // Sau khi đổi trang → focus heading kết quả, không cuộn đỉnh site (§9.4)
  useEffect(() => {
    if (!focusResultsPending.current) return;
    focusResultsPending.current = false;
    const el = resultsRef.current;
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "start" });
    }
  });

  // --- Handlers: gõ tìm → replace, đổi trang/tag/sort → push ---

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      navigate(
        {
          q: value,
          tag: latestParams.current.tag,
          sort: latestParams.current.sort,
          page: 1,
        },
        "replace",
      );
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSearchClear = () => {
    window.clearTimeout(debounceRef.current);
    setSearchInput("");
    navigate({ q: "", page: 1 }, "replace");
  };

  // Tag/sort/page giữ nguyên keyword đang gõ — flush input vào cùng URL
  // thay vì chỉ hủy timer (mất chữ) hoặc để timer cũ ghi đè (reset trang).
  const flushSearch = () => {
    window.clearTimeout(debounceRef.current);
    return searchInput;
  };

  const handleTagChange = (tag: string) => {
    const q = flushSearch();
    navigate({ q, tag, page: 1 }, "push");
  };

  const handleSortChange = (nextSort: ModSortKey) => {
    const q = flushSearch();
    navigate({ q, sort: nextSort, page: 1 }, "push");
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;
    const q = flushSearch();
    focusResultsPending.current = true;
    navigate({ q, page: nextPage }, "push");
  };

  const handleClearFilters = () => {
    window.clearTimeout(debounceRef.current);
    setSearchInput("");
    navigate({ q: "", tag: DEFAULT_TAG, page: 1 }, "replace");
  };

  return (
    <CatalogView
      searchInput={searchInput}
      activeTag={activeTag}
      sort={sort}
      qParam={qParam}
      totalItems={totalItems}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      featured={featured}
      showFeatured={showFeatured}
      ownedSlugs={ownedSlugs}
      items={paginated}
      page={page}
      totalPages={totalPages}
      dbError={dbError}
      commentsOpen={commentsOpen}
      resultsRef={resultsRef}
      onSearchChange={handleSearchChange}
      onSearchClear={handleSearchClear}
      onTagChange={handleTagChange}
      onSortChange={handleSortChange}
      onPageChange={handlePageChange}
      onClearFilters={handleClearFilters}
      onRetryDb={() => void retryDb()}
      onCommentsToggle={setCommentsOpen}
    />
  );
}

export default function ModsClient({
  initialDbMods = [],
}: {
  initialDbMods?: DbModRecord[];
}) {
  return (
    <Suspense fallback={<CatalogFallback dbMods={initialDbMods} />}>
      <ModsCatalog initialDbMods={initialDbMods} />
    </Suspense>
  );
}
