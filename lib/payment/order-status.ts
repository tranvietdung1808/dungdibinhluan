// =====================================================
// lib/payment/order-status — parse response order thuần (pure)
// Nguồn contract:
//   GET /api/credit/topup/order → 200 { status, paid, breakdown:{amountVnd,creditBase,creditBonus,creditTotal} }
//                                 lỗi { error } (400/401/404/429/500)
//   GET /api/payment/order      → 200 = record order trong Redis:
//                                 { productId, email, status, paymentLinkId, createdAt, code?, completedAt? }
//                                 404 { error: "Order not found" }
// Status đơn payment (webhook ghi):
//   PENDING        → chưa ghi nhận thanh toán
//   CODE_GENERATED → đã thanh toán + đã cấp nội dung, email CHƯA gửi được (A04/T14)
//   COMPLETED      → đã thanh toán + cấp nội dung + email đã gửi
// =====================================================

import { getProduct, type ProductConfig } from "./config";

export const SUPPORT_URL = "https://web.facebook.com/dungbinhluan/";
export const DEFAULT_CHECKOUT_PATH = "/games/fc26/select";

// ---------- /api/credit/topup/order ----------

export interface TopupBreakdown {
  amountVnd: number;
  creditBase: number;
  creditBonus: number;
  creditTotal: number;
}

export interface TopupOrder {
  status: string;
  paid: boolean;
  breakdown: TopupBreakdown | null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Parse body /api/credit/topup/order.
 * A01: `paid` nằm ở ROOT của response, KHÔNG nằm trong `data.data`.
 * Trả null nếu payload không đúng shape (lỗi { error } hoặc response lạ).
 */
export function parseTopupOrder(json: unknown): TopupOrder | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.status !== "string") return null;

  let breakdown: TopupBreakdown | null = null;
  const b = obj.breakdown;
  if (b && typeof b === "object" && !Array.isArray(b)) {
    const rec = b as Record<string, unknown>;
    const amountVnd = asNumber(rec.amountVnd);
    const creditBase = asNumber(rec.creditBase);
    const creditBonus = asNumber(rec.creditBonus);
    const creditTotal = asNumber(rec.creditTotal);
    if (amountVnd !== null && creditBase !== null && creditBonus !== null && creditTotal !== null) {
      breakdown = { amountVnd, creditBase, creditBonus, creditTotal };
    }
  }

  return { status: obj.status, paid: obj.paid === true, breakdown };
}

// ---------- /api/payment/order ----------

export interface PaymentOrder {
  productId: string | null;
  email: string | null;
  status: string;
  code: string | null;
}

export function parsePaymentOrder(json: unknown): PaymentOrder | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  if (typeof obj.status !== "string") return null;
  return {
    productId: typeof obj.productId === "string" ? obj.productId : null,
    email: typeof obj.email === "string" ? obj.email : null,
    status: obj.status,
    code: typeof obj.code === "string" && obj.code !== "" ? obj.code : null,
  };
}

/** Thanh toán đã được webhook ghi nhận (kể cả khi email lỗi). */
export function isPaymentPaid(status: string): boolean {
  return status === "COMPLETED" || status === "CODE_GENERATED";
}

/** Nội dung (mã kích hoạt hoặc link) đã được cấp cho đơn. */
export function isContentIssued(status: string): boolean {
  return status === "COMPLETED" || status === "CODE_GENERATED";
}

/**
 * Chỉ COMPLETED mới được nói "email đã gửi" (A04/T14).
 * CODE_GENERATED = email gửi thất bại — không được hiển thị là đã gửi.
 */
export function isEmailSent(status: string): boolean {
  return status === "COMPLETED";
}

// ---------- Checklist 3 bước cho /payment/success ----------

export type StepState = "done" | "waiting" | "issue";

export interface ProgressStep {
  key: "paid" | "content" | "email";
  label: string;
  state: StepState;
}

function contentLabel(product: ProductConfig | null): string {
  switch (product?.fulfillment.kind) {
    case "link":
      return "Link tải đã sẵn sàng";
    case "code":
      return "Mã kích hoạt đã được tạo";
    default:
      return "Nội dung đã được cấp";
  }
}

/**
 * Tách 3 trạng thái độc lập (A04):
 * thanh toán xác nhận → nội dung đã cấp → email đã gửi.
 * Bước email chỉ "done" khi server báo COMPLETED.
 */
export function buildPaymentSteps(status: string, product: ProductConfig | null): ProgressStep[] {
  const paid = isPaymentPaid(status);
  const issued = isContentIssued(status);
  const emailSent = isEmailSent(status);
  return [
    { key: "paid", label: "Thanh toán đã xác nhận", state: paid ? "done" : "waiting" },
    { key: "content", label: contentLabel(product), state: issued ? "done" : "waiting" },
    {
      key: "email",
      label: emailSent ? "Email đã gửi" : issued ? "Email chưa gửi được" : "Gửi email",
      state: emailSent ? "done" : issued ? "issue" : "waiting",
    },
  ];
}

// ---------- Điều hướng quay lại checkout ----------

/**
 * Đích quay lại cho /payment/cancel (T15).
 * Ưu tiên productId hợp lệ (query `product` hoặc tra từ order); fallback trang chọn phiên bản.
 */
export function checkoutPathFor(productId: string | null | undefined): string {
  const product = productId ? getProduct(productId) : null;
  return product?.checkoutPath ?? DEFAULT_CHECKOUT_PATH;
}

export function productForOrder(order: PaymentOrder | null): ProductConfig | null {
  return order?.productId ? getProduct(order.productId) : null;
}

// ---------- Redirect nội bộ an toàn (§5.3) ----------

/**
 * Chỉ chấp nhận đường dẫn nội bộ `/...` — loại protocol-relative `//`,
 * backslash, scheme `xxx:` và ký tự điều khiển. Trả null nếu không hợp lệ.
 */
export function sanitizeInternalPath(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const p = raw.trim();
  if (!p.startsWith("/") || p.startsWith("//")) return null;
  if (p.includes("\\") || p.includes(":") || /[\s]/.test(p)) return null;
  return p;
}
