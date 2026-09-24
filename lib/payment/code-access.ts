export interface StoredAccessCode {
  type: string;
  productId?: string | null;
}

/**
 * Mã mới phải khớp tuyệt đối productId. Mã FC 26 cũ chưa lưu productId
 * được giữ tương thích theo type để khách cũ không mất quyền tải.
 */
export function codeMatchesProduct(
  stored: StoredAccessCode,
  expectedProductId: string | null,
): boolean {
  if (!expectedProductId) return true;
  if (stored.productId) return stored.productId === expectedProductId;

  if (!expectedProductId.startsWith("fc26-")) return false;
  if (expectedProductId === "fc26-mods") return stored.type === "mods";
  if (expectedProductId === "fc26-normal") return stored.type !== "mods";
  return false;
}
