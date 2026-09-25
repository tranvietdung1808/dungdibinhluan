// =====================================================
// lib/players/normalize — chuẩn hoá & validate dữ liệu catalog
// Blueprint §4.1 (allowlist), §6.3 (kiểm tra trước khi staging)
// =====================================================

import { createHash } from "node:crypto";
import { EXPORT_SCHEMA } from "./types.ts";
import type { PlayerExportRecord, PlayerCatalogManifest } from "./types.ts";

// ---------- Tìm kiếm không dấu ----------

/**
 * Chuẩn hoá tên về ASCII thường — tương đương public.fc_normalize_name
 * của bộ dữ liệu nguồn để `ilike '%term%'` khớp cả gõ không dấu.
 */
export function normalizeSearchName(value: string): string {
  return value
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ø/g, "o")
    .replace(/Ø/g, "O")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Slug đích ổn định: tên-không-dấu + EA id (xử lý trùng tên tự nhiên).
 * Không phụ thuộc slug nguồn; không render ID thành nhãn người dùng.
 */
export function buildPlayerSlug(displayName: string, eaPlayerId: number): string {
  const base = normalizeSearchName(displayName).replace(/\s+/g, "-") || "cau-thu";
  return `${base}-${eaPlayerId}`;
}

// ---------- Allowlist chỉ số (§4.1 "Các key chuẩn đã duyệt") ----------

export interface StatItem {
  key: string;
  label: string;
}
export interface StatGroup {
  title: string;
  items: StatItem[];
}

/** 6 chỉ số tổng trên "face" thẻ cầu thủ — key trong stats jsonb */
export const FACE_STAT_KEYS = ["pac", "sho", "pas", "dri", "def", "phy"] as const;

export const GK_FACE_STAT_KEYS = [
  "gkDiving",
  "gkHandling",
  "gkKicking",
  "gkPositioning",
  "gkReflexes",
] as const;

/**
 * Nhóm chỉ số chi tiết hiển thị ở trang chi tiết. Đây đồng thời là
 * allowlist: key ngoài danh sách này bị loại khi chuẩn hoá, KHÔNG tự
 * động xuất hiện trong API đích.
 */
export const STAT_GROUPS: StatGroup[] = [
  {
    title: "Tốc độ",
    items: [
      { key: "acceleration", label: "Tăng tốc" },
      { key: "sprintSpeed", label: "Tốc độ nước rút" },
    ],
  },
  {
    title: "Dứt điểm",
    items: [
      { key: "finishing", label: "Dứt điểm" },
      { key: "longShots", label: "Sút xa" },
      { key: "positioning", label: "Chọn vị trí" },
      { key: "shotPower", label: "Lực sút" },
      { key: "volleys", label: "Sút vô lê" },
      { key: "penalties", label: "Đá phạt đền" },
    ],
  },
  {
    title: "Chuyền bóng",
    items: [
      { key: "crossing", label: "Tạt bóng" },
      { key: "curve", label: "Độ xoáy" },
      { key: "freeKickAccuracy", label: "Đá phạt" },
      { key: "longPassing", label: "Chuyền dài" },
      { key: "shortPassing", label: "Chuyền ngắn" },
      { key: "vision", label: "Nhãn quan" },
    ],
  },
  {
    title: "Rê bóng",
    items: [
      { key: "agility", label: "Nhanh nhẹn" },
      { key: "balance", label: "Thăng bằng" },
      { key: "ballControl", label: "Kiểm soát bóng" },
      { key: "composure", label: "Điềm tĩnh" },
      { key: "dribbling", label: "Rê bóng" },
      { key: "reactions", label: "Phản ứng" },
    ],
  },
  {
    title: "Phòng ngự",
    items: [
      { key: "defensiveAwareness", label: "Ý thức phòng ngự" },
      { key: "headingAccuracy", label: "Đánh đầu" },
      { key: "interceptions", label: "Cắt bóng" },
      { key: "slidingTackle", label: "Tắc bóng xoạc" },
      { key: "standingTackle", label: "Tắc bóng đứng" },
    ],
  },
  {
    title: "Thể chất",
    items: [
      { key: "aggression", label: "Quyết liệt" },
      { key: "jumping", label: "Sức bật" },
      { key: "stamina", label: "Sức bền" },
      { key: "strength", label: "Sức mạnh" },
    ],
  },
  {
    title: "Thủ môn",
    items: [
      { key: "gkDiving", label: "Đổ người" },
      { key: "gkHandling", label: "Bắt bóng" },
      { key: "gkKicking", label: "Phát bóng" },
      { key: "gkPositioning", label: "Chọn vị trí" },
      { key: "gkReflexes", label: "Phản xạ" },
    ],
  },
];

