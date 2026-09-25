// =====================================================
// lib/server/players — repository catalog cầu thủ (server-only)
// Blueprint §8: đọc từ bản ACTIVE duy nhất, ghim release trong một lượt
// đọc/count/options; giá lọc/sort theo reference_value_eur (sau điều
// chỉnh); lương theo weekly_wage_eur; null luôn ở cuối khi sort.
//
// CONTRACT — chữ ký hàm đã chốt cho page/API dùng chung.
// =====================================================

import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { calcAgeAt, gameVersionLabel } from "@/lib/players/format";
import type {
  CatalogFilterOptions,
  CatalogListParams,
  CatalogListResult,
  CatalogSort,
  PlayerCatalogEntryRow,
  PlayerDetailDto,
  PlayerListDto,
} from "@/lib/players/types";

/** Bản dữ liệu đang công bố — null khi chưa có import nào được duyệt. */
export interface ActiveCatalogRelease {
  id: string;
  game_version: string;
  data_date: string | null;
  record_count: number;
  activated_at: string | null;
}

const DEFAULT_QUERY_TIMEOUT_MS = 8_000;
export { DEFAULT_QUERY_TIMEOUT_MS as PLAYER_QUERY_TIMEOUT_MS };

/** Cột DTO danh sách — KHÔNG select stats/provenance nặng cho list. */
export const PLAYER_LIST_COLUMNS =
  "slug,display_name,position_short,team_name,nationality_name,overall_rating,potential,reference_value_eur,weekly_wage_eur,avatar_url" as const;

/**
 * Tag cache chung của module. Importer là script .mjs chạy NGOÀI Next nên
 * không gọi được revalidateTag — đây là lý do TTL đọc giữ ngắn (60s cho
 * release, 1h cho filter options): sau khi kích hoạt bản mới, tầng cache
 * tự hết hạn thay vì chờ invalidate chủ động. Cố ý KHÔNG export helper
 * revalidatePlayerCatalog() vì không có caller nào trong process Next.
 */
const PLAYER_CATALOG_CACHE_TAG = "player-catalog";

// ---------- Release đang active ----------

/**
 * Query thật tới DB. Throw khi lỗi để unstable_cache KHÔNG ghi lỗi thành
 * "không có bản" (§8 — lỗi không được cache thành trạng thái rỗng).
 */
async function fetchActiveCatalogRelease(): Promise<ActiveCatalogRelease | null> {
  const { data, error } = await supabaseAdmin
    .from("player_catalog_releases")
    .select("id,game_version,data_date,record_count,activated_at")
    .eq("status", "active")
    .order("activated_at", { ascending: false })
    .limit(1)
    .abortSignal(AbortSignal.timeout(DEFAULT_QUERY_TIMEOUT_MS))
    .maybeSingle();

  if (error) throw error;
  return (data as ActiveCatalogRelease | null) ?? null;
}

const getCachedActiveRelease = unstable_cache(
  fetchActiveCatalogRelease,
  ["player-catalog-active-release"],
  { tags: [PLAYER_CATALOG_CACHE_TAG], revalidate: 60 }
);

/**
 * Release đang active (mỗi game_version tối đa 1 bản — partial unique index).
 * Lỗi DB nuốt về null sau khi log: caller coi như "chưa có bản" và trả
 * trạng thái rỗng thay vì 500 cho một lỗi tạm thời.
 */
export async function getActiveCatalogRelease(): Promise<ActiveCatalogRelease | null> {
  try {
    return await getCachedActiveRelease();
  } catch (error) {
    console.error("getActiveCatalogRelease:", error);
    return null;
  }
}

// ---------- Mapping Row -> DTO ----------

/** Row → DTO danh sách (map 1:1, không thêm trường nội bộ). */
export function toPlayerListDto(row: PlayerCatalogEntryRow): PlayerListDto {
  return {
    slug: row.slug,
    display_name: row.display_name,
    position_short: row.position_short,
    team_name: row.team_name,
    nationality_name: row.nationality_name,
    overall_rating: row.overall_rating,
    potential: row.potential,
    reference_value_eur: row.reference_value_eur,
    weekly_wage_eur: row.weekly_wage_eur,
    avatar_url: row.avatar_url,
  };
}

