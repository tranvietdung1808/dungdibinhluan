import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom, rpc: mockRpc },
}));

import { addCredits, deductCredits, getCreditWallet } from "@/lib/server/credit";
import { MAX_TOPUP, validateTopupAmount } from "@/lib/credit-core";

interface WalletBuilder {
  select: Mock<() => WalletBuilder>;
  eq: Mock<() => WalletBuilder>;
  upsert: Mock<(row: Record<string, unknown>, opts?: unknown) => WalletBuilder>;
  maybeSingle: Mock<() => Promise<{ data: Record<string, unknown> | null; error: null }>>;
}

function createWalletBuilder(store: { wallet: Record<string, unknown> | null }): WalletBuilder {
  const builder: WalletBuilder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    upsert: vi.fn((row: Record<string, unknown>) => {
      store.wallet = { ...(store.wallet ?? {}), ...row };
      return builder;
    }),
    maybeSingle: vi.fn(async () => ({ data: store.wallet, error: null })),
  };
  return builder;
}

describe("lib/server/credit.ts — atomic qua RPC", () => {
  beforeEach(() => vi.clearAllMocks());

  it("addCredits gọi RPC credit_add với đúng tham số", async () => {
    mockRpc.mockResolvedValue({ data: 100, error: null });

    await addCredits({
      userId: "u1",
      amount: 100,
      referenceType: "payment",
      referenceId: "999",
      description: "test",
    });

    expect(mockRpc).toHaveBeenCalledWith("credit_add", {
      p_user_id: "u1",
      p_amount: 100,
      p_ref_type: "payment",
      p_ref_id: "999",
      p_desc: "test",
    });
  });

  it("addCredits: unique violation (23505) → đã xử lý, không throw", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate" } });

    await expect(
      addCredits({ userId: "u1", amount: 100, referenceType: "payment", referenceId: "999" })
    ).resolves.toBeUndefined();
  });

  it("deductCredits trả balanceAfter khi thành công", async () => {
    mockRpc.mockResolvedValue({ data: 5, error: null });

    await expect(deductCredits({ userId: "u1", amount: 5 })).resolves.toEqual({
      balanceAfter: 5,
    });
  });

  it("deductCredits không đủ credit → throw 'Bạn không đủ credit'", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "INSUFFICIENT_CREDIT" } });

    await expect(deductCredits({ userId: "u1", amount: 5 })).rejects.toThrow("Bạn không đủ credit");
  });

  it("getCreditWallet: chưa có ví → upsert race-safe rồi đọc lại", async () => {
    const store: { wallet: Record<string, unknown> | null } = { wallet: null };
    const builder = createWalletBuilder(store);
    mockFrom.mockReturnValue(builder);

    const wallet = await getCreditWallet("u1");

    expect(wallet).toEqual({ balance: 0, totalEarned: 0, totalSpent: 0 });
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1" }),
      { onConflict: "user_id", ignoreDuplicates: true }
    );
    expect(mockFrom).toHaveBeenCalledTimes(3); // read → upsert → read lại
  });
});

describe("validateTopupAmount — giới hạn tối đa", () => {
  it("từ chối số tiền vượt MAX_TOPUP", () => {
    expect(validateTopupAmount(MAX_TOPUP + 10000)).toContain("tối đa");
  });

  it("chấp nhận số tiền hợp lệ", () => {
    expect(validateTopupAmount(100000)).toBeNull();
  });
});
