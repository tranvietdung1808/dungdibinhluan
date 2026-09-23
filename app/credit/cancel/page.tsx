"use client";

// =====================================================
// /credit/cancel — user hủy giao dịch nạp credit
// §13.4: hủy nạp dùng màu trung tính — đỏ chỉ dành cho lỗi thật.
// Đích quay lại cố định /credit (không router.back()).
// =====================================================

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ButtonLink, Card } from "@/app/components/ui";
import { sanitizeInternalPath } from "@/lib/payment/order-status";

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
  // §5.3: quay về đúng ngữ cảnh (vd trang mod) nếu có next hợp lệ
  const nextPath = sanitizeInternalPath(params.get("next"));

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
            <h1 className="text-h2 text-title">Đã hủy nạp credit</h1>
            <p className="text-sm text-muted">
              Giao dịch đã được hủy — chưa có khoản tiền nào bị trừ và không có
              credit nào được cộng.
            </p>
          </div>
          {orderCode && <OrderCodeRow orderCode={orderCode} />}
          <div className="space-y-2">
            <ButtonLink href={nextPath ?? "/credit"} size="lg" fullWidth>
              {nextPath ? "Quay lại trang mod" : "Quay lại trang nạp credit"}
            </ButtonLink>
            <ButtonLink href={nextPath ? "/credit" : "/mods"} variant="ghost" fullWidth>
              {nextPath ? "Nạp lại credit" : "Khám phá mod"}
            </ButtonLink>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default function CreditCancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  );
}
