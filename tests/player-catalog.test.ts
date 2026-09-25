// tests/player-catalog.test.ts — chuẩn hoá & validate gói export cầu thủ
// Blueprint §4.1 (allowlist), §5 (top/giá), §6.3 (nhập), §8 (URL params)
// Fixture tổng hợp tự tạo — không đọc file ngoài, không cần DB.
import { describe, it, expect } from "vitest";
import {
  normalizeSearchName,
  buildPlayerSlug,
  sanitizeStats,
  validateManifest,
  validateExportRecord,
  parseNdjsonChunk,
  normalizeExportRecord,
} from "@/lib/players/normalize";
import {
  selectTopPotentialIds,
  computeEntryFinancials,
} from "@/lib/players/pricing";
import { parseCatalogParams } from "@/lib/players/params";
import { EXPORT_SCHEMA } from "@/lib/players/types";
import type {
  PlayerExportRecord,
  PlayerCatalogManifest,
} from "@/lib/players/types";

// ---------- Fixture tổng hợp ----------

function exportRec(
  overrides: Partial<PlayerExportRecord> = {}
): PlayerExportRecord {
  return {
    id: 1,
    slug: "nguon-1",
    display_name: "Nguyễn Quang Hải",
    common_name: null,
    overall_rating: 78,
    potential: 82,
    birthdate: "1997-04-12",
    height_cm: 168,
    weight_kg: 65,
    preferred_foot: 1,
    skill_moves: 4,
    weak_foot: 3,
    league_name: "V-League",
    team_id: 100,
    team_name: "Hà Nội FC",
    nationality_id: 195,
    nationality_name: "Việt Nam",
    gender: 0,
    position_short: "CAM",
    alt_positions: ["CM", "LM"],
    stats: { pac: 80, sho: 74 },
    avatar_url: null,
    game_version: "fc26",
    value_eur: 2_000_000,
    wage_eur: 5_000,
    market_value: null,
    ...overrides,
  };
}

function manifest(
  overrides: Partial<PlayerCatalogManifest> = {}
): PlayerCatalogManifest {
  return {
    schema: EXPORT_SCHEMA,
    export_id: "exp-2026-09-25",
    game_version: "fc26",
    data_date: "2026-09-25",
    record_count: 2,
    chunk_size: 500,
    chunks: [{ file: "chunk-000.ndjson", sha256: "a".repeat(64), records: 2 }],
    career_source: "nguon-career-test",
    market_source_name: "Nguồn Test",
    created_at: "2026-09-25T00:00:00Z",
    ...overrides,
  };
}

// ---------- Tìm kiếm không dấu / slug ----------

describe("normalizeSearchName", () => {
  it("bỏ dấu: 'Estêvão' → 'estevao'", () => {
    expect(normalizeSearchName("Estêvão")).toBe("estevao");
  });

  it("xử lý 'đ/Đ' và 'Ł/ł' (không nằm trong NFD combining)", () => {
    expect(normalizeSearchName("Đặng Văn Lâm")).toBe("dang van lam");
    expect(normalizeSearchName("Łukasz Fabiański")).toBe("lukasz fabianski");
  });

  it("khoảng trắng thừa + ký tự lạ → chuẩn hoá gọn", () => {
    expect(normalizeSearchName("  Kylian   Mbappé!! ")).toBe("kylian mbappe");
    expect(normalizeSearchName("N'Golo Kanté")).toBe("n golo kante");
  });
});

describe("buildPlayerSlug", () => {
  it("trùng tên khác id → slug khác nhau", () => {
    const a = buildPlayerSlug("Nguyễn Văn Toàn", 101);
    const b = buildPlayerSlug("Nguyễn Văn Toàn", 202);
    expect(a).toBe("nguyen-van-toan-101");
    expect(b).toBe("nguyen-van-toan-202");
    expect(a).not.toBe(b);
  });

  it("ổn định: cùng input → cùng slug", () => {
    expect(buildPlayerSlug("Kylian Mbappé", 9)).toBe("kylian-mbappe-9");
    expect(buildPlayerSlug("Kylian Mbappé", 9)).toBe("kylian-mbappe-9");
  });

  it("tên toàn ký tự lạ → fallback 'cau-thu-<id>'", () => {
    expect(buildPlayerSlug("???!!!", 7)).toBe("cau-thu-7");
  });
});

