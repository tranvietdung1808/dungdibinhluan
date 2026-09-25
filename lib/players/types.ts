// =====================================================
// lib/players — contract chung cho module danh bạ cầu thủ
// Blueprint: PLAYER-DATABASE-BLUEPRINT.md §4.1, §5, §7, §8
// An toàn import cả client lẫn server (không phụ thuộc SDK nặng).
// =====================================================

// ---------- Gói export (nguồn -> đích) ----------

/** Schema version của gói export — importer chỉ nhận đúng giá trị này. */
export const EXPORT_SCHEMA = "player-catalog/1" as const;

/**
 * Một bản ghi cầu thủ trong chunk NDJSON của gói export.
 * Exporter (project nguồn) phải emit đúng shape này — đây là projection
 * cố định đã duyệt, KHÔNG phải SELECT *.
 */
export interface PlayerExportRecord {
  /** EA player id — định danh dữ liệu thể thao, dùng nội bộ/routing */
  id: number;
  /** Slug nguồn — chỉ tham khảo, đích tự tạo slug riêng */
  slug: string;
  display_name: string;
  common_name: string | null;
  overall_rating: number;
  potential: number | null;
  birthdate: string | null; // yyyy-mm-dd
  height_cm: number | null;
  weight_kg: number | null;
  /** 1 = phải, 2 = trái (mã EA) */
  preferred_foot: number | null;
  skill_moves: number | null;
  weak_foot: number | null;
  league_name: string | null;
  team_id: number | null;
  team_name: string | null;
  nationality_id: number | null;
  nationality_name: string | null;
  /** 0 = nam, 1 = nữ (khớp cột `gender` của EA) */
  gender: number | null;
  position_short: string | null;
  alt_positions: string[];
  /** Chỉ số con đã lấy `.value` — key nằm trong PLAYER_STAT_KEYS */
  stats: Record<string, number>;
  avatar_url: string | null;
  game_version: string;
  /** Giá trị trong bảng players nguồn — có thể là market hoặc career */
  value_eur: number | null;
  wage_eur: number | null;
  /**
   * Giá thị trường đã xác minh: chỉ non-null khi map nguồn khớp
   * (`map[id].value === value_eur`), tái hiện getMarketValueSource.
   */
  market_value: { value: number; date: string; url: string } | null;
}

/** manifest.json của gói export — đối chiếu trước khi nhập. */
export interface PlayerCatalogManifest {
  schema: typeof EXPORT_SCHEMA;
  export_id: string;
  game_version: string;
  /** Ngày tham chiếu của bộ dữ liệu — tuổi cầu thủ tính theo ngày này */
  data_date: string;
  record_count: number;
  chunk_size: number;
  chunks: Array<{ file: string; sha256: string; records: number }>;
  /**
   * Xác nhận của người vận hành nguồn về provenance giá Career
   * (vd. "sofifa-fc26"). null = giá không khớp market KHÔNG được coi là
   * career — phải để base_value_kind = 'unknown'.
   */
  career_source: string | null;
  /** Tên nguồn giá thị trường để ghi công (vd. "Transfermarkt") */
  market_source_name: string | null;
  created_at: string;
}

// ---------- Bảng đích (Supabase) ----------

export type BaseValueKind = "market" | "career" | "unknown";
export type WageBasis = "game_weekly_eur" | "unknown";
export type ReleaseStatus = "staging" | "active" | "archived" | "failed";

/** Row của public.player_catalog_releases */
export interface PlayerCatalogReleaseRow {
  id: string;
  export_id: string;
  game_version: string;
  data_date: string | null;
  manifest: Record<string, unknown>;
  record_count: number;
  status: ReleaseStatus;
  imported_at: string;
  activated_at: string | null;
  created_at: string;
}

