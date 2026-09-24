import Image from "next/image";
import Link from "next/link";
import type { ProductConfig } from "@/lib/payment/config";
import { SUPPORT_URL } from "@/lib/payment/order-status";
import PayOSButton from "@/app/components/PayOSButton";
import CopyButton from "@/app/components/CopyButton";
import CheckUyTinButton from "@/app/components/CheckUyTinButton";
import { Badge, Card, InlineNotice } from "@/app/components/ui";
import { CheckoutSteps } from "./CheckoutSteps";
import { formatVnd } from "./format";

// =====================================================
// Checkout — bố cục thanh toán dùng chung (§12.2)
//   /games/fc26/payment  (fc26-normal, fc26-mods — fulfillment code)
//   /mods/mix-mods-fc26/payment (mix-mods — fulfillment link, noCode)
//
// Bố cục: form trái / summary phải (desktop); mobile: tóm tắt ngắn trước form.
// PayOS là phương thức chính; chuyển khoản thủ công nằm trong <details>
// riêng với copy từng trường + QR object-contain nền trắng.
// Toàn bộ giá/cách nhận/bước sau thanh toán lấy từ product config —
// KHÔNG hardcode giá hay hứa sai loại nội dung (A03/T13).
// =====================================================

const BANK_INFO = {
  bank: "BIDV",
  accountNumber: "5200501707",
  accountName: "TRAN VIET DUNG",
};

export interface CheckoutProps {
  product: ProductConfig;
  /** Ảnh nhỏ trong summary (không bắt buộc) */
  image?: string;
  imageAlt?: string;
  /** Nhãn phụ dưới tên sản phẩm, ví dụ "Standard Edition" */
  editionLabel?: string;
  /** Nội dung chuyển khoản — memo ngân hàng admin đối chiếu */
  bankNote: string;
  /** Quay lại bước trước (trang chọn phiên bản / trang sản phẩm) */
  backHref: string;
  backLabel?: string;
  /** Link "Đã có mã? Nhập mã" — chỉ truyền cho sản phẩm dùng mã kích hoạt */
  codeEntryHref?: string;
}

function OrderSummary({
  product,
  image,
  imageAlt,
  editionLabel,
  compact = false,
}: {
  product: ProductConfig;
  image?: string;
  imageAlt?: string;
  editionLabel?: string;
  compact?: boolean;
}) {
  const price = formatVnd(product.price);
  return (
    <div className={compact ? "flex items-center gap-3" : "space-y-4"}>
      <div className={compact ? "flex min-w-0 items-center gap-3" : "flex items-center gap-3"}>
        {image && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--color-line)]">
            <Image
              src={image}
              alt={imageAlt ?? product.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-title)]">
            {product.name}
          </p>
          {editionLabel && (
            <p className="text-meta text-[var(--color-muted)]">{editionLabel}</p>
          )}
        </div>
      </div>

      {!compact && (
        <>
          <p className="text-sm leading-relaxed text-[var(--color-muted)]">
            {product.fulfillment.receiveText}
          </p>
          <div className="space-y-2 border-t border-[var(--color-line)] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-muted)]">Đơn giá</span>
              <span className="tabular font-medium text-[var(--color-body)]">{price}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-3">
              <span className="font-semibold text-[var(--color-title)]">Tổng thanh toán</span>
              <span className="tabular text-price text-[var(--color-accent-strong)]">{price}</span>
            </div>
          </div>
        </>
      )}

      {compact && (
        <span className="tabular ml-auto shrink-0 text-lg font-bold text-[var(--color-accent-strong)]">
          {price}
        </span>
      )}
    </div>
  );
}