/** Toàn bộ stat key được phép = 6 face + nhóm chi tiết. */
export const PLAYER_STAT_KEYS: ReadonlySet<string> = new Set(
  [
    ...FACE_STAT_KEYS,
    ...STAT_GROUPS.flatMap((g) => g.items.map((i) => i.key)),
  ]
);

/**
 * Chuẩn hoá stats về { key: number } chỉ gồm key allowlist + int 0–99.
 * Key lạ bị loại (đếm trả về để importer báo cáo, không âm thầm mở rộng).
 */
export function sanitizeStats(input: unknown): {
  stats: Record<string, number>;
  droppedKeys: string[];
} {
  const stats: Record<string, number> = {};
  const dropped = new Set<string>();
  if (input && typeof input === "object") {
    for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
      // Chấp nhận cả { value } (shape EA thô) lẫn number (đã project)
      const value =
        typeof raw === "object" && raw !== null
          ? (raw as { value?: unknown }).value
          : raw;
      if (!PLAYER_STAT_KEYS.has(key)) {
        dropped.add(key);
        continue;
      }
      if (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 99
      ) {
        stats[key] = value;
      }
    }
  }
  return { stats, droppedKeys: [...dropped] };
}

// ---------- Validate gói export (§6.3) ----------

export function sha256Hex(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

/** Kiểm manifest — trả danh sách lỗi (rỗng = hợp lệ). */
export function validateManifest(manifest: unknown): string[] {
  const errors: string[] = [];
  if (!manifest || typeof manifest !== "object") {
    return ["manifest không phải object"];
  }
  const m = manifest as Partial<PlayerCatalogManifest>;
  if (m.schema !== EXPORT_SCHEMA) {
    errors.push(`schema không hỗ trợ: ${String(m.schema)} (cần ${EXPORT_SCHEMA})`);
  }
  if (typeof m.export_id !== "string" || !m.export_id) {
    errors.push("thiếu export_id");
  }
  if (typeof m.game_version !== "string" || !m.game_version) {
    errors.push("thiếu game_version");
  }
  if (typeof m.data_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(m.data_date)) {
    errors.push("data_date phải dạng yyyy-mm-dd");
  }
  if (!Number.isInteger(m.record_count) || (m.record_count as number) < 0) {
    errors.push("record_count phải là số nguyên >= 0");
  }
  if (
    !Array.isArray(m.chunks) ||
    m.chunks.length === 0 ||
    !m.chunks.every(
      (c) =>
        c &&
        typeof c.file === "string" &&
        /^[0-9a-f]{64}$/i.test(c.sha256 ?? "") &&
        Number.isInteger(c.records) &&
        c.records >= 0
    )
  ) {
    errors.push("chunks phải là danh sách {file, sha256 hex-64, records}");
  }
  if (
    m.chunks &&
    Number.isInteger(m.record_count) &&
    m.chunks.reduce((sum, c) => sum + (c?.records ?? 0), 0) !== m.record_count
  ) {
    errors.push("tổng records trong chunks không khớp record_count");
  }
  return errors;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v);
}
function isNullOrInt(v: unknown): boolean {
  return v === null || isInt(v);
}
function isNullOrString(v: unknown): boolean {
  return v === null || typeof v === "string";
}

