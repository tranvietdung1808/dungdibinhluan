"use client";

// =====================================================
// /credit/success — kết quả sau khi nạp credit qua PayOS
// Poll /api/credit/topup/order cho tới khi webhook cộng credit.
// A01: response có `paid` ở ROOT (parse qua parseTopupOrder).
// A08: invalid-order / unauthorized / network-error / pending
//      đều có đường hồi phục; cleanup mọi timer + request khi unmount.
// =====================================================

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  parseTopupOrder,
  sanitizeInternalPath,
  SUPPORT_URL,
  type TopupBreakdown,
} from "@/lib/payment/order-status";
import { clearCachedCreditBalance, fetchCreditBalance } from "@/utils/credit-balance";
import { Button, ButtonLink, Card, InlineNotice, Spinner } from "@/app/components/ui";

type Stage =
  | "checking"
  | "completed"
  | "pending"
  | "network-error"
  | "unauthorized"
  | "invalid-order";

const INITIAL_DELAY_MS = 2000;
const POLL_MS = 3000;
const MAX_ATTEMPTS = 30; // ~90s chờ webhook
const MAX_NET_ERRORS = 3; // lỗi mạng liên tiếp → network-error

const vnd = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)}đ`;
const num = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

// ---------- Icon nhỏ (SVG, không emoji) ----------

function IconCheck() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function IconBadge({ tone, children }: { tone: "ok" | "warn" | "danger" | "muted"; children: ReactNode }) {
  const tones = {
    ok: "border-ok/30 bg-ok-subtle text-ok",
    warn: "border-warn/30 bg-warn-subtle text-warn",
    danger: "border-danger/30 bg-danger-subtle text-danger",
    muted: "border-line bg-surface-2 text-muted",
  } as const;
  return (
    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${tones[tone]}`}>
      {children}
    </div>
  );
}

function OrderCodeRow({ orderCode }: { orderCode: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-center gap-2 text-meta text-muted">
      <span>Mã đơn</span>
      <code className="tabular font-semibold text-body">#{orderCode}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(orderCode);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard bị chặn — mã đơn vẫn hiển thị để copy tay
          }
        }}
        className="rounded-md border border-line-strong px-2 py-0.5 text-xs text-body transition-colors hover:border-accent-border hover:text-title"
      >
        {copied ? "Đã copy" : "Copy"}
      </button>
    </div>
  );
}

