// =====================================================
// lib/catalog — model public thống nhất cho danh mục mod
// Blueprint: UI-UPGRADE-BLUEPRINT.md §20.2 (ModSummary + AccessOffer)
// An toàn import cả client lẫn server (không phụ thuộc SDK nặng).
// =====================================================

import type { ProductId } from "@/lib/payment/config";

/**
 * AccessOffer — UI khỏi suy luận giá từ thiếu trường hoặc tên tag.
 *  - free:    có link tải mở, không yêu cầu credit/sản phẩm
 *  - credit:  mở khóa bằng credit (giá từ mod_unlock_prices)
 *  - product: sản phẩm bán qua checkout riêng (vd. Mix Mods FC 26)
 *  - contact: chưa có kênh nhận tự động → người dùng liên hệ admin
 */
export type AccessOffer =
  | { kind: "free" }
  | { kind: "credit"; creditCost: number }
  | { kind: "product"; productId: ProductId; priceVnd: number }
  | { kind: "contact"; label: string };

/**
 * ModSummary — DTO public tối thiểu cho card/catalog.
 * Không chứa link tải premium hay nội dung protected (§20.2).
 *
 * Trường mở rộng ngoài blueprint (phục vụ UI, vẫn public-safe):
 *  - featured:     cờ nổi bật từ static/DB — catalog dùng cho Featured block
 *  - updatedAtTs:  updatedAt đã parse thành timestamp (0 = không parse được)
 *                  để sort "mới cập nhật" không phải parse lại mỗi lần render.
 */
export interface ModSummary {
  slug: string;
  name: string;
  author: string;
  category: string;
  tags: string[];
  thumbnail: string | null;
  orientation: "portrait" | "landscape";
  version: string;
  updatedAt: string | null;
  description: string;
  offer: AccessOffer;
  featured: boolean;
  updatedAtTs: number;
}

/**
 * DbModRecord — shape tối thiểu của 1 row mods trả từ /api/mods
 * và từ SSR (page.tsx → listModsPublic + getCreditPricesMap).
 * Các field optional (long_description, download_url, video_id)
 * tồn tại trong payload nhưng catalog không đọc trực tiếp —
 * giữ trong type để page.tsx/adapter không vỡ excess-property check.
 */
export interface DbModRecord {
  id: string;
  slug: string;
  name: string;
  author: string;
  category: string;
  version: string;
  updated_at: string;
  description: string | null;
  long_description?: string | null;
  thumbnail: string | null;
  download_url?: string | null;
  tags: string[] | null;
  thumbnail_orientation: string | null;
  featured: boolean;
  video_id?: string | null;
  created_at: string;
  /** Giá mở khóa credit — null/undefined = không yêu cầu credit */
  credit_cost?: number | null;
}

/** Taxonomy filter cố định của catalog (§9.1 wireframe). "Tất cả" = pseudo-tag UI. */
export const MOD_FILTER_TAGS = [
  "Tất cả",
  "Faces",
  "Kits",
  "Gameplay",
  "Đồ họa",
  "Cơ chế game",
] as const;

export type ModFilterTag = (typeof MOD_FILTER_TAGS)[number];
export const DEFAULT_TAG: ModFilterTag = "Tất cả";

export type ModSortKey = "updated" | "name";
export const DEFAULT_SORT: ModSortKey = "updated";
