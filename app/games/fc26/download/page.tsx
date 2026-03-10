"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DownloadPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/download")
      .then(r => r.json())
      .then(data => { setUrl(data.url); setLoading(false); });
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ce5a67]/10 border border-[#ce5a67]/20 flex items-center justify-center text-3xl">
            ✅
          </div>
          <h1 className="text-2xl font-black">SẴN SÀNG TẢI!</h1>
          <p className="text-slate-500 text-sm tracking-widest uppercase">EA FC 26 — Bản Thường</p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">EA FC 26 Full Setup</span>
            <span className="text-xs text-slate-500">~57GB</span>
          </div>

          {loading ? (
            <div className="w-full py-4 bg-white/5 rounded-2xl text-slate-500 text-sm animate-pulse">
              Đang tạo link tải...
            </div>
          ) : (
            <a
              href={url!}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#ce5a67] rounded-2xl font-black tracking-widest text-white hover:bg-[#b44c5c] transition-all shadow-[0_8px_30px_rgba(206,90,103,0.3)]"
            >
              ⬇️ TẢI EA FC 26
            </a>
          )}

          <p className="text-[10px] text-slate-600">Link có hiệu lực trong 1 giờ</p>
        </div>

        <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
          ← Về trang chủ
        </Link>
      </div>
    </main>
  );
}