/** Row + release → DTO chi tiết (DTO public — không base_value_eur). */
export function toPlayerDetailDto(
  row: PlayerCatalogEntryRow,
  release: Pick<ActiveCatalogRelease, "game_version" | "data_date">
): PlayerDetailDto {
  return {
    ...toPlayerListDto(row),
    common_name: row.common_name,
    league_name: row.league_name,
    birthdate: row.birthdate,
    age: calcAgeAt(row.birthdate, release.data_date),
    height_cm: row.height_cm,
    weight_kg: row.weight_kg,
    preferred_foot: row.preferred_foot,
    skill_moves: row.skill_moves,
    weak_foot: row.weak_foot,
    gender: row.gender,
    alt_positions: row.alt_positions,
    stats: row.stats,
    base_value_kind: row.base_value_kind,
    valuation_date: row.valuation_date,
    valuation_source_name: row.valuation_source_name,
    valuation_source_url: row.valuation_source_url,
    is_adjusted: row.adjustment_bps > 0,
    game_label: gameVersionLabel(release.game_version),
  };
}

// ---------- Danh sách ----------

/** Sort catalog → cột + chiều; null luôn ở cuối (§8 — thiếu ≠ 0). */
const SORT_COLUMNS: Record<
  CatalogSort,
  { column: string; ascending: boolean }
> = {
  overall: { column: "overall_rating", ascending: false },
  potential: { column: "potential", ascending: false },
  name: { column: "display_name", ascending: true },
  value_desc: { column: "reference_value_eur", ascending: false },
  value_asc: { column: "reference_value_eur", ascending: true },
  wage_desc: { column: "weekly_wage_eur", ascending: false },
  wage_asc: { column: "weekly_wage_eur", ascending: true },
};

function emptyListResult(
  params: CatalogListParams,
  releaseId: string | null,
  error: unknown = null
): CatalogListResult {
  return {
    data: [],
    count: 0,
    page: params.page,
    limit: params.limit,
    totalPages: 1,
    releaseId,
    error,
  };
}

/**
 * Danh sách + tìm + lọc + sort + phân trang trên bản active (§8).
 * Không có bản active → trả rỗng với releaseId=null (KHÔNG trộn bản).
 * Khoảng tiền chỉ áp gte/lte khi param non-null: bản ghi thiếu giá/lương
 * tự rơi khỏi range thay vì bị coi là 0.
 */
export async function listCatalogPlayers(
  params: CatalogListParams
): Promise<CatalogListResult> {
  const release = await getActiveCatalogRelease();
  if (!release) return emptyListResult(params, null);

  let query = supabaseAdmin
    .from("player_catalog_entries")
    .select(PLAYER_LIST_COLUMNS, { count: "exact" })
    .eq("release_id", release.id);

  // search đã normalize ASCII thường + strip wildcard ở params.ts — an toàn cho ilike
  if (params.search) {
    query = query.ilike("search_name", `%${params.search}%`);
  }
  if (params.position) query = query.eq("position_short", params.position);
  if (params.team) query = query.eq("team_name", params.team);
  if (params.league) query = query.eq("league_name", params.league);
  if (params.nationality) query = query.eq("nationality_name", params.nationality);
  if (params.gender != null) query = query.eq("gender", params.gender);

  if (params.minOverall != null) query = query.gte("overall_rating", params.minOverall);
  if (params.maxOverall != null) query = query.lte("overall_rating", params.maxOverall);
  if (params.minPotential != null) query = query.gte("potential", params.minPotential);
  if (params.maxPotential != null) query = query.lte("potential", params.maxPotential);
  if (params.minValue != null) query = query.gte("reference_value_eur", params.minValue);
  if (params.maxValue != null) query = query.lte("reference_value_eur", params.maxValue);
  if (params.minWage != null) query = query.gte("weekly_wage_eur", params.minWage);
  if (params.maxWage != null) query = query.lte("weekly_wage_eur", params.maxWage);

  const sort = SORT_COLUMNS[params.sort] ?? SORT_COLUMNS.overall;
  query = query
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    // Tie-break ổn định để phân trang không trùng/thiếu bản ghi
    .order("ea_player_id", { ascending: true });

  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, count, error } = await query
    .range(from, to)
    .abortSignal(AbortSignal.timeout(DEFAULT_QUERY_TIMEOUT_MS));

  if (error) {
    console.error("listCatalogPlayers:", error);
    return emptyListResult(params, release.id, error);
  }

  const total = count ?? 0;
  const rows = (data ?? []) as PlayerCatalogEntryRow[];
  return {
    data: rows.map(toPlayerListDto),
    count: total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
    releaseId: release.id,
    error: null,
  };
}

