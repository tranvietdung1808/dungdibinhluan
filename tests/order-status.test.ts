import { describe, it, expect } from "vitest";

// =====================================================
// Contract test client ↔ API cho luồng thanh toán (A01/A03/A04, T09/T13/T14)
// Shape thật lấy từ:
//   app/api/credit/topup/order/route.ts  → { status, paid, breakdown } ở ROOT
//   app/api/payment/order/route.ts       → record Redis { productId, email, status, code?, ... }
//   app/api/payment/webhook/route.ts     → status ∈ PENDING | CODE_GENERATED | COMPLETED
// =====================================================

import {
  parseTopupOrder,
  parsePaymentOrder,
  buildPaymentSteps,
  isPaymentPaid,
  isContentIssued,
  isEmailSent,
  checkoutPathFor,
  sanitizeInternalPath,
  DEFAULT_CHECKOUT_PATH,
} from "@/lib/payment/order-status";
import { PRODUCTS, getProduct, type ProductId } from "@/lib/payment/config";

describe("parseTopupOrder — /api/credit/topup/order (A01/T09)", () => {
  it("đọc `paid` ở ROOT của response, không phải data.data.paid", () => {
    const order = parseTopupOrder({
      status: "paid",
      paid: true,
      breakdown: {
        amountVnd: 100000,
        creditBase: 100,
        creditBonus: 10,
        creditTotal: 110,
      },
    });
    expect(order).not.toBeNull();
    expect(order!.paid).toBe(true);
    expect(order!.breakdown?.creditTotal).toBe(110);
  });

  it("shape lồng nhau { data: { paid: true } } (giả định cũ) KHÔNG được coi là paid", () => {
    // Regression A01: client cũ đọc data.data.paid — parser mới phải bỏ qua shape này
    const order = parseTopupOrder({ data: { paid: true } });
    expect(order?.paid ?? false).toBe(false);
  });

  it("đơn chưa thanh toán → paid=false", () => {
    const order = parseTopupOrder({
      status: "pending",
      paid: false,
      breakdown: {
        amountVnd: 50000,
        creditBase: 50,
        creditBonus: 0,
        creditTotal: 50,
      },
    });
    expect(order!.paid).toBe(false);
    expect(order!.status).toBe("pending");
  });

  it("payload lỗi { error } hoặc rác → null", () => {
    expect(parseTopupOrder({ error: "Không tìm thấy đơn hàng" })).toBeNull();
    expect(parseTopupOrder(null)).toBeNull();
    expect(parseTopupOrder("paid")).toBeNull();
    expect(parseTopupOrder([])).toBeNull();
  });

  it("thiếu breakdown vẫn parse được paid/status", () => {
    const order = parseTopupOrder({ status: "paid", paid: true });
    expect(order!.paid).toBe(true);
    expect(order!.breakdown).toBeNull();
  });
});

describe("parsePaymentOrder — /api/payment/order", () => {
  it("đọc record order từ Redis trả thẳng ra root", () => {
    const order = parsePaymentOrder({
      productId: "fc26-normal",
      email: "khach@gmail.com",
      status: "COMPLETED",
      paymentLinkId: "abc",
      createdAt: 1725000000000,
      code: "DUNG-XXXX",
      completedAt: 1725000060000,
    });
    expect(order).toMatchObject({
      productId: "fc26-normal",
      email: "khach@gmail.com",
      status: "COMPLETED",
      code: "DUNG-XXXX",
    });
  });

  it("payload lỗi { error } → null", () => {
    expect(parsePaymentOrder({ error: "Order not found" })).toBeNull();
    expect(parsePaymentOrder(null)).toBeNull();
  });
});

describe("tách trạng thái fulfillment (A04/T14)", () => {
  it("PENDING → chưa xác nhận gì", () => {
    expect(isPaymentPaid("PENDING")).toBe(false);
    expect(isContentIssued("PENDING")).toBe(false);
    expect(isEmailSent("PENDING")).toBe(false);
  });

  it("CODE_GENERATED → đã trả tiền + đã cấp nội dung nhưng email CHƯA gửi", () => {
    expect(isPaymentPaid("CODE_GENERATED")).toBe(true);
    expect(isContentIssued("CODE_GENERATED")).toBe(true);
    // T14: không được nói "email đã gửi"
    expect(isEmailSent("CODE_GENERATED")).toBe(false);
  });

  it("COMPLETED → cả 3 bước đã xong", () => {
    expect(isPaymentPaid("COMPLETED")).toBe(true);
    expect(isContentIssued("COMPLETED")).toBe(true);
    expect(isEmailSent("COMPLETED")).toBe(true);
  });

  it("buildPaymentSteps — CODE_GENERATED có bước email ở trạng thái issue", () => {
    const steps = buildPaymentSteps(
      "CODE_GENERATED",
      getProduct("fc26-normal"),
    );
    expect(steps.map((s) => [s.key, s.state])).toEqual([
      ["paid", "done"],
      ["content", "done"],
      ["email", "issue"],
    ]);
    const emailStep = steps.find((s) => s.key === "email")!;
    expect(emailStep.label).not.toContain("đã gửi");
  });

  it("buildPaymentSteps — COMPLETED có cả 3 bước done", () => {
    const steps = buildPaymentSteps("COMPLETED", getProduct("mix-mods"));
    expect(steps.every((s) => s.state === "done")).toBe(true);
  });

  it("buildPaymentSteps — PENDING tất cả waiting", () => {
    const steps = buildPaymentSteps("PENDING", null);
    expect(steps.every((s) => s.state === "waiting")).toBe(true);
  });
});

