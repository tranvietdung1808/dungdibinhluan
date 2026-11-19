export type ProductId =
  | "fc27-standard"
  | "fc27-viet-hoa"
  | "fc27-combo"
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
  /** Hiển thị dạng "donate để được hỗ trợ" thay vì "mua/thanh toán" */
  donation?: boolean;
  /** Giá gốc để gạch ngang khi đang sale (chỉ hiển thị, không dùng để thu tiền) */
  listPrice?: number;
  /** Quyền truy cập mà mã cấp ra mở được (mặc định = id). Combo dùng quyền FC 27 Standard. */
  accessProductId?: ProductId;
  /** Ghi chú thêm trong email + trang kết quả, `{orderCode}` được thay bằng mã đơn */
  bonusNote?: string;
}

const BASE = "https://www.dungdibinhluan.com";

export const PRODUCTS: Record<ProductId, ProductConfig> = {
  "fc27-standard": {
    id: "fc27-standard",
    name: "EA FC 27 Standard Edition",
    price: 99000,
    listPrice: 180000,
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
  "fc27-viet-hoa": {
    id: "fc27-viet-hoa",
    name: "Việt hóa EA FC 27",
    price: 99000,
    codePrefix: "FC27",
    returnUrl: "/viet-hoa-fc27",
    codeEntryUrl: `${BASE}/viet-hoa-fc27`,
    checkoutPath: "/viet-hoa-fc27/donate",
    fulfillment: {
      kind: "manual",
      receiveText:
        "Sau khi donate, nhắn fanpage kèm mã đơn để được cài bản Việt hóa FC 27 qua UltraViewer.",
      steps: [
        "Donate 99.000đ qua QR ngân hàng",
        "Nhắn fanpage DungDiBinhLuan kèm mã đơn hoặc ảnh giao dịch",
        "Gửi ID và mật khẩu UltraViewer — admin cài Việt hóa trực tiếp trên máy bạn",
      ],
    },
    noCode: true,
    donation: true,
  },
  "fc27-combo": {
    id: "fc27-combo",
    name: "Combo EA FC 27 + Việt hóa",
    price: 149000,
    listPrice: 279000,
    codePrefix: "FC27",
    accessProductId: "fc27-standard",
    returnUrl: "/games/fc27",
    codeEntryUrl: `${BASE}/games/fc27`,
    checkoutPath: "/sieu-sale/combo",
    fulfillment: {
      kind: "code",
      receiveText:
        "Mã truy cập FC 27 được gửi qua email; nhắn fanpage kèm mã đơn để được cài Việt hóa qua UltraViewer.",
      steps: [
        "Xác nhận thanh toán qua QR ngân hàng",
        "Nhận mã truy cập FC 27 qua email, nhập mã tại trang FC 27 để tải game",
        "Nhắn fanpage kèm mã đơn + ID UltraViewer — admin cài game và Việt hóa cho bạn",
      ],
    },
    bonusNote:
      "Combo đã gồm Việt hóa FC 27: nhắn fanpage DungDiBinhLuan kèm mã đơn #{orderCode} và ID UltraViewer để admin cài Việt hóa cho bạn.",
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

/** Mã cấp ra mở quyền của sản phẩm nào (combo → fc27-standard) */
export function accessProductIdOf(product: ProductConfig): ProductId {
  return product.accessProductId ?? product.id;
}

/** Sản phẩm cấp mã truy cập FC 27 (Standard hoặc combo) */
export function grantsFC27Code(product: ProductConfig | null | undefined): boolean {
  return (
    !!product &&
    product.fulfillment.kind === "code" &&
    accessProductIdOf(product) === "fc27-standard"
  );
}

export function bonusNoteFor(
  product: ProductConfig | null | undefined,
  orderCode: string | number,
): string | null {
  return product?.bonusNote?.replace("{orderCode}", String(orderCode)) ?? null;
}