// ---------- Chi tiết ----------

/** Slug đích do importer sinh (normalize + ea id) — input lạ bỏ sớm, khỏi query. */
const SLUG_RE = /^[a-z0-9-]{1,120}$/;

/**
 * Chi tiết theo slug trong bản active (§8 — đọc qua repository, không
 * cần detail API riêng). Trả data=null khi không thấy hoặc chưa có bản.
 */
export async function getCatalogPlayerBySlug(
  slug: string
): Promise<{ data: PlayerDetailDto | null; error: unknown }> {
  if (!SLUG_RE.test(slug)) return { data: null, error: null };

  const release = await getActiveCatalogRelease();
  if (!release) return { data: null, error: null };

  const { data, error } = await supabaseAdmin
    .from("player_catalog_entries")
    .select("*")
    .eq("release_id", release.id)
    .eq("slug", slug)
    .abortSignal(AbortSignal.timeout(DEFAULT_QUERY_TIMEOUT_MS))
    .maybeSingle();

  if (error) {
    console.error("getCatalogPlayerBySlug:", error);
    return { data: null, error };
  }
  if (!data) return { data: null, error: null };
  return {
    data: toPlayerDetailDto(data as PlayerCatalogEntryRow, release),
    error: null,
  };
}

// ---------- Tùy chọn bộ lọc ----------

const EMPTY_FILTER_OPTIONS: CatalogFilterOptions = {
  positions: [],
  teams: [],
  leagues: [],
  nationalities: [],
  hasMixedGender: false,
};

interface FilterOptionColumns {
  position_short: string | null;
  team_name: string | null;
  league_name: string | null;
  nationality_name: string | null;
  gender: number | null;
}

/**
 * PostgREST không có SELECT DISTINCT (không thêm RPC mới) nên đọc 5 cột
 * nhẹ của bản active rồi dedupe trong JS. Kết quả cache 1h nên chi phí
 * quét một lần/giờ/release là chấp nhận được.
 */
const getCachedFilterOptions = unstable_cache(
  async (releaseId: string): Promise<CatalogFilterOptions> => {
    const { data, error } = await supabaseAdmin
      .from("player_catalog_entries")
      .select("position_short,team_name,league_name,nationality_name,gender")
      .eq("release_id", releaseId)
      .abortSignal(AbortSignal.timeout(DEFAULT_QUERY_TIMEOUT_MS));

    if (error) throw error;

    const positions = new Set<string>();
    const teams = new Set<string>();
    const leagues = new Set<string>();
    const nationalities = new Set<string>();
    const genders = new Set<number>();

    for (const row of (data ?? []) as FilterOptionColumns[]) {
      if (row.position_short) positions.add(row.position_short);
      if (row.team_name) teams.add(row.team_name);
      if (row.league_name) leagues.add(row.league_name);
      if (row.nationality_name) nationalities.add(row.nationality_name);
      if (row.gender != null) genders.add(row.gender);
    }

    const alpha = (a: string, b: string) => a.localeCompare(b);
    return {
      positions: [...positions].sort(alpha),
      teams: [...teams].sort(alpha),
      leagues: [...leagues].sort(alpha),
      nationalities: [...nationalities].sort(alpha),
      // Chỉ khi có >1 giới tính UI mới hiện bộ lọc nam/nữ
      hasMixedGender: genders.size > 1,
    };
  },
  ["player-catalog-filter-options"],
  { tags: [PLAYER_CATALOG_CACHE_TAG], revalidate: 3600 }
);

/**
 * Tùy chọn bộ lọc từ catalog active (§8) — distinct position/team/
 * league/nationality + cờ hasMixedGender. Chưa có bản active hoặc lỗi
 * → options rỗng (UI tự ẩn bộ lọc, không phải trạng thái lỗi trang).
 */
export async function getCatalogFilterOptions(): Promise<CatalogFilterOptions> {
  const release = await getActiveCatalogRelease();
  if (!release) return EMPTY_FILTER_OPTIONS;
  try {
    return await getCachedFilterOptions(release.id);
  } catch (error) {
    console.error("getCatalogFilterOptions:", error);
    return EMPTY_FILTER_OPTIONS;
  }
}
