// =====================================================
// mod-access — logic THUẦN cho ma trận trạng thái truy cập
// mod credit (UI-UPGRADE-BLUEPRINT §10.2, test T04–T07).
// Tách khỏi component để unit-test không cần DOM/network.
// =====================================================

/**
 * AccessPhase — 11 trạng thái của vùng hành động trên trang chi tiết mod:
 *
 * | Phase            | §10.2                                      |
 * |------------------|---------------------------------------------|
 * | checking         | Đang kiểm tra quyền / auth / số dư          |
 * | check-error      | Không kiểm tra được quyền (lỗi mạng/API)    |
 * | guest            | Khách chưa đăng nhập (T04)                  |
 * | session-expired  | Có ngữ cảnh user nhưng phiên đã hết hạn     |
 * | balance-loading  | Đã đăng nhập, số dư đang tải                |
 * | balance-error    | Số dư chưa tải được — KHÔNG giả định = 0    |
 * | insufficient     | Thiếu credit (T05)                          |
 * | ready            | Đủ credit — sẵn sàng mở khóa                |
 * | unlocking        | Đang trừ credit — disable chống double (T06)|
 * | unlocked         | Đã mở (content đang tải hoặc đã sẵn sàng)   |
 * | content-error    | Đã mở nhưng nội dung lỗi — retry, KHÔNG thu |
 * |                  | lại tiền (T07)                              |
 */
export type AccessPhase =
  | "checking"
  | "check-error"
  | "guest"
  | "session-expired"
  | "balance-loading"
  | "balance-error"
  | "insufficient"
  | "ready"
  | "unlocking"
  | "unlocked"
  | "content-error";

export interface AccessInput {
  /** useAuth đã resolve xong session lần đầu */
  authResolved: boolean;
  /** Có session đăng nhập hợp lệ */
  isAuthenticated: boolean;
  /** Context báo user đã login nhưng token/session thực tế hết hạn */
  sessionExpired: boolean;
  /** Kết quả GET /api/mods/[slug]/access */
  access: "checking" | "locked" | "unlocked" | "error";
  /** Trạng thái đọc số dư credit (idle = chưa bắt đầu) */
  balance: "idle" | "loading" | "ok" | "error";
  /** Chỉ có nghĩa khi balance === "ok" */
  hasEnoughCredit: boolean | null;
  /** Đang POST trừ credit */
  unlocking: boolean;
  /** Trạng thái tải nội dung protected sau khi có quyền */
  content: "idle" | "loading" | "ready" | "error";
}

/**
 * deriveAccessPhase — suy ra 1 trạng thái hiển thị duy nhất.
 * Thứ tự ưu tiên: lỗi kiểm tra quyền > đã mở > đang kiểm tra >
 * guest/hết phiên > đang mở > số dư.
 */
export function deriveAccessPhase(input: AccessInput): AccessPhase {
  if (input.access === "error") return "check-error";
  if (input.access === "unlocked") {
    // T07: quyền đã có nhưng content lỗi → báo lỗi nội dung,
    // KHÔNG quay về trạng thái trả tiền.
    return input.content === "error" ? "content-error" : "unlocked";
  }
  if (input.access === "checking" || !input.authResolved) return "checking";

  // access === 'locked'
  // sessionExpired thắng cả khi context còn user object cũ (phiên thật
  // đã mất nhưng useAuth chưa kịp clear) — không rơi về flow số dư.
  if (input.sessionExpired) return "session-expired";
  if (!input.isAuthenticated) return "guest";
  // T06: giữ trạng thái đang mở để UI disable mọi submit trùng
  if (input.unlocking) return "unlocking";
  switch (input.balance) {
    case "error":
      return "balance-error";
    case "ok":
      return input.hasEnoughCredit ? "ready" : "insufficient";
    default:
      return "balance-loading";
  }
}

// ---------- Tính tiền credit (pure) ----------

/** Số credit còn thiếu; null khi chưa biết số dư. */
export function creditShortfall(
  creditCost: number,
  balance: number | null,
): number | null {
  if (balance === null) return null;
  return Math.max(0, creditCost - balance);
}

/** Số dư dự kiến sau khi mở — chỉ gọi khi đủ credit. */
export function balanceAfterUnlock(balance: number, creditCost: number): number {
  return Math.max(0, balance - creditCost);
}

// ---------- Return-path an toàn (§5.3) ----------

/** Chỉ nhận đường dẫn nội bộ "/..."; loại "//host" protocol-relative. */
export function isInternalPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//");
}

/**
 * Link nạp credit kèm đường về đúng mod (T05, §5.3).
 * `next` chỉ nhận path nội bộ — slug đã encodeURIComponent.
 */
export function topupHrefForMod(slug: string): string {
  const back = `/mods/${encodeURIComponent(slug)}`;
  return `/credit?next=${encodeURIComponent(back)}`;
}

// ---------- Parse response (contract guards) ----------

export interface ModAccessResult {
  unlocked: boolean;
  modId: string | null;
  creditCost: number | null;
}

/** Parse GET /api/mods/[slug]/access → null nếu payload sai shape. */
export function parseAccessResponse(json: unknown): ModAccessResult | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.unlocked !== "boolean") return null;
  return {
    unlocked: obj.unlocked,
    modId: typeof obj.modId === "string" ? obj.modId : null,
    creditCost: typeof obj.creditCost === "number" ? obj.creditCost : null,
  };
}

/** Nội dung protected sau khi đã mở — shape tối thiểu UI cần. */
export interface UnlockedModContent {
  slug: string;
  name: string;
  author: string;
  category: string;
  version: string;
  description: string | null;
  long_description: string | null;
  thumbnail: string | null;
  download_url: string | null;
  tags: string[];
}

/**
 * Parse GET /api/mods/[slug]/content. API trả object mod trần
 * (không bọc data) — chấp nhận cả { data: {...} } phòng thay đổi.
 */
export function parseUnlockedContent(json: unknown): UnlockedModContent | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  let obj = json as Record<string, unknown>;
  // Tương thích: nếu response bọc trong { data: {...} } thì mở ra
  const inner = obj.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    obj = inner as Record<string, unknown>;
  }
  if (typeof obj.slug !== "string" || typeof obj.name !== "string") return null;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    slug: obj.slug,
    name: obj.name,
    author: str(obj.author) ?? "",
    category: str(obj.category) ?? "",
    version: str(obj.version) ?? "",
    description: str(obj.description),
    long_description: str(obj.long_description),
    thumbnail: str(obj.thumbnail),
    download_url: str(obj.download_url),
    tags: Array.isArray(obj.tags)
      ? obj.tags.filter((t): t is string => typeof t === "string")
      : [],
  };
}

/** Kết quả POST /api/credit/spend/mod-unlock (200). */
export interface SpendResult {
  modId: string;
  modSlug: string | null;
  modName: string | null;
  downloadUrl: string | null;
  alreadyUnlocked: boolean;
  creditDeducted: number | null;
  balanceRemaining: number | null;
}

export function parseSpendResult(json: unknown): SpendResult | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.modId !== "string") return null;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    modId: obj.modId,
    modSlug: str(obj.modSlug),
    modName: str(obj.modName),
    downloadUrl: str(obj.downloadUrl),
    alreadyUnlocked: obj.alreadyUnlocked === true,
    creditDeducted: num(obj.creditDeducted),
    balanceRemaining: num(obj.balanceRemaining),
  };
}