describe("fulfillment trong product config (A03/T13)", () => {
  it("mọi sản phẩm có fulfillment hợp lệ và checkoutPath nội bộ", () => {
    for (const id of Object.keys(PRODUCTS) as ProductId[]) {
      const p = PRODUCTS[id];
      expect(["code", "link", "manual"]).toContain(p.fulfillment.kind);
      expect(p.fulfillment.receiveText.length).toBeGreaterThan(0);
      expect(p.fulfillment.steps.length).toBeGreaterThanOrEqual(2);
      expect(p.checkoutPath.startsWith("/")).toBe(true);
    }
  });

  it("mix-mods (noCode) nhận LINK tải — không hứa mã kích hoạt", () => {
    const p = getProduct("mix-mods")!;
    expect(p.noCode).toBe(true);
    expect(p.fulfillment.kind).toBe("link");
    expect(p.fulfillment.receiveText).toContain("Link tải");
    // Copy không được hứa cấp mã/code game
    expect(p.fulfillment.receiveText).not.toMatch(/mã kích hoạt được gửi/i);
    expect(p.fulfillment.steps.join(" ")).not.toMatch(/nhập mã/i);
  });

  it("sản phẩm có noCode=true thì fulfillment.kind không được là 'code'", () => {
    for (const id of Object.keys(PRODUCTS) as ProductId[]) {
      const p = PRODUCTS[id];
      if (p.noCode) expect(p.fulfillment.kind).not.toBe("code");
    }
  });

  it("sản phẩm FC26 dùng fulfillment kind 'code'", () => {
    expect(getProduct("fc26-normal")!.fulfillment.kind).toBe("code");
    expect(getProduct("fc26-mods")!.fulfillment.kind).toBe("code");
  });

  it("FC27 có giá server 180.000đ và dùng mã truy cập riêng", () => {
    const product = getProduct("fc27-standard")!;
    expect(product.price).toBe(180000);
    expect(product.codePrefix).toBe("FC27");
    expect(product.fulfillment.kind).toBe("code");
    expect(product.returnUrl).toBe("/games/fc27");
  });
});

describe("checkoutPathFor — đích quay lại của /payment/cancel (T15)", () => {
  it("map đúng checkout từng sản phẩm", () => {
    expect(checkoutPathFor("fc26-normal")).toBe(
      "/games/fc26/payment?edition=normal",
    );
    expect(checkoutPathFor("fc26-mods")).toBe(
      "/games/fc26/payment?edition=mods",
    );
    expect(checkoutPathFor("mix-mods")).toBe("/mods/mix-mods-fc26/payment");
    expect(checkoutPathFor("fc27-standard")).toBe("/games/fc27/payment");
  });

  it("productId lạ/thiếu → fallback trang chọn phiên bản", () => {
    expect(checkoutPathFor("khong-ton-tai")).toBe(DEFAULT_CHECKOUT_PATH);
    expect(checkoutPathFor(null)).toBe(DEFAULT_CHECKOUT_PATH);
    expect(checkoutPathFor(undefined)).toBe(DEFAULT_CHECKOUT_PATH);
  });
});

describe("sanitizeInternalPath — ?next= sau nạp credit (§5.3, open-redirect guard)", () => {
  it("chấp nhận path nội bộ, giữ query/hash", () => {
    expect(sanitizeInternalPath("/mods/mix-mods-fc26")).toBe(
      "/mods/mix-mods-fc26",
    );
    expect(sanitizeInternalPath("/account?section=credit")).toBe(
      "/account?section=credit",
    );
    expect(sanitizeInternalPath("/mods/x#download")).toBe("/mods/x#download");
  });

  it("chặn open redirect: external URL và protocol-relative", () => {
    expect(sanitizeInternalPath("https://evil.example")).toBeNull();
    expect(sanitizeInternalPath("http://evil.example/x")).toBeNull();
    expect(sanitizeInternalPath("//evil.example/path")).toBeNull();
    expect(sanitizeInternalPath("javascript:alert(1)")).toBeNull();
    expect(sanitizeInternalPath("mods/x")).toBeNull();
  });

  it("chặn backslash, whitespace, control char và input rác", () => {
    expect(sanitizeInternalPath("/\\evil")).toBeNull();
    expect(sanitizeInternalPath("/path with space")).toBeNull();
    expect(sanitizeInternalPath("/path\nnewline")).toBeNull();
    expect(sanitizeInternalPath("")).toBeNull();
    expect(sanitizeInternalPath(null)).toBeNull();
    expect(sanitizeInternalPath(undefined)).toBeNull();
    expect(sanitizeInternalPath("  /mods/x  ")).toBe("/mods/x");
  });
});
