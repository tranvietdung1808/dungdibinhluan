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
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timeout = setTimeout(() => setTime(getTimeLeft()), 0);
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="text-center py-3 px-4 rounded-2xl bg-gradient-to-r from-[#ce5a67]/15 via-[#080810]/40 to-[#f59e0b]/15 border border-white/10">
      <p className="text-[11px] font-black text-white tracking-widest uppercase mb-2">
        🍂 AUTUMN SALE — GIÁ SỐC 7 NGÀY 🍂
      </p>
      <div className="flex items-center justify-center gap-2">
        <TimeBlock value={pad(time.days)} label="NGÀY" />
        <span className="text-white/30 font-black">:</span>
        <TimeBlock value={pad(time.hours)} label="GIỜ" />
        <span className="text-white/30 font-black">:</span>
        <TimeBlock value={pad(time.minutes)} label="PHÚT" />
        <span className="text-white/30 font-black">:</span>
        <TimeBlock value={pad(time.seconds)} label="GIÂY" />
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl md:text-2xl font-black text-white bg-white/[0.04] border border-white/10 rounded-lg px-2 py-0.5 min-w-[2.5rem] text-center tabular-nums">
        {value}
      </span>
      <span className="text-[8px] text-white/60 tracking-widest mt-0.5">{label}</span>
    </div>
  );
}
