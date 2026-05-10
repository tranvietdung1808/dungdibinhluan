"use client";

import { useState } from "react";
import Image from "next/image";

export default function MessengerButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Function to open Facebook Messenger in a small popup window instead of a full new tab
  const handleOpenMessenger = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    
    // Open a popup window centered roughly
    const width = 450;
    const height = 600;
    const left = (typeof window !== 'undefined' ? window.screen.width / 2 : 0) - (width / 2);
    const top = (typeof window !== 'undefined' ? window.screen.height / 2 : 0) - (height / 2);
    
    window.open(
      "https://m.me/dungbinhluan",
      "messenger_chat",
      `width=${width},height=${height},top=${top},left=${left},location=no,status=no,toolbar=no,scrollbars=yes,menubar=no`
    );
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end">
      {/* The Chat Widget Popup */}
      <div 
        className={`mb-4 w-[300px] md:w-[340px] bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden transform transition-all duration-300 origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none absolute bottom-12 right-0"
        }`}
      >
        {/* Header */}
        <div className="bg-[#ce5a67] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center p-0.5 shadow-sm">
              <Image src="/logo.png" alt="DungDiBinhLuan" width={36} height={36} className="rounded-full object-cover" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm md:text-base leading-tight">DungDiBinhLuan</h3>
              <p className="text-white/80 text-[11px] md:text-xs">Thường trả lời trong vài phút</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 bg-gray-50 dark:bg-[#111116] min-h-[160px] flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-white dark:bg-[#222] flex-shrink-0 flex items-center justify-center border border-black/5 dark:border-white/5 overflow-hidden shadow-sm">
              <Image src="/logo.png" alt="" width={28} height={28} className="rounded-full object-cover" />
            </div>
            <div className="bg-white dark:bg-[#1f1f26] p-3 rounded-2xl rounded-tl-sm shadow-sm border border-black/5 dark:border-white/5 text-slate-700 dark:text-slate-300 text-[13px] md:text-sm leading-relaxed max-w-[85%]">
              Chào bạn! Bạn cần hỗ trợ bản Mod FC 26, tải game hay có thắc mắc gì không? Vui lòng chat với Admin qua Messenger nhé! 👇
            </div>
          </div>
        </div>
        
        {/* Footer with action button */}
        <div className="p-4 bg-white dark:bg-[#0a0a0a] border-t border-black/5 dark:border-white/5">
          <button 
            onClick={handleOpenMessenger}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#ce5a67] hover:bg-[#b44c5c] active:scale-[0.98] text-white font-semibold rounded-xl transition-all text-sm shadow-md"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2C6.477 2 2 6.145 2 11.26c0 2.91 1.488 5.503 3.82 7.243v3.497l3.488-1.928c.866.241 1.77.368 2.692.368 5.523 0 10-4.145 10-9.26S17.523 2 12 2zm1.157 12.394l-2.986-3.18-5.839 3.18 6.417-6.815 3.056 3.18 5.766-3.18-6.414 6.815z" />
            </svg>
            Bắt đầu chat trên Messenger
          </button>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-[#ce5a67] hover:bg-[#b44c5c] text-white rounded-full shadow-[0_4px_20px_rgba(206,90,103,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 z-10"
        aria-label="Mở cửa sổ Chat"
      >
        <div className={`transition-all duration-300 absolute ${isOpen ? "rotate-90 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100"}`}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-8 md:h-8">
            <path d="M12 2C6.477 2 2 6.145 2 11.26c0 2.91 1.488 5.503 3.82 7.243v3.497l3.488-1.928c.866.241 1.77.368 2.692.368 5.523 0 10-4.145 10-9.26S17.523 2 12 2zm1.157 12.394l-2.986-3.18-5.839 3.18 6.417-6.815 3.056 3.18 5.766-3.18-6.414 6.815z" />
          </svg>
        </div>
        <div className={`transition-all duration-300 absolute ${isOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-50"}`}>
          <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
    </div>
  );
}
