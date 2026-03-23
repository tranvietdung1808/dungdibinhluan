"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function CheckUyTinButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Nút chính */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center gap-2 px-4 py-2 bg-[#0A1A14] border border-emerald-500/40 rounded-lg overflow-hidden transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
      >
        {/* Hiệu ứng gradient nền khi hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Nội dung nút */}
        <div className="relative flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">Uy Tín</span>
        </div>
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-200 origin-top ${
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        {/* Mũi tên chỉ lên */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#111111] border-t border-l border-white/10 rotate-45"></div>

        {/* Header */}
        <div className="relative bg-gradient-to-b from-emerald-900/20 to-transparent p-4 border-b border-white/5 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 mb-2">
            <span className="text-emerald-400 text-lg">🛡️</span>
          </div>
          <h3 className="text-sm font-semibold text-white">Xác Minh Uy Tín</h3>
          <p className="text-xs text-slate-400 mt-1">Hoạt động từ 2020 • Hỗ trợ 24/7</p>
        </div>

        {/* Nội dung chính */}
        <div className="p-2 space-y-1">
          {/* Card Highlight: Bài đánh giá (Đặt lên đầu cho dễ click) */}
          <Link
            href="https://web.facebook.com/dungbinhluan/posts/pfbid036HdhijihVSbeppjAq5RBhbPL5FZWQMVxpM3aCYmmbU9hvdJZwvosdBFMX8GypDfMl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors group mb-2"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
              <span className="text-emerald-400 text-sm">⭐</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-400 group-hover:text-emerald-300">Xem Đánh Giá Khách Hàng</p>
              <p className="text-xs text-emerald-500/70 mt-0.5">Hàng trăm feedback thực tế</p>
            </div>
          </Link>

          {/* Social Links */}
          <Link
            href="https://www.facebook.com/dungbinhluan"
            target="_blank"
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <span className="w-6 text-center text-blue-500">📘</span>
            <div className="flex-1">
              <p className="text-sm text-gray-200">Facebook Page</p>
            </div>
            <span className="text-gray-600 text-xs">↗</span>
          </Link>

          <Link
            href="https://zalo.me/0917742686"
            target="_blank"
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <span className="w-6 text-center text-blue-400">💬</span>
            <div className="flex-1">
              <p className="text-sm text-gray-200">Zalo: 0917 742 686</p>
            </div>
            <span className="text-gray-600 text-xs">↗</span>
          </Link>

          <Link
            href="https://www.tiktok.com/@dungdibinhluan"
            target="_blank"
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <span className="w-6 text-center text-gray-400">🎵</span>
            <div className="flex-1">
              <p className="text-sm text-gray-200">TikTok</p>
            </div>
            <span className="text-gray-600 text-xs">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}