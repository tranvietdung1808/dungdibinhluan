// =====================================================
// lib/players/params — parse/validate URL params cho catalog
// Dùng chung: /api/cau-thu, trang /cau-thu (SSR) và UI build URL.
// Blueprint §8: enum/số validate, page size 25 mặc định / 50 tối đa,
// giá & lương lọc theo EUR nguyên, min<=max.
// =====================================================

import { normalizeSearchName } from "./normalize.ts";
import {
  CATALOG_SORTS,
  DEFAULT_CATALOG_SORT,
  CATALOG_PAGE_SIZE_DEFAULT,
  CATALOG_PAGE_SIZE_MAX,
} from "./types.ts";
import type { CatalogListParams, CatalogSort } from "./types.ts";

/** Tên param canonical trên URL (ngắn, không lộ tên cột kỹ thuật). */
export const CATALOG_PARAM_KEYS = {
  search: "q",
  position: "vi-tri",
  team: "clb",
  league: "giai",
  nationality: "qt",
  gender: "gioi-tinh",
  minOverall: "ovr-min",
  maxOverall: "ovr-max",
  minPotential: "pot-min",
  maxPotential: "pot-max",
  minValue: "gia-min",
  maxValue: "gia-max",
  minWage: "luong-min",
  maxWage: "luong-max",
  sort: "sap-xep",
  page: "trang",
} as const;

const MAX_SEARCH_LEN = 60;
/** Loại wildcard PostgREST/ilike để input tìm kiếm không bẻ query */
const SEARCH_BAD_CHARS = /[%_*,()]/g;

function clampInt(raw: string | null, min: number, max: number): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

/** EUR nguyên — query gửi số, không gửi chuỗi "20 triệu" (§8) */
function moneyParam(raw: string | null): number | null {
  return clampInt(raw, 0, 2_000_000_000);
}

function textParam(raw: string | null, maxLen = 80): string | null {
  if (!raw) return null;
  const v = raw.trim().slice(0, maxLen);
  return v || null;
}

function positionParam(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
  return v || null;
}

function genderParam(raw: string | null): number | null {
  if (raw === "nam") return 0;
  if (raw === "nu") return 1;
  return null;
}

function sortParam(raw: string | null): CatalogSort {
  return (CATALOG_SORTS as readonly string[]).includes(raw ?? "")
    ? (raw as CatalogSort)
    : DEFAULT_CATALOG_SORT;
}

/**
 * Parse searchParams → CatalogListParams đã validate hoàn chỉnh.
 * `search` đã normalize về ASCII thường + strip wildcard — truyền thẳng
 * xuống ilike được. Giá trị không hợp lệ bị loại (coi như không truyền).
 */
export function parseCatalogParams(
  searchParams: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
): CatalogListParams {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) return searchParams.get(key);
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] ?? null : v ?? null;
  };

  const rawSearch = (get(CATALOG_PARAM_KEYS.search) ?? "")
    .slice(0, MAX_SEARCH_LEN)
    .replace(SEARCH_BAD_CHARS, "");
  const minOverall = clampInt(get(CATALOG_PARAM_KEYS.minOverall), 0, 99);
  const maxOverall = clampInt(get(CATALOG_PARAM_KEYS.maxOverall), 0, 99);
  const minPotential = clampInt(get(CATALOG_PARAM_KEYS.minPotential), 0, 99);
  const maxPotential = clampInt(get(CATALOG_PARAM_KEYS.maxPotential), 0, 99);
  const minValue = moneyParam(get(CATALOG_PARAM_KEYS.minValue));
  const maxValue = moneyParam(get(CATALOG_PARAM_KEYS.maxValue));
  const minWage = moneyParam(get(CATALOG_PARAM_KEYS.minWage));
  const maxWage = moneyParam(get(CATALOG_PARAM_KEYS.maxWage));

  return {
    search: normalizeSearchName(rawSearch),
    position: positionParam(get(CATALOG_PARAM_KEYS.position)),
    team: textParam(get(CATALOG_PARAM_KEYS.team)),
    league: textParam(get(CATALOG_PARAM_KEYS.league)),
    nationality: textParam(get(CATALOG_PARAM_KEYS.nationality)),
    gender: genderParam(get(CATALOG_PARAM_KEYS.gender)),
    // min>max → swap để filter vẫn có nghĩa thay vì trả rỗng khó hiểu
    minOverall:
      minOverall != null && maxOverall != null && minOverall > maxOverall
        ? maxOverall
        : minOverall,
    maxOverall:
      minOverall != null && maxOverall != null && minOverall > maxOverall
        ? minOverall
        : maxOverall,
    minPotential:
      minPotential != null && maxPotential != null && minPotential > maxPotential
        ? maxPotential
        : minPotential,
    maxPotential:
      minPotential != null && maxPotential != null && minPotential > maxPotential
        ? minPotential
        : maxPotential,
    minValue:
      minValue != null && maxValue != null && minValue > maxValue
        ? maxValue
        : minValue,
    maxValue:
      minValue != null && maxValue != null && minValue > maxValue
        ? minValue
        : maxValue,
    minWage:
      minWage != null && maxWage != null && minWage > maxWage
        ? maxWage
        : minWage,
    maxWage:
      minWage != null && maxWage != null && minWage > maxWage
        ? minWage
        : maxWage,
    sort: sortParam(get(CATALOG_PARAM_KEYS.sort)),
    page: Math.max(1, clampInt(get(CATALOG_PARAM_KEYS.page), 1, 100_000) ?? 1),
    limit: CATALOG_PAGE_SIZE_DEFAULT,
  };
}

export const CATALOG_LIMIT_MAX = CATALOG_PAGE_SIZE_MAX;