// ---------- Allowlist chỉ số ----------

describe("sanitizeStats", () => {
  it("giữ key allowlist: {key:{value,diff}} → number", () => {
    const { stats, droppedKeys } = sanitizeStats({
      pac: { value: 80, diff: 2 },
      sho: 75,
      hack_x: 99,
    });
    expect(stats).toEqual({ pac: 80, sho: 75 });
    expect(droppedKeys).toEqual(["hack_x"]);
  });

  it("loại value >99 / non-int trong key hợp lệ (không tính droppedKeys)", () => {
    const { stats, droppedKeys } = sanitizeStats({
      pac: 120, // >99 → loại
      sho: 88.5, // non-int → loại
      pas: 70,
      pas_x: { value: 10 }, // key lạ → đếm dropped
    });
    expect(stats).toEqual({ pas: 70 });
    expect(droppedKeys).toEqual(["pas_x"]);
  });

  it("input không phải object → stats rỗng, không crash", () => {
    expect(sanitizeStats(null).stats).toEqual({});
    expect(sanitizeStats("x").stats).toEqual({});
  });
});

// ---------- Validate gói export (§6.3) ----------

describe("validateManifest", () => {
  it("manifest đúng → không lỗi", () => {
    expect(validateManifest(manifest())).toEqual([]);
  });

  it("schema sai → lỗi", () => {
    const errs = validateManifest({ ...manifest(), schema: "khac/9" });
    expect(errs.join()).toContain("schema");
  });

  it("record_count lệch tổng records của chunks → lỗi", () => {
    const errs = validateManifest(manifest({ record_count: 5 }));
    expect(errs.join()).toContain("record_count");
  });

  it("sha256 sai format → lỗi", () => {
    const errs = validateManifest(
      manifest({
        chunks: [{ file: "c.ndjson", sha256: "not-a-hex", records: 2 }],
      })
    );
    expect(errs.join()).toContain("chunks");
  });
});

describe("validateExportRecord", () => {
  it("record tối thiểu hợp lệ → 0 lỗi", () => {
    expect(validateExportRecord(exportRec())).toEqual([]);
  });

  it("market_value.date tương lai → lỗi (chặn theo §5.1)", () => {
    const future = new Date(Date.now() + 86400e3 * 30)
      .toISOString()
      .slice(0, 10);
    const errs = validateExportRecord(
      exportRec({
        value_eur: 1_000_000,
        market_value: { value: 1_000_000, date: future, url: "https://x/p" },
      })
    );
    expect(errs.join()).toContain("tương lai");
  });

  it("wage_eur âm → lỗi", () => {
    const errs = validateExportRecord(exportRec({ wage_eur: -1 }));
    expect(errs.join()).toContain("wage_eur");
  });

  it("thiếu display_name → lỗi", () => {
    expect(validateExportRecord(exportRec({ display_name: "  " })).join()).toContain(
      "display_name"
    );
    expect(
      validateExportRecord({ ...exportRec(), display_name: 5 }).join()
    ).toContain("display_name");
  });
});

describe("parseNdjsonChunk", () => {
  it("bỏ qua dòng trống/whitespace", () => {
    const recs = parseNdjsonChunk('{"id":1}\n\n   \n{"id":2}\n');
    expect(recs).toHaveLength(2);
  });

  it("JSON hỏng → throw kèm số dòng", () => {
    expect(() => parseNdjsonChunk('{"id":1}\n{bad json}\n')).toThrow(/dòng 2/);
  });
});

// ---------- URL params (§8) ----------

describe("parseCatalogParams — §8", () => {
  it("sort enum sai → default 'overall'", () => {
    expect(parseCatalogParams({ "sap-xep": "bogus" }).sort).toBe("overall");
    expect(parseCatalogParams({ "sap-xep": "wage_desc" }).sort).toBe(
      "wage_desc"
    );
  });

  it("gia-min > gia-max → swap", () => {
    const p = parseCatalogParams({ "gia-min": "5000000", "gia-max": "1000000" });
    expect(p.minValue).toBe(1_000_000);
    expect(p.maxValue).toBe(5_000_000);
  });

  it("trang 0 / không hợp lệ → 1", () => {
    expect(parseCatalogParams({ trang: "0" }).page).toBe(1);
    expect(parseCatalogParams({ trang: "abc" }).page).toBe(1);
    expect(parseCatalogParams({}).page).toBe(1);
  });

  it("q có wildcard % _ * → strip trước khi normalize", () => {
    expect(parseCatalogParams({ q: "ron%al_do*" }).search).toBe("ronaldo");
  });

  it("gioi-tinh=nu → gender 1; nam → 0; lạ → null", () => {
    expect(parseCatalogParams({ "gioi-tinh": "nu" }).gender).toBe(1);
    expect(parseCatalogParams({ "gioi-tinh": "nam" }).gender).toBe(0);
    expect(parseCatalogParams({ "gioi-tinh": "x" }).gender).toBeNull();
  });
});

