"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GAMES } from "../../data/games";

const game = GAMES.find(g => g.slug === "fc26")!;

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
    <Image src="/logo.png" alt="Dung Gaming" width={size} height={size} className="object-cover w-full h-full" />
  </div>
);

const Spinner = () => (
  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
);

const LoadingDots = () => (
  <span className="inline-flex items-center gap-1">
    {[0, 1, 2].map(i => (
      <span key={i} style={{ animationDelay: `${i * 0.15}s` }} className="w-2 h-2 bg-white rounded-full animate-bounce" />
    ))}
  </span>
);

// ========== LOGIN VIEW ==========
function LoginView({ onSuccess }: { onSuccess: (type: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        onSuccess(data.type ?? "normal"); // ← truyền type lên
      } else {
        setError(data.message || "Mã không hợp lệ!");
        setCode("");
      }
    } catch {
      setError("Lỗi kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
      <Avatar />
      <div className="text-center">
        <h1 className="text-xl font-black tracking-widest uppercase">{game.name}</h1>
        <p className="text-[10px] text-slate-500 tracking-[0.35em] uppercase mt-1">{game.subtitle}</p>
      </div>
      <div className="w-full space-y-2">
        <input
          type="text"
          placeholder="DUNG-XXXX-XXXX hoặc MODS-XXXX-XXXX"
          value={code}
          autoComplete="off"
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
          className={`w-full bg-white/5 border rounded-2xl px-6 py-4 text-center tracking-widest text-base font-mono focus:outline-none transition-colors ${
            error ? "border-red-500/60 focus:border-red-500" : "border-white/10 focus:border-[#ce5a67]"
          }`}
        />
        {error && <p className="text-center text-xs text-red-400 animate-pulse">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#ce5a67] rounded-2xl font-black tracking-[0.3em] hover:bg-[#b44c5c] transition-colors shadow-[0_8px_30px_rgba(206,90,103,0.3)] disabled:opacity-60"
      >
        {loading ? "ĐANG KIỂM TRA..." : "XÁC THỰC"}
      </button>
      <Link href="/" className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors tracking-widest uppercase">
        ← Quay lại trang chủ
      </Link>
    </form>
  );
}

// ========== DASHBOARD VIEW ==========
function DashboardView({ type }: { type: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [toolStatus, setToolStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleDownload = async () => {
    setStatus("loading");
    try {
      const { url } = await fetch("/api/download").then(r => r.json());
      if (url) {
        setStatus("done");
        setTimeout(() => { window.location.href = url; }, 600);
      }
    } catch {
      alert("Lỗi kết nối máy chủ R2!");
      setStatus("idle");
    }
  };

  const handleDownloadMods = async () => {
    try {
      const { url } = await fetch("/api/download-mods").then(r => r.json());
      if (url) window.location.href = url;
    } catch {
      alert("Lỗi kết nối máy chủ R2!");
    }
  };

  const handleDownloadTool = async () => {
    setToolStatus("loading");
    try {
      const { url } = await fetch("/api/download-tool").then(r => r.json());
      if (url) {
        setToolStatus("done");
        setTimeout(() => { window.location.href = url; }, 600);
      }
    } catch {
      alert("Lỗi kết nối máy chủ R2!");
      setToolStatus("idle");
    }
  };

  const buttonContent = {
    idle: <span className="relative z-10 tracking-widest">BẮT ĐẦU TẢI XUỐNG</span>,
    loading: (
      <span className="relative z-10 flex items-center justify-center gap-3">
        <Spinner />
        <span className="tracking-widest">ĐANG KHỞI TẠO</span>
        <LoadingDots />
      </span>
    ),
    done: (
      <span className="relative z-10 flex items-center justify-center gap-2 tracking-widest">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        ĐANG MỞ LINK...
      </span>
    ),
  };

  return (
    <div className="relative z-10 w-full max-w-xl">
      <div className="absolute -inset-px bg-gradient-to-b from-[#ce5a67]/30 via-[#ce5a67]/8 to-transparent rounded-3xl pointer-events-none" />
      <div className="relative bg-[#111]/90 backdrop-blur-xl rounded-3xl overflow-hidden">

        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Avatar size={40} />
            <div>
              <p className="text-sm font-black tracking-wider">{game.name}</p>
              <p className="text-[9px] text-[#ce5a67] tracking-[0.3em] uppercase">
                {type === "mods" ? "FULL MODS EDITION" : game.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ce5a67]/30 bg-[#ce5a67]/5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ce5a67] animate-pulse" />
            <span className="text-[9px] font-bold text-[#ce5a67] tracking-widest">SYSTEM ONLINE</span>
          </div>
        </header>

        <div className="px-8 py-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Dung lượng file</p>
              <p className="text-2xl font-black text-[#ce5a67]">{game.fileSize}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Định dạng</p>
              <p className="text-2xl font-black text-[#ce5a67]">{game.fileFormat}</p>
            </div>
          </div>

          {/* Nút tải game — luôn hiện */}
          <button
            onClick={handleDownload}
            disabled={status !== "idle"}
            className={`group relative w-full py-5 rounded-2xl font-black text-lg overflow-hidden transition-all active:scale-[0.98] shadow-[0_10px_40px_rgba(206,90,103,0.25)] disabled:cursor-not-allowed ${
              status === "done" ? "bg-green-500/80" : "bg-[#ce5a67] hover:bg-[#b44c5c]"
            }`}
          >
            {buttonContent[status]}
            {status === "idle" && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}
          </button>

          {/* Nút tải mods — chỉ hiện nếu type === "mods" */}
          {type === "mods" && (
            <button
              onClick={handleDownloadMods}
              className="group relative w-full py-5 rounded-2xl font-black text-lg overflow-hidden transition-all active:scale-[0.98] border border-[#ce5a67]/40 text-[#ce5a67] hover:bg-[#ce5a67]/10"
            >
              <span className="relative z-10 tracking-widest">🎮 TẢI FULL MODS PACK</span>
            </button>
          )}

          {/* ========== TOOL CÀI ĐẶT ========== */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              <span className="text-[9px] text-cyan-400/70 tracking-[0.4em] uppercase font-bold flex-shrink-0">Công cụ cài đặt</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            </div>

            <div className="p-5 rounded-2xl bg-cyan-500/[0.04] border border-cyan-500/15 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 text-lg mt-0.5 flex-shrink-0">🛠️</span>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-cyan-300 tracking-wide">ClientTool DungDiBinhLuan</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Công cụ hỗ trợ cài đặt tự động, giải nén và setup game chỉ với vài cú click. Tải về và làm theo video hướng dẫn bên dưới.
                  </p>
                </div>
              </div>

              {/* Nút tải tool */}
              <button
                onClick={handleDownloadTool}
                disabled={toolStatus !== "idle"}
                className={`group relative w-full py-4 rounded-xl font-bold text-sm overflow-hidden transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
                  toolStatus === "done"
                    ? "bg-emerald-500/80 shadow-[0_8px_30px_rgba(16,185,129,0.2)]"
                    : "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.1)]"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {toolStatus === "loading" ? (
                    <>
                      <Spinner />
                      <span className="tracking-widest">ĐANG KHỞI TẠO</span>
                      <LoadingDots />
                    </>
                  ) : toolStatus === "done" ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="tracking-widest">ĐANG MỞ LINK...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="tracking-widest">TẢI TOOL CÀI ĐẶT</span>
                    </>
                  )}
                </span>
                {toolStatus === "idle" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}
              </button>

              {/* Nút xem video hướng dẫn */}
              <button
                onClick={() => window.open("https://www.youtube.com/watch?v=wOuYBJcY0k0", "_blank")}
                className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-bold tracking-widest hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                📺 XEM VIDEO HƯỚNG DẪN CÀI ĐẶT
              </button>

              <p className="text-[10px] text-slate-500 text-center leading-relaxed pt-1 border-t border-white/5">
                ⚡ Nếu gặp lỗi trong quá trình cài đặt, vui lòng nhắn tin qua{' '}
                <span className="text-cyan-400 font-semibold">Fanpage</span> hoặc{' '}
                <span className="text-cyan-400 font-semibold">Zalo</span> để được hỗ trợ ngay.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-base mt-0.5 flex-shrink-0">⚠️</span>
              <div className="space-y-2">
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  <span className="font-bold text-amber-400">LƯU Ý QUAN TRỌNG KHI TẢI GAME (FILE NẶNG {game.fileSize}):</span>
                  <br />
                  Do dung lượng file game rất lớn, nếu bạn tải trực tiếp bằng trình duyệt mặc định (Chrome, Edge, Cốc Cốc...) khi mạng yếu hoặc chập chờn sẽ rất dễ bị nghẽn, lỗi hoặc ngắt kết nối giữa chừng.
                </p>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  <span className="font-bold text-amber-400">Khuyến nghị:</span> Để quá trình tải không bị lỗi và đạt tốc độ tối đa, bạn nên sử dụng các phần mềm hỗ trợ download chuyên dụng như <span className="text-white font-semibold">IDM (Internet Download Manager)</span> hoặc <span className="text-white font-semibold">Neat Download Manager</span>.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.open("https://www.youtube.com/results?search_query=c%C3%A1ch+s%E1%BB%AD+d%E1%BB%A5ng+IDM", "_blank")}
              className="w-full py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-widest hover:bg-amber-500/25 transition-colors"
            >
              📺 XEM HƯỚNG DẪN SỬ DỤNG IDM
            </button>
          </div>

          <footer className="pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-600 uppercase tracking-widest">
            <span>Powered by Google Antivirus</span>
            <Link href="/" className="hover:text-slate-400 transition-colors">← Trang chủ</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ========== PAGE ==========
export default function FC26Page() {
  const [codeType, setCodeType] = useState<string | null>(null);

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4 overflow-hidden font-sans">
      <GlowBg />
      {codeType !== null
        ? <DashboardView type={codeType} />
        : <LoginView onSuccess={(type) => setCodeType(type)} />
      }
    </main>
  );
}
