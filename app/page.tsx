"use client";
import { useState } from 'react';
import Image from 'next/image';

// ========== SUB COMPONENTS ==========
const GlowBackground = () => (
  <>
    <div className="absolute inset-0 bg-[linear-gradient(rgba(206,90,103,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(206,90,103,0.04)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />
    <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#ce5a67]/10 blur-[140px] rounded-full pointer-events-none" />
    <div className="absolute bottom-[-150px] right-[-50px] w-[350px] h-[350px] bg-[#ce5a67]/6 blur-[100px] rounded-full pointer-events-none" />
  </>
);

const Logo = ({ size = 112 }: { size?: number }) => (
  <div
    style={{ width: size, height: size }}
    className="rounded-full overflow-hidden ring-2 ring-[#ce5a67]/40 shadow-[0_0_30px_rgba(206,90,103,0.25)] flex-shrink-0"
  >
    <Image src="/logo.png" alt="Dung Gaming" width={size} height={size} className="object-cover w-full h-full" />
  </div>
);

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 space-y-2">
    <p className="text-[9px] text-slate-500 uppercase tracking-widest">{label}</p>
    <p className="text-2xl font-black text-[#ce5a67]">{value}</p>
  </div>
);

// ========== MAIN ==========
export default function Home() {
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === (process.env.NEXT_PUBLIC_ACCESS_CODE ?? 'fc26vip')) {
      setIsAuthorized(true);
    } else {
      alert('Mã truy cập không chính xác!');
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { url } = await fetch('/api/download').then(r => r.json());
      if (url) window.location.href = url;
    } catch {
      alert('Lỗi kết nối máy chủ R2!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4 overflow-hidden font-sans">
      <GlowBackground />

      {!isAuthorized ? (
        // ---- LOGIN ----
        <form onSubmit={handleLogin} className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
          <Logo />
          <div className="text-center">
            <h1 className="text-xl font-black tracking-widest uppercase">DUNGDIBINHLUAN</h1>
            <p className="text-[10px] text-slate-500 tracking-[0.35em] uppercase mt-1">ALL IN ONE GAME SET UP</p>
          </div>
          <input
            type="password"
            placeholder="• • • • • • • •"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center tracking-[1em] text-lg focus:outline-none focus:border-[#ce5a67] transition-colors"
          />
          <button
            type="submit"
            className="w-full bg-[#ce5a67] text-white font-black py-4 rounded-2xl tracking-[0.3em] hover:bg-[#b44c5c] transition-colors shadow-[0_8px_30px_rgba(206,90,103,0.3)]"
          >
            XÁC THỰC
          </button>
        </form>

      ) : (
        // ---- DASHBOARD ----
        <div className="relative z-10 w-full max-w-xl">
          <div className="absolute -inset-[1px] bg-gradient-to-b from-[#ce5a67]/30 via-[#ce5a67]/8 to-transparent rounded-3xl pointer-events-none" />
          <div className="relative bg-[#111]/90 backdrop-blur-xl rounded-3xl overflow-hidden">

            {/* Header */}
            <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Logo size={40} />
                <div>
                  <p className="text-sm font-black tracking-wider">DUNGDIBINHLUAN</p>
                  <p className="text-[9px] text-[#ce5a67] tracking-[0.3em] uppercase">ALL IN ONE GAME SET UP</p>
                </div>
              </div>
              <div className="flex items-center gap-2 border border-[#ce5a67]/30 rounded-full px-3 py-1.5 bg-[#ce5a67]/5">
                <span className="w-1.5 h-1.5 bg-[#ce5a67] rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-[#ce5a67] tracking-widest">SYSTEM ONLINE</span>
              </div>
            </header>

            {/* Body */}
            <div className="px-8 py-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Dung lượng file" value="50 GB" />
                <InfoCard label="Định dạng" value="WINRAR" />
              </div>

              <button
                onClick={handleDownload}
                disabled={loading}
                className="group relative w-full py-5 bg-[#ce5a67] rounded-2xl font-black text-lg tracking-widest overflow-hidden hover:bg-[#b44c5c] transition-colors active:scale-[0.98] shadow-[0_10px_40px_rgba(206,90,103,0.25)] disabled:opacity-60"
              >
                <span className="relative z-10">
                  {loading ? 'ĐANG KHỞI TẠO...' : 'BẮT ĐẦU TẢI XUỐNG'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>

              <footer className="pt-4 border-t border-white/5 flex justify-between text-[9px] text-slate-600 uppercase tracking-widest">
                <span>Powered by Google Antivirus</span>
                <span>© 2026 DUNGDIBINHLUAN</span>
              </footer>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
