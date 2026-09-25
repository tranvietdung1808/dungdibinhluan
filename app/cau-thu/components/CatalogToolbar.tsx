"use client";

import {
  useEffect,
  useState,
  useTransition,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Button, Dialog, Field, inputClass } from "@/app/components/ui";
import type { CatalogFilterOptions } from "@/lib/players/types";
import {
  ALL_PARAM_KEYS,
  PARAM,
  SORT_OPTIONS,
  setOrDelete,
} from "./catalogQuery";
import { CatalogPending } from "./CatalogStates";

// =====================================================
// CatalogToolbar — tìm tên + lọc nhanh + dialog lọc mở rộng + sắp xếp
// URL là source of truth: mọi thay đổi → router.replace (scroll:false),
// xóa `trang` để về trang 1; Back/Forward khôi phục (§8, §9.1–9.2).
// =====================================================

/** Các param do dialog bộ lọc mở rộng quản lý. */
const ADVANCED_KEYS: readonly string[] = [
  PARAM.league,
  PARAM.gender,
  PARAM.minOverall,
  PARAM.maxOverall,
  PARAM.minPotential,
  PARAM.maxPotential,
  PARAM.minValue,
  PARAM.maxValue,
  PARAM.minWage,
  PARAM.maxWage,
];

/** Đọc query MỚI NHẤT từ window.location (an toàn khi nav đang pending),
    áp thay đổi, xóa trang, replace vào history. */
function replaceCatalogQuery(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  startTransition: (cb: () => void) => void,
  mutate: (sp: URLSearchParams) => void
) {
  const sp = new URLSearchParams(window.location.search);
  mutate(sp);
  sp.delete(PARAM.page); // đổi filter/search/sort → về trang 1 (§8)
  const qs = sp.toString();
  startTransition(() => {
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  });
}

