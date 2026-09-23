"use client";

// =====================================================
// /payment/cancel — user hủy giao dịch mua sản phẩm
// T15: quay về đúng checkout theo query `product`, hoặc tra
//      productId từ order qua orderCode; fallback /games/fc26/select.
//      Không dùng router.back() (tránh vòng lại PayOS).
// Hủy là lựa chọn của user → màu trung tính, không phải lỗi.
// =====================================================

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  checkoutPathFor,
  parsePaymentOrder,
} from "@/lib/payment/order-status";
import { ButtonLink, Card } from "@/app/components/ui";

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

function CancelContent() {
  const params = useSearchParams();
  const orderCode = params.get("orderCode");
  const productParam = params.get("product");
  // Đích quay lại: query `product` trước, nếu không có thì tra từ order
  const [checkoutHref, setCheckoutHref] = useState(() => checkoutPathFor(productParam));

  useEffect(() => {
    if (productParam || !orderCode) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/payment/order?orderCode=${orderCode}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const order = parsePaymentOrder(await res.json());
        if (!cancelled && order?.productId) {
          setCheckoutHref(checkoutPathFor(order.productId));
        }
      } catch {
        // Giữ fallback /games/fc26/select
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [orderCode, productParam]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-0 px-4 py-16 text-body">
      <div className="w-full max-w-md">
        <Card className="space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-muted">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="m9 9 6 6" />
              <path d="m15 9-6 6" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-h2 text-title">Đã hủy thanh toán</h1>
            <p className="text-sm text-muted">
              Bạn chưa bị trừ tiền cho giao dịch này. Khi sẵn sàng, quay lại trang
              thanh toán để đặt hàng.
            </p>
          </div>
          {orderCode && <OrderCodeRow orderCode={orderCode} />}
          <div className="space-y-2">
            <ButtonLink href={checkoutHref} size="lg" fullWidth>
              Quay lại thanh toán
            </ButtonLink>
            <ButtonLink href="/" variant="ghost" fullWidth>
              Về trang chủ
            </ButtonLink>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  );
}
