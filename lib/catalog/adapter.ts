// =====================================================
// lib/catalog/adapter — merge static (app/data/*.ts) + DB
// (/api/mods) thành ModSummary[] duy nhất.
// Quy tắc (B02, §9.4):
//   - Dedupe theo slug TRƯỚC filter/count/pagination.
//   - DB record hợp lệ (có slug + name) ưu tiên metadata;
//     field nào trống/thiếu thì lấy static làm fallback.
//   - Hai DB record trùng slug: bản mới hơn (đầu danh sách,
//     API đang order created_at desc) thắng.
// =====================================================

import type { ProductId } from "@/lib/payment/config";
import {
  formatUpdatedAt,
  normalizeVi,
  resolveMediaSrc,
  toUpdatedAtTs,
} from "./normalize";
import type { AccessOffer, DbModRecord, ModSummary } from "./types";

/**
 * Slug → sản phẩm bán qua checkout riêng.
 * ĐỒNG BỘ với PRODUCTS trong lib/payment/config.ts —
 * giá VND là thông tin public trên trang checkout.
 * (Không import PRODUCTS vào đây: file đó chứa directDownloadUrl,
 * không đưa vào public bundle — §20.4.)
 */
const PRODUCT_OFFER_BY_SLUG: Record<
  string,
  { productId: ProductId; priceVnd: number }
> = {
  "mix-mods-fc26": { productId: "mix-mods", priceVnd: 169000 },
};

/**
 * StaticModInput — shape tối thiểu của 1 entry trong app/data/mods.ts /
 * app/data/faces.ts. Định nghĩa riêng (không import type Mod) vì faces.ts
 * không có annotation → thumbnailOrientation suy ra là string, và vài
 * field có thể thiếu ở entry lẻ — adapter tự fallback khi merge.
 */
export interface StaticModInput {
  slug: string;
  name: string;
  author?: string;
  category?: string;
  description?: string;
  thumbnail?: string;
  downloadUrl?: string;
  tags?: string[];
  featured?: boolean;
  version?: string;
  updatedAt?: string;
  thumbnailOrientation?: string;
  videoId?: string;
}

const FALLBACK_AUTHOR = "DungDiBinhLuan";

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
}

function normalizeOrientation(value: unknown): "portrait" | "landscape" {
  return value === "landscape" ? "landscape" : "portrait";
}

/** Record DB tối thiểu hợp lệ để ưu tiên metadata: phải có slug + name. */
function isValidDbRecord(row: DbModRecord): boolean {
  return Boolean(row?.slug?.trim()) && Boolean(row?.name?.trim());
}

type OfferInput = {
  slug: string;
  creditCost?: number | null;
  /** Có đường nhận mod tự động (download_url/public link) hay không */
  hasDownload: boolean;
};

/**
 * Thứ tự quyết định offer:
 *  1. credit_cost > 0 (admin cấu hình) → credit
 *  2. slug gắn sản phẩm checkout (Mix Mods) → product
 *  3. Không có kênh nhận tự động → contact (KHÔNG mặc định thiếu
 *     credit_cost nghĩa là miễn phí — §9.2)
 *  4. Còn lại → free
 */
function resolveOffer({ slug, creditCost, hasDownload }: OfferInput): AccessOffer {
  if (typeof creditCost === "number" && creditCost > 0) {
    return { kind: "credit", creditCost };
  }
  const product = PRODUCT_OFFER_BY_SLUG[slug];
  if (product) {
    return { kind: "product", productId: product.productId, priceVnd: product.priceVnd };
  }
  if (!hasDownload) {
    return { kind: "contact", label: "Liên hệ" };
  }
  return { kind: "free" };
}

function fromStaticMod(mod: StaticModInput): ModSummary {
  const updatedAtTs = toUpdatedAtTs(mod.updatedAt);
  return {
    slug: mod.slug,
    name: mod.name,
    author: mod.author?.trim() || FALLBACK_AUTHOR,
    category: mod.category || "Mod",
    tags: normalizeTags(mod.tags),
    thumbnail: resolveMediaSrc(mod.thumbnail),
    orientation: normalizeOrientation(mod.thumbnailOrientation),
    version: mod.version || "",
    updatedAt: formatUpdatedAt(mod.updatedAt),
    description: mod.description || "",
    featured: mod.featured === true,
    updatedAtTs,
    offer: resolveOffer({
      slug: mod.slug,
      creditCost: null,
      hasDownload: Boolean(mod.downloadUrl?.trim()),
    }),
  };
}