function ChevronDown() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/** Select gọn trong hàng toolbar — label qua aria-label. */
function ToolbarSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} appearance-none pr-9`}
      >
        {children}
      </select>
      <ChevronDown />
    </div>
  );
}

export function CatalogToolbar({
  filterOptions,
}: {
  filterOptions: CatalogFilterOptions;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/cau-thu";
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // --- Ô tìm tên: state cục bộ, đồng bộ ngược khi URL đổi (Back/Forward,
  //     Xóa bộ lọc). Reset trong render theo derived-state (pattern Navbar).
  const urlQ = searchParams.get(PARAM.search) ?? "";
  const [q, setQ] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (prevUrlQ !== urlQ) {
    setPrevUrlQ(urlQ);
    setQ(urlQ);
  }

  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  // Debounce 350ms: gõ tiếp hủy timeout cũ (không gửi request thừa);
  // replace mới tự động thay navigation đang chạy của router (§8).
  useEffect(() => {
    if (q === urlQ) return;
    const t = window.setTimeout(() => {
      replaceCatalogQuery(router, pathname, startTransition, (sp) =>
        setOrDelete(sp, PARAM.search, q.trim() || null)
      );
    }, 350);
    return () => window.clearTimeout(t);
  }, [q, urlQ, router, pathname]);

  const updateParam = (key: string, value: string) => {
    replaceCatalogQuery(router, pathname, startTransition, (sp) => {
      // Giữ từ khóa đang gõ khi URL chưa kịp commit nav tìm kiếm —
      // window.location chỉ phản ánh URL đã commit (§8: không để
      // request chậm ghi đè lựa chọn mới).
      setOrDelete(sp, PARAM.search, q.trim() || null);
      setOrDelete(sp, key, value || null);
    });
  };

  // --- Dialog bộ lọc mở rộng: draft khởi tạo từ URL lúc mở,
  //     "Áp dụng" ghi một lượt, "Xóa bộ lọc" dọn toàn bộ param catalog.
  const openFilters = () => {
    const next: Record<string, string> = {};
    for (const k of ADVANCED_KEYS) next[k] = searchParams.get(k) ?? "";
    setDraft(next);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    replaceCatalogQuery(router, pathname, startTransition, (sp) => {
      setOrDelete(sp, PARAM.search, q.trim() || null);
      for (const k of ADVANCED_KEYS) {
        const raw = (draft[k] ?? "").trim();
        setOrDelete(sp, k, raw === "" ? null : raw);
      }
    });
    setFilterOpen(false);
  };

  const clearFilters = () => {
    replaceCatalogQuery(router, pathname, startTransition, (sp) => {
      for (const k of ALL_PARAM_KEYS) sp.delete(k);
    });
    setFilterOpen(false);
  };

  const setDraftField = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  /** Input số nguyên (EUR / OVR / POT) — chặn ký tự không phải số ngay khi gõ. */
  const numberField = (key: string) => ({
    value: draft[key] ?? "",
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      setDraftField(key, e.target.value.replace(/[^\d]/g, "")),
  });

  const activeAdvanced = ADVANCED_KEYS.filter((k) => searchParams.get(k)).length;

  // URL tay gõ sort lạ → hiển thị mặc định (server đã sanitize tương tự)
  const rawSort = searchParams.get(PARAM.sort) ?? "overall";
  const sortValue = SORT_OPTIONS.some((o) => o.value === rawSort)
    ? rawSort
    : "overall";

  return (
    <div className="mt-8 space-y-3">
      {/* Tìm tên — toàn chiều ngang */}
      <div>
        <label htmlFor="player-search" className="sr-only">
          Tìm tên cầu thủ
        </label>
        <input
          id="player-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm tên cầu thủ…"
          maxLength={60}
          autoComplete="off"
          spellCheck={false}
          className={inputClass}
        />
      </div>

      {/* Lọc nhanh + Bộ lọc + Sắp xếp */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <ToolbarSelect
          label="Vị trí"
          value={searchParams.get(PARAM.position) ?? ""}
          onChange={(v) => updateParam(PARAM.position, v)}
        >
          <option value="">Tất cả vị trí</option>
          {filterOptions.positions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </ToolbarSelect>

        <ToolbarSelect
          label="CLB"
          value={searchParams.get(PARAM.team) ?? ""}
          onChange={(v) => updateParam(PARAM.team, v)}
        >
          <option value="">Tất cả CLB</option>
          {filterOptions.teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </ToolbarSelect>

        <ToolbarSelect
          label="Quốc tịch"
          value={searchParams.get(PARAM.nationality) ?? ""}
          onChange={(v) => updateParam(PARAM.nationality, v)}
        >
          <option value="">Tất cả quốc tịch</option>
          {filterOptions.nationalities.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </ToolbarSelect>

        <Button
          variant="secondary"
          size="md"
          onClick={openFilters}
          aria-haspopup="dialog"
          className="w-full"
        >
          Bộ lọc{activeAdvanced > 0 ? ` (${activeAdvanced})` : ""}
        </Button>

        <ToolbarSelect
          label="Sắp xếp"
          value={sortValue}
          onChange={(v) => updateParam(PARAM.sort, v)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </ToolbarSelect>
      </div>

      {isPending && <CatalogPending />}

      {/* Dialog bộ lọc mở rộng — focus trap + trả focus sẵn trong primitive */}
      <Dialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        label="Bộ lọc cầu thủ"
      >
        <h2 className="text-h3 text-[var(--color-title)]">Bộ lọc</h2>

        <div className="mt-5 space-y-4">
          <Field label="Giải đấu">
            {({ id }) => (
              <div className="relative">
                <select
                  id={id}
                  value={draft[PARAM.league] ?? ""}
                  onChange={(e) => setDraftField(PARAM.league, e.target.value)}
                  className={`${inputClass} appearance-none pr-9`}
                >
                  <option value="">Tất cả giải đấu</option>
                  {filterOptions.leagues.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            )}
          </Field>

          {filterOptions.hasMixedGender && (
            <Field label="Giới tính">
              {({ id }) => (
                <div className="relative">
                  <select
                    id={id}
                    value={draft[PARAM.gender] ?? ""}
                    onChange={(e) =>
                      setDraftField(PARAM.gender, e.target.value)
                    }
                    className={`${inputClass} appearance-none pr-9`}
                  >
                    <option value="">Tất cả</option>
                    <option value="nam">Nam</option>
                    <option value="nu">Nữ</option>
                  </select>
                  <ChevronDown />
                </div>
              )}
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tổng quát từ">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="0"
                  className={inputClass}
                  {...numberField(PARAM.minOverall)}
                />
              )}
            </Field>
            <Field label="Tổng quát đến">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="99"
                  className={inputClass}
                  {...numberField(PARAM.maxOverall)}
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tiềm năng từ">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="0"
                  className={inputClass}
                  {...numberField(PARAM.minPotential)}
                />
              )}
            </Field>
            <Field label="Tiềm năng đến">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="99"
                  className={inputClass}
                  {...numberField(PARAM.maxPotential)}
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá từ (EUR)">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                  className={inputClass}
                  {...numberField(PARAM.minValue)}
                />
              )}
            </Field>
            <Field label="Giá đến (EUR)">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="1000000"
                  className={inputClass}
                  {...numberField(PARAM.maxValue)}
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Lương từ (EUR/tuần)">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                  className={inputClass}
                  {...numberField(PARAM.minWage)}
                />
              )}
            </Field>
            <Field label="Lương đến (EUR/tuần)">
              {({ id }) => (
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="50000"
                  className={inputClass}
                  {...numberField(PARAM.maxWage)}
                />
              )}
            </Field>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button variant="ghost" size="md" onClick={clearFilters}>
            Xóa bộ lọc
          </Button>
          <Button variant="primary" size="md" onClick={applyFilters}>
            Áp dụng
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
