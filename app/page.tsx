import Image from "next/image";
import Link from "next/link";
import { GAMES } from "./data/games";

// ========== NAVBAR ==========
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-[#ce5a67]/40">
          <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-cover w-full h-full" />
        </div>
        <div>
          <p className="font-black text-sm tracking-widest hidden sm:block">DUNGDIBINHLUAN</p>
          <p className="text-[8px] text-slate-500 tracking-[0.3em] hidden sm:block">ALL IN ONE GAME SET UP</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1">
        {["TRANG CHỦ", "MIX MODS", "HƯỚNG DẪN"].map(item => (
          <button key={item} className="px-4 py-2 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            {item}
          </button>
        ))}
        <a
          href="https://web.facebook.com/dungbinhluan/"
          target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          GROUP FACEBOOK
        </a>
      </div>

      <Link
        href="/games/fc26"
        className="flex-shrink-0 px-5 py-2.5 bg-[#ce5a67] rounded-xl text-[11px] font-black tracking-widest text-white hover:bg-[#b44c5c] transition-colors shadow-[0_4px_20px_rgba(206,90,103,0.3)]"
      >
        TẢI NGAY
      </Link>
    </div>
  </nav>
);

// ========== HERO ==========
const Hero = () => (
  <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden">
    <div className="absolute inset-0">
      <Image
        src="/games/fc26-banner.jpg"
        alt="EA FC 26"
        fill
        className="object-cover object-top opacity-50"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
    </div>

    <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-[#ce5a67]/20 text-[#ce5a67] border border-[#ce5a67]/30">
            🔥 HOT
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-white/5 text-slate-400 border border-white/10">
            SPOTLIGHT
          </span>
        </div>

        <div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-white">
            EA FC <span className="text-[#ce5a67]">26</span>
          </h1>
          <p className="text-slate-400 text-sm tracking-[0.3em] uppercase mt-3">ALL IN ONE GAME SET UP</p>
        </div>

        <p className="text-slate-400 text-base leading-relaxed max-w-sm">
          Bộ cài đặt đầy đủ, tối ưu hiệu năng. Chơi ngay không cần chờ đợi.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/games/fc26"
            className="group flex items-center gap-2 px-8 py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-white hover:bg-[#b44c5c] transition-all shadow-[0_8px_30px_rgba(206,90,103,0.3)]"
          >
            TẢI FC 26 NGAY
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <a
            href="https://web.facebook.com/dungbinhluan/"
            target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 rounded-2xl font-black tracking-widest text-slate-300 border border-white/10 hover:border-white/30 hover:text-white transition-all"
          >
            XEM VIDEO
          </a>
        </div>
      </div>
    </div>
  </section>
);

// ========== FEATURES ==========
const features = [
  { icon: "🛒", title: "MUA HÀNG DỄ DÀNG", desc: "Nhanh chóng, thuận tiện. Với nhiều mẫu mã cho anh em lựa chọn." },
  { icon: "💬", title: "HỖ TRỢ NHANH CHÓNG", desc: "Đội ngũ admin luôn sẵn sàng xử lí những vấn đề anh em gặp phải." },
  { icon: "🛡️", title: "BẢO HÀNH TRỌN ĐỜI", desc: "Cam kết bảo hành trọn đời với những sản phẩm đã mua." },
  { icon: "⚙️", title: "DỄ DÀNG CÀI ĐẶT", desc: "Hỗ trợ cài đặt 1:1 qua Teamviewer bất cứ lúc nào." },
];

const Features = () => (
  <section className="bg-[#0d0d0d] border-t border-white/5 py-16">
    <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
      {features.map(f => (
        <div key={f.title} className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-2xl">
            {f.icon}
          </div>
          <p className="text-[10px] font-black tracking-widest text-white uppercase">{f.title}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

// ========== GAME GRID ==========
const GameGrid = () => {
  const others = GAMES.filter(g => !g.spotlight);

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">CÁC GAME KHÁC</h2>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Liên hệ để mua</p>
        </div>
        <a
          href="https://web.facebook.com/dungbinhluan/"
          target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-[#ce5a67] font-bold tracking-widest hover:underline uppercase"
        >
          Xem tất cả →
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {others.map(game => (
          <div
            key={game.slug}
            className="group relative overflow-hidden rounded-2xl border transition-all hover:scale-[1.01] duration-300"
            style={{ borderColor: `${game.coverColor}20`, background: `radial-gradient(ellipse at top right, ${game.coverColor}10, transparent 60%), #111` }}
          >
            {/* Thumbnail */}
            <div className="relative h-44 overflow-hidden">
              <Image
                src={`/games/${game.slug}-thumb.jpg`}
                alt={game.name}
                fill
                className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
              <span
                className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest"
                style={{ background: `${game.coverColor}20`, color: game.coverColor, border: `1px solid ${game.coverColor}30` }}
              >
                {game.tag}
              </span>
            </div>

            {/* Info */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-black">{game.name}</h3>
                <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: game.coverColor }}>{game.subtitle}</p>
                <p className="text-slate-500 text-xs mt-1">{game.description}</p>
              </div>
              <a
                href={game.fbUrl}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black tracking-widest border transition-all hover:opacity-80"
                style={{ borderColor: `${game.coverColor}40`, color: game.coverColor }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                LIÊN HỆ MUA
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ========== PAGE ==========
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <div className="pt-16">
        <Hero />
        <Features />
        <GameGrid />
      </div>
      <footer className="border-t border-white/5 px-6 py-6 text-center text-[9px] text-slate-600 uppercase tracking-widest">
        © 2026 DUNGDIBINHLUAN — Powered by Google Antivirus
      </footer>
    </main>
  );
}
