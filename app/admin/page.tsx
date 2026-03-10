"use client";
import { useState } from "react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [codeType, setCodeType] = useState<"normal" | "mods">("normal");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.length > 0) setAuthed(true);
  };

  const genCode = async (count = 1) => {
    setLoading(true);
    const newCodes: string[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const res = await fetch("/api/gen-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminKey, type: codeType }), // ← thêm type
        });
        const data = await res.json();
        if (data.code) {
          newCodes.push(data.code);
        } else {
          alert("Sai admin key!");
          break;
        }
      } catch {
        alert("Lỗi kết nối server!");
        break;
      }
    }
    setCodes(prev => [...newCodes, ...prev]);
    setLoading(false);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    alert("Đã copy tất cả!");
  };

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-black tracking-widest text-center text-white">ADMIN PANEL</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase text-center">DUNGDIBINHLUAN</p>
          <input
            type="password"
            placeholder="Nhập admin key..."
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#ce5a67] transition-colors text-white"
          />
          <button type="submit" className="w-full py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest hover:bg-[#b44c5c] transition-colors">
            ĐĂNG NHẬP
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-black tracking-widest">ADMIN — GEN CODE</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">
            Code hiệu lực 30 ngày kể từ lúc tạo
          </p>
        </div>

        {/* Chọn loại code */}
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 tracking-widest uppercase text-center">Chọn loại code</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCodeType("normal")}
              className={`py-4 rounded-xl font-black text-xs tracking-widest border transition-all ${
                codeType === "normal"
                  ? "bg-[#ce5a67] border-[#ce5a67] text-white shadow-[0_4px_20px_rgba(206,90,103,0.3)]"
                  : "border-white/10 text-slate-400 hover:border-white/30 hover:text-white"
              }`}
            >
              DUNG-xxxx
              <br />
              <span className="text-[9px] opacity-70 font-normal">Bản thường</span>
            </button>
            <button
              onClick={() => setCodeType("mods")}
              className={`py-4 rounded-xl font-black text-xs tracking-widest border transition-all ${
                codeType === "mods"
                  ? "bg-[#ce5a67] border-[#ce5a67] text-white shadow-[0_4px_20px_rgba(206,90,103,0.3)]"
                  : "border-white/10 text-slate-400 hover:border-white/30 hover:text-white"
              }`}
            >
              MODS-xxxx
              <br />
              <span className="text-[9px] opacity-70 font-normal">Full Mods</span>
            </button>
          </div>
        </div>

        {/* Gen buttons */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 5, 10].map(n => (
            <button
              key={n}
              onClick={() => genCode(n)}
              disabled={loading}
              className="py-4 bg-[#ce5a67] rounded-xl font-black tracking-widest hover:bg-[#b44c5c] transition-colors disabled:opacity-50"
            >
              {loading ? "..." : `+${n} CODE`}
            </button>
          ))}
        </div>

        {/* Code list */}
        {codes.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500 tracking-widest uppercase">
                {codes.length} code đã tạo
              </p>
              <button onClick={copyAll} className="text-xs text-[#ce5a67] font-bold hover:underline tracking-widest uppercase">
                Copy tất cả
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {codes.map((code, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-5 py-3 border border-white/5">
                  <div className="flex items-center gap-3">
                    {/* Badge loại code */}
                    <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full border ${
                      code.startsWith("MODS")
                        ? "text-purple-400 border-purple-400/30 bg-purple-400/10"
                        : "text-[#ce5a67] border-[#ce5a67]/30 bg-[#ce5a67]/10"
                    }`}>
                      {code.startsWith("MODS") ? "MODS" : "THƯỜNG"}
                    </span>
                    <span className="font-mono font-bold tracking-widest text-white text-sm">
                      {code}
                    </span>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="text-[10px] text-slate-500 hover:text-white transition-colors tracking-widest uppercase ml-4 flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => { setAuthed(false); setAdminKey(""); setCodes([]); }}
          className="w-full py-3 rounded-xl border border-white/10 text-xs text-slate-500 hover:text-white hover:border-white/30 transition-colors tracking-widest uppercase"
        >
          Đăng xuất
        </button>

      </div>
    </main>
  );
}
