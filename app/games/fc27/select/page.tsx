import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CheckUyTinButton from "@/app/components/CheckUyTinButton";
import { Badge, ButtonLink, Card, Container, InlineNotice } from "@/app/components/ui";
import { PRODUCTS } from "@/lib/payment/config";
import { formatVnd } from "../../components/format";

const product = PRODUCTS["fc27-standard"];

export const metadata: Metadata = {
  title: "Mua EA FC 27 — 180.000đ",
  description:
    "EA FC 27 đã ra mắt. Mua Launch Edition giá 180.000đ, thanh toán QR ngân hàng và nhận mã truy cập qua email.",
  alternates: { canonical: "https://dungdibinhluan.com/games/fc27/select" },
};

const benefits = [
  "Bộ cài đặt EA FC 27 đầy đủ",
  "ClientTool DungDiBinhLuan hỗ trợ cài đặt",
  "Mã truy cập được gửi tự động qua email sau thanh toán",
  "Hỗ trợ cài đặt qua Fanpage/Zalo, kèm TeamViewer/UltraViewer",
];

export default function FC27SelectPage() {
  const price = formatVnd(product.price);

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)] px-4 py-10 text-[var(--color-body)] md:py-14">
      <Container className="max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <h1 className="text-h1 text-[var(--color-title)]">Chọn phiên bản FC 27</h1>
          <p className="mx-auto max-w-xl text-sm text-[var(--color-muted)]">
            FC 27 đã chính thức ra mắt. Thanh toán bằng QR ngân hàng và nhận mã
            truy cập khu tải qua email.
          </p>
          <div className="flex justify-center pt-1">
            <CheckUyTinButton />
          </div>
        </header>

        <Card padding={false} className="mx-auto flex max-w-md flex-col overflow-hidden">
          <div className="relative h-48 shrink-0 sm:h-52">
            <Image
              src="/games/fc27/fc27-city.webp"
              alt="EA FC 27 Launch Edition"
              fill
              priority
              sizes="(min-width: 640px) 448px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-1)] via-transparent to-transparent" />
            <div className="absolute left-4 top-4 flex gap-2">
              <Badge tone="accent">Đã ra mắt</Badge>
              <Badge tone="neutral">Launch Edition</Badge>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-5">
            <div className="space-y-1">
              <h2 className="text-h3 text-[var(--color-title)]">{product.name}</h2>
              <p className="text-meta text-[var(--color-muted)]">Bộ cài đặt game</p>
            </div>

            <ul className="space-y-1.5 text-sm">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-[var(--color-body)]">
                  <span aria-hidden="true" className="mt-0.5 text-[var(--color-ok)]">
                    ✓
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>

            <InlineNotice tone="accent" title="Nhận game sau thanh toán">
              {product.fulfillment.receiveText}
            </InlineNotice>

            <div className="mt-auto space-y-3 border-t border-[var(--color-line)] pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-meta text-[var(--color-muted)]">Giá</span>
                <span className="tabular text-xl font-extrabold text-[var(--color-title)]">
                  {price}
                </span>
              </div>
              <ButtonLink href={product.checkoutPath} size="lg" fullWidth>
                Mua FC 27 — {price}
              </ButtonLink>
            </div>
          </div>
        </Card>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/games/fc27"
            className="text-sm font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
          >
            Đã có mã? Mở khu tải →
          </Link>
          <Link
            href="/"
            className="text-meta text-[var(--color-muted)] transition-colors hover:text-[var(--color-body)]"
          >
            ← Về trang chủ
          </Link>
        </div>
      </Container>
    </main>
  );
}
