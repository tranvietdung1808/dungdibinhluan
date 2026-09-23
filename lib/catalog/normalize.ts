// =====================================================
// lib/catalog/normalize — chuẩn hóa chuỗi/ngày/ảnh cho catalog
// Thuần hàm, chạy được cả client lẫn server.
// =====================================================

import { parseFlexibleDate } from "@/lib/related-content";

/**
 * normalizeVi — bỏ dấu tiếng Việt để tìm kiếm không dấu (B01).
 * NFD tách dấu khỏi chữ → xóa combining marks; riêng đ/Đ không
 * nằm trong dạng composed nên phải replace thủ công.
 */
export function normalizeVi(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** So khớp tìm kiếm: haystack/needle đều qua normalizeVi. */
export function viIncludes(haystack: string, needle: string): boolean {
  return normalizeVi(haystack).includes(normalizeVi(needle));
}

/** So sánh tên A–Z theo locale vi, numeric để "V2" < "V10". */
export function compareViName(a: string, b: string): number {
  return a.localeCompare(b, "vi", { sensitivity: "base", numeric: true });
}

/**
 * dedupeBySlug — một slug chỉ một item; bản ghi đầu tiên thắng.
 * Adapter gọi với DB trước → DB ưu tiên, static làm fallback (B02, §9.4).
 */
export function dedupeBySlug<T extends { slug: string }>(items: readonly T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    if (!item?.slug) continue;
    if (!seen.has(item.slug)) seen.set(item.slug, item);
  }
  return [...seen.values()];
}

/**
 * Parse updatedAt ("dd/mm/yyyy" hoặc ISO) → timestamp cho sort.
 * 0 = không parse được → xếp cuối khi sort mới cập nhật.
 */
export function toUpdatedAtTs(value: string | null | undefined): number {
  return parseFlexibleDate(value);
}

/** Hiển thị ngày cập nhật thống nhất dd/mm/yyyy; không parse được → giữ nguyên. */
export function formatUpdatedAt(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const ts = parseFlexibleDate(value);
  if (!ts) return value.trim();
  return new Date(ts).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** "169000" → "169.000đ" */
export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

// -----------------------------------------------------
// Ảnh thumbnail từ DB có thể là URL R2 không public →
// phải đi qua proxy cùng origin /api/media/<key>.
// ĐỒNG BỘ với utils/r2.ts resolveThumbnailSrc — bản này
// tách riêng để adapter dùng được client-side mà không
// kéo @aws-sdk/client-s3 vào client bundle.
// -----------------------------------------------------
const UPLOADED_OBJECT_KEY = /^[0-9]+-[a-z0-9]+\.[a-z0-9]+$/i;

export function resolveMediaSrc(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (u.startsWith("/api/media/")) return u;
  if (u.startsWith("/")) return u;

  try {
    const { pathname } = new URL(u);
    const key = pathname.split("/").filter(Boolean).pop() ?? "";
    if (UPLOADED_OBJECT_KEY.test(key)) {
      return `/api/media/${encodeURIComponent(key)}`;
    }
  } catch {
    return u;
  }
  return u;
}
