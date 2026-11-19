import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CheckUyTinButton from "@/app/components/CheckUyTinButton";
import { PRODUCTS } from "@/lib/payment/config";
import { SUPPORT_URL as FANPAGE_URL } from "@/lib/payment/order-status";
import { formatVnd } from "../games/components/format";
import { VIET_HOA_PERKS, VIET_HOA_SHOTS } from "./data";
import s from "./viet-hoa.module.css";

const product = PRODUCTS["fc27-viet-hoa"];
const combo = PRODUCTS["fc27-combo"];
const price = formatVnd(product.price);
const ZALO_URL = "https://zalo.me/0917742686";

export const metadata: Metadata = {
  title: `Việt hóa EA FC 27 — Donate ${price}, cài đặt qua UltraViewer`,
  description: `Bản Việt hóa EA FC 27: menu, Career Mode, hồ sơ cầu thủ, chuyển nhượng bằng tiếng Việt. Donate ${price} để được admin cài đặt trực tiếp qua UltraViewer.`,
  alternates: { canonical: "https://dungdibinhluan.com/viet-hoa-fc27" },
  openGraph: {
    title: "Việt hóa EA FC 27 — Chơi FC 27 bằng tiếng Việt",
    description: `Donate ${price} để được hỗ trợ cài đặt bản Việt hóa qua UltraViewer.`,
    images: [
      {
        url: "/viet-hoa-fc27/kickoff.webp",
        width: 2048,
        height: 1150,
        alt: "EA FC 27 Việt hóa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Việt hóa EA FC 27",
    description: `Donate ${price} — cài đặt qua UltraViewer.`,
    images: ["/viet-hoa-fc27/kickoff.webp"],
  },
};

const steps = [
  {
    title: `Donate ${price}`,
    text: "Quét QR ngân hàng, hệ thống tự xác nhận và gửi mã đơn qua email.",
  },
  {
    title: "Nhắn fanpage",
    text: "Gửi mã đơn (hoặc ảnh giao dịch) cho fanpage DungDiBinhLuan.",
  },
  {
    title: "Cài qua UltraViewer",
    text: "Gửi ID + mật khẩu UltraViewer, admin cài Việt hóa trực tiếp trên máy bạn.",
  },
];

const requirements = [
  "Máy tính Windows đã cài sẵn EA FC 27",
  "Phần mềm UltraViewer (miễn phí tại ultraviewer.net)",
  "Kết nối mạng ổn định trong lúc cài đặt",
];

const faqs = [
  [
    "Donate xong bao lâu thì được cài?",
    "Ngay khi bạn nhắn fanpage kèm mã đơn, admin sẽ hẹn lịch và cài qua UltraViewer. Giờ cao điểm page trả lời trong tối đa 6 tiếng; quá thời gian này hãy nhắn Zalo 0917742686.",
  ],
  [
    "Tôi có cần tự cài gì không?",
    "Không. Bạn chỉ cần mở UltraViewer và gửi ID + mật khẩu, admin sẽ thao tác cài toàn bộ bản Việt hóa cho bạn.",
  ],
  [
    "Bản Việt hóa có ảnh hưởng tới game gốc không?",
    "Bản Việt hóa chỉ thay đổi ngôn ngữ hiển thị. Nếu có lỗi sau khi cài, nhắn fanpage để được hỗ trợ xử lý.",
  ],
  [
    "Chưa có EA FC 27 thì sao?",
    `Bạn cần cài EA FC 27 trước. Đang Siêu sale: combo game + Việt hóa chỉ ${formatVnd(combo.price)} — nhận mã tải game qua email, admin cài Việt hóa qua UltraViewer.`,
  ],
];

export default function VietHoaFC27Page() {
  return (
    <main className={s.page}>
      {/* Hero */}
      <section className={s.hero} aria-labelledby="vh-title">
        <div className={s.heroGlow} aria-hidden="true" />
        <div className={s.container}>
          <div className={s.heroGrid}>
            <div className={s.heroCopy}>
              <p className={s.eyebrow}>
                <span className={s.pulse} aria-hidden="true" /> MỚI RA MẮT ·
                BẢN VIỆT HÓA
              </p>
              <h1 id="vh-title" className={s.title}>
                EA FC 27
                <span>Tiếng Việt</span>
              </h1>
              <p className={s.lead}>
                Menu, Career Mode, hồ sơ cầu thủ, chuyển nhượng… tất cả bằng
                tiếng Việt. Không cần đoán nghĩa, chơi FC 27 thoải mái như game
                Việt.
              </p>

              <div className={s.offer}>
                <div>
                  <span className={s.overline}>DONATE ĐỂ ĐƯỢC CÀI ĐẶT</span>
                  <strong>{price}</strong>
                </div>
                <Link href={product.checkoutPath} className={s.primary}>
                  DONATE &amp; CÀI NGAY <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <p className={s.offerNote}>
                Admin cài trực tiếp qua <b>UltraViewer</b> — bạn không cần tự
                thao tác.
              </p>
              <div className={s.trust}>
                <CheckUyTinButton />
                <a href="#anh-thuc-te" className={s.ghostLink}>
                  Xem ảnh thực tế ↓
                </a>
              </div>
            </div>

            <div className={s.heroShot}>
              <div className={s.screen}>
                <Image
                  src={VIET_HOA_SHOTS[0].src}
                  alt={VIET_HOA_SHOTS[0].alt}
                  width={2048}
                  height={1150}
                  priority
                  sizes="(max-width: 900px) 100vw, 640px"
                />
              </div>
              <div className={s.floatCard}>
                <Image
                  src={VIET_HOA_SHOTS[1].src}
                  alt=""
                  width={2048}
                  height={1150}
                  sizes="260px"
                />
              </div>
              <span className={s.badgeVn}>Giao diện tiếng Việt</span>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <div className={s.strip}>
        <div className={s.container}>
          <ul>
            <li>
              <b>Giao bóng</b>
              <span>Menu & cài đặt</span>
            </li>
            <li>
              <b>Career Mode</b>
              <span>Hồ sơ · Phát triển</span>
            </li>
            <li>
              <b>Chuyển nhượng</b>
              <span>Hợp đồng · Cho mượn</span>
            </li>
            <li>
              <b>UltraViewer</b>
              <span>Admin cài tận nơi</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Gallery */}
      <section
        id="anh-thuc-te"
        className={s.section}
        aria-labelledby="vh-gallery"
      >
        <div className={s.sectionHead}>
          <p className={s.eyebrow}>ẢNH CHỤP TRONG GAME</p>
          <h2 id="vh-gallery">Nhìn là hiểu, chơi là mê.</h2>
          <p>Ảnh chụp thực tế từ bản Việt hóa EA FC 27. Bấm để xem kích thước đầy đủ.</p>
        </div>
        <div className={s.gallery}>
          {VIET_HOA_SHOTS.map((shot) => (
            <a
              key={shot.src}
              href={shot.src}
              target="_blank"
              rel="noopener noreferrer"
              className={s.shot}
            >
              <div className={s.shotImage}>
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                />
              </div>
              <div className={s.shotCaption}>
                <h3>{shot.title}</h3>
                <p>{shot.caption}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Package + steps */}
      <section className={s.section} aria-labelledby="vh-package">
        <div className={s.packageGrid}>
          <div className={s.packageCard}>
            <p className={s.eyebrow}>GÓI HỖ TRỢ CÀI ĐẶT</p>
            <h2 id="vh-package">Việt hóa EA FC 27</h2>
            <p className={s.packagePrice}>
              {price}
              <small>donate một lần</small>
            </p>
            <ul className={s.perks}>
              {VIET_HOA_PERKS.map((perk) => (
                <li key={perk}>
                  <span aria-hidden="true">✓</span>
                  {perk}
                </li>
              ))}
            </ul>
            <Link href={product.checkoutPath} className={s.primary}>
              DONATE {price} — CÀI NGAY <span aria-hidden="true">↗</span>
            </Link>
            <p className={s.fineprint}>
              Donate qua QR tự xác nhận · Mã đơn gửi qua email
            </p>
          </div>

          <div className={s.howTo}>
            <p className={s.eyebrow}>3 BƯỚC LÀ XONG</p>
            <h2>Donate xong, admin cài ngay.</h2>
            <ol className={s.steps}>
              {steps.map((step, i) => (
                <li key={step.title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className={s.requirements}>
              <h3>Cần chuẩn bị</h3>
              <ul>
                {requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <a
                href="https://www.ultraviewer.net/vi/download.html"
                target="_blank"
                rel="noopener noreferrer"
                className={s.ghostLink}
              >
                Tải UltraViewer ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={s.section} aria-labelledby="vh-faq">
        <div className={s.faqGrid}>
          <div>
            <p className={s.eyebrow}>HỎI NHANH</p>
            <h2 id="vh-faq">Trước khi donate.</h2>
            <p className={s.muted}>
              Cần tư vấn thêm? Nhắn{" "}
              <a href={FANPAGE_URL} target="_blank" rel="noopener noreferrer">
                fanpage
              </a>{" "}
              hoặc{" "}
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer">
                Zalo
              </a>
              .
            </p>
          </div>
          <div className={s.faqList}>
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
        </div>
      </section>

      {/* Final CTA */}
      <section className={s.final}>
        <div className={s.container}>
          <div className={s.finalCard}>
            <div>
              <h2>Chơi FC 27 bằng tiếng Việt ngay hôm nay.</h2>
              <p>
                Donate {price} — admin cài tận máy qua UltraViewer.
              </p>
            </div>
            <Link href={product.checkoutPath} className={s.primary}>
              DONATE &amp; CÀI NGAY <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className={s.backLinks}>
            <Link href={combo.checkoutPath}>
              Chưa có game? Combo game + Việt hóa chỉ {formatVnd(combo.price)} →
            </Link>
            <Link href="/">← Về trang chủ</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
