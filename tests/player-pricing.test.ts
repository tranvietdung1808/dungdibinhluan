// tests/player-pricing.test.ts — quy tắc giá blueprint §5
import { describe, expect, it } from "vitest";
import {
  selectTopPotentialIds,
  resolveBaseValue,
  computeReferenceValue,
  computeEntryFinancials,
  TOP_POTENTIAL_ADJUSTMENT_BPS,
} from "@/lib/players/pricing";

const player = (id: number, potential: number | null, overall = 80) => ({
  id,
  potential,
  overall_rating: overall,
});

describe("selectTopPotentialIds — §5.2", () => {
  it("chọn đúng 100 đầu theo POT trên toàn tập (>100 người)", () => {
    const players = Array.from({ length: 150 }, (_, i) =>
      player(i + 1, 90 - Math.floor(i / 10), 70 + (i % 10))
    );
    const top = selectTopPotentialIds(players);
    expect(top.size).toBe(100);
    // 150 người, POT 90→76 theo nhóm 10: 100 đầu = 10 nhóm POT 90..81
    for (const p of players.slice(0, 100)) expect(top.has(p.id)).toBe(true);
    expect(top.has(players[100].id)).toBe(false);
  });

  it("tie POT → overall DESC → id ASC", () => {
    const players = [
      player(1, 90, 85),
      player(2, 90, 88), // cùng POT, OVR cao hơn → đứng trước
      player(3, 90, 88), // cùng POT+OVR → id nhỏ trước
      player(4, 89, 99),
    ];
    const top = selectTopPotentialIds(players, 2);
    expect([...top].sort()).toEqual([2, 3]);
  });

  it("bỏ qua potential null; tập <100 thì lấy hết", () => {
    const players = [player(1, 90), player(2, null), player(3, 80)];
    const top = selectTopPotentialIds(players);
    expect(top.size).toBe(2);
    expect(top.has(2)).toBe(false);
    // Tập có POT hợp lệ ít hơn count → lấy tất cả, không thay thế
    const small = selectTopPotentialIds([player(9, 50)], 100);
    expect(small.size).toBe(1);
  });
});

describe("resolveBaseValue — §5.1", () => {
  const mv = { value: 100_000_000, date: "2026-06-04", url: "https://x.test/p" };

  it("ưu tiên market khi map khớp value_eur (kể cả có career)", () => {
    const r = resolveBaseValue(
      { value_eur: 100_000_000, market_value: mv },
      true
    );
    expect(r.kind).toBe("market");
    expect(r.baseValueEur).toBe(100_000_000);
    expect(r.valuationDate).toBe("2026-06-04");
    expect(r.sourceUrl).toBe("https://x.test/p");
  });

  it("thiếu market → career chỉ khi provenance career được xác nhận", () => {
    const verified = resolveBaseValue(
      { value_eur: 20_000_000, market_value: null },
      true
    );
    expect(verified.kind).toBe("career");
    // Không có map KHÔNG chứng minh là career → chưa xác nhận thì unknown
    const unverified = resolveBaseValue(
      { value_eur: 20_000_000, market_value: null },
      false
    );
    expect(unverified.kind).toBe("unknown");
    expect(unverified.baseValueEur).toBeNull();
  });

  it("market_value lệch value_eur → không gán nhãn market", () => {
    const r = resolveBaseValue(
      {
        value_eur: 20_000_000,
        market_value: { value: 30_000_000, date: "2026-06-04", url: "u" },
      },
      true
    );
    expect(r.kind).toBe("career"); // fallback career vì đã xác nhận nguồn
    expect(r.baseValueEur).toBe(20_000_000);
  });

  it("thiếu cả hai giá → null/unknown", () => {
    const r = resolveBaseValue({ value_eur: null, market_value: null }, true);
    expect(r).toMatchObject({ baseValueEur: null, kind: "unknown" });
  });
});

describe("computeReferenceValue — §5.3", () => {
  it("cộng đúng 10% khi top 100 (round half-up)", () => {
    expect(computeReferenceValue(100_000_000, TOP_POTENTIAL_ADJUSTMENT_BPS)).toBe(
      110_000_000
    );
    expect(computeReferenceValue(20_000_000, TOP_POTENTIAL_ADJUSTMENT_BPS)).toBe(
      22_000_000
    );
    // Làm tròn half-up: 5 → lên
    expect(computeReferenceValue(55, TOP_POTENTIAL_ADJUSTMENT_BPS)).toBe(61); // 60.5 → 61
  });

  it("ngoài top 100 giữ nguyên; null → null", () => {
    expect(computeReferenceValue(100_000_000, 0)).toBe(100_000_000);
    expect(computeReferenceValue(null, TOP_POTENTIAL_ADJUSTMENT_BPS)).toBeNull();
  });
});

describe("computeEntryFinancials — toàn bộ công thức", () => {
  it("top 100 market: +10% giá, lương giữ nguyên", () => {
    const f = computeEntryFinancials(
      {
        value_eur: 100_000_000,
        wage_eur: 250_000,
        market_value: { value: 100_000_000, date: "2026-06-04", url: "u" },
      },
      true,
      true
    );
    expect(f.reference_value_eur).toBe(110_000_000);
    expect(f.adjustment_bps).toBe(1000);
    expect(f.is_top_potential).toBe(true);
    expect(f.weekly_wage_eur).toBe(250_000); // lương không điều chỉnh
    expect(f.wage_basis).toBe("game_weekly_eur");
    expect(f.base_value_kind).toBe("market");
  });

  it("top 100 thiếu giá vẫn là top 100 nhưng giá hiển thị thiếu", () => {
    const f = computeEntryFinancials(
      { value_eur: null, wage_eur: 10_000, market_value: null },
      true,
      true
    );
    expect(f.is_top_potential).toBe(true);
    expect(f.reference_value_eur).toBeNull();
    expect(f.base_value_kind).toBe("unknown");
  });

  it("người thứ 101 (ngoài top): giá giữ nguyên, không lũy tiến", () => {
    const f = computeEntryFinancials(
      { value_eur: 20_000_000, wage_eur: null, market_value: null },
      false,
      true
    );
    expect(f.adjustment_bps).toBe(0);
    expect(f.reference_value_eur).toBe(20_000_000); // tính từ base, không +10%
  });
});
