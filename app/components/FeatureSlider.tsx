"use client";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import Image from "next/image";

const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduceMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCE_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getReduceMotion = () => window.matchMedia(REDUCE_MOTION_QUERY).matches;
const getReduceMotionServer = () => false;

// =====================================================
// FeatureSlider — slider tính năng nổi bật trên trang Mix Mods
// §10.4-ish / a11y:
// - Nút Tạm dừng/Phát tường minh + dừng khi hover hoặc focus
//   trong slider; tôn trọng prefers-reduced-motion (không autoplay).
// - Copy thống nhất số liệu với mô tả sản phẩm (≈2.000 faces —
//   không claim "5000+" không kiểm chứng).
// =====================================================

const slides = [
  {
    img: "/features/feat-1.jpg",
    title: "FACE MOD SIÊU CHI TIẾT — GƯƠNG MẶT CHÂN THỰC",
    desc: "Gần 2.000 gương mặt cầu thủ được làm lại chi tiết, chân thực như ngoài đời.",
    tag: "Face / Visual Upgrade",
    type: "portrait",
  },
  {
    img: "/features/feat-2.jpg",
    title: "KIT & JERSEY — BỘ SƯU TẬP ÁO ĐẤU ĐẦY ĐỦ NHẤT",
    desc: "Full bộ kit mùa giải 2025-26 của tất cả giải đấu lớn: Premier League, La Liga, Serie A, Bundesliga, Ligue 1.",
    tag: "Kit / Jersey Upgrade",
    type: "portrait",
  },
  {
    img: "/features/feat-3.jpg",
    title: "SÂN VẬN ĐỘNG ĐỈNH CAO — EMIRATES STADIUM",
    desc: "Sân Emirates được làm lại hoàn toàn với khán đài chi tiết đến từng góc, ánh sáng chân thực, không khí sống động.",
    tag: "Stadium Upgrade",
    type: "landscape",
  },
  {
    img: "/features/feat-4.jpg",
    title: "STADIUM MODS — SÂN VẬN ĐỘNG CHÂN THỰC",
    desc: "Hàng trăm sân vận động Premier League, Champions League được cập nhật với đồ họa siêu thực, khán đài 3D sống động.",
    tag: "Stadium Upgrade",
    type: "landscape",
  },
  {
    img: "/features/feat-5.jpg",
    title: "GAMEPLAY MƯỢT MÀ — AI THÔNG MINH",
    desc: "Gameplay được tối ưu với AI cầu thủ thông minh hơn, chuyển động tự nhiên, passing chính xác, tạo cảm giác chơi chân thực.",
    tag: "Gameplay Upgrade",
    type: "landscape",
  },
  {
    img: "/features/feat-6.jpg",
    title: "CAMERA BROADCAST — GÓC NHÌN THỂ THAO CHUYÊN NGHIỆP",
    desc: "Camera góc rộng như trực tiếp truyền hình, bao quát toàn bộ sân cỏ. Trải nghiệm như đang xem trận đấu trực tiếp.",
    tag: "Camera Mod",
    type: "landscape",
  },
  {
    img: "/features/feat-7.jpg",
    title: "CHIẾN THUẬT ĐA DẠNG — ULTIMATE TEAM MODE",
    desc: "Khả năng tùy chỉnh chiến thuật không giới hạn. Tạo lối chơi riêng với hàng ngàn sơ đồ và phong cách độc đáo.",
    tag: "Gameplay Upgrade",
    type: "landscape",
  },
] as const;

