// =====================================================
// app/cau-thu/components/catalogQuery — URL state helpers
// Pure constants/functions: an toàn import từ client LẪN server.
//
// LƯU Ý: KHÔNG import CATALOG_PARAM_KEYS từ "@/lib/players/params"
// vào client bundle — file đó kéo lib/players/normalize → node:crypto
// và sẽ vỡ build phía browser. PARAM bên dưới là mirror 1:1; satisfies
// bảo đảm không thiếu key khi canonical đổi (đổi tên param → sửa cả 2).
// =====================================================

import type { CATALOG_PARAM_KEYS } from "@/lib/players/params";
import type { CatalogSort } from "@/lib/players/types";

/** Tên param canonical trên URL — mirror của CATALOG_PARAM_KEYS. */
export const PARAM = {
  search: "q",
  position: "vi-tri",
  team: "clb",
  league: "giai",
  nationality: "qt",
  gender: "gioi-tinh",
  minOverall: "ovr-min",
  maxOverall: "ovr-max",
  minPotential: "pot-min",
  maxPotential: "pot-max",
  minValue: "gia-min",
  maxValue: "gia-max",
  minWage: "luong-min",
  maxWage: "luong-max",
  sort: "sap-xep",
  page: "trang",
} satisfies Record<keyof typeof CATALOG_PARAM_KEYS, string>;

/** Tất cả tên param catalog — dùng cho "Xóa bộ lọc". */
export const ALL_PARAM_KEYS: readonly string[] = Object.values(PARAM);

/** Nhãn sắp xếp ↔ giá trị CATALOG_SORTS (§9.1). */
export const SORT_OPTIONS: ReadonlyArray<{
  value: CatalogSort;
  label: string;
}> = [
  { value: "overall", label: "Tổng quát" },
  { value: "potential", label: "Tiềm năng" },
  { value: "name", label: "Tên A–Z" },
  { value: "value_desc", label: "Giá cao → thấp" },
  { value: "value_asc", label: "Giá thấp → cao" },
  { value: "wage_desc", label: "Lương cao → thấp" },
  { value: "wage_asc", label: "Lương thấp → cao" },
];

/** Set param khi có giá trị, xóa khi rỗng/null — giữ URL sạch. */
export function setOrDelete(
  sp: URLSearchParams,
  key: string,
  value: string | null | undefined
): void {
  if (value == null || value === "") {
    sp.delete(key);
  } else {
    sp.set(key, value);
  }
}
