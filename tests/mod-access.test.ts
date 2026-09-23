import { describe, it, expect } from "vitest";

// =====================================================
// mod-access — ma trận trạng thái truy cập mod credit
// (§10.2, T04–T07, T13, §5.3 return-path an toàn)
// =====================================================

import {
  balanceAfterUnlock,
  creditShortfall,
  deriveAccessPhase,
  isInternalPath,
  parseAccessResponse,
  parseSpendResult,
  parseUnlockedContent,
  topupHrefForMod,
  type AccessInput,
} from "@/app/mods/components/mod-access";

function input(overrides: Partial<AccessInput> = {}): AccessInput {
  return {
    authResolved: true,
    isAuthenticated: true,
    sessionExpired: false,
    access: "locked",
    balance: "ok",
    hasEnoughCredit: true,
    unlocking: false,
    content: "idle",
    ...overrides,
  };
}

describe("deriveAccessPhase — §10.2 state matrix", () => {
  it("đang kiểm tra: access checking hoặc auth chưa resolve", () => {
    expect(deriveAccessPhase(input({ access: "checking" }))).toBe("checking");
    expect(deriveAccessPhase(input({ authResolved: false }))).toBe("checking");
  });

  it("lỗi kiểm tra quyền → check-error", () => {
    expect(deriveAccessPhase(input({ access: "error" }))).toBe("check-error");
  });

  it("T04: guest chưa đăng nhập → guest (không phải balance-error)", () => {
    expect(
      deriveAccessPhase(input({ isAuthenticated: false, balance: "idle" })),
    ).toBe("guest");
  });

  it("phiên hết hạn: có ngữ cảnh user nhưng session mất → session-expired", () => {
    expect(
      deriveAccessPhase(
        input({ isAuthenticated: false, sessionExpired: true }),
      ),
    ).toBe("session-expired");
  });

  it("phiên hết hạn thắng cả khi context còn user cũ (stale)", () => {
    // isAuthenticated=true nhưng token thật đã mất → không rơi vào
    // flow số dư/thiếu credit mà phải yêu cầu đăng nhập lại.
    expect(
      deriveAccessPhase(input({ isAuthenticated: true, sessionExpired: true })),
    ).toBe("session-expired");
  });

  it("số dư đang tải → balance-loading (không giả định gì)", () => {
    expect(
      deriveAccessPhase(input({ balance: "loading", hasEnoughCredit: null })),
    ).toBe("balance-loading");
    expect(
      deriveAccessPhase(input({ balance: "idle", hasEnoughCredit: null })),
    ).toBe("balance-loading");
  });

  it("số dư lỗi → balance-error (KHÔNG suy ra thiếu tiền)", () => {
    expect(
      deriveAccessPhase(input({ balance: "error", hasEnoughCredit: null })),
    ).toBe("balance-error");
  });

  it("T05: thiếu credit → insufficient", () => {
    expect(
      deriveAccessPhase(input({ hasEnoughCredit: false })),
    ).toBe("insufficient");
  });

  it("đủ credit → ready", () => {
    expect(deriveAccessPhase(input())).toBe("ready");
  });

  it("T06: đang trừ → unlocking (ưu tiên hơn ready)", () => {
    expect(deriveAccessPhase(input({ unlocking: true }))).toBe("unlocking");
  });

  it("đã mở → unlocked (content loading/ready đều giữ quyền)", () => {
    expect(deriveAccessPhase(input({ access: "unlocked" }))).toBe("unlocked");
    expect(
      deriveAccessPhase(input({ access: "unlocked", content: "loading" })),
    ).toBe("unlocked");
    expect(
      deriveAccessPhase(input({ access: "unlocked", content: "ready" })),
    ).toBe("unlocked");
  });

  it("T07: đã mở nhưng content lỗi → content-error, không quay về trả tiền", () => {
    expect(
      deriveAccessPhase(input({ access: "unlocked", content: "error" })),
    ).toBe("content-error");
  });
});

describe("credit math", () => {
  it("creditShortfall: đủ → 0, thiếu → phần thiếu, chưa biết → null", () => {
    expect(creditShortfall(5, 8)).toBe(0);
    expect(creditShortfall(5, 3)).toBe(2);
    expect(creditShortfall(5, null)).toBeNull();
  });

  it("balanceAfterUnlock: trừ đúng, không âm", () => {
    expect(balanceAfterUnlock(10, 5)).toBe(5);
    expect(balanceAfterUnlock(3, 5)).toBe(0);
  });
});

describe("isInternalPath / topupHrefForMod (§5.3)", () => {
  it("chỉ nhận path nội bộ bắt đầu bằng /, loại protocol-relative", () => {
    expect(isInternalPath("/mods/x")).toBe(true);
    expect(isInternalPath("//evil.com/x")).toBe(false);
    expect(isInternalPath("https://evil.com")).toBe(false);
    expect(isInternalPath("")).toBe(false);
    expect(isInternalPath(null)).toBe(false);
  });

  it("topupHrefForMod gắn next nội bộ đã encode", () => {
    const href = topupHrefForMod("brx15");
    expect(href).toBe("/credit?next=%2Fmods%2Fbrx15");
    const next = decodeURIComponent(href.split("next=")[1]);
    expect(isInternalPath(next)).toBe(true);
  });
});

describe("parse response contracts", () => {
  it("parseAccessResponse: nhận đúng shape, loại payload lạ", () => {
    expect(
      parseAccessResponse({ unlocked: true, modId: "m1", creditCost: 5 }),
    ).toEqual({ unlocked: true, modId: "m1", creditCost: 5 });
    expect(parseAccessResponse({ unlocked: false })).toEqual({
      unlocked: false,
      modId: null,
      creditCost: null,
    });
    expect(parseAccessResponse({ error: "x" })).toBeNull();
    expect(parseAccessResponse(null)).toBeNull();
    expect(parseAccessResponse([1, 2])).toBeNull();
  });

  it("parseUnlockedContent: object trần + bọc data; thiếu slug/name → null", () => {
    const row = {
      slug: "x",
      name: "Mod X",
      author: "A",
      category: "Faces",
      version: "1.0",
      description: "d",
      long_description: "ld",
      thumbnail: "/t.jpg",
      download_url: "https://dl",
      tags: ["Faces", 1],
    };
    expect(parseUnlockedContent(row)?.download_url).toBe("https://dl");
    expect(parseUnlockedContent({ data: row })?.name).toBe("Mod X");
    // tags lọc phần tử không phải string
    expect(parseUnlockedContent(row)?.tags).toEqual(["Faces"]);
    expect(parseUnlockedContent({ name: "no slug" })).toBeNull();
    expect(parseUnlockedContent("x")).toBeNull();
  });

  it("parseSpendResult: giữ balanceRemaining/alreadyUnlocked khi có", () => {
    expect(
      parseSpendResult({
        modId: "m1",
        modSlug: "s",
        modName: "n",
        downloadUrl: "u",
        alreadyUnlocked: false,
        creditDeducted: 5,
        balanceRemaining: 12,
      }),
    ).toMatchObject({ alreadyUnlocked: false, balanceRemaining: 12 });
    expect(
      parseSpendResult({ modId: "m1", alreadyUnlocked: true })?.balanceRemaining,
    ).toBeNull();
    expect(parseSpendResult({})).toBeNull();
  });
});
