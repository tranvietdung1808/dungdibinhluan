"use client";
import { useState } from "react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.length > 0) setAuthed(true);
  };

  const genCode = async (count = 1) => {
    setLoading(true);
    const newCodes: string[] = [];
    for (let i = 0; i < count; i++) {
      const res = await fetch("/api/gen-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey }),
      });
      const data = await res.json();
      if (data.code) newCodes.push(data.code);
      else { alert("Sai admin key!"); break; }
    }
    setCodes(prev => [...newCodes, ...prev]);
    setLoading(false);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    alert("Đã copy tất cả!");
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      {!authed ? (
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-black tracking-widest text-center">ADMIN PANEL</h1>
          <input
            type="password"
            placeholder="Admin key..."
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#ce5a67] transition-colors"
          />
          <button type="submit" className="w-full py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest hover:bg-[#b44c5c] transition-colors">
            VÀO
          </button>
        </form>
      ) : (
        <div className="w-full max-w-lg space-y-6">
          <h1 className="text-xl font-black tracking-widest text-center">ADMIN — GEN CODE</h1>
          <div className="grid grid-cols-3 gap-3">
            {[1, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => genCode(n)}
                disabled={loading}
                className="py-3 bg-[#ce5a67] rounded-xl font-black tracking-widest hover:bg-[#b44c5c] transition-colors disabled:opacity-50"
              >
                {loading ? "..." : `+${n} CODE`}
              </button>
            ))}
          </div>
          {codes.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 tracking-widest uppercase">{codes.length} code — hiệu lực 4 tiếng</p>
                <button onClick={copyAll} className="text-xs text-[#ce5a67] font-bold hover:underline">Copy tất cả</button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {codes.map((code, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-5 py-3 border border-white/5">
                    <span className="font-mono font-bold tracking-widest text-[#ce5a67]">{code}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="text-[10px] text-slate-500 hover:text-white transition-colors tracking-widest uppercase"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
