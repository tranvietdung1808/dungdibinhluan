import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS } from "@/lib/payment/config";
import { formatVnd } from "../games/components/format";
import SaleBanner from "./SaleBanner";
import s from "./page.module.css";

const game = PRODUCTS["fc27-standard"];
const combo = PRODUCTS["fc27-combo"];
const vietHoa = PRODUCTS["fc27-viet-hoa"];

export const metadata: Metadata = {
  title: `Siêu sale EA FC 27 — chỉ ${formatVnd(game.price)}, combo Việt hóa ${formatVnd(combo.price)}`,
  description: `Siêu sale EA FC 27: game chỉ ${formatVnd(game.price)}, Việt hóa ${formatVnd(vietHoa.price)}, combo game + Việt hóa chỉ ${formatVnd(combo.price)}. Thanh toán QR, nhận mã qua email, hỗ trợ cài qua UltraViewer.`,
  alternates: { canonical: "https://dungdibinhluan.com/sieu-sale" },
  openGraph: {
    title: `SIÊU SALE EA FC 27 — chỉ ${formatVnd(game.price)}`,
    description: `Combo game + Việt hóa chỉ ${formatVnd(combo.price)}.`,
    images: [{ url: "/sale/sale-action.webp", width: 1920, height: 1080, alt: "Siêu sale EA FC 27" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `SIÊU SALE EA FC 27 — chỉ ${formatVnd(game.price)}`,
    description: `Combo game + Việt hóa chỉ ${formatVnd(combo.price)}.`,
    images: ["/sale/sale-action.webp"],
  },
};

const rows: [string, boolean, boolean, boolean][] = [
  ["Bộ cài EA FC 27 Standard Edition", true, true, false],
  ["Mã tải game gửi qua email", true, true, false],
  ["Bản Việt hóa FC 27", false, true, true],
  ["Admin cài Việt hóa qua UltraViewer", false, true, true],
  ["Hỗ trợ cài đặt qua Fanpage/Zalo", true, true, true],
];

const faqs = [
  [
    `Combo ${formatVnd(combo.price)} nhận những gì?`,
    "Bạn nhận mã tải EA FC 27 qua email ngay sau khi thanh toán, sau đó nhắn fanpage kèm mã đơn và ID UltraViewer để admin cài bản Việt hóa cho bạn.",
  ],
  [
    "Mua game trước, sau đó mua Việt hóa có được không?",
    `Được. Game ${formatVnd(game.price)} + Việt hóa ${formatVnd(vietHoa.price)} mua riêng vẫn dùng bình thường — nhưng mua combo ${formatVnd(combo.price)} sẽ rẻ hơn.`,
  ],
  [
    "Siêu sale kéo dài bao lâu?",
    "Giá sale áp dụng cho tới khi có thông báo mới trên fanpage và trang chủ.",
  ],
];

export default function SieuSalePage() {
  const separate = game.price + vietHoa.price;

  return (
    <main className={s.page}>
      <SaleBanner />

      <section className={s.section} aria-labelledby="compare-title">
        <p className={s.eyebrow}>SO SÁNH NHANH</p>
        <h2 id="compare-title">
          Mua lẻ {formatVnd(separate)} — combo chỉ {formatVnd(combo.price)}.
        </h2>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Bao gồm</th>
                <th scope="col">
                  Game
                  <small>{formatVnd(game.price)}</small>
                </th>
                <th scope="col" className={s.hl}>
                  Combo
                  <small>{formatVnd(combo.price)}</small>
                </th>
                <th scope="col">
                  Việt hóa
                  <small>{formatVnd(vietHoa.price)}</small>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, ...cols]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {cols.map((yes, i) => (
                    <td key={i} className={i === 1 ? s.hl : undefined}>
                      {yes ? (
                        <span className={s.yes} aria-label="Có">✓</span>
                      ) : (
                        <span className={s.no} aria-label="Không">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" />
                <td>
                  <Link href={game.checkoutPath} className={s.btn}>
                    Mua game
                  </Link>
                </td>
                <td className={s.hl}>
                  <Link href={combo.checkoutPath} className={`${s.btn} ${s.btnPrimary}`}>
                    Mua combo
                  </Link>
                </td>
                <td>
                  <Link href={vietHoa.checkoutPath} className={s.btn}>
                    Donate
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.section} aria-labelledby="sale-faq">
        <p className={s.eyebrow}>HỎI NHANH</p>
        <h2 id="sale-faq">Trước khi chốt đơn.</h2>
        <div className={s.faq}>
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <p className={s.links}>
          <Link href="/viet-hoa-fc27">Xem ảnh bản Việt hóa →</Link>
          <Link href="/games/fc27/select">Chi tiết gói game →</Link>
        </p>
      </section>
    </main>
  );
}
