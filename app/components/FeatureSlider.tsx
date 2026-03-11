"use client";
import { useState } from "react";
import Image from "next/image";

const slides = [
  {
    img: "/features/feat-1.jpg",
    title: "FACE MOD SIÊU CHI TIẾT — GƯƠNG MẶT CHÂN THỰC",
    desc: "Cập nhật face mod mới nhất với hơn 5000+ gương mặt cầu thủ được làm lại chi tiết, chân thực như ngoài đời.",
    type: "portrait",
  },
  {
    img: "/features/feat-2.jpg",
    title: "KIT & JERSEY — BỘ SƯU TẬP ÁO ĐẤU ĐẦY ĐỦ NHẤT",
    desc: "Full bộ kit mùa giải 2025-26 của tất cả giải đấu lớn: Premier League, La Liga, Serie A, Bundesliga, Ligue 1.",
    type: "portrait",
  },
  {
    img: "/features/feat-3.jpg",
    title: "SÂN VẬN ĐỘNG ĐỈN CAO — EMIRATES STADIUM",
    desc: "Sân Emirates được làm lại hoàn toàn với khán đài chi tiết đến từng góc, ánh sáng chân thực, không khí sống động.",
    type: "landscape",
  },
  {
    img: "/features/feat-4.jpg",
    title: "STADIUM MODS — SÂN VẬN ĐỘNG CHÂN THỰC",
    desc: "Hàng trăm sân vận động Premier League, Champions League được cập nhật với đồ họa siêu thực, khán đài 3D sống động.",
    type: "landscape",
  },
  {
    img: "/features/feat-5.jpg",
    title: "GAMEPLAY MƯỢT MÀ — AI THÔNG MINH",
    desc: "Gameplay được tối ưu với AI cầu thủ thông minh hơn, chuyển động tự nhiên, passing chính xác, tạo cảm giác chơi chân thực.",
    type: "landscape",
  },
  {
    img: "/features/feat-6.jpg",
    title: "CAMERA BROADCAST — GÓC NHÌN THỂ THAO CHUYÊN NGHIỆP",
    desc: "Camera góc rộng như trực tiếp truyền hình, bao quát toàn bộ sân cỏ. Trải nghiệm như đang xem trận đấu trực tiếp.",
    type: "landscape",
  },
  {
    img: "/features/feat-7.jpg",
    title: "CHIẾN THUẬT ĐA DẠNG — ULTIMATE TEAM MODE",
    desc: "Khả năng tùy chỉnh chiến thuật không giới hạn. Tạo lối chơi riêng với hàng ngàn sơ đồ và phong cách độc đáo.",
    type: "landscape",
  },
] as const;

export default function FeatureSlider() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setCurrent((i) => (i + 1) % slides.length);

  const slide = slides[current];
  const isPortrait = slide.type === "portrait";

  return (
    <section className="bg-[#0a0a0a] py-10 md:py-14 overflow-hidden border-y border-white/5">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-6 md:mb-8 text-center">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-slate-500">
            FC26 MOD SHOWCASE
          </p>
          <h2 className="mt-2 text-2xl md:text-4xl font-black tracking-tight text-white">
            TÍNH NĂNG <span className="text-[#ce5a67]">NỔI BẬT</span>
          </h2>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0c0c0c] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="relative h-[430px] md:h-[560px]">
              {isPortrait ? (
                <>
                  <div className="absolute inset-0 scale-110">
                    <Image
                      src={slide.img}
                      alt={slide.title}
                      fill
                      priority
                      className="object-cover blur-3xl opacity-30 scale-110"
                    />
                  </div>

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(206,90,103,0.14),transparent_45%)]" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/80" />

                  <div className="relative z-10 h-full grid md:grid-cols-[420px_1fr] items-center gap-6 md:gap-10 px-5 md:px-10 py-6 md:py-10">
                    <div className="flex justify-center">
                      <div className="relative w-[240px] h-[320px] sm:w-[270px] sm:h-[360px] md:w-[320px] md:h-[430px] rounded-[28px] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-black/20">
                        <Image
                          src={slide.img}
                          alt={slide.title}
                          fill
                          priority
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div className="relative z-10 max-w-2xl text-center md:text-left">
                      <div className="inline-flex px-3 py-1 rounded-full text-[10px] md:text-xs font-black tracking-[0.25em] uppercase bg-[#ce5a67]/15 text-[#f08a95] border border-[#ce5a67]/25">
                        Face / Visual Upgrade
                      </div>
                      <h3 className="mt-4 text-2xl md:text-5xl font-black leading-[1.05] tracking-tight text-white">
                        {slide.title}
                      </h3>
                      <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-300 max-w-xl mx-auto md:mx-0">
                        {slide.desc}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Image
                    src={slide.img}
                    alt={slide.title}
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(206,90,103,0.18),transparent_28%)]" />

                  <div className="absolute left-0 right-0 bottom-0 z-10 p-5 md:p-10">
                    <div className="max-w-3xl">
                      <div className="inline-flex px-3 py-1 rounded-full text-[10px] md:text-xs font-black tracking-[0.25em] uppercase bg-white/10 text-white border border-white/10 backdrop-blur-sm">
                        Gameplay / Stadium Upgrade
                      </div>
                      <h3 className="mt-4 text-2xl md:text-5xl font-black leading-[1.05] tracking-tight text-white">
                        {slide.title}
                      </h3>
                      <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-300 max-w-2xl">
                        {slide.desc}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/10 bg-black/45 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/10 bg-black/45 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2.5 mt-5">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 h-2 bg-[#ce5a67]"
                    : "w-2.5 h-2.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
