"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const modalSections = [
  {
    title: "I. Số lượng faces mới khổng lồ",
    items: [
      "Facepack lớn nhất + hàng trăm faces lẻ từ facemakers tốt nhất trên thị trường.",
      "Wonderkids mới: Yamal (Barca), Ethan Mbappe (PSG), Garnacho (MU)...",
      "Faces đẹp của Garnacho, Martinez (MU) và nhiều cầu thủ nổi tiếng.",
      "Faces giải hạng 2, hạng 3 nước Anh, Bỉ, Mỹ...",
    ],
  },
  {
    title: "II. Cập nhật mùa giải 2025 - 2026",
    items: [
      "Áo đấu chi tiết mùa 2025-26: MU, Barca, Real và tất cả đội lớn.",
      "Thị trường chuyển nhượng cập nhật mới nhất.",
      "Chỉ số cầu thủ được tính toán lại bởi AI theo mùa giải mới.",
      "Bóng thi đấu của tất cả giải đấu được cập nhật.",
    ],
  },
  {
    title: "III. Hệ thống Database đồ sộ",
    items: [
      "Gần 4000 minifaces được cập nhật.",
      "Hàng trăm Wonderkids mới.",
      "Bản quyền các giải đấu PreSeason.",
    ],
  },
  {
    title: "IV. Gameplay & Thuật toán",
    items: [
      "AI phòng ngự thông minh hơn, CDM lấp khoảng hở zone 14.",
      "Power Shoot được cân bằng, tăng Awareness cầu thủ.",
      "Tấn công cánh khỏe, cầu thủ biên xâm nhập half space tích cực.",
      "Thủ môn cản phá 1:1 tốt hơn tùy theo chỉ số.",
      "Cầu thủ chạy mượt, bớt trượt tuyết. Vật lí bóng được cập nhật.",
      "Xóa bỏ một số Scriptings khó chịu.",
    ],
  },
  {
    title: "V. Đồ họa 4K UltraHD",
    items: [
      "Đồ họa 4K UltraHD siêu nét — hết cảnh mờ, vỡ hình.",
      "Camera broadcast chuẩn ngoài đời thật.",
      "Tùy chọn bật/tắt theo cấu hình máy.",
    ],
  },
  {
    title: "VI. Và nhiều thứ khác...",
    items: [
      "Themes mới cực đẹp, load game nhanh hơn.",
      "Hàng trăm đôi boots mới.",
      "Edit Player, Manager và nhiều cập nhật lặt vặt.",
    ],
  },
];

export default function HeroSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section
        id="home"
        className="relative h-[100vh] min-h-[640px] flex items-center overflow-hidden"
      >
        <div className="absolute inset-0">
          <Image
            src="/games/fc26-banner.jpg"
            alt="EA FC 26"
            fill
            className="object-cover object-top opacity-55"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(206,90,103,0.12),transparent_55%)]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-6 w-full">
          <div className="max-w-xs sm:max-w-sm md:max-w-xl space-y-4 md:space-y-6">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-black tracking-widest bg-[#ce5a67]/20 text-[#ce5a67] border border-[#ce5a67]/30">
                🔥 HOT
              </span>
              <span className="px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-black tracking-widest bg-white/5 text-slate-400 border border-white/10">
                SPOTLIGHT
              </span>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-white">
                EA FC <span className="text-[#ce5a67]">26</span>
              </h1>
              <p className="text-slate-400 text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase mt-2 md:mt-3">
                ALL IN ONE GAME SET UP
              </p>
            </div>

            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-[260px] md:max-w-sm">
              Bộ cài đặt đầy đủ, tối ưu hiệu năng. Chơi ngay không cần chờ đợi.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/games/fc26/select"
                className="group flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-sm md:text-base text-white hover:bg-[#b44c5c] transition-all shadow-[0_8px_30px_rgba(206,90,103,0.3)]"
              >
                TẢI FC 26 NGAY
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              <button
                onClick={() => setOpen(true)}
                className="flex items-center justify-center gap-2 px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-black tracking-widest text-sm md:text-base text-slate-300 border border-white/10 hover:border-white/30 hover:text-white transition-all"
              >
                XEM CHI TIẾT
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40">
          <p className="text-[9px] tracking-[0.3em] uppercase text-slate-400">SCROLL</p>
          <div className="w-[1px] h-8 bg-gradient-to-b from-slate-400 to-transparent" />
        </div>
      </section>

      {/* ── MODAL ── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 w-full md:max-w-2xl bg-[#111] md:rounded-3xl border border-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh] md:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 md:px-8 pt-6 md:pt-7 pb-4 border-b border-white/5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">FC26 MOD SHOWCASE</p>
                <h3 className="mt-1 text-xl md:text-2xl font-black text-white leading-tight">
                  MIX MODS FC 26 <span className="text-[#ce5a67]">2025–2026</span>
                </h3>
                <p className="mt-2 text-xs md:text-sm text-slate-400 leading-relaxed">
                  Siêu phẩm MIX MODS FC 26 đã chính thức ra mắt! Bản mod hoàn thiện nhất trên thị trường với hàng trăm mod mất phí được chọn lọc kĩ càng.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 md:px-8 py-5 space-y-5">
              {modalSections.map((section) => (
                <div key={section.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 rounded-full bg-[#ce5a67] flex-shrink-0" />
                    <h4 className="text-xs md:text-sm font-black text-white tracking-wide uppercase">
                      {section.title}
                    </h4>
                  </div>
                  <ul className="space-y-1.5 pl-3">
                    {section.items.map((item, i) => (
                      <li key={i}
