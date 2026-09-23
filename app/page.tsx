import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GAMES } from "./data/games";
import { MODS, type Mod } from "./data/mods";
import { FACES } from "./data/faces";
import { createClient } from "@/utils/supabase/server";
import { listModsPublic } from "@/lib/server/mods";
import { getCreditPricesMap } from "@/lib/server/credit";
import { buildCatalog, type DbModRecord } from "@/lib/catalog";
import { resolveThumbnailSrc } from "@/utils/r2";
import ModCard from "./mods/components/ModCard";
import { InlineNotice } from "./components/ui";
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
  const [guidesRes, dbModsRes, prices] = await Promise.all([
    supabase
      .from("guides")
      .select("id,title,slug,created_at,thumbnail_url")
      .order("created_at", { ascending: false })
      .limit(6),
    listModsPublic(),
    getCreditPricesMap(),
  ]);

  const guidesFailed = Boolean(guidesRes.error);
  const latestGuides: HomeGuide[] = guidesRes.data || [];
  const guides = latestGuides.slice(0, 6).map((guide) => ({
    id: guide.id,
    slug: guide.slug,
    title: guide.title,
    createdAt: new Date(guide.created_at).toLocaleDateString("vi-VN"),
    thumbnail: resolveThumbnailSrc(guide.thumbnail_url) || "",
  }));

  // Cùng pipeline với /mods (lib/catalog): gắn credit_cost, che download_url
  // của mod khóa credit, merge static+DB, dedupe theo slug, resolve offer.
  const modsPartialError = Boolean(dbModsRes.error);
  const dbMods: DbModRecord[] = (dbModsRes.data ?? []).map((m) => {
    const cost = prices[m.id as string];
    const isLocked = cost != null;
    return {
      id: m.id as string,
      slug: m.slug as string,
      name: m.name as string,
      author: m.author as string,
      category: m.category as string,
      version: m.version as string,
      updated_at: m.updated_at as string,
      description: (m.description as string | null) ?? null,
      long_description: null,
      thumbnail: (m.thumbnail as string | null) ?? null,
      download_url: isLocked ? null : ((m.download_url as string | null) ?? null),
      tags: (m.tags as string[] | null) ?? [],
      thumbnail_orientation: (m.thumbnail_orientation as string) ?? "portrait",
      featured: Boolean(m.featured),
      video_id: (m.video_id as string | null) ?? null,
      created_at: m.created_at as string,
      credit_cost: cost ?? null,
    };
  });

  const catalog = buildCatalog([...MODS, ...(FACES as Mod[])], dbMods);
  const modCards = [...catalog]
    .sort((a, b) => b.updatedAtTs - a.updatedAtTs)
    .slice(0, 4);

  return (
    <main className={s.home} id="home">
      {/* 1. Announcement — chỉ hiển thị khi chiến dịch đang hoạt động */}
      <div className={s.announcement}>
        <span className={s.dot} aria-hidden="true" /> MÙA GIẢI MỚI ĐANG ĐẾN{" "}
        <span className={s.announcementDivider} aria-hidden="true">
          /
        </span>{" "}
        <a href="#dat-truoc">
          Đặt trước FC 27 · {price} <Arrow />
        </a>
      </div>

      {/* 2. Hero FC 27 */}
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={s.heroArt}>
          <Image
            src="/games/fc27/fc27-portrait.webp"
            alt="Ảnh minh họa EA FC 27 với cầu thủ trong trang phục Real Madrid"
            fill
            priority
            sizes="(max-width: 600px) 100vw, (max-width: 1000px) 65vw, 58vw"
            className={s.portrait}
          />
        </div>
        <div className={s.heroShade} aria-hidden="true" />
        <div className={s.container}>
          <div className={s.heroTop}>
            <span>DUNGDIBINHLUAN / NEXT SEASON</span>
            <span>FC 27 — ĐẶT TRƯỚC</span>
          </div>
          <div className={s.heroContent}>
            <p className={s.eyebrow}>
              <span className={s.dot} aria-hidden="true" /> SẴN SÀNG CHO NGÀY RA
              MẮT
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
            <span>HÌNH ẢNH MINH HỌA</span>
          </div>
        </div>
      </section>

      {/* 3. Lối tắt FC 26 / Kho mod / Hướng dẫn */}
      <div className={s.seasonRail}>
        <div className={s.container}>
          <Link href="/games/fc26/select">
            <b>FC 26</b>
            <span>Chọn phiên bản & chơi ngay</span>
            <Arrow />
          </Link>
          <Link href="/mods">
            <b>KHO MOD</b>
            <span>Faces, kits, gameplay</span>
            <Arrow />
          </Link>
          <Link href="/huong-dan">
            <b>HƯỚNG DẪN</b>
            <span>Cài đặt & mẹo Career Mode</span>
            <Arrow />
          </Link>
        </div>
      </div>

      {/* 4. Khối đặt trước */}
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
                sizes="(max-width: 800px) 100vw, (max-width: 1100px) 55vw, 720px"
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
              LIÊN HỆ ĐẶT TRƯỚC QUA FACEBOOK <Arrow />
            </a>
            <p className={s.fineprint}>
              Mở fanpage Facebook của DungDiBinhLuan để xác nhận gói và đặt
              trước.
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
            <h3>Kết nối với fanpage</h3>
            <p>Nhắn fanpage để xác nhận phiên bản và cách nhận game.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Sẵn sàng vào sân</h3>
            <p>Chơi ngay khi game ra mắt.</p>
          </div>
        </div>
      </section>

      {/* 5. FC 26 */}
      <section id="fc26" className={s.section} aria-labelledby="fc26-title">
        <div className={s.sectionHeader}>
          <div>
            <p className={s.eyebrow}>02 / TRONG LÚC CHỜ FC 27</p>
            <h2 id="fc26-title">Sân cỏ vẫn đang chờ bạn.</h2>
          </div>
          <Link href="/games/fc26/select" className={s.textLink}>
            Chi tiết FC 26 <Arrow />
          </Link>
        </div>
        <div className={s.fc26Card}>
          <Image
            src="/games/fc26-banner.jpg"
            alt="EA FC 26"
            fill
            sizes="(max-width: 1264px) calc(100vw - 64px), 1200px"
          />
          <div className={s.fc26Shade} aria-hidden="true" />
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
              <Link href="/games/fc26" className={s.textLink}>
                Đã có code? Nhập code →
              </Link>
              <Link href="/mods" className={s.textLink}>
                Khám phá mods →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Mods mới — cùng card family với catalog */}
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
        {modsPartialError && (
          <InlineNotice
            tone="warning"
            title="Một số mod mới chưa tải được"
            className={s.notice}
          >
            Danh sách bên dưới có thể chưa đầy đủ — kho mod đầy đủ luôn mở tại{" "}
            <Link href="/mods" className={s.noticeLink}>
              /mods
            </Link>
            .
          </InlineNotice>
        )}
        {modCards.length > 0 ? (
          <div className={s.modGrid}>
            {modCards.map((mod) => (
              <ModCard key={mod.slug} mod={mod} />
            ))}
          </div>
        ) : (
          !modsPartialError && (
            <p className={s.empty}>
              Các bản mod đang được cập nhật.{" "}
              <Link href="/mods">Mở thư viện mods →</Link>
            </p>
          )
        )}
      </section>

      {/* 7. Hướng dẫn nổi bật */}
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
                alt=""
                width={1600}
                height={900}
                sizes="320px"
              />
            </div>
          </div>
          <div className={s.guideList}>
            {guidesFailed ? (
              <InlineNotice
                tone="warning"
                title="Chưa tải được bài hướng dẫn"
              >
                Các khối khác trên trang vẫn hoạt động.{" "}
                <Link href="/huong-dan" className={s.noticeLink}>
                  Mở chuyên mục hướng dẫn →
                </Link>
              </InlineNotice>
            ) : (
              <>
                {guides.slice(0, 4).map((guide, index) => (
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
                    {guide.thumbnail ? (
                      <div className={s.guideImage}>
                        <Image
                          src={guide.thumbnail}
                          alt=""
                          fill
                          sizes="80px"
                          unoptimized={guide.thumbnail.startsWith("/api/media/")}
                        />
                      </div>
                    ) : (
                      <div className={s.guideThumbFallback} aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                    )}
                    <Arrow />
                  </Link>
                ))}
                {guides.length === 0 && (
                  <div className={s.empty}>
                    <h3>Bắt đầu từ một hướng dẫn hay.</h3>
                    <p>
                      Khám phá cách cài đặt và chơi game trong chuyên mục hướng
                      dẫn.
                    </p>
                    <Link href="/huong-dan" className={s.textLink}>
                      Mở chuyên mục →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* 8. Game khác */}
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
                  sizes="(max-width: 600px) 95px, (max-width: 800px) 180px, 160px"
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

      {/* 9. FAQ */}
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
    </main>
  );
}
