"use client";
import { useState } from "react";
import Image from "next/image";

const slides = [
  {
    img: "/features/feat-1.jpg",
    title: "FACE MOD SIÊU CHI TIẾT — GƯƠNG MẶT CHÂN THỰC",
    desc: "Cập nhật face mod mới nhất với hơn 5000+ gương mặt cầu thủ được làm lại chi tiết, chân thực như ngoài đời.",
    type: "portrait", // ảnh dọc
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
    type: "landscape", // ảnh ngang
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
];

export default function FeatureSlider() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setCurrent((i) => (i + 1) % slides.length);

  const slide = slides[current];

  return (
    <section className="bg-[#0a0a0a] py-16 md:py-24 overflow-hidden border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-10">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-black text-center tracking-tight">
          TÍNH NĂNG <span className="text-[#ce5a67]">NỔI BẬT</span>
        </h2>

        {/* Slider */}
        <div className="relative">
          {/* Main slide */}
          <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-[#0d0d0d] border border-white/10">
            <Image
              src={slide.img}
              alt={slide.title}
              fill
              className={`transition-all duration-700 ${
                slide.type === "portrait" ? "object-contain" : "object-cover"
              }`}
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />

            {/* Text content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 space-y-3">
              <h3 className="text-lg md:text-2xl font-black text-white leading-tight">
                {slide.title}
              </h3>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl">
                {slide.desc}
              </p>
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all z-10"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all z-10"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-8 h-2 bg-[#ce5a67]"
                    : "w-2 h-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
