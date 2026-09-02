import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// ─── Mocks (hoisted trước khi import route) ───
const { mockExtractToken, mockGetUserFromToken, mockFrom } = vi.hoisted(() => ({
  mockExtractToken: vi.fn(),
  mockGetUserFromToken: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => ({
  extractToken: mockExtractToken,
  getUserFromToken: mockGetUserFromToken,
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { GET } from "@/app/api/credit/topup/order/route";

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

const ORDER_FIXTURE = {
  order_code: 999,
  amount_vnd: 100000,
  credit_base: 100,
  credit_bonus: 10,
  credit_total: 110,
  status: "paid",
  paid_at: "2026-09-02T00:00:00Z",
  created_at: "2026-09-02T00:00:00Z",
};

describe("GET /api/credit/topup/order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("user A không đọc được order của user B → 404, query có filter user_id", async () => {
    mockExtractToken.mockReturnValue("token-a");
    mockGetUserFromToken.mockResolvedValue({ id: "userA" });
    // DB chỉ có order của user B → không khớp filter user_id
    const builder = createBuilder([{ ...ORDER_FIXTURE, user_id: "userB" }]);
    mockFrom.mockReturnValue(builder);

    const res = await GET(
      new Request("http://localhost/api/credit/topup/order?orderCode=999")
    );

    expect(res.status).toBe(404);
    // Route phải giới hạn theo user_id trước khi tra cứu order_code
    expect(builder.eq).toHaveBeenCalledWith("user_id", "userA");
    expect(builder.eq).toHaveBeenCalledWith("order_code", 999);
  });

  it("user hợp lệ đọc được order của chính mình → 200", async () => {
    mockExtractToken.mockReturnValue("token-a");
    mockGetUserFromToken.mockResolvedValue({ id: "userA" });
    const builder = createBuilder([{ ...ORDER_FIXTURE, user_id: "userA" }]);
    mockFrom.mockReturnValue(builder);

    const res = await GET(
      new Request("http://localhost/api/credit/topup/order?orderCode=999")
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paid).toBe(true);
    expect(body.breakdown.creditTotal).toBe(110);
  });

  it("thiếu token → 401, không truy vấn DB", async () => {
    mockExtractToken.mockReturnValue("");

    const res = await GET(
      new Request("http://localhost/api/credit/topup/order?orderCode=999")
    );

    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