/** Kiểm 1 record NDJSON theo contract PlayerExportRecord — trả danh sách lỗi. */
export function validateExportRecord(rec: unknown): string[] {
  const errors: string[] = [];
  if (!rec || typeof rec !== "object") return ["record không phải object"];
  const r = rec as Record<string, unknown>;

  if (!isInt(r.id) || r.id <= 0) errors.push("id phải là số nguyên dương");
  if (typeof r.display_name !== "string" || !r.display_name.trim()) {
    errors.push("display_name rỗng");
  }
  if (!isInt(r.overall_rating) || r.overall_rating < 0 || r.overall_rating > 99) {
    errors.push("overall_rating phải là int 0–99");
  }
  if (
    r.potential !== null &&
    (!isInt(r.potential) || r.potential < 0 || r.potential > 99)
  ) {
    errors.push("potential phải là int 0–99 hoặc null");
  }
  for (const f of [
    "height_cm",
    "weight_kg",
    "preferred_foot",
    "skill_moves",
    "weak_foot",
    "nationality_id",
    "gender",
  ]) {
    if (!isNullOrInt(r[f])) errors.push(`${f} phải là int hoặc null`);
  }
  if (!isNullOrInt(r.team_id)) errors.push("team_id phải là int hoặc null");
  for (const f of [
    "slug",
    "common_name",
    "league_name",
    "team_name",
    "nationality_name",
    "position_short",
    "avatar_url",
    "game_version",
  ]) {
    if (!isNullOrString(r[f])) errors.push(`${f} phải là string hoặc null`);
  }
  if (r.birthdate !== null && (typeof r.birthdate !== "string" || !DATE_RE.test(r.birthdate))) {
    errors.push("birthdate phải dạng yyyy-mm-dd hoặc null");
  }
  if (!Array.isArray(r.alt_positions) || !r.alt_positions.every((p) => typeof p === "string")) {
    errors.push("alt_positions phải là string[]");
  }
  if (typeof r.stats !== "object" || r.stats === null || Array.isArray(r.stats)) {
    errors.push("stats phải là object");
  }
  // Tiền: int >= 0 hoặc null. 0 chỉ hợp lệ nếu nguồn xác nhận — importer
  // giữ nguyên giá trị, việc phân loại do pricing.resolveBaseValue quyết.
  for (const f of ["value_eur", "wage_eur"]) {
    if (r[f] !== null && (!isInt(r[f]) || (r[f] as number) < 0)) {
      errors.push(`${f} phải là int >= 0 hoặc null`);
    }
  }
  const mv = r.market_value;
  if (mv !== null) {
    if (
      !mv ||
      typeof mv !== "object" ||
      !isInt((mv as { value?: unknown }).value) ||
      (mv as { value: number }).value < 0 ||
      typeof (mv as { date?: unknown }).date !== "string" ||
      !DATE_RE.test((mv as { date: string }).date) ||
      typeof (mv as { url?: unknown }).url !== "string"
    ) {
      errors.push("market_value phải là {value:int>=0, date:yyyy-mm-dd, url:string} hoặc null");
    } else if ((mv as { date: string }).date > new Date().toISOString().slice(0, 10)) {
      errors.push("market_value.date ở tương lai — chặn theo §5.1");
    }
  }
  return errors;
}

/** Parse NDJSON thành records — throw kèm số dòng khi JSON hỏng. */
export function parseNdjsonChunk(content: string): unknown[] {
  const records: unknown[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      throw new Error(`NDJSON dòng ${i + 1} không parse được`);
    }
  }
  return records;
}

/**
 * Chuẩn hoá record export → cột bảng entries (phần phi tài chính).
 * Phần tài chính tính riêng bằng pricing.computeEntryFinancials.
 */
export function normalizeExportRecord(rec: PlayerExportRecord): {
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
  droppedStatKeys: string[];
} {
  const { stats, droppedKeys } = sanitizeStats(rec.stats);
  const displayName = rec.display_name.trim();
  return {
    ea_player_id: rec.id,
    slug: buildPlayerSlug(displayName, rec.id),
    display_name: displayName,
    search_name: normalizeSearchName(displayName),
    common_name: rec.common_name,
    overall_rating: rec.overall_rating,
    potential: rec.potential,
    birthdate: rec.birthdate,
    height_cm: rec.height_cm,
    weight_kg: rec.weight_kg,
    preferred_foot: rec.preferred_foot,
    skill_moves: rec.skill_moves,
    weak_foot: rec.weak_foot,
    league_name: rec.league_name,
    team_id: rec.team_id,
    team_name: rec.team_name,
    nationality_id: rec.nationality_id,
    nationality_name: rec.nationality_name,
    gender: rec.gender,
    position_short: rec.position_short,
    alt_positions: rec.alt_positions ?? [],
    stats,
    avatar_url: rec.avatar_url,
    droppedStatKeys: droppedKeys,
  };
}
