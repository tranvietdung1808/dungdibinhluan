import { describe, expect, it } from "vitest";
import { codeMatchesProduct } from "@/lib/payment/code-access";

describe("FC27 product-bound access code", () => {
  it("chỉ chấp nhận mã gắn đúng sản phẩm FC27", () => {
    const code = { type: "normal", productId: "fc27-standard" };
    expect(codeMatchesProduct(code, "fc27-standard")).toBe(true);
    expect(codeMatchesProduct(code, "fc26-normal")).toBe(false);
  });

  it("không cho mã FC26 mở FC27", () => {
    expect(
      codeMatchesProduct(
        { type: "normal", productId: "fc26-normal" },
        "fc27-standard",
      ),
    ).toBe(false);
    expect(codeMatchesProduct({ type: "normal" }, "fc27-standard")).toBe(false);
  });

  it("giữ tương thích mã FC26 cũ theo loại quyền", () => {
    expect(codeMatchesProduct({ type: "normal" }, "fc26-normal")).toBe(true);
    expect(codeMatchesProduct({ type: "mods" }, "fc26-mods")).toBe(true);
    expect(codeMatchesProduct({ type: "mods" }, "fc26-normal")).toBe(false);
  });
});
