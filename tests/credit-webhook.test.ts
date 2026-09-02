import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// ─── Mocks (hoisted trước khi import route) ───
// verify() đọc state tại thời điểm gọi → không phụ thuộc mockReset cross-test
const { mockState, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockState: {
    verifyResult: null as Record<string, unknown> | null,
    verifyError: null as Error | null,
  },
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@payos/node", () => ({
  PayOS: class {
    webhooks = {
      verify: vi.fn(async () => {
        if (mockState.verifyError) throw mockState.verifyError;
        return mockState.verifyResult;
      }),
    };
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom, rpc: mockRpc },
}));

import { POST } from "@/app/api/credit/topup/webhook/route";

// Builder mô phỏng Supabase query: lọc fixture theo các .eq() đã gọi
interface MockBuilder {
  select: Mock<() => MockBuilder>;
  eq: Mock<(field: string, value: unknown) => MockBuilder>;
  update: Mock<() => MockBuilder>;
  insert: Mock<() => MockBuilder>;
  order: Mock<() => MockBuilder>;
  limit: Mock<() => MockBuilder>;
  maybeSingle: Mock<() => Promise<{ data: Record<string, unknown> | null; error: null }>>;
}

function createBuilder(fixtureRows: Array<Record<string, unknown>> = []): MockBuilder {
  const filters: Array<{ field: string; value: unknown }> = [];
  const builder: MockBuilder = {
    select: vi.fn(() => builder),
    eq: vi.fn((field: string, value: unknown) => {
      filters.push({ field, value });
      return builder;
    }),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => {
      const match = fixtureRows.find((row) =>
        filters.every((f) => row[f.field] === f.value)
      );
      return { data: match ?? null, error: null };
    }),
  };
  return builder;
}

const webhookBody = (orderCode: number, signature = "sig") =>
  JSON.stringify({
    code: "00",
    desc: "success",
    success: true,
    data: { orderCode, amount: 100000, code: "00", desc: "success" },
    signature,
  });

describe("POST /api/credit/topup/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.verifyResult = null;
    mockState.verifyError = null;
  });

  it("chữ ký PayOS không hợp lệ → 401, không truy vấn DB, không gọi RPC", async () => {
    mockState.verifyError = new Error("Data not integrity");

    const res = await POST(
      new Request("http://localhost/api/credit/topup/webhook", {
        method: "POST",
        body: webhookBody(999, "forged-signature"),
        headers: {
          "Content-Type": "application/json",
          "x-payos-signature": "forged-signature",
        },
      })
    );

    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("chữ ký hợp lệ → claim order + cộng credit qua RPC credit_fulfill_topup", async () => {
    mockState.verifyResult = { orderCode: 999, code: "00", amount: 100000 };
    mockFrom.mockReturnValue(createBuilder([{ id: "o1", order_code: 999 }]));
    mockRpc.mockResolvedValue({ data: true, error: null });

    const res = await POST(
      new Request("http://localhost/api/credit/topup/webhook", {
        method: "POST",
        body: webhookBody(999),
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      "credit_fulfill_topup",
      expect.objectContaining({ p_order_id: "o1" })
    );
    // Response webhook không được cache
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