const AUTO_PLAY_INTERVAL = 5000;

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  ) : (
    <svg
      className="h-4 w-4 translate-x-px"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export default function FeatureSlider() {
  const [current, setCurrent] = useState(0);
  // pausedByUser: nút play/pause + hover/focus giữ riêng
  const [pausedByUser, setPausedByUser] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  // prefers-reduced-motion → không autoplay (vẫn điều khiển tay được).
  // useSyncExternalStore: đọc media query không cần setState trong effect.
  const reduceMotion = useSyncExternalStore(
    subscribeReduceMotion,
    getReduceMotion,
    getReduceMotionServer,
  );
  const regionRef = useRef<HTMLDivElement>(null);

  const next = useCallback(
    () => setCurrent((i) => (i + 1) % slides.length),
    [],
  );
  const prev = () => setCurrent((i) => (i - 1 + slides.length) % slides.length);

  const autoplayOn = !reduceMotion && !pausedByUser && !interactionPaused;

  useEffect(() => {
    if (!autoplayOn) return;
    const timer = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [autoplayOn, next]);

  // Dừng autoplay khi focus nằm trong slider (keyboard a11y)
  const onFocusCapture = () => setInteractionPaused(true);
  const onBlurCapture = (e: React.FocusEvent) => {
    if (!regionRef.current?.contains(e.relatedTarget as Node)) {
      setInteractionPaused(false);
    }
  };

  const slide = slides[current];
  const isPortrait = slide.type === "portrait";

  return (
    <section className="overflow-hidden bg-[var(--color-surface-0)] pb-10 pt-12 md:pb-14 md:pt-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-6 text-center md:mb-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--color-muted)] md:text-xs">
            FC26 MOD SHOWCASE
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--color-title)] md:text-4xl">
            TÍNH NĂNG{" "}
            <span className="text-[var(--color-accent)]">NỔI BẬT</span>
          </h2>
        </div>

        {/* Card — vùng carousel */}
        <div
          ref={regionRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Tính năng nổi bật của Mix Mods"
          className="relative overflow-hidden rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-0)] shadow-[var(--shadow-ambient)]"
          onMouseEnter={() => setInteractionPaused(true)}
          onMouseLeave={() => setInteractionPaused(false)}
          onFocusCapture={onFocusCapture}
          onBlurCapture={onBlurCapture}
        >
          {isPortrait ? (
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${current + 1} / ${slides.length}: ${slide.title}`}
              className="relative h-[460px] md:h-[580px]"
            >
              <Image
                src={slide.img}
                alt=""
                aria-hidden="true"
                fill
                className="scale-110 object-cover opacity-25 blur-3xl"
                sizes="100vw"
                priority={current === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/80" />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at center, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 50%)",
                }}
              />

              <div className="relative z-10 flex h-full flex-col items-center gap-6 px-6 py-8 md:flex-row md:gap-12 md:px-12 md:py-10">
                <div className="flex-shrink-0">
                  <div className="relative h-[268px] w-[200px] overflow-hidden rounded-2xl border border-[var(--color-line)] shadow-[var(--shadow-ambient)] sm:h-[320px] sm:w-[240px] md:h-[415px] md:w-[310px]">
                    <Image
                      src={slide.img}
                      alt={slide.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 240px, 310px"
                      priority={current === 0}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-center md:text-left">
                  <span className="inline-flex self-center rounded-full border border-[var(--color-violet)]/25 bg-[var(--color-violet-subtle)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-violet)] md:self-start">
                    {slide.tag}
                  </span>
                  <h3 className="text-2xl font-black leading-tight tracking-tight text-[var(--color-title)] md:text-4xl">
                    {slide.title}
                  </h3>
                  <p className="max-w-lg text-sm leading-relaxed text-[var(--color-body)] md:text-base">
                    {slide.desc}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${current + 1} / ${slides.length}: ${slide.title}`}
            >
              <div className="relative h-[260px] w-full sm:h-[360px] md:h-[480px]">
                <Image
                  src={slide.img}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={current === 0}
                />
              </div>
              <div className="flex flex-col gap-3 border-t border-[var(--color-line)] bg-[var(--color-surface-1)] px-6 py-5 sm:flex-row sm:items-center sm:gap-6 md:px-10 md:py-6">
                <span className="inline-flex flex-shrink-0 self-start rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] sm:self-auto">
                  {slide.tag}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black leading-tight tracking-tight text-[var(--color-title)] md:text-xl">
                    {slide.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-body)] md:text-sm">
                    {slide.desc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Arrows — hit target 44px */}
          <button
            onClick={prev}
            aria-label="Slide trước"
            className={`absolute left-3 z-20 md:left-5 ${
              isPortrait
                ? "top-1/2 -translate-y-1/2"
                : "top-[130px] sm:top-[180px] md:top-[240px]"
            } flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-line)] bg-black/55 text-white backdrop-blur-md transition-all hover:bg-[var(--color-surface-2)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]`}
          >
            <svg
              className="h-4 w-4 md:h-5 md:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={next}
            aria-label="Slide sau"
            className={`absolute right-3 z-20 md:right-5 ${
              isPortrait
                ? "top-1/2 -translate-y-1/2"
                : "top-[130px] sm:top-[180px] md:top-[240px]"
            } flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-line)] bg-black/55 text-white backdrop-blur-md transition-all hover:bg-[var(--color-surface-2)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]`}
          >
            <svg
              className="h-4 w-4 md:h-5 md:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots + nút play/pause tường minh */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPausedByUser((v) => !v)}
            aria-label={pausedByUser ? "Phát trình chiếu" : "Tạm dừng trình chiếu"}
            aria-pressed={pausedByUser}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-1)] text-[var(--color-body)] transition-colors hover:text-[var(--color-title)] focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]"
          >
            <PlayPauseIcon playing={!pausedByUser && !reduceMotion} />
          </button>
          <div className="flex items-center gap-2.5">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === current || undefined}
                onClick={() => {
                  setCurrent(i);
                  setPausedByUser(true);
                }}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "h-2 w-8 bg-[var(--color-accent)]"
                    : "h-2.5 w-2.5 bg-[var(--color-line-strong)] hover:bg-[var(--color-muted)]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
