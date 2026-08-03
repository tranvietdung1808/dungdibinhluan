"use client";

import Link from "next/link";

export default function AutumnSaleBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#12050b] via-[#0c060a] to-[#080810] border-b border-white/5">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#ce5a67]/10 via-transparent to-[#f59e0b]/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(206,90,103,0.18)_0%,transparent_62%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_30%,rgba(245,158,11,0.10)_0%,transparent_65%)]" />
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-10"
        style={{ background: "#ce5a67" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-8"
        style={{ background: "#f59e0b" }}
      />

      {/* Particles */}
      <div className="absolute inset-x-0 top-0 h-[70%] opacity-[0.14]" aria-hidden="true">
        {STAR_DATA.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${s.w}px`,
              height: `${s.h}px`,
              background: "rgba(255,255,255,0.9)",
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ce5a67] animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase text-white/80">
              Autumn Sale
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter leading-[1.15] overflow-visible">
            <span className="inline-block pb-1 pr-2 bg-gradient-to-r from-[#ce5a67] via-[#f59e0b] to-[#ce5a67] bg-clip-text text-transparent">
              AUTUMN SALE
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Thu này săn ngay <strong className="text-white">EA FC 26</strong> với giá{" "}
            <strong className="text-white">sale sập sàn</strong> — số lượng ưu đãi có hạn, chốt nhanh để
            giữ giá tốt nhất.
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
              className="group w-full sm:w-auto flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#f59e0b]/40 hover:bg-[#f59e0b]/5 transition-all duration-300"
            >
              <div className="text-left">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Full Mods Edition</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-slate-600 line-through">269k</span>
                  <span className="text-lg font-black text-[#f59e0b]">199.000₫</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#f59e0b] group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* CTA Button */}
          <div className="pt-1">
            <Link
              href="/games/fc26/select"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase text-[#06040a] bg-gradient-to-r from-[#ce5a67] via-[#f59e0b] to-[#ce5a67] hover:from-[#fb7185] hover:via-[#fbbf24] hover:to-[#fb7185] transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#ce5a67]/20"
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
