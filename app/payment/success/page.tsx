"use client";

// =====================================================
// /payment/success — kết quả sau khi mua sản phẩm qua PayOS
// Poll /api/payment/order (record Redis do webhook ghi).
// A04: tách 3 trạng thái — thanh toán xác nhận / nội dung đã cấp /
//      email đã gửi. CODE_GENERATED ≠ "email đã gửi" (T14).
// A03: sản phẩm noCode (Mix Mods) nhận link tải, không hứa mã game.
// A08: invalid-order / network-error / pending có đường hồi phục;
//      cleanup mọi timer + request khi unmount.
// =====================================================

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  buildPaymentSteps,
  checkoutPathFor,
  isEmailSent,
  parsePaymentOrder,
  productForOrder,
  SUPPORT_URL,
  type PaymentOrder,
  type ProgressStep,
} from "@/lib/payment/order-status";
import { getProduct, type ProductConfig } from "@/lib/payment/config";
import { Button, ButtonLink, Card, InlineNotice, Spinner } from "@/app/components/ui";

type Stage =
  | "checking"
  | "fulfilled"
  | "delivery-issue"
  | "pending"
  | "network-error"
  | "invalid-order";

const INITIAL_DELAY_MS = 2000;
const POLL_MS = 3000;
const MAX_ATTEMPTS = 30; // ~90s chờ webhook
const MAX_NET_ERRORS = 3; // lỗi mạng liên tiếp → network-error

// ---------- Icon nhỏ (SVG, không emoji) ----------

function IconCheck({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
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

/** Checklist 3 bước: xác nhận → cấp nội dung → gửi email */
function StepList({ steps }: { steps: ProgressStep[] }) {
  return (
    <ul className="space-y-2.5 text-left">
      {steps.map((step) => (
        <li key={step.key} className="flex items-center gap-3">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
              step.state === "done"
                ? "border-ok/40 bg-ok-subtle text-ok"
                : step.state === "issue"
                  ? "border-warn/40 bg-warn-subtle text-warn"
                  : "border-line bg-surface-2 text-muted"
            }`}
          >
            {step.state === "done" ? (
              <IconCheck className="h-3.5 w-3.5" />
            ) : step.state === "issue" ? (
              <span aria-hidden="true" className="text-[11px] font-bold leading-none">!</span>
            ) : (
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
          </span>
          <span
            className={`text-sm ${
              step.state === "done"
                ? "text-body"
                : step.state === "issue"
                  ? "text-warn"
                  : "text-muted"
            }`}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SuccessContent() {
  const params = useSearchParams();
  const orderCode = params.get("orderCode");
  const productParam = params.get("product");
  const [stage, setStage] = useState<Stage>("checking");
  const [order, setOrder] = useState<PaymentOrder | null>(null);
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

    const schedule = () => {
      timer = setTimeout(() => {
        if (!cancelled) void check();
      }, POLL_MS);
    };

    const check = async () => {
      try {
        const res = await fetch(`/api/payment/order?orderCode=${orderCode}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (cancelled) return;

        if (res.status === 404) {
          setStage("invalid-order");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const parsed = parsePaymentOrder(await res.json());
        if (!parsed) throw new Error("Unexpected payload");

        netErrors = 0;
        setOrder(parsed);

        if (isEmailSent(parsed.status)) {
          // COMPLETED: thanh toán + cấp nội dung + email đều xong
          setStage("fulfilled");
          return;
        }
        if (parsed.status === "CODE_GENERATED") {
          // Đã trả tiền + cấp nội dung nhưng email chưa gửi (T14).
          // Vẫn poll thêm — webhook có thể chạy lại và gửi email sau.
          setStage("delivery-issue");
        }

        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          // Giữ delivery-issue nếu đã cấp nội dung; chỉ pending khi chưa trả tiền
          if (parsed.status !== "CODE_GENERATED") setStage("pending");
          return;
        }
        schedule();
      } catch {
        if (cancelled) return;
        netErrors++;
        if (netErrors >= MAX_NET_ERRORS) {
          setStage("network-error");
          return;
        }
        schedule();
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

  const product: ProductConfig | null =
    productForOrder(order) ?? (productParam ? getProduct(productParam) : null);
  const isLinkProduct = product?.fulfillment.kind === "link";
  const steps = order ? buildPaymentSteps(order.status, product) : null;
  // CTA "tiếp tục đúng sản phẩm": code → trang nhập mã, link → trang Mix Mods
  const continueHref = product?.returnUrl ?? "/";
  const continueLabel = product
    ? isLinkProduct
      ? "Xem trang Mix Mods"
      : "Nhập mã tại trang FC 26"
    : "Về trang chủ";

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

          {stage === "fulfilled" && (
            <>
              <IconBadge tone="ok">
                <IconCheck />
              </IconBadge>
              <div className="space-y-1.5">
                <h1 className="text-h2 text-title">Thanh toán thành công</h1>
                <p className="text-sm text-muted">
                  {isLinkProduct
                    ? `Link tải đã được gửi đến email ${order?.email ?? "của bạn"}.`
                    : `Mã kích hoạt đã được gửi đến email ${order?.email ?? "của bạn"}.`}
                </p>
                <p className="text-meta text-muted">
                  Kiểm tra cả thư mục spam nếu chưa thấy email.
                </p>
              </div>
              {steps && <StepList steps={steps} />}
              {orderCode && <OrderCodeRow orderCode={orderCode} />}
              <div className="space-y-2">
                <ButtonLink href={continueHref} size="lg" fullWidth>
                  {continueLabel}
                </ButtonLink>
                <ButtonLink href="/" variant="ghost" fullWidth>
                  Về trang chủ
                </ButtonLink>
              </div>
            </>
          )}

          {stage === "delivery-issue" && (
            <>
              <IconBadge tone="warn">
                <IconAlert />
              </IconBadge>
              <h1 className="text-h2 text-title">Đã ghi nhận thanh toán</h1>
              {steps && <StepList steps={steps} />}
              <InlineNotice tone="warning" className="text-left">
                {isLinkProduct
                  ? "Link tải đã sẵn sàng nhưng email chưa gửi được. Hệ thống có thể tự gửi lại — nếu chưa nhận được, liên hệ hỗ trợ kèm mã đơn."
                  : "Mã kích hoạt đã được tạo nhưng email chưa gửi được. Hệ thống có thể tự gửi lại — nếu chưa nhận được, liên hệ hỗ trợ kèm mã đơn."}
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

          {stage === "pending" && (
            <>
              <IconBadge tone="warn">
                <IconClock />
              </IconBadge>
              <h1 className="text-h2 text-title">Chưa xác nhận được thanh toán</h1>
              <InlineNotice tone="warning" className="text-left">
                Nếu bạn đã thanh toán xong, nội dung sẽ được cấp tự động sau khi hệ
                thống đối chiếu — bạn không cần thanh toán lại.
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

          {stage === "invalid-order" && (
            <>
              <IconBadge tone="muted">
                <IconInfo />
              </IconBadge>
              <div className="space-y-1.5">
                <h1 className="text-h2 text-title">Không tìm thấy thông tin giao dịch</h1>
                <p className="text-sm text-muted">
                  Trang này chỉ mở được từ liên kết sau khi thanh toán. Bạn có thể quay
                  lại trang thanh toán để đặt hàng.
                </p>
              </div>
              <div className="space-y-2">
                <ButtonLink href={checkoutPathFor(productParam)} fullWidth>
                  Quay lại thanh toán
                </ButtonLink>
                <ButtonLink href="/" variant="ghost" fullWidth>
                  Về trang chủ
                </ButtonLink>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
