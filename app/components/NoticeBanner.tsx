"use client";
import { useState, useEffect } from "react";

export default function NoticeBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("notice-dismissed");
    if (!stored) setDismissed(false);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notice-dismissed", "1");
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-[#111] border-t border-[#ce5a67]/40 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed">
          ⚠️ <span className="text-[#ce5a67] font-bold">Lưu ý:</span> Website chia sẻ <strong>key bản quyền offline</strong> và các bản <strong>mod bổ trợ</strong> — <em>KHÔNG</em> phải crack game.
        </p>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-[10px] font-bold text-[#ce5a67] hover:text-white tracking-widest uppercase transition-colors"
        >
          ĐÃ HIỂU ✕
        </button>
      </div>
    </div>
  );
}
