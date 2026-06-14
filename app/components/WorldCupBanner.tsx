"use client";

import Link from "next/link";

export default function WorldCupBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0a0608] via-[#100a0c] to-[#080810] border-b border-[#c9a84c]/15">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c]/5 via-transparent to-[#c9a84c]/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,168,76,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.04)_0%,transparent_70%)]" />
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-10"
        style={{ background: "#c9a84c" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-8"
        style={{ background: "#f0c75e" }}
      />

      {/* Stars */}
      <div className="absolute inset-0 opacity-[0.12]" aria-hidden="true">
        {STAR_DATA.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${s.w}px`,
              height: `${s.h}px`,
              background: "#c9a84c",
              top: `${s.t}%`,
              left: `${s.l}%`,
              animation: `twinkle ${s.dur}s ease-in-out infinite`,
              animationDelay: `${s.del}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-7 md:py-10">
        <div className="text-center space-y-5 md:space-y-6">
          {/* Label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase text-[#c9a84c]">
              FIFA World Cup 26™
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter leading-[1.15] overflow-visible">
            <span className="text-white inline-block pb-1">WORLD CUP ĐÃ KHỞI TRANH</span>
          </h2>

          {/* Subheadline */}
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Hòa cùng không khí bóng đá đỉnh cao toàn cầu. Săn ngay{" "}
            <strong className="text-white">EA FC 26</strong> với giá{" "}
            <strong className="text-[#f0c75e]">SALE SẬP SÀN</strong> mùa World Cup!
          </p>

          {/* Price Cards */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <Link
              href="/games/fc26/payment?edition=normal"
              className="group w-full sm:w-auto flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#ce5a67]/40 hover:bg-[#ce5a67]/5 transition-all duration-300"
            >
              <div className="text-left">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Standard Edition</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-slate-600 line-through">149k</span>
                  <span className="text-lg font-black text-[#ce5a67]">69.000₫</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#ce5a67] group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/games/fc26/payment?edition=mods"
              className="group w-full sm:w-auto flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#c9a84c]/30 bg-[#c9a84c]/5 hover:border-[#c9a84c]/50 hover:bg-[#c9a84c]/10 transition-all duration-300"
            >
              <div className="text-left">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Full Mods Edition</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-slate-600 line-through">269k</span>
                  <span className="text-lg font-black text-[#f0c75e]">199.000₫</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#c9a84c] group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* CTA Button */}
          <div className="pt-1">
            <Link
              href="/games/fc26/select"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase text-[#06040a] bg-gradient-to-r from-[#c9a84c] via-[#f0c75e] to-[#c9a84c] hover:from-[#f0c75e] hover:via-[#f7d47a] hover:to-[#f0c75e] transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#c9a84c]/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 12c0 1.1-.9 2-2 2v4c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h.17l1.23-1.23A.996.996 0 018.17 4h7.66c.46 0 .88.21 1.17.57L18.33 6H20c1.1 0 2 .9 2 2v4zm-8-6c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
              </svg>
              CHỌN PHIÊN BẢN NGAY
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Hashtag */}
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase">
            #FIFAWorldCup #WeAre26 #DungDiBinhLuan
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </section>
  );
}

// Deterministic stars
function hash(i: number, seed: number) {
  let h = i * 2654435761 + seed;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
function fract(n: number) {
  return n / 4294967296;
}

const STAR_DATA = Array.from({ length: 15 }, (_, i) => ({
  w: 1.5 + fract(hash(i, 1)) * 3,
  h: 1.5 + fract(hash(i, 2)) * 3,
  t: fract(hash(i, 3)) * 100,
  l: fract(hash(i, 4)) * 100,
  dur: 3 + fract(hash(i, 5)) * 4,
  del: fract(hash(i, 6)) * 2,
}));