// ---------- Pipeline import mini: validate → normalize → top → giá ----------

describe("pipeline import (mini) — §6.3 trên toàn tập", () => {
  it("3 records (market / career / không giá) → financials đúng", () => {
    const recs = [
      exportRec({
        id: 10,
        display_name: "Top Market",
        overall_rating: 90,
        potential: 95,
        value_eur: 100_000_000,
        wage_eur: 250_000,
        market_value: {
          value: 100_000_000,
          date: "2026-06-01",
          url: "https://nguon.test/p10",
        },
        stats: { pac: 90, unknownStat: 50 },
      }),
      exportRec({
        id: 20,
        display_name: "Career Only",
        overall_rating: 80,
        potential: 80,
        value_eur: 20_000_000,
        wage_eur: 50_000,
        market_value: null,
      }),
      exportRec({
        id: 30,
        display_name: "No Price",
        overall_rating: 70,
        potential: null, // POT null → không xét top
        value_eur: null,
        wage_eur: null,
        market_value: null,
      }),
    ];

    // Bước 3: validate từng record — gói sạch thì 0 lỗi
    for (const r of recs) expect(validateExportRecord(r)).toEqual([]);

    // Bước 4: chuẩn hoá — slug/search/stats theo allowlist
    const norm = recs.map(normalizeExportRecord);
    expect(norm[0].slug).toBe("top-market-10");
    expect(norm[0].search_name).toBe("top market");
    expect(norm[0].stats).toEqual({ pac: 90 }); // unknownStat bị loại
    expect(norm[0].droppedStatKeys).toEqual(["unknownStat"]);

    // Bước 5: top POT trên TOÀN TẬP (tập <100 → lấy hết POT hợp lệ)
    const topIds = selectTopPotentialIds(recs);
    expect(topIds.has(10)).toBe(true);
    expect(topIds.has(20)).toBe(true);
    expect(topIds.has(30)).toBe(false);

    // careerVerified = manifest.career_source != null → true
    const careerVerified = true;

    // Record market + top: ưu tiên market, +10% giá, lương giữ nguyên
    const fMarket = computeEntryFinancials(
      recs[0],
      topIds.has(10),
      careerVerified
    );
    expect(fMarket).toMatchObject({
      base_value_eur: 100_000_000,
      base_value_kind: "market",
      valuation_date: "2026-06-01",
      valuation_source_url: "https://nguon.test/p10",
      adjustment_bps: 1000,
      is_top_potential: true,
      reference_value_eur: 110_000_000,
      weekly_wage_eur: 250_000,
      wage_basis: "game_weekly_eur",
    });

    // Record career + top: fallback career (đã xác minh), +10% → 22M
    const fCareer = computeEntryFinancials(
      recs[1],
      topIds.has(20),
      careerVerified
    );
    expect(fCareer).toMatchObject({
      base_value_eur: 20_000_000,
      base_value_kind: "career",
      valuation_date: null,
      adjustment_bps: 1000,
      is_top_potential: true,
      reference_value_eur: 22_000_000,
      weekly_wage_eur: 50_000,
      wage_basis: "game_weekly_eur",
    });

    // Record không giá + POT null: ngoài top, mọi số tiền null
    const fNone = computeEntryFinancials(
      recs[2],
      topIds.has(30),
      careerVerified
    );
    expect(fNone).toMatchObject({
      base_value_eur: null,
      base_value_kind: "unknown",
      adjustment_bps: 0,
      is_top_potential: false,
      reference_value_eur: null,
      weekly_wage_eur: null,
      wage_basis: "unknown",
    });
  });
});
