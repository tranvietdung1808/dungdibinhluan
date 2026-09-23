"use client";

// =====================================================
// /games/fc26/payment — checkout FC 26 dùng chung (§12.2)
// ?edition=normal → fc26-normal · ?edition=mods → fc26-mods
// Thiếu/không hợp lệ → hiển thị lựa chọn lại, KHÔNG âm thầm
// mặc định một gói (§12.1).
// =====================================================

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getProduct } from "@/lib/payment/config";
import { Checkout } from "../../components/Checkout";
import { ButtonLink, Card, Container, InlineNotice } from "../../../components/ui";
import { CheckoutSteps } from "../../components/CheckoutSteps";

const EDITION_PRODUCT: Record<string, { productId: string; image: string; label: string; bankNote: string }> = {
  normal: {
    productId: "fc26-normal",
    image: "/games/fc26n.jpg",
    label: "Standard Edition",
    bankNote: "quacuoi",
  },
  mods: {
    productId: "fc26-mods",
    image: "/games/fc26-banner.jpg",
    label: "Full Mods Edition",
    bankNote: "quaque",
  },
};

function PaymentContent() {
  const params = useSearchParams();
  const edition = params.get("edition");
  const ed = edition ? EDITION_PRODUCT[edition] : undefined;
  const product = ed ? getProduct(ed.productId) : null;

  // Query edition thiếu/không hợp lệ → bắt chọn lại, không mặc định ngầm
  if (!ed || !product) {
    return (
      <main className="min-h-screen bg-[var(--color-surface-0)] px-4 py-10 text-[var(--color-body)] md:py-14">
        <Container className="max-w-md space-y-6">
          <CheckoutSteps current={1} />
          <Card className="space-y-4 text-center">
            <h1 className="text-h2 text-[var(--color-title)]">Chưa chọn phiên bản</h1>
            <InlineNotice tone="warning" className="text-left">
              {edition
                ? `Phiên bản “${edition}” không tồn tại.`
                : "Liên kết thanh toán này thiếu phiên bản."}{" "}
              Hãy chọn lại phiên bản trước khi thanh toán.
            </InlineNotice>
            <div className="space-y-2">
              <ButtonLink href="/games/fc26/select" size="lg" fullWidth>
                Chọn phiên bản FC 26
              </ButtonLink>
              <ButtonLink href="/games/fc26" variant="ghost" fullWidth>
                Đã có mã? Nhập mã
              </ButtonLink>
            </div>
          </Card>
        </Container>
      </main>
    );
  }

  return (
    <Checkout
      product={product}
      image={ed.image}
      editionLabel={ed.label}
      bankNote={ed.bankNote}
      backHref="/games/fc26/select"
      backLabel="Quay lại chọn phiên bản"
      codeEntryHref={`/games/fc26?edition=${edition}`}
    />
  );
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentContent />
    </Suspense>
  );
}
