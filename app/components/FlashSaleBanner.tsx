"use client";

import { useEffect, useState } from "react";

// 7 ngay ke tu hom nay
const END_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

function getTimeLeft() {
  const diff = END_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function FlashSaleBanner() {
  const [time, setTime] = useState(getTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="text-center py-3 px-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-orange-950/40 to-red-950/60 border border-red-500/20 animate-pulse">
        <p className="text-[11px] font-black text-red-400 tracking-widest uppercase">⚡ FLASH SALE — GIÁ SỐC 7 NGÀY ⚡</p>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="text-center py-3 px-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-orange-950/40 to-red-950/60 border border-red-500/20">
      <p className="text-[11px] font-black text-red-400 tracking-widest uppercase mb-2">⚡ FLASH SALE — GIÁ SỐC 7 NGÀY ⚡</p>
      <div className="flex items-center justify-center gap-2">
        <TimeBlock value={pad(time.days)} label="NGÀY" />
        <span className="text-red-500 font-black">:</span>
        <TimeBlock value={pad(time.hours)} label="GIỜ" />
        <span className="text-red-500 font-black">:</span>
        <TimeBlock value={pad(time.minutes)} label="PHÚT" />
        <span className="text-red-500 font-black">:</span>
        <TimeBlock value={pad(time.seconds)} label="GIÂY" />
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl md:text-2xl font-black text-white bg-red-950/80 border border-red-500/30 rounded-lg px-2 py-0.5 min-w-[2.5rem] text-center tabular-nums">
        {value}
      </span>
      <span className="text-[8px] text-red-400/60 tracking-widest mt-0.5">{label}</span>
    </div>
  );
}
