import Image from "next/image";
import Link from "next/link";
import { PRODUCTS, type ProductConfig } from "@/lib/payment/config";
import { formatVnd } from "../games/components/format";
import s from "./sale.module.css";

// =====================================================
// SaleBanner — banner "Siêu sale" dùng cho trang chủ và /sieu-sale.
// Giá + giá gạch đọc từ PRODUCTS (server vẫn là nguồn thu tiền).
// =====================================================

const game = PRODUCTS["fc27-standard"];
const combo = PRODUCTS["fc27-combo"];
const vietHoa = PRODUCTS["fc27-viet-hoa"];

function percentOff(p: ProductConfig): number | null {
  return p.listPrice ? Math.round((1 - p.price / p.listPrice) * 100) : null;
}

const offers = [
  {
    key: "game",
    product: game,
    tag: "Game",
    title: "EA FC 27",
    sub: "Bộ cài Standard Edition + mã tải",
    image: "/sale/sale-spain.webp",
    cta: "Mua game",
    href: game.checkoutPath,
  },
  {
    key: "combo",
    product: combo,
    tag: "Combo hời nhất",
    title: "Game + Việt hóa",
    sub: "Tải game + admin cài Việt hóa qua UltraViewer",
    image: "/games/fc27/fc27-city.webp",
    cta: "Mua combo",
    href: combo.checkoutPath,
    featured: true,
  },
  {
    key: "viet-hoa",
    product: vietHoa,
    tag: "Việt hóa",
    title: "Việt hóa FC 27",
    sub: "Donate — cài trực tiếp qua UltraViewer",
    image: "/viet-hoa-fc27/kickoff.webp",
    cta: "Donate Việt hóa",
    href: vietHoa.checkoutPath,
  },
];

export default function SaleBanner({ id }: { id?: string }) {
  const comboSave = combo.listPrice ? combo.listPrice - combo.price : 0;

  return (
    <section id={id} className={s.banner} aria-labelledby="sale-title">
      <div className={s.bg} aria-hidden="true">
        <Image
          src="/sale/sale-action.webp"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className={s.shade} aria-hidden="true" />
      <div className={s.inner}>
        <div className={s.head}>
          <p className={s.kicker}>
            <span className={s.flash} aria-hidden="true">
              ⚡
            </span>
            EA SPORTS FC 27 · ƯU ĐÃI LỚN NHẤT MÙA GIẢI
          </p>
          <h1 id="sale-title" className={s.title}>
            SIÊU <span>SALE</span>
          </h1>
          <p className={s.lead}>
            Game EA FC 27 chỉ còn <b>{formatVnd(game.price)}</b>
            {percentOff(game) && <> (giảm {percentOff(game)}%)</>} · Combo game
            + Việt hóa chỉ <b>{formatVnd(combo.price)}</b>
          </p>
        </div>

        <div className={s.offers}>
          {offers.map((o) => (
            <Link
              key={o.key}
              href={o.href}
              className={`${s.offer} ${o.featured ? s.featured : ""}`}
            >
              {o.featured && (
                <span className={s.ribbon}>
                  Tiết kiệm {formatVnd(comboSave)}
                </span>
              )}
              <div className={s.offerImage}>
                <Image
                  src={o.image}
                  alt=""
                  fill
                  sizes="(max-width: 860px) 100vw, 380px"
                />
                {percentOff(o.product) && (
                  <span className={s.off}>-{percentOff(o.product)}%</span>
                )}
              </div>
              <div className={s.offerBody}>
                <span className={s.tag}>{o.tag}</span>
                <h2>{o.title}</h2>
                <p>{o.sub}</p>
                <div className={s.priceRow}>
                  <strong>{formatVnd(o.product.price)}</strong>
                  {o.product.listPrice && (
                    <del>{formatVnd(o.product.listPrice)}</del>
                  )}
                </div>
                <span className={s.cta}>
                  {o.cta} <span aria-hidden="true">↗</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className={s.foot}>
          Thanh toán QR tự xác nhận · Mã tải gửi qua email · Hỗ trợ cài đặt qua
          UltraViewer ·{" "}
          <Link href="/games/fc27">Đã mua? Nhập mã để tải →</Link>
        </p>
      </div>
    </section>
  );
}