/** Row của public.player_catalog_entries */
export interface PlayerCatalogEntryRow {
  release_id: string;
  ea_player_id: number;
  slug: string;
  display_name: string;
  search_name: string;
  common_name: string | null;
  overall_rating: number;
  potential: number | null;
  birthdate: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: number | null;
  skill_moves: number | null;
  weak_foot: number | null;
  league_name: string | null;
  team_id: number | null;
  team_name: string | null;
  nationality_id: number | null;
  nationality_name: string | null;
  gender: number | null;
  position_short: string | null;
  alt_positions: string[];
  stats: Record<string, number>;
  avatar_url: string | null;
  base_value_eur: number | null;
  base_value_kind: BaseValueKind;
  valuation_date: string | null;
  valuation_source_name: string | null;
  valuation_source_url: string | null;
  adjustment_bps: number;
  is_top_potential: boolean;
  reference_value_eur: number | null;
  weekly_wage_eur: number | null;
  wage_basis: WageBasis;
}

// ---------- DTO public (allowlist — không lộ provenance nội bộ) ----------

/** DTO danh sách — đúng các cột UI bảng cần, không kèm stats nặng. */
export interface PlayerListDto {
  slug: string;
  display_name: string;
  position_short: string | null;
  team_name: string | null;
  nationality_name: string | null;
  overall_rating: number;
  potential: number | null;
  /** Giá tham khảo SAU điều chỉnh — sort/lọc dùng số này */
  reference_value_eur: number | null;
  /** Lương trong game, EUR/tuần — giữ nguyên */
  weekly_wage_eur: number | null;
  avatar_url: string | null;
}

/** DTO chi tiết — thông tin hiển thị + ghi công, không lộ manifest/ID nội bộ. */
export interface PlayerDetailDto extends PlayerListDto {
  common_name: string | null;
  league_name: string | null;
  birthdate: string | null;
  /** Tuổi tính theo data_date của bản dữ liệu (không phải hôm nay) */
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: number | null;
  skill_moves: number | null;
  weak_foot: number | null;
  gender: number | null;
  alt_positions: string[];
  stats: Record<string, number>;
  /** Nhãn cơ sở giá: market | career | unknown — KHÔNG trả base_value_eur */
  base_value_kind: BaseValueKind;
  valuation_date: string | null;
  valuation_source_name: string | null;
  valuation_source_url: string | null;
  /** true = cầu thủ top 100 POT, giá tham khảo đã cộng 10% cơ sở */
  is_adjusted: boolean;
  /** Nhãn bản game đúng dữ liệu (vd. "FC 26") — sinh từ game_version đã xác minh */
  game_label: string;
}

export interface CatalogFilterOptions {
  positions: string[];
  teams: string[];
  leagues: string[];
  nationalities: string[];
  /** true khi catalog có cả nam lẫn nữ — UI mới hiện bộ lọc giới tính */
  hasMixedGender: boolean;
}

// ---------- Query params (URL / API — tên canonical) ----------

export const CATALOG_SORTS = [
  "overall",
  "potential",
  "name",
  "value_desc",
  "value_asc",
  "wage_desc",
  "wage_asc",
] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];
export const DEFAULT_CATALOG_SORT: CatalogSort = "overall";

export const CATALOG_PAGE_SIZE_DEFAULT = 25;
export const CATALOG_PAGE_SIZE_MAX = 50;

/** Tham số đã validate/normalize — input của repository. */
export interface CatalogListParams {
  /** Chuỗi tìm tên ĐÃ normalizeSearchName (ASCII thường, có thể rỗng) */
  search: string;
  position: string | null;
  team: string | null;
  league: string | null;
  nationality: string | null;
  /** 0 = nam, 1 = nữ */
  gender: number | null;
  minOverall: number | null;
  maxOverall: number | null;
  minPotential: number | null;
  maxPotential: number | null;
  /** EUR nguyên — lọc theo reference_value_eur (giá SAU điều chỉnh) */
  minValue: number | null;
  maxValue: number | null;
  /** EUR/tuần nguyên — lọc theo weekly_wage_eur */
  minWage: number | null;
  maxWage: number | null;
  sort: CatalogSort;
  page: number;
  limit: number;
}

export interface CatalogListResult {
  data: PlayerListDto[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Revision đích (uuid release) — ghim phân trang, không chứa info nguồn */
  releaseId: string | null;
  error: unknown;
}
