// lib/catalog — adapter + model public thống nhất cho kho mod (§20.1–20.2)
export type {
  AccessOffer,
  ModSummary,
  DbModRecord,
  ModFilterTag,
  ModSortKey,
} from "./types";
export { MOD_FILTER_TAGS, DEFAULT_TAG, DEFAULT_SORT } from "./types";

export {
  normalizeVi,
  viIncludes,
  compareViName,
  dedupeBySlug,
  toUpdatedAtTs,
  formatUpdatedAt,
  formatVnd,
  resolveMediaSrc,
} from "./normalize";

export { buildCatalog, buildSearchText } from "./adapter";
export type { StaticModInput } from "./adapter";
