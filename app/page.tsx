"use client";
import { useState } from "react";
import Image from "next/image";

// ========== CONSTANTS ==========
const BRAND = {
  name: "DUNGDIBINHLUAN",
  tagline: "ALL IN ONE GAME SET UP",
  color: "#ce5a67",
  fileSize: "50 GB",
  fileFormat: "WINRAR",
} as const;

// ========== UTILS ==========
/**
 * Pass hợp lệ: bất kỳ chuỗi kết thúc bằng 3 chữ số có tổng = 15
 * Ví dụ: nguyenvana285, player960, dungvip555
 */
const isValidPass = (code: string): boolean => {
  const digits = code.slice(-3);
  if (!/^\d{3}$/.test(digits)) return false;
  return [...digits].reduce((sum, d) => sum + +d, 0) === 15;
};

// ========== UI COMPONENTS ==========
const GlowBg = () => (
  <div aria-hidden className="pointer-events-none">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(206,90,103,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(206,90,103,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#ce5a67]/10 blur-[140px] rounded-full" />
    <div className="absolute -bottom-40 -right-10 w-[350px] h-[350px] bg-[#ce5a67]/6 blur-[100px] rounded-full" />
  </div>
);

const Avatar = ({ size = 112 }: { size?: number }) => (
  <div
    style={{ width: size, height: size }}
    className="rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#ce5a67]/40 shadow-[0_0_30px_rgba(206,90,103,0.25)]"
  >
    <Image src="/logo.png" alt={BRAND.name} width={size} height={size} className="object-cover w-full h-full" />
  </div>
);

const StatusBadge = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ce5a67]/30 bg-[#ce5a67]/5">
    <span className="w-1.5 h-1.5 rounded-full bg-[#ce5a67] animate-pulse" />
    <span className="text-[9px] font-bold text-[#ce5a67] tracking-widest">SYSTEM ONLINE</span>
  </div>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
    <p className="text-[9px] text-slate-500 uppercase tracking-widest">{label}</p>
    <p className="text-2xl font-black text-[#ce5a67]">{value}</p>
  </div>
);

// ========== VIEWS ==========
function LoginView({ onSuccess }: { onSuccess: () => void }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidPass(pass)) {
      onSuccess();
    } else {
      setError("Mã truy cập không chính xác!");
      setPass("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
      <Avatar />

      <div className="text-center">
        <h1 className="text-xl font-black tracking-widest uppercase">{BRAND.name}</h1>
        <p className="text-[10px] text-slate-500 tracking-[0.35em] uppercase mt-1">{BRAND.tagline}</p>
      </div>

      <div className="w-full space-y-2">
        <input
          type="password"
          placeholder="• • • • • • • •"
          value={pass}
          autoComplete="off"
          onChange={e => { setPass(e.target.value); setError(""); }}
          className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-center tracking-[1em] text-lg focus:outline-none transition-colors ${
            error
              ? "border-red-500/60 focus:border-red-500"
              : "border-white/10 focus:border-[#ce5a67]"
          }`}
        />
        {error && <p className="text-center text-xs text-red-400 animate-pulse">{error}</p>}
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-[#ce5a67] rounded-2xl font-black tracking-[0.3em] hover:bg-[#b44c5c] transition-colors shadow-[0_8px_30px_rgba(206,90,103,0.3)]"
      >
        XÁC THỰC
      </button>
    </form>
  );
}

function DashboardView() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { url } = await fetch("/api/download").then(r => r.json());
      if (url) window.location.href = url;
    } catch {
      alert("Lỗi kết nối máy chủ R2!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-xl">
      {/* Glow border */}
      <div className="absolute -inset-px bg-gradient-to-b from-[#ce5a67]/30 via-[#ce5a67]/8 to-transparent rounded-3xl pointer-events-none" />

      <div className="relative bg-[#111]/90 backdrop-blur-xl rounded-3xl overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Avatar size={40} />
            <div>
              <p className="text-sm font-black tracking-wider">{BRAND.name}</p>
              <p className="text-[9px] text-[#ce5a67] tracking-[0.3em] uppercase">{BRAND.tagline}</p>
            </div>
          </div>
          <StatusBadge />
        </header>

        {/* Body */}
        <div className="px-8 py-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Dung lượng file" value={BRAND.fileSize} />
            <StatCard label="Định dạng" value={BRAND.fileFormat} />
          </div>

          <button
            onClick={handleDownload}
            disabled={loading}
            className="group relative w-full py-5 bg-[#ce5a67] rounded-2xl font-black text-lg tracking-widest overflow-hidden hover:bg-[#b44c5c] transition-colors active:scale-[0.98] shadow-[0_10px_40px_rgba(206,90,103,0.25)] disabled:opacity-60"
          >
            <span className="relative z-10">
              {loading ? "ĐANG KHỞI TẠO..." : "BẮT ĐẦU TẢI XUỐNG"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>

          <footer className="pt-4 border-t border-white/5 flex justify-between text-[9px] text-slate-600 uppercase tracking-widest">
            <span>Powered by Google Antivirus</span>
            <span>© 2026 {BRAND.name}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ========== PAGE ==========
export default function Home() {
  const [isAuthorized, setIsAuthorized] = useState(false);

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4 overflow-hidden font-sans">
      <GlowBg />
      {isAuthorized
        ? <DashboardView />
        : <LoginView onSuccess={() => setIsAuthorized(true)} />
      }
    </main>
  );
}