function ManualTransferDisclosure({ price, bankNote }: { price: string; bankNote: string }) {
  const rows = [
    { label: "Ngân hàng", value: BANK_INFO.bank },
    { label: "Số tài khoản", value: BANK_INFO.accountNumber },
    { label: "Người nhận", value: BANK_INFO.accountName },
    { label: "Số tiền", value: price },
    { label: "Nội dung chuyển khoản", value: bankNote },
  ];

  return (
    <details className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-[var(--color-title)] [&::-webkit-details-marker]:hidden">
        <span>Chuyển khoản ngân hàng thủ công</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <div className="space-y-3 border-t border-[var(--color-line)] px-5 py-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <span className="shrink-0 text-meta text-[var(--color-muted)]">{row.label}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="tabular truncate text-sm font-semibold text-[var(--color-title)]">
                {row.value}
              </span>
              <CopyButton text={row.value} />
            </span>
          </div>
        ))}

        <div className="flex flex-col items-center gap-2 border-t border-[var(--color-line)] pt-4">
          <p className="text-meta text-[var(--color-muted)]">Quét mã QR {BANK_INFO.bank}</p>
          <div className="relative h-44 w-44 overflow-hidden rounded-xl bg-white p-2">
            <Image
              src="/qrbidv.jpg"
              alt={`Mã QR chuyển khoản ${BANK_INFO.bank}`}
              fill
              sizes="176px"
              className="object-contain"
            />
          </div>
        </div>

        <InlineNotice tone="warning" className="text-left">
          Chuyển khoản thủ công <strong>không tự xác nhận</strong>. Sau khi chuyển
          đúng số tiền và nội dung, gửi ảnh giao dịch qua{" "}
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--color-accent-strong)] underline underline-offset-2"
          >
            fanpage hỗ trợ
          </a>{" "}
          để được đối chiếu và cấp nội dung.
        </InlineNotice>
      </div>
    </details>
  );
}

export function Checkout({
  product,
  image,
  imageAlt,
  editionLabel,
  bankNote,
  backHref,
  backLabel = "Quay lại",
  codeEntryHref,
}: CheckoutProps) {
  const price = formatVnd(product.price);
  const isCode = product.fulfillment.kind === "code";
  const codeLabel = product.id === "fc27-standard" ? "mã truy cập" : "mã kích hoạt";
  const emailLabel = isCode ? `Email nhận ${codeLabel}` : "Email nhận link tải";

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)] px-4 py-10 text-[var(--color-body)] md:py-14">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-3">
          <CheckoutSteps current={1} />
          <div className="space-y-1.5">
            <h1 className="text-h2 text-[var(--color-title)]">Thanh toán — {product.name}</h1>
            <p className="text-sm text-[var(--color-muted)]">
              {product.fulfillment.receiveText}
            </p>
          </div>
        </header>

        {/* Tóm tắt đơn ngắn — mobile hiện trước form (§12.2) */}
        <Card className="md:hidden" padding={true}>
          <OrderSummary
            product={product}
            image={image}
            imageAlt={imageAlt}
            editionLabel={editionLabel}
            compact
          />
        </Card>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px] md:items-start">
          {/* ===== Cột trái: form thanh toán ===== */}
          <section className="space-y-4" aria-label="Hình thức thanh toán">
            <Card>
              <div className="space-y-1.5">
                <h2 className="text-h3 text-[var(--color-title)]">
                  Thanh toán qua QR ngân hàng
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  Phương thức chính — tự động xác nhận và cấp nội dung sau khi thanh toán.
                </p>
              </div>
              <div className="mt-5">
                <PayOSButton
                  productId={product.id}
                  price={price}
                  emailLabel={emailLabel}
                  emailHint={product.fulfillment.receiveText}
                />
              </div>
            </Card>

            <ManualTransferDisclosure price={price} bankNote={bankNote} />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] px-5 py-4">
              <p className="text-sm text-[var(--color-muted)]">
                Cần hỗ trợ về thanh toán?
              </p>
              <CheckUyTinButton />
            </div>
          </section>

          {/* ===== Cột phải: tóm tắt sản phẩm (desktop) ===== */}
          <aside className="hidden md:block" aria-label="Tóm tắt đơn hàng">
            <Card className="sticky top-24">
              <p className="mb-4 text-meta font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Tóm tắt đơn hàng
              </p>
              <OrderSummary
                product={product}
                image={image}
                imageAlt={imageAlt}
                editionLabel={editionLabel}
              />
              <div className="mt-4 border-t border-[var(--color-line)] pt-4">
                <Badge tone={isCode ? "accent" : "violet"}>
                  {isCode ? `Nhận ${codeLabel} qua email` : "Nhận link tải qua email"}
                </Badge>
              </div>
            </Card>
          </aside>
        </div>

        {/* ===== Các bước sau thanh toán — từ product.fulfillment.steps ===== */}
        <Card>
          <h2 className="text-h3 text-[var(--color-title)]">Sau khi thanh toán</h2>
          <ol className="mt-4 space-y-3">
            {product.fulfillment.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm text-[var(--color-body)]">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-xs font-bold text-[var(--color-accent-strong)]"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        <div className="flex flex-col items-center gap-3">
          {codeEntryHref && (
            <Link
              href={codeEntryHref}
              className="text-sm font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
            >
              Đã có mã? Nhập mã →
            </Link>
          )}
          <Link
            href={backHref}
            className="text-meta text-[var(--color-muted)] transition-colors hover:text-[var(--color-body)]"
          >
            ← {backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
