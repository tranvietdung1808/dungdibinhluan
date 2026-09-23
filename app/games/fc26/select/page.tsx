import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PRODUCTS, type ProductId } from "@/lib/payment/config";
import CheckUyTinButton from "../../../components/CheckUyTinButton";
import FlashSaleBanner from "../../../components/FlashSaleBanner";
import { Badge, ButtonLink, Card, Container, InlineNotice } from "../../../components/ui";
import { FC26_GAME_SIZE } from "../../../data/games";
import { formatVnd } from "../../components/format";

export const metadata: Metadata = {
  title: "Chọn phiên bản EA FC 26",
  description: "So sánh và chọn phiên bản EA FC 26 phù hợp trước khi thanh toán.",
  alternates: {
    canonical: "https://dungdibinhluan.com/games/fc26/select",
  },
};

// =====================================================
// §12.1 — Chọn phiên bản FC 26
// Giá/cách nhận lấy từ PRODUCTS (một nguồn với checkout/email).
// Không giá cũ/% giảm khi chưa có chiến dịch thật; không bịa
// chế độ chơi hay hình thức kích hoạt chưa xác minh.
// =====================================================

type EditionId = "normal" | "mods";

const EDITIONS: {
  id: EditionId;
  productId: ProductId;
  badge: string;
  badgeTone: "neutral" | "violet";
  image: string;
  contentType: string;
  includes: string[];
  excludes: string[];
}[] = [
  {
    id: "normal",
    productId: "fc26-normal",
    badge: "Standard",
    badgeTone: "neutral",
    image: "/games/fc26n.jpg",
    contentType: "Bộ cài đặt game",
    includes: [
      `Bộ cài đặt EA FC 26 đầy đủ (${FC26_GAME_SIZE}, file RAR)`,
      "ClientTool hỗ trợ giải nén và cài đặt",
      "Hỗ trợ cài đặt qua Fanpage/Zalo, kèm TeamViewer/UltraViewer",
    ],
    excludes: ["Gói Full Mods (faces, kits, đồ họa, gameplay)"],
  },
  {
    id: "mods",
    productId: "fc26-mods",
    badge: "Full Mods",
    badgeTone: "violet",
    image: "/games/fc26-banner.jpg",
    contentType: "Bộ cài đặt game + gói mod",
    includes: [
      "Toàn bộ nội dung bản Standard",
      "Gói Full Mods Pack: faces, kits, đồ họa, gameplay",
      "Hỗ trợ cài đặt qua Fanpage/Zalo, kèm TeamViewer/UltraViewer",
    ],
    excludes: [],
  },
];

const COMPARISON: { label: string; values: [boolean | string, boolean | string] }[] = [
  { label: `Bộ cài đặt game (${FC26_GAME_SIZE})`, values: [true, true] },
  { label: "ClientTool cài đặt", values: [true, true] },
  { label: "Gói Full Mods Pack", values: [false, true] },
  { label: "Cách nhận", values: ["Mã kích hoạt qua email", "Mã kích hoạt qua email"] },
];

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="text-[var(--color-ok)]" aria-label="Có">
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-[var(--color-muted)]" aria-label="Không có">
        —
      </span>
    );
  }
  return <span className="text-[var(--color-body)]">{value}</span>;
}

export default async function SelectEditionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const editionParam = params.edition;
  const invalidEdition =
    typeof editionParam === "string" &&
    editionParam !== "" &&
    !EDITIONS.some((e) => e.id === editionParam);

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)] px-4 py-10 text-[var(--color-body)] md:py-14">
      <Container className="max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <h1 className="text-h1 text-[var(--color-title)]">Chọn phiên bản FC 26</h1>
          <p className="mx-auto max-w-xl text-sm text-[var(--color-muted)]">
            So sánh hai phiên bản trước khi thanh toán. Mã kích hoạt được gửi qua
            email sau khi hệ thống xác nhận thanh toán.
          </p>
          <div className="flex justify-center pt-1">
            <CheckUyTinButton />
          </div>
        </header>

        {/* Chỉ hiện khi có endsAt/NEXT_PUBLIC_SALE_ENDS_AT thật */}
        <FlashSaleBanner />

        {invalidEdition && (
          <InlineNotice tone="warning" title="Phiên bản không hợp lệ">
            Liên kết bạn mở có phiên bản “{editionParam}” không tồn tại. Hãy chọn
            một trong hai phiên bản bên dưới — chúng tôi không tự chọn giúp bạn.
          </InlineNotice>
        )}

        {/* Hai card cùng chiều cao (desktop) / xếp dọc (mobile) */}
        <div className="grid items-stretch gap-5 md:grid-cols-2">
          {EDITIONS.map((ed) => {
            const product = PRODUCTS[ed.productId];
            const price = formatVnd(product.price);
            return (
              <Card key={ed.id} padding={false} className="flex h-full flex-col overflow-hidden">
                <div className="relative h-40 shrink-0">
                  <Image
                    src={ed.image}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 380px, 100vw"
                    className="object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-1)] via-transparent to-transparent" />
                  <div className="absolute left-4 top-4">
                    <Badge tone={ed.badgeTone}>{ed.badge}</Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="space-y-1">
                    <h2 className="text-h3 text-[var(--color-title)]">{product.name}</h2>
                    <p className="text-meta text-[var(--color-muted)]">{ed.contentType}</p>
                  </div>

                  <ul className="space-y-1.5 text-sm">
                    {ed.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[var(--color-body)]">
                        <span aria-hidden="true" className="mt-0.5 text-[var(--color-ok)]">✓</span>
                        {item}
                      </li>
                    ))}
                    {ed.excludes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[var(--color-muted)]">
                        <span aria-hidden="true" className="mt-0.5">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p className="text-meta leading-relaxed text-[var(--color-muted)]">
                    {product.fulfillment.receiveText}
                  </p>

                  <div className="mt-auto space-y-3 border-t border-[var(--color-line)] pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-meta text-[var(--color-muted)]">Giá</span>
                      <span className="tabular text-xl font-extrabold text-[var(--color-title)]">
                        {price}
                      </span>
                    </div>
                    {/* Một accent CTA duy nhất — edition phân biệt bằng tên + nhãn */}
                    <ButtonLink href={product.checkoutPath} size="lg" fullWidth>
                      Mua {ed.badge} — {price}
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bảng so sánh ngắn */}
        <Card padding={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-meta text-[var(--color-muted)]">
                <th scope="col" className="px-5 py-3 font-medium">Nội dung</th>
                <th scope="col" className="px-5 py-3 text-center font-medium">Standard</th>
                <th scope="col" className="px-5 py-3 text-center font-medium">Full Mods</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-[var(--color-line)] last:border-0">
                  <th scope="row" className="px-5 py-3 text-left font-normal text-[var(--color-body)]">
                    {row.label}
                  </th>
                  <td className="px-5 py-3 text-center"><ComparisonCell value={row.values[0]} /></td>
                  <td className="px-5 py-3 text-center"><ComparisonCell value={row.values[1]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/games/fc26"
            className="text-sm font-semibold text-[var(--color-accent-strong)] underline-offset-4 hover:underline"
          >
            Đã có mã? Nhập mã →
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