function SuccessContent() {
  const params = useSearchParams();
  const orderCode = params.get("orderCode");
  // §5.3/§13.4: nếu đến từ trang mod (topup từ unlock wall) → CTA quay lại
  const nextPath = sanitizeInternalPath(params.get("next"));
  const [stage, setStage] = useState<Stage>("checking");
  const [breakdown, setBreakdown] = useState<TopupBreakdown | null>(null);
  const [runId, setRunId] = useState(0);

  const retry = () => {
    setStage("checking");
    setRunId((i) => i + 1);
  };

  useEffect(() => {
    if (!orderCode) {
      setStage("invalid-order");
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    let attempts = 0;
    let netErrors = 0;

    const check = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(`/api/credit/topup/order?orderCode=${orderCode}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
          signal: controller.signal,
          cache: "no-store",
        });
        if (cancelled) return;

        if (res.status === 401) {
          setStage("unauthorized");
          return;
        }
        if (res.status === 404) {
          // Đơn không tồn tại hoặc không thuộc tài khoản hiện tại
          setStage("invalid-order");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const order = parseTopupOrder(await res.json());
        if (!order) throw new Error("Unexpected payload");

        netErrors = 0;
        if (order.paid) {
          // §13.3: xóa cache số dư rồi fetch lại để navbar/account thấy số mới
          clearCachedCreditBalance();
          void fetchCreditBalance();
          setBreakdown(order.breakdown);
          setStage("completed");
          return;
        }

        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          setStage("pending");
          return;
        }
        timer = setTimeout(() => {
          if (!cancelled) void check();
        }, POLL_MS);
      } catch {
        if (cancelled) return;
        netErrors++;
        if (netErrors >= MAX_NET_ERRORS) {
          setStage("network-error");
          return;
        }
        timer = setTimeout(() => {
          if (!cancelled) void check();
        }, POLL_MS);
      }
    };

    timer = setTimeout(() => {
      if (!cancelled) void check();
    }, INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      controller.abort();
    };
  }, [orderCode, runId]);

  const login = async () => {
    const supabase = createClient();
    const next = `${window.location.pathname}${window.location.search}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-0 px-4 py-16 text-body">
      <div className="w-full max-w-md">
        <Card className="space-y-6 text-center">
          {stage === "checking" && (
            <>
              <Spinner size={40} label="Đang xác nhận thanh toán" className="mx-auto text-accent" />
              <div className="space-y-1.5">
                <h1 className="text-h2 text-title">Đang xác nhận thanh toán</h1>
                <p className="text-sm text-muted">
                  Đang kiểm tra giao dịch của bạn. Vui lòng giữ trang này mở.
                </p>
              </div>
              {orderCode && <OrderCodeRow orderCode={orderCode} />}
            </>
          )}

          {stage === "completed" && (
            <>
              <IconBadge tone="ok">
                <IconCheck />
              </IconBadge>
              <div className="space-y-1.5">
                <h1 className="text-h2 text-title">Nạp credit thành công</h1>
                <p className="text-sm text-muted">Credit đã được cộng vào ví của bạn.</p>
              </div>
              <div>
                <p className="text-price tabular text-credit">
                  +{breakdown ? num(breakdown.creditTotal) : "—"} credit
                </p>
                {breakdown && (
                  <p className="mt-1 text-meta tabular text-muted">
                    Đã thanh toán {vnd(breakdown.amountVnd)} · {num(breakdown.creditBase)} credit
                    {breakdown.creditBonus > 0 ? ` + ${num(breakdown.creditBonus)} credit tặng` : ""}
                  </p>
                )}
              </div>
              {orderCode && <OrderCodeRow orderCode={orderCode} />}
              <div className="space-y-2">
                {nextPath && (
                  <ButtonLink href={nextPath} size="lg" fullWidth>
                    Quay lại trang mod
                  </ButtonLink>
                )}
                <ButtonLink
                  href="/account?section=credit"
                  size="lg"
                  variant={nextPath ? "secondary" : "primary"}
                  fullWidth
                >
                  Xem ví credit
                </ButtonLink>
                <ButtonLink href="/mods" variant="ghost" fullWidth>
                  Khám phá mod
                </ButtonLink>
              </div>
            </>
          )}

          {stage === "pending" && (
            <>
              <IconBadge tone="warn">
                <IconClock />
              </IconBadge>
              <h1 className="text-h2 text-title">Chưa xác nhận được thanh toán</h1>
              <InlineNotice tone="warning" className="text-left">
                Nếu bạn đã chuyển khoản, credit sẽ được cộng tự động khi hệ thống đối
                chiếu xong — thường trong vài phút. Bạn không cần thanh toán lại.
              </InlineNotice>
              {orderCode && <OrderCodeRow orderCode={orderCode} />}
              <div className="space-y-2">
                <Button onClick={retry} fullWidth>
                  Kiểm tra lại
                </Button>
                <ButtonLink href={SUPPORT_URL} external variant="secondary" fullWidth>
                  Liên hệ hỗ trợ
                </ButtonLink>
              </div>
            </>
          )}

          {stage === "network-error" && (
            <>
              <IconBadge tone="danger">
                <IconAlert />
              </IconBadge>
              <h1 className="text-h2 text-title">Chưa kiểm tra được trạng thái</h1>
              <InlineNotice tone="danger" className="text-left">
                Kết nối bị gián đoạn nên chưa đối chiếu được giao dịch. Đơn hàng của
                bạn vẫn được giữ nguyên — hãy thử kiểm tra lại.
              </InlineNotice>
              {orderCode && <OrderCodeRow orderCode={orderCode} />}
              <div className="space-y-2">
                <Button onClick={retry} fullWidth>
                  Kiểm tra lại
                </Button>
                <ButtonLink href={SUPPORT_URL} external variant="secondary" fullWidth>
                  Liên hệ hỗ trợ
                </ButtonLink>
              </div>
            </>
          )}

          {stage === "unauthorized" && (
            <>
              <IconBadge tone="muted">
                <IconInfo />
              </IconBadge>
              <div className="space-y-1.5">
                <h1 className="text-h2 text-title">Vui lòng đăng nhập lại</h1>
                <p className="text-sm text-muted">
                  Phiên đăng nhập đã hết hạn nên chưa kiểm tra được đơn nạp. Đăng nhập
                  lại để xem kết quả.
                </p>
              </div>
              {orderCode && <OrderCodeRow orderCode={orderCode} />}
              <Button onClick={() => void login()} fullWidth>
                Đăng nhập Google
              </Button>
            </>
          )}

          {stage === "invalid-order" && (
            <>
              <IconBadge tone="muted">
                <IconInfo />
              </IconBadge>
              <div className="space-y-1.5">
                <h1 className="text-h2 text-title">Không tìm thấy thông tin giao dịch</h1>
                <p className="text-sm text-muted">
                  Trang này chỉ mở được từ liên kết sau khi thanh toán. Nếu bạn vừa nạp
                  credit, kiểm tra số dư trong ví.
                </p>
              </div>
              <div className="space-y-2">
                <ButtonLink href="/credit" fullWidth>
                  Nạp credit
                </ButtonLink>
                <ButtonLink href="/account?section=credit" variant="ghost" fullWidth>
                  Xem ví credit
                </ButtonLink>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}

export default function CreditSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
