import Link from "next/link";
import { GAMES, type Game } from "./data/games";

const SpotlightCard = ({ game }: { game: Game }) => (
  <Link href={`/games/${game.slug}`} className="group col-span-full block">
    <div
      className="relative overflow-hidden rounded-3xl p-8 md:p-12 border transition-transform duration-300 group-hover:scale-[1.01]"
      style={{ borderColor: `${game.coverColor}30`, background: `radial-gradient(ellipse at top left, ${game.coverColor}15, transparent 60%), #111` }}
    >
      {/* Glow */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ background: `${game.coverColor}20` }} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest" style={{ background: `${game.coverColor}20`, color: game.coverColor }}>
              {game.tag}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest border" style={{ borderColor: `${game.coverColor}40`, color: game.coverColor }}>
              SPOTLIGHT
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tight text-white">{game.name}</h2>
          <p className="text-sm text-slate-400 tracking-widest uppercase">{game.subtitle}</p>
          <p className="text-slate-500 text-sm max-w-md">{game.description}</p>
        </div>

        <div
          className="flex-shrink-0 flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-black tracking-widest transition-all group-hover:shadow-2xl"
          style={{ background: game.coverColor }}
        >
          <span>TẢI NGAY</span>
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </div>
  </Link>
);

const GameCard = ({ game }: { game: Game }) => (
  <div
    className="group relative overflow-hidden rounded-2xl p-6 border flex flex-col justify-between gap-6 transition-transform duration-300 hover:scale-[1.02]"
    style={{ borderColor: `${game.coverColor}20`, background: `radial-gradient(ellipse at top right, ${game.coverColor}10, transparent 60%), #111` }}
  >
    <div className="space-y-2">
      <span className="px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest" style={{ background: `${game.coverColor}15`, color: game.coverColor }}>
        {game.tag}
      </span>
      <h3 className="text-xl font-black text-white mt-2">{game.name}</h3>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{game.subtitle}</p>
      <p className="text-slate-500 text-xs">{game.description}</p>
    </div>

    <a
      href={game.fbUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm tracking-widest border transition-all hover:opacity-80"
      style={{ borderColor: `${game.coverColor}40`, color: game.coverColor }}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
      LIÊN HỆ MUA
    </a>
  </div>
);

export default function HomePage() {
  const spotlight = GAMES.find(g => g.spotlight)!;
  const others = GAMES.filter(g => !g.spotlight);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-widest">DUNGDIBINHLUAN</h1>
            <p className="text-[9px] text-slate-500 tracking-[0.3em] uppercase">ALL IN ONE GAME SET UP</p>
          </div>
          <a
            href="https://web.facebook.com/dungbinhluan/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-xs text-slate-400 hover:border-white/30 hover:text-white transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Liên hệ
          </a>
        </div>
      </header>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SpotlightCard game={spotlight} />
          {others.map(game => <GameCard key={game.slug} game={game} />)}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-5 text-center text-[9px] text-slate-600 uppercase tracking-widest">
        © 2026 DUNGDIBINHLUAN — Powered by Google Antivirus
      </footer>
    </main>
  );
}
