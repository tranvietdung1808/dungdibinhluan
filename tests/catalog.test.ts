import { describe, it, expect } from "vitest";

// =====================================================
// lib/catalog — B01 (search toàn kho, không dấu),
// B02 (model thống nhất static+DB), T03 (dedupe theo slug)
// =====================================================

import {
  buildCatalog,
  buildSearchText,
  dedupeBySlug,
  normalizeVi,
  viIncludes,
  type DbModRecord,
  type StaticModInput,
} from "@/lib/catalog";

function dbRow(overrides: Partial<DbModRecord> = {}): DbModRecord {
  return {
    id: "db-1",
    slug: "some-mod",
    name: "Some Mod",
    author: "DB Author",
    category: "Faces",
    version: "1.0",
    updated_at: "2026-01-10T00:00:00Z",
    description: "DB description",
    thumbnail: "https://cdn.example.com/thumb.jpg",
    download_url: "https://example.com/dl",
    tags: ["Faces"],
    thumbnail_orientation: "landscape",
    featured: false,
    created_at: "2026-01-01T00:00:00Z",
    credit_cost: null,
    ...overrides,
  };
}

function staticMod(overrides: Partial<StaticModInput> = {}): StaticModInput {
  return {
    slug: "some-mod",
    name: "Static Name",
    author: "Static Author",
    category: "Faces",
    description: "Static desc",
    thumbnail: "/images/static.jpg",
    downloadUrl: "https://example.com/static-dl",
    tags: ["Faces"],
    ...overrides,
  };
}

describe("normalizeVi", () => {
  it("bỏ dấu tiếng Việt + lowercase", () => {
    expect(normalizeVi("Hòa")).toBe("hoa");
    expect(normalizeVi("Đồ họa")).toBe("do hoa");
    expect(normalizeVi("Đ")).toBe("d");
    expect(normalizeVi("MESSI")).toBe("messi");
  });

  it("gom whitespace + trim; null/undefined → chuỗi rỗng", () => {
    expect(normalizeVi("  a   b  ")).toBe("a b");
    expect(normalizeVi(null)).toBe("");
    expect(normalizeVi(undefined)).toBe("");
  });
});

describe("viIncludes", () => {
  it("khớp không dấu cả hai chiều", () => {
    expect(viIncludes("Cristiano Ronaldo Face", "ronaldo")).toBe(true);
    expect(viIncludes("Hoa hậu", "hoa")).toBe(true);
    expect(viIncludes("đồ họa 4k", "do hoa")).toBe(true);
    expect(viIncludes("abc", "xyz")).toBe(false);
  });
});

describe("dedupeBySlug", () => {
  it("một slug một item, bản đầu thắng", () => {
    const out = dedupeBySlug([
      { slug: "a", v: 1 },
      { slug: "a", v: 2 },
      { slug: "b", v: 3 },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ slug: "a", v: 1 });
  });
});

describe("buildCatalog — merge + dedupe (B02/T03)", () => {
  it("T03: static + DB trùng slug → đúng 1 card, DB ưu tiên", () => {
    const catalog = buildCatalog(
      [staticMod({ name: "Static Name" })],
      [dbRow({ name: "DB Name" })],
    );
    expect(catalog).toHaveLength(1);
    expect(catalog[0].name).toBe("DB Name");
  });

  it("field DB trống → fallback static", () => {
    const catalog = buildCatalog(
      [staticMod({ author: "Static Author", thumbnail: "/images/static.jpg" })],
      [dbRow({ author: "", thumbnail: null, tags: null })],
    );
    expect(catalog).toHaveLength(1);
    expect(catalog[0].author).toBe("Static Author");
    expect(catalog[0].thumbnail).toBe("/images/static.jpg");
    expect(catalog[0].tags).toEqual(["Faces"]);
  });

  it("DB record không hợp lệ (thiếu name) → static fallback vẫn hiển thị", () => {
    const catalog = buildCatalog(
      [staticMod({ name: "Static Name" })],
      [dbRow({ name: "  " })],
    );
    expect(catalog).toHaveLength(1);
    expect(catalog[0].name).toBe("Static Name");
  });

  it("hai DB record trùng slug → bản đầu (mới hơn) thắng", () => {
    const catalog = buildCatalog(
      [],
      [dbRow({ name: "Newest" }), dbRow({ id: "db-2", name: "Older" })],
    );
    expect(catalog).toHaveLength(1);
    expect(catalog[0].name).toBe("Newest");
  });

  it("slug khác nhau → cả hai giữ lại", () => {
    const catalog = buildCatalog(
      [staticMod({ slug: "static-only" })],
      [dbRow({ slug: "db-only" })],
    );
    expect(catalog.map((m) => m.slug).sort()).toEqual(["db-only", "static-only"]);
  });
});

describe("buildCatalog — offer resolution", () => {
  it("credit_cost > 0 → credit", () => {
    const [mod] = buildCatalog([], [dbRow({ credit_cost: 50 })]);
    expect(mod.offer).toEqual({ kind: "credit", creditCost: 50 });
  });

  it("slug mix-mods-fc26 → product 169.000đ", () => {
    const [mod] = buildCatalog([staticMod({ slug: "mix-mods-fc26" })], []);
    expect(mod.offer).toEqual({
      kind: "product",
      productId: "mix-mods",
      priceVnd: 169000,
    });
  });

  it("không có kênh nhận tự động → contact (không mặc định free)", () => {
    const [mod] = buildCatalog(
      [staticMod({ downloadUrl: undefined })],
      [],
    );
    expect(mod.offer.kind).toBe("contact");
  });

  it("có download link → free", () => {
    const [mod] = buildCatalog([staticMod()], []);
    expect(mod.offer).toEqual({ kind: "free" });
  });

  it("DB credit-locked (download_url null) + static cùng slug có link → vẫn credit", () => {
    const [mod] = buildCatalog(
      [staticMod({ downloadUrl: "https://x/y.zip" })],
      [dbRow({ credit_cost: 30, download_url: null })],
    );
    expect(mod.offer).toEqual({ kind: "credit", creditCost: 30 });
  });
});

describe("buildSearchText — search toàn kho (B01)", () => {
  it("tìm được theo tên, mô tả, tác giả, tag, category", () => {
    const [mod] = buildCatalog(
      [
        staticMod({
          name: "Lionel Messi Face",
          description: "Khuôn mặt chuẩn 4K",
          author: "Nguyễn Văn Đức",
          tags: ["Faces", "World Cup"],
          category: "Faces",
        }),
      ],
      [],
    );
    const hay = buildSearchText(mod);
    for (const needle of ["messi", "khuon mat", "nguyen van duc", "world cup", "faces"]) {
      expect(hay).toContain(normalizeVi(needle));
    }
  });
});
