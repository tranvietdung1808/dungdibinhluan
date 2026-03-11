"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const slides = [
  {
    img: "/features/feat-1.jpg",
    title: "FACE MOD SIÊU CHI TIẾT — GƯƠNG MẶT CHÂN THỰC",
    desc: "Cập nhật face mod mới nhất với hơn 5000+ gương mặt cầu thủ được làm lại chi tiết, chân thực như ngoài đời.",
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

export default function FeatureSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((i) => (i + 1) % slides.length), []);
  const prev = () => setCurrent((i) => (i - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, next]);

  const slide = slides[current];
  const isPortrait = slide.type === "portrait";

  return (
    <section className="bg-[#0a0a0a] pt-12 pb-10 md:pt-16 md:pb-14 overflow-hidden">

      {/* Preload toàn bộ ảnh ẩn — fix lag khi chuyển slide */}
      <div className="hidden">
        {slides.map((s) => (
          <Image key={s.img} src={s.img} alt="" fill priority sizes="1px" />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-slate-500">
            FC26 MOD SHOWCASE
          </p>
          <h2 className="mt-2 text-2xl md:text-4xl font-black tracking-tight text-white">
            TÍNH NĂNG <span className="text-[#ce5a67]">NỔI BẬT</span>
          </h2>
        </div>

        {/* Card */}
        <div
          className="relative rounded-[24px] border border-white/10 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] bg-[#0c0c0c]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Tất cả slides render sẵn, dùng opacity để switch — không bị giật */}
          {slides.map((s, i) => {
            const active = i === current;
            const portrait = s.type === "portrait";

            return (
              <div
                key={s.img}
                className={`transition-opacity duration-300 ${active ? "opacity-100 relative" : "opacity-0 absolute inset-0 pointer-events-none"}`}
              >
                {portrait ? (
                  /* ── PORTRAIT ── */
                  <div className="relative h-[460px] md:h-[580px]">
                    <Image src={s.img} alt="" fill className="object-cover scale-110 blur-3xl opacity-25" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/80" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(206,90,103,0.12),transparent_50%)]" />

                    <div className="relative z-10 h-full flex flex-col md:flex-row items-center gap-6 md:gap-12 px-6 md:px-12 py-8 md:py-10">
                      <div className="flex-shrink-0">
                        <div className="relative w-[200px] h-[268px] sm:w-[240px] sm:h-[320px] md:w-[310px] md:h-[415px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                          <Image src={s.img} alt={s.title} fill className="object-cover" priority />
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 text-center md:text-left">
                        <span className="inline-flex self-center md:self-start px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase bg-[#ce5a67]/15 text-[#f08a95] border border-[#ce5a67]/25">
                          {s.tag}
                        </span>
                        <h3 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight">
                          {s.title}
                        </h3>
                        <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-lg">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── LANDSCAPE ── */
                  <div>
                    <div className="relative w-full h-[260px] sm:h-[360px] md:h-[480px]">
                      <Image src={s.img} alt={s.title} fill className="object-cover" priority />
                    </div>
                    <div className="bg-[#0e0e0e] border-t border-white/5 px-6 md:px-10 py-5 md:py-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <span className="inline-flex self-start sm:self-auto flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase bg-white/5 text-slate-400 border border-white/10">
                        {s.tag}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-xl font-black text-white leading-tight tracking-tight">
                          {s.title}
                        </h3>
                        <p className="mt-1 text-xs md:text-sm text-slate-400 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Arrows */}
          <button
            onClick={prev}
            aria-label="Previous"
            className={`absolute z-20 left-3 md:left-5 ${
              isPortrait ? "top-1/2 -translate-y-1/2" : "top-[130px] sm:top-[180px] md:top-[240px]"
            } w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/55 border border-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 hover:border-white/25 transition-all`}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={next}
            aria-label="Next"
            className={`absolute z-20 right-3 md:right-5 ${
              isPortrait ? "top-1/2 -translate-y-1/2" : "top-[130px] sm:top-[180px] md:top-[240px]"
            } w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/55 border border-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 hover:border-white/25 transition-all`}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2.5 mt-5">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => { setCurrent(i); setPaused(true); }}
              className={`rounded-full transition-all duration-300 ${
                i === current ? "w-8 h-2 bg-[#ce5a67]" : "w-2.5 h-2.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
