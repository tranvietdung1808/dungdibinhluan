// =====================================================
// lib/players/pricing — quy tắc giá bắt buộc (blueprint §5)
// Chạy MỘT LẦN tại import trên toàn tập — không tính lúc request.
// =====================================================

import type { PlayerExportRecord, BaseValueKind } from "./types.ts";

export const TOP_POTENTIAL_COUNT = 100;
/** 10% biểu diễn theo basis points để tính integer chính xác */
export const TOP_POTENTIAL_ADJUSTMENT_BPS = 1000;
const BPS_DENOMINATOR = 10_000;

/**
 * Chọn top cầu thủ theo POT trên TOÀN TẬP (§5.2):
 *  - Chỉ xét potential hợp lệ (không null)
 *  - potential DESC → overall_rating DESC → id ASC
 *  - Đúng `count` đầu; tập nhỏ hơn thì lấy hết
 *  - Không lọc giới tính/CLB/giá/vị trí; thiếu giá vẫn được chọn
 */
export function selectTopPotentialIds(
  players: ReadonlyArray<{
    id: number;
    potential: number | null;
    overall_rating: number;
  }>,
  count = TOP_POTENTIAL_COUNT
): Set<number> {
  const eligible = players
    .filter((p) => p.potential != null)
    .sort(
      (a, b) =>
        b.potential! - a.potential! ||
        b.overall_rating - a.overall_rating ||
        a.id - b.id
    );
  return new Set(eligible.slice(0, count).map((p) => p.id));
}

/**
 * Giá cơ sở (§5.1):
 *  - market hợp lệ (đã xác minh khớp map ở nguồn) → ưu tiên market
 *  - không market: career CHỈ KHI provenance career được xác nhận
 *    (manifest.career_source non-null) — không đoán loại giá
 *  - cả hai đều thiếu → null / 'unknown'
 * Không trung bình, không max, không fallback vì giá market thấp.
 */
export function resolveBaseValue(record: {
  value_eur: number | null;
  market_value: { value: number; date: string; url: string } | null;
}, careerSourceVerified: boolean): {
  baseValueEur: number | null;
  kind: BaseValueKind;
  valuationDate: string | null;
  sourceUrl: string | null;
} {
  const market = record.market_value;
  // Defense-in-depth: gói export cam kết market.value === value_eur;
  // nếu lệch thì loại market thay vì gán nhãn sai.
  if (
    market != null &&
    market.value === record.value_eur &&
    Number.isInteger(market.value) &&
    market.value >= 0
  ) {
    return {
      baseValueEur: market.value,
      kind: "market",
      valuationDate: market.date,
      sourceUrl: market.url,
    };
  }
  if (
    careerSourceVerified &&
    record.value_eur != null &&
    Number.isInteger(record.value_eur) &&
    record.value_eur >= 0
  ) {
    return {
      baseValueEur: record.value_eur,
      kind: "career",
      valuationDate: null,
      sourceUrl: null,
    };
  }
  return {
    baseValueEur: null,
    kind: "unknown",
    valuationDate: null,
    sourceUrl: null,
  };
}

/**
 * Công thức điều chỉnh (§5.3) — integer/round-half-up:
 *   reference = base * (10000 + bps) / 10000
 * Luôn tính từ giá CƠ SỞ — retry cùng dữ liệu không lũy tiến.
 * Số nguyên EUR không âm, an toàn < 2^53.
 */
export function computeReferenceValue(
  baseValueEur: number | null,
  adjustmentBps: number
): number | null {
  if (baseValueEur == null) return null;
  if (!Number.isSafeInteger(baseValueEur) || baseValueEur < 0) {
    throw new Error(`base_value_eur không hợp lệ: ${baseValueEur}`);
  }
  return Math.floor(
    (baseValueEur * (BPS_DENOMINATOR + adjustmentBps) + 5000) / BPS_DENOMINATOR
  );
}

/** Kết quả tài chính hoàn chỉnh cho một record tại import. */
export function computeEntryFinancials(
  record: Pick<PlayerExportRecord, "value_eur" | "wage_eur" | "market_value">,
  isTopPotential: boolean,
  careerSourceVerified: boolean
): {
  base_value_eur: number | null;
  base_value_kind: BaseValueKind;
  valuation_date: string | null;
  valuation_source_url: string | null;
  adjustment_bps: number;
  is_top_potential: boolean;
  reference_value_eur: number | null;
  weekly_wage_eur: number | null;
  wage_basis: "game_weekly_eur" | "unknown";
} {
  const base = resolveBaseValue(record, careerSourceVerified);
  const adjustmentBps = isTopPotential ? TOP_POTENTIAL_ADJUSTMENT_BPS : 0;
  const wage =
    record.wage_eur != null &&
    Number.isInteger(record.wage_eur) &&
    record.wage_eur >= 0
      ? record.wage_eur
      : null;
  return {
    base_value_eur: base.baseValueEur,
    base_value_kind: base.kind,
    valuation_date: base.valuationDate,
    valuation_source_url: base.sourceUrl,
    adjustment_bps: adjustmentBps,
    is_top_potential: isTopPotential,
    reference_value_eur: computeReferenceValue(base.baseValueEur, adjustmentBps),
    weekly_wage_eur: wage,
    wage_basis: wage != null ? "game_weekly_eur" : "unknown",
  };
}
