export type ProductId =
  | "fc27-standard"
  | "fc26-normal"
  | "fc26-mods"
  | "mix-mods";

/**
 * Cách khách nhận nội dung sau khi thanh toán (A03).
 * Dùng xuyên suốt checkout → trang kết quả → email để không hứa sai loại nội dung.
 * - code:   sản phẩm cấp mã kích hoạt gửi qua email (FC26 editions)
 * - link:   sản phẩm cấp link tải gửi qua email, KHÔNG có mã kích hoạt (Mix Mods)
 * - manual: nội dung bàn giao thủ công qua hỗ trợ
 */
export type FulfillmentKind = "code" | "link" | "manual";

export interface ProductFulfillment {
  kind: FulfillmentKind;
  /** Câu ngắn mô tả cách nhận — hiển thị ở checkout và màn kết quả */
  receiveText: string;
  /** Các bước sau thanh toán theo đúng thứ tự */
  steps: string[];
}

export interface ProductConfig {
  id: ProductId;
  name: string;
  price: number;
  codePrefix: "FC27" | "DUNG" | "MODS";
  returnUrl: string;
  codeEntryUrl: string;
  /** Trang checkout nội bộ của sản phẩm — đích quay lại từ /payment/cancel (T15) */
  checkoutPath: string;
  fulfillment: ProductFulfillment;
  noCode?: boolean;
  directDownloadUrl?: string;
}

const BASE = "https://www.dungdibinhluan.com";

export const PRODUCTS: Record<ProductId, ProductConfig> = {
  "fc27-standard": {
    id: "fc27-standard",
    name: "EA FC 27 Standard Edition",
    price: 180000,
    codePrefix: "FC27",
    returnUrl: "/games/fc27",
    codeEntryUrl: `${BASE}/games/fc27`,
    checkoutPath: "/games/fc27/payment",
    fulfillment: {
      kind: "code",
      receiveText:
        "Mã truy cập FC 27 được gửi qua email sau khi thanh toán được xác nhận.",
      steps: [
        "Xác nhận thanh toán qua QR ngân hàng",
        "Nhận mã truy cập FC 27 qua email",
        "Nhập mã tại trang FC 27 để mở khu tải game",
      ],
    },
  },
  "fc26-normal": {
    id: "fc26-normal",
    name: "FC26 Standard Edition",
    price: 69000,
    codePrefix: "DUNG",
    returnUrl: "/games/fc26?edition=normal",
    codeEntryUrl: `${BASE}/games/fc26?edition=normal`,
    checkoutPath: "/games/fc26/payment?edition=normal",
    fulfillment: {
      kind: "code",
      receiveText:
        "Mã kích hoạt được gửi qua email sau khi thanh toán được xác nhận.",
      steps: [
        "Xác nhận thanh toán qua QR ngân hàng",
        "Nhận mã kích hoạt qua email",
        "Nhập mã tại trang FC 26 để tải và cài đặt game",
      ],
    },
  },
  "fc26-mods": {
    id: "fc26-mods",
    name: "FC26 Full Mods Edition",
    price: 199000,
    codePrefix: "MODS",
    returnUrl: "/games/fc26?edition=mods",
    codeEntryUrl: `${BASE}/games/fc26?edition=mods`,
    checkoutPath: "/games/fc26/payment?edition=mods",
    fulfillment: {
      kind: "code",
      receiveText:
        "Mã kích hoạt được gửi qua email sau khi thanh toán được xác nhận.",
      steps: [
        "Xác nhận thanh toán qua QR ngân hàng",
        "Nhận mã kích hoạt qua email",
        "Nhập mã tại trang FC 26 để tải game và mod",
      ],
    },
  },
  "mix-mods": {
    id: "mix-mods",
    name: "Mix Mods FC26 2025-2026",
    price: 169000,
    codePrefix: "MODS",
    returnUrl: "/mods/mix-mods-fc26",
    codeEntryUrl: `${BASE}/mods/mix-mods-fc26`,
    checkoutPath: "/mods/mix-mods-fc26/payment",
    fulfillment: {
      kind: "link",
      receiveText:
        "Link tải được gửi qua email sau khi thanh toán được xác nhận. Sản phẩm này không dùng mã kích hoạt.",
      steps: [
        "Xác nhận thanh toán qua QR ngân hàng",
        "Nhận link tải qua email",
        "Tải file và cài đặt theo hướng dẫn trên trang Mix Mods",
      ],
    },
    noCode: true,
    directDownloadUrl:
      "https://drive.google.com/file/d/1PSa5JSNOyEZlKJ2onJksdM9t-1fz_trh/view?usp=drive_link",
  },
};

export function getProduct(id: string): ProductConfig | null {
  return PRODUCTS[id as ProductId] ?? null;
}