function fromDbMod(row: DbModRecord): ModSummary {
  return {
    slug: row.slug,
    name: row.name,
    author: row.author?.trim() || FALLBACK_AUTHOR,
    category: row.category || "Mod",
    tags: normalizeTags(row.tags),
    thumbnail: resolveMediaSrc(row.thumbnail),
    orientation: normalizeOrientation(row.thumbnail_orientation),
    version: row.version || "",
    updatedAt: formatUpdatedAt(row.updated_at),
    description: row.description || "",
    featured: row.featured === true,
    updatedAtTs: toUpdatedAtTs(row.updated_at),
    offer: resolveOffer({
      slug: row.slug,
      creditCost: row.credit_cost,
      hasDownload: Boolean(row.download_url?.trim()),
    }),
  };
}

/**
 * Merge DB record hợp lệ với static cùng slug: DB ưu tiên,
 * từng field trống/thiếu rơi về static. Offer tính lại trên
 * input đã merge (vd. DB thiếu download_url nhưng static có).
 */
function mergeDbOverStatic(row: DbModRecord, staticMod: StaticModInput): ModSummary {
  const db = fromDbMod(row);
  const fallback = fromStaticMod(staticMod);
  const orientation: ModSummary["orientation"] =
    db.orientation === "landscape" || fallback.orientation === "landscape"
      ? "landscape"
      : "portrait";
  return {
    slug: db.slug,
    name: db.name || fallback.name,
    author: row.author?.trim() ? db.author : fallback.author,
    category: row.category?.trim() ? db.category : fallback.category,
    tags: db.tags.length > 0 ? db.tags : fallback.tags,
    thumbnail: db.thumbnail ?? fallback.thumbnail,
    orientation,
    version: db.version || fallback.version,
    updatedAt: db.updatedAt ?? fallback.updatedAt,
    description: db.description || fallback.description,
    featured: db.featured || fallback.featured,
    updatedAtTs: db.updatedAtTs || fallback.updatedAtTs,
    offer: resolveOffer({
      slug: row.slug,
      creditCost: row.credit_cost,
      // DB row hợp lệ nhưng thiếu download_url → static cùng slug
      // vẫn có thể cung cấp link tải public cho offer.
      hasDownload:
        Boolean(row.download_url?.trim()) || Boolean(staticMod.downloadUrl?.trim()),
    }),
  };
}

/**
 * buildCatalog — hợp nhất static + DB thành danh sách ModSummary
 * đã dedupe theo slug. Gọi trước mọi filter/count/pagination.
 */
export function buildCatalog(
  staticMods: readonly StaticModInput[],
  dbMods: readonly DbModRecord[],
): ModSummary[] {
  const staticBySlug = new Map<string, StaticModInput>();
  for (const mod of staticMods) {
    if (mod?.slug && !staticBySlug.has(mod.slug)) staticBySlug.set(mod.slug, mod);
  }

  const bySlug = new Map<string, ModSummary>();

  // DB trước — record hợp lệ ưu tiên; trùng slug: giữ bản đầu (mới nhất).
  for (const row of dbMods) {
    if (!isValidDbRecord(row) || bySlug.has(row.slug)) continue;
    const staticMod = staticBySlug.get(row.slug);
    bySlug.set(
      row.slug,
      staticMod ? mergeDbOverStatic(row, staticMod) : fromDbMod(row),
    );
  }

  // Static fallback — slug chưa có trong DB.
  for (const mod of staticMods) {
    if (mod?.slug && !bySlug.has(mod.slug)) {
      bySlug.set(mod.slug, fromStaticMod(mod));
    }
  }

  return [...bySlug.values()];
}

/** Haystack chuẩn hóa cho search toàn kho: tên + mô tả + tác giả + tags + category. */
export function buildSearchText(mod: ModSummary): string {
  return normalizeVi(
    `${mod.name} ${mod.description} ${mod.author} ${mod.tags.join(" ")} ${mod.category}`,
  );
}
