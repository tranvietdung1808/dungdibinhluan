import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GAMES } from "./data/games";
import { MODS } from "./data/mods";
import { FACES } from "./data/faces";
import { createClient } from "@/utils/supabase/server";
import { resolveThumbnailSrc } from "@/utils/r2";
import s from "./home.module.css";

const PREORDER_PRICE = 180000;
const price = new Intl.NumberFormat("vi-VN").format(PREORDER_PRICE) + "đ";
const contactUrl = "https://web.facebook.com/dungbinhluan/";
export const metadata: Metadata = {
  title: "Đặt trước EA FC 27 — 180.000đ | FC 26 & Mods",
  description:
    "Đặt trước FC 27 giá 180.000đ tại DungDiBinhLuan. Chơi ngay khi game ra mắt. Khám phá FC 26, mods và hướng dẫn Career Mode.",
  alternates: { canonical: "https://dungdibinhluan.com" },
  openGraph: {
    title: "EA FC 27 — Sẵn sàng cho mùa giải mới",
    description: "Đặt trước 180.000đ. Chơi ngay khi game ra mắt.",
    images: [
      {
        url: "/games/fc27/fc27-city.webp",
        width: 1240,
        height: 698,
        alt: "EA FC 27",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Đặt trước EA FC 27 — 180.000đ",
    description: "Chơi ngay khi game ra mắt.",
    images: ["/games/fc27/fc27-city.webp"],
  },
};
export const revalidate = 3600;
type HomeGuide = {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  thumbnail_url: string | null;
};
type HomeDbMod = {
  id: string;
  slug: string;
  name: string;
  updated_at: string;
  thumbnail: string | null;
  tags: string[];
};
type HomeModCard = {
  slug: string;
  name: string;
  updatedAt: string;
  thumbnail: string;
  tag: string;
};
const parseDate = (value: string) => {
  if (value.includes("/")) {
    const [d, m, y] = value.split("/").map(Number);
    return new Date(y, m - 1, d).getTime() || 0;
  }
  return new Date(value).getTime() || 0;
};
const sortModsByUpdated = (a: HomeModCard, b: HomeModCard) =>
  parseDate(b.updatedAt) - parseDate(a.updatedAt);
const Arrow = () => <span aria-hidden="true">↗</span>;
const faqs = [
  [
    "Đặt trước FC 27 giá bao nhiêu?",
    "Giá đặt trước là 180.000đ. Nhấn “Liên hệ đặt trước” để trao đổi với DungDiBinhLuan trên Facebook và xác nhận thông tin gói trước khi thanh toán.",
  ],
  [
    "Khi nào mình được chơi FC 27?",
    "Chơi ngay khi game ra mắt. Thời điểm mở chơi và hướng dẫn nhận game sẽ được xác nhận trực tiếp qua kênh hỗ trợ khi đặt trước.",
  ],
  [
    "Gói đặt trước bao gồm phiên bản nào?",
    "Liên hệ để xác nhận phiên bản, hình thức kích hoạt, chế độ chơi và cấu hình phù hợp trước khi đặt. Hình ảnh trên trang dùng để minh họa, không đại diện cho quyền lợi của gói.",
  ],
  [
    "FC 26 và các bản mod có còn không?",
    "Có. FC 26 vẫn có khu chọn phiên bản riêng, cùng thư viện mods và hướng dẫn hiện tại. Bạn có thể tiếp tục chơi FC 26 trong lúc chờ FC 27.",
  ],
  [
    "Mods FC 26 có dùng được cho FC 27 không?",
    "Các mods hiện có được ghi theo phiên bản hỗ trợ trên từng trang chi tiết. Chỉ sử dụng cho FC 27 khi bản mod đã được xác nhận tương thích.",
  ],
];

export default async function HomePage() {
  const supabase = createClient();
  const [guidesRes, dbModsRes] = await Promise.all([
    supabase
      .from("guides")
      .select("id,title,slug,created_at,thumbnail_url")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("mods")
      .select("id,slug,name,updated_at,thumbnail,tags")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const latestGuides: HomeGuide[] = guidesRes.data || [];
  const heroGuides = latestGuides.slice(0, 6).map((guide) => ({
    id: guide.id,
    slug: guide.slug,
    title: guide.title,
    createdAt: new Date(guide.created_at).toLocaleDateString("vi-VN"),
    thumbnail: resolveThumbnailSrc(guide.thumbnail_url) || "",
  }));

  const staticMods: HomeModCard[] = [...MODS, ...FACES].map((mod) => ({
    slug: mod.slug,
    name: mod.name,
    updatedAt: mod.updatedAt,
    thumbnail: mod.thumbnail || "",
    tag: mod.tags?.[0] || "MOD",
  }));

  const dbMods: HomeModCard[] = ((dbModsRes.data || []) as HomeDbMod[]).map(
    (mod) => ({
      slug: mod.slug,
      name: mod.name,
      updatedAt: mod.updated_at,
      thumbnail: resolveThumbnailSrc(mod.thumbnail) || "",
      tag: mod.tags?.[0] || "MOD",
    }),
  );

  const latestMods = [
    ...new Map(
      [...staticMods, ...dbMods].map((mod) => [mod.slug, mod]),
    ).values(),
  ].sort(sortModsByUpdated);

  return (
    <main className={s.home} id="home">
      <a href="#dat-truoc" className={s.skip}>
        Đến phần đặt trước FC 27
      </a>
      <div className={s.announcement}>
        <span className={s.dot} /> MÙA GIẢI MỚI ĐANG ĐẾN{" "}
        <span className={s.announcementDivider}>/</span>{" "}
        <a href="#dat-truoc">
          Đặt trước FC 27 · {price} <Arrow />
        </a>
      </div>
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={s.heroArt}>
          <Image
            src="/games/fc27/fc27-portrait.webp"
            alt="Ảnh minh họa EA FC 27 với cầu thủ trong trang phục Real Madrid"
            fill
            priority
            sizes="(max-width: 700px) 100vw, 58vw"
            className={s.portrait}
          />
        </div>
        <div className={s.heroShade} />
        <div className={s.container}>
          <div className={s.heroTop}>
            <span>DUNGDIBINHLUAN / NEXT SEASON</span>
            <span>FC 27 — ĐẶT TRƯỚC</span>
          </div>
          <div className={s.heroContent}>
            <p className={s.eyebrow}>
              <span className={s.dot} /> SẴN SÀNG CHO NGÀY RA MẮT
            </p>
            <h1 id="hero-title" className={s.heroTitle}>
              EA FC <span>27</span>
              <small>
                Mùa giải mới.
                <br />
                Đam mê tiếp nối.
              </small>
            </h1>
            <p className={s.heroDescription}>
              Chơi ngay khi game ra mắt.
              <br />
              Đặt trước hôm nay, sẵn sàng bước vào sân.
            </p>
            <div className={s.heroOffer}>
              <div>
                <span className={s.overline}>GIÁ ĐẶT TRƯỚC</span>
                <strong>{price}</strong>
              </div>
              <a href="#dat-truoc" className={s.primary}>
                ĐẶT TRƯỚC FC 27 <Arrow />
              </a>
            </div>
            <Link href="/games/fc26/select" className={s.quietLink}>
              Muốn chơi ngay? Khám phá FC 26 <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={s.heroBottom}>
            <span>01 / MÙA GIẢI TIẾP THEO</span>
            <a href="#dat-truoc">
              KHÁM PHÁ FC 27 <span aria-hidden="true">↓</span>
            </a>
            <span className={s.artNote}>HÌNH ẢNH MINH HỌA</span>
          </div>
        </div>
      </section>
      <div className={s.seasonRail}>
        <div className={s.container}>
          <a href="#dat-truoc">
            <span className={s.dot} />
            <b>FC 27</b>
            <span>Đang nhận đặt trước</span>
            <Arrow />
          </a>
          <a href="#fc26">
            <b>FC 26</b>
            <span>Sẵn sàng để chơi</span>
            <Arrow />
          </a>
          <Link href="/mods">
            <b>MODS & CAREER MODE</b>
            <span>Tiếp tục đam mê</span>
            <Arrow />
          </Link>
        </div>
      </div>
      <section
        id="dat-truoc"
        className={s.section}
        aria-labelledby="preorder-title"
      >
        <div className={s.sectionHeader}>
          <div>
            <p className={s.eyebrow}>01 / KHỞI ĐỘNG MÙA GIẢI MỚI</p>
            <h2 id="preorder-title">Sẵn sàng. Ngay từ hôm nay.</h2>
          </div>
          <span className={s.status}>ĐANG NHẬN ĐẶT TRƯỚC</span>
        </div>
        <div className={s.preorderGrid}>
          <div className={s.cityCard}>
            <div className={s.cityImage}>
              <Image
                src="/games/fc27/fc27-city.webp"
                alt="Ảnh minh họa FC 27 trên nền thành phố và sân bóng"
                fill
                sizes="(max-width: 800px) 100vw, 60vw"
              />
            </div>
            <div className={s.cityCaption}>
              <div>
                <span className={s.overline}>EA SPORTS FC 27</span>
                <h3>Một mùa giải để mong chờ.</h3>
              </div>
              <span aria-hidden="true">↗</span>
            </div>
          </div>
          <div className={s.orderCard}>
            <p className={s.eyebrow}>DÀNH CHO ANH EM SẴN SÀNG</p>
            <h3>Đặt trước FC 27</h3>
            <p className={s.orderPrice}>{price}</p>
            <p className={s.orderPromise}>Chơi ngay khi game ra mắt.</p>
            <ul className={s.benefits}>
              <li>
                <span>01</span> Xác nhận gói phù hợp trước khi đặt
              </li>
              <li>
                <span>02</span> Nhận thông tin mở chơi qua hỗ trợ
              </li>
              <li>
                <span>03</span> Hướng dẫn nhận game khi ra mắt
              </li>
            </ul>
            <a
              className={s.primary}
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              LIÊN HỆ ĐẶT TRƯỚC <Arrow />
            </a>
            <p className={s.fineprint}>
              Mở Facebook của DungDiBinhLuan để xác nhận đơn và thông tin gói.
            </p>
          </div>
        </div>
        <div className={s.steps}>
          <div>
            <span>01</span>
            <h3>Chọn mùa giải mới</h3>
            <p>FC 27 với giá đặt trước {price}.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Kết nối với Page</h3>
            <p>Nhắn Page để xác nhận phiên bản và cách nhận game.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Sẵn sàng vào sân</h3>
            <p>Chơi ngay khi game ra mắt.</p>
          </div>
        </div>
      </section>
      <section id="fc26" className={s.section} aria-labelledby="fc26-title">
        <div className={s.sectionHeader}>
          <div>
            <p className={s.eyebrow}>02 / TRONG LÚC CHỜ FC 27</p>
            <h2 id="fc26-title">Sân cỏ vẫn đang chờ bạn.</h2>
          </div>
          <Link href="/games/fc26" className={s.textLink}>
            Chi tiết FC 26 <Arrow />
          </Link>
        </div>
        <div className={s.fc26Card}>
          <Image
            src="/games/fc26-banner.jpg"
            alt="EA FC 26"
            fill
            sizes="(max-width: 800px) 100vw, 1200px"
          />
          <div className={s.fc26Shade} />
          <div className={s.fc26Content}>
            <span className={s.status}>ĐANG CÓ SẴN</span>
            <h3>
              EA FC <span>26</span>
            </h3>
            <p>
              Tiếp tục hành trình Career Mode.
              <br />
              Khám phá game, bộ mods và hướng dẫn cài đặt.
            </p>
            <div className={s.actions}>
              <Link href="/games/fc26/select" className={s.secondary}>
                CHỌN PHIÊN BẢN FC 26 <Arrow />
              </Link>
              <Link href="/mods" className={s.textLink}>
                Khám phá mods →
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className={s.section} aria-labelledby="mods-title">
        <div className={s.sectionHeader}>
          <div>
            <p className={s.eyebrow}>03 / THÊM CHẤT RIÊNG CHO GAME</p>
            <h2 id="mods-title">Mods mới. Cảm hứng mới.</h2>
            <p className={s.sectionDescription}>
              Thư viện hiện tại · Xem phiên bản tương thích trong từng bản mod.
            </p>
          </div>
          <Link href="/mods" className={s.textLink}>
            Tất cả mods <Arrow />
          </Link>
        </div>
        <div className={s.modGrid}>
          {latestMods.slice(0, 4).map((mod) => (
            <Link
              key={mod.slug}
              href={"/mods/" + mod.slug}
              className={s.modCard}
            >
              <div className={s.modImage}>
                {mod.thumbnail ? (
                  <Image
                    src={mod.thumbnail}
                    alt={mod.name}
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 25vw"
                    unoptimized={mod.thumbnail.startsWith("/api/media/")}
                  />
                ) : (
                  <span className={s.placeholder}>MOD / FC</span>
                )}
                <span className={s.modTag}>{mod.tag}</span>
              </div>
              <div className={s.modInfo}>
                <h3>{mod.name}</h3>
                <span>
                  KHÁM PHÁ BẢN MOD <Arrow />
                </span>
              </div>
            </Link>
          ))}
        </div>
        {latestMods.length === 0 && (
          <p className={s.empty}>
            Các bản mod đang được cập nhật.{" "}
            <Link href="/mods">Mở thư viện mods →</Link>
          </p>
        )}
      </section>
      <section className={s.editorialSection} aria-labelledby="guides-title">
        <div className={s.editorialGrid}>
          <div className={s.editorialIntro}>
            <p className={s.eyebrow}>04 / NGOÀI ĐƯỜNG BIÊN</p>
            <h2 id="guides-title">
              Hiểu game hơn.
              <br />
              Chơi chất hơn.
            </h2>
            <p>
              Góc chia sẻ chiến thuật, cài đặt và những điều thú vị trong Career
              Mode.
            </p>
            <Link href="/huong-dan" className={s.textLink}>
              Đọc tất cả bài viết <Arrow />
            </Link>
            <div className={s.editorialArt}>
              <Image
                src="/games/fc27/fc27-cover.webp"
                alt="Ảnh minh họa mùa giải FC 27"
                width={1600}
                height={900}
                sizes="(max-width: 800px) 100vw, 400px"
              />
            </div>
          </div>
          <div className={s.guideList}>
            {heroGuides.slice(0, 4).map((guide, index) => (
              <Link
                key={guide.id}
                href={"/huong-dan/" + guide.slug}
                className={s.guide}
              >
                <span className={s.guideNumber}>0{index + 1}</span>
                <div>
                  <span className={s.overline}>{guide.createdAt}</span>
                  <h3>{guide.title}</h3>
                </div>
                {guide.thumbnail && (
                  <div className={s.guideImage}>
                    <Image
                      src={guide.thumbnail}
                      alt=""
                      fill
                      sizes="88px"
                      unoptimized={guide.thumbnail.startsWith("/api/media/")}
                    />
                  </div>
                )}
                <Arrow />
              </Link>
            ))}
            {heroGuides.length === 0 && (
              <div className={s.empty}>
                <h3>Bắt đầu từ một hướng dẫn hay.</h3>
                <p>
                  Khám phá cách cài đặt và chơi game trong chuyên mục hướng dẫn.
                </p>
                <Link href="/huong-dan" className={s.textLink}>
                  Mở chuyên mục →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
      <section id="games" className={s.section} aria-labelledby="games-title">
        <div className={s.sectionHeader}>
          <div>
            <p className={s.eyebrow}>05 / ĐỔI GIÓ MỘT CHÚT</p>
            <h2 id="games-title">Ngoài sân cỏ.</h2>
          </div>
        </div>
        <div className={s.otherGames}>
          {GAMES.filter((game) => !game.spotlight).map((game) => (
            <a
              key={game.slug}
              href={game.fbUrl || contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.otherGame}
            >
              <div className={s.otherImage}>
                <Image
                  src={game.thumbnail || "/games/" + game.slug + "-thumb.jpg"}
                  alt={game.name}
                  fill
                  sizes="(max-width: 600px) 100vw, 50vw"
                />
              </div>
              <div>
                <span className={s.overline}>KHÁM PHÁ THÊM</span>
                <h3>{game.name}</h3>
                <p>{game.description}</p>
                <span className={s.textLink}>
                  Liên hệ mua <Arrow />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <section className={s.section} aria-labelledby="faq-title">
        <div className={s.faqGrid}>
          <div>
            <p className={s.eyebrow}>TRƯỚC KHI VÀO SÂN</p>
            <h2 id="faq-title">
              Bạn hỏi.
              <br />
              Dũng trả lời.
            </h2>
            <p className={s.sectionDescription}>
              Những điều cần biết về đặt trước FC 27.
            </p>
            <Image
              className={s.faqLogo}
              src="/games/fc27/fc27-logo.webp"
              alt="EA Sports FC 27"
              width={250}
              height={125}
            />
          </div>
          <div className={s.faqList}>
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className={s.finalCall}>
        <div className={s.container}>
          <div>
            <p className={s.eyebrow}>HẸN BẠN Ở MÙA GIẢI MỚI</p>
            <h2>
              Trận đấu mới.
              <br />
              <span>Bắt đầu từ đây.</span>
            </h2>
          </div>
          <div className={s.finalOffer}>
            <p>
              Đặt trước FC 27 <strong>{price}</strong>
            </p>
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.primary}
            >
              LIÊN HỆ ĐẶT TRƯỚC <Arrow />
            </a>
            <span>Chơi ngay khi game ra mắt.</span>
          </div>
        </div>
      </section>
      <footer className={s.footer}>
        <div className={s.container}>
          <div>
            <Link href="/" className={s.footerBrand}>
              DUNGDIBINHLUAN
            </Link>
            <p>FC MODDING & CAREER MODE</p>
          </div>
          <div className={s.footerLinks}>
            <Link href="/mods">Mods</Link>
            <Link href="/huong-dan">Hướng dẫn</Link>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              Liên hệ
            </a>
            <Link href="/dmca">DMCA & Abuse</Link>
          </div>
          <span>© 2026 DungDiBinhLuan</span>
        </div>
      </footer>
    </main>
  );
}
