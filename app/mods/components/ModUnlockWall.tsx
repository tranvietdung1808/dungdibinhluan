"use client";

// =====================================================
// ModUnlockWall — Màn hình khóa mod yêu cầu credit
// - Mod chưa mở khóa: hiện ảnh bìa mờ + tên + giá + nút Mở khóa
// - Mở khóa thành công → tự render nội dung đầy đủ ngay trên trang
//   (mô tả chi tiết + nút tải) thông qua /api/mods/[slug]/content
// - Dữ liệu nhạy cảm (download_url, mô tả) chỉ lấy sau khi có quyền
// =====================================================

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/components/useAuth";
import { createClient } from "@/utils/supabase/client";

interface ModUnlockWallProps {
  slug: string;
  name: string;
  author: string;
  category: string;
  version: string;
  updatedAt: string;
  tags: string[];
  thumbnail: string | null;
  creditCost: number;
}

interface UnlockedModContent {
  slug: string;
  name: string;
  author: string;
  category: string;
  version: string;
  description: string | null;
  long_description: string | null;
  thumbnail: string | null;
  download_url: string | null;
  tags: string[];
}

type WallState = "checking" | "locked" | "unlocked" | "error";

function CoinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

export default function ModUnlockWall({
  slug,
  name,
  author,
  category,
  version,
  updatedAt,
  tags,
  thumbnail,
  creditCost,
}: ModUnlockWallProps) {
  const { user, login } = useAuth();
  const [state, setState] = useState<WallState>("checking");
  const [modId, setModId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [content, setContent] = useState<UnlockedModContent | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [needLogin, setNeedLogin] = useState(false);

  // Lấy số dư credit hiện tại (hiển thị cho user)
  const fetchBalance = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: s } = await supabase.auth.getSession();
      if (!s.session?.access_token) return;
      const res = await fetch("/api/credit/balance", {
        headers: { Authorization: `Bearer ${s.session.access_token}` },
      });
      if (!res.ok) return;
      const d = await res.json();
      if (typeof d.balance === "number") setBalance(d.balance);
    } catch {
      // bỏ qua
    }
  }, []);

  // Tải nội dung đầy đủ sau khi đã có quyền
  const loadContent = useCallback(async () => {
    const supabase = createClient();
    const { data: s } = await supabase.auth.getSession();
    if (!s.session?.access_token) return;
    const res = await fetch(`/api/mods/${slug}/content`, {
      headers: { Authorization: `Bearer ${s.session.access_token}` },
    });
    if (!res.ok) {
      setState("error");
      setErrorMsg("Không tải được nội dung mod");
      return;
    }
    const d = await res.json();
    setContent((d.data ?? d) as UnlockedModContent);
    setState("unlocked");
  }, [slug]);

  // Kiểm tra quyền truy cập khi mount
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const supabase = createClient();
        const { data: s } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (s.session?.access_token) headers.Authorization = `Bearer ${s.session.access_token}`;
        const res = await fetch(`/api/mods/${slug}/access`, { headers });
        if (!res.ok) {
          if (active) setState("error");
          return;
        }
        const d = await res.json();
        if (active) {
          if (d.modId) setModId(d.modId);
          if (d.unlocked) {
            void loadContent();
          } else {
            setState("locked");
          }
        }
      } catch {
        if (active) setState("error");
      }
    };
    void fetchBalance();
    void check();
    return () => {
      active = false;
    };
  }, [slug, loadContent, fetchBalance]);

  const handleUnlock = async () => {
    if (!user) {
      setNeedLogin(true);
      return;
    }
    if (!modId) return;
    setUnlocking(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { data: s } = await supabase.auth.getSession();
      if (!s.session?.access_token) {
        setNeedLogin(true);
        return;
      }
      const res = await fetch("/api/credit/spend/mod-unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${s.session.access_token}`,
        },
        body: JSON.stringify({ modId }),
      });
      const d = await res.json();
      if (!res.ok) {
        // 402: không đủ credit
        if (res.status === 402) {
          setErrorMsg(d.error ?? "Không đủ credit");
        } else {
          setErrorMsg(d.error ?? "Mở khóa thất bại, thử lại sau");
        }
        return;
      }
      // Cập nhật balance trên navbar
      window.dispatchEvent(new Event("credit-balance-changed"));
      await loadContent();
    } catch {
      setErrorMsg("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setUnlocking(false);
    }
  };

  const insufficient = balance !== null && balance < creditCost;

  // ─── Đang kiểm tra ───
  if (state === "checking") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" role="status" aria-label="Đang tải" />
      </div>
    );
  }

  // ─── Đã mở khóa → render nội dung đầy đủ ───
  if (state === "unlocked" && content) {
    const hero = content.thumbnail || thumbnail;
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
        {/* Banner đã mở khóa */}
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 flex items-center gap-3 text-emerald-300">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-bold">Mod đã được mở khóa — tải xuống ngay bên dưới!</p>
        </div>

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 h-56 md:h-96">
          {hero ? (
            <Image src={hero} alt={name} fill className="object-cover opacity-60" sizes="(max-width: 1024px) 100vw, 1024px" priority />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-amber-400/90 text-black">{category}</span>
              {tags.slice(0, 3).map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full text-[9px] font-black bg-white/10 text-white border border-white/15">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl md:text-4xl font-black leading-tight drop-shadow-lg">{name}</h1>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap text-xs border-b border-white/5 pb-5">
          <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">👤 {author}</span>
          <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">📦 {content.version || version}</span>
          <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">🔄 Cập nhật: {updatedAt}</span>
        </div>

        {/* Mô tả */}
        {content.long_description || content.description ? (
          <div className="bg-[#111] rounded-2xl border border-white/5 p-5 md:p-7">
            <h2 className="text-sm font-black tracking-widest uppercase text-slate-400 mb-3">Mô tả</h2>
            <div
              className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line overflow-hidden"
              dangerouslySetInnerHTML={{ __html: content.long_description || content.description || "" }}
            />
          </div>
        ) : null}

        {/* Download */}
        {content.download_url ? (
          <div className="bg-gradient-to-br from-amber-400/15 via-transparent to-transparent border border-amber-400/25 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest">Sẵn sàng tải</p>
              <p className="text-xl md:text-2xl font-black mt-1 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                Đã mở khóa thành công
              </p>
            </div>
            <a
              href={content.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl font-black tracking-widest text-sm text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-[0_12px_40px_rgba(245,158,11,0.35)] whitespace-nowrap"
            >
              ⬇️ TẢI XUỐNG
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center text-sm text-slate-400">
            Admin chưa cập nhật link tải cho mod này.
          </div>
        )}

        <p className="text-xs text-slate-600 italic text-center">
          Lưu ý: Bản mod chỉ dành cho anh em đã có game.
        </p>
      </div>
    );
  }

  // ─── Cần đăng nhập ───
  if (needLogin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400">
          <LockIcon className="w-7 h-7" />
        </div>
        <h1 className="mt-5 text-xl font-black">Cần đăng nhập để mở khóa</h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Đăng nhập bằng Google để mở khóa &quot;{name}&quot; và tải xuống.
        </p>
        <button
          onClick={() => login()}
          className="mt-6 w-full px-6 py-3.5 rounded-2xl bg-white text-black text-sm font-black tracking-widest hover:bg-slate-200 transition"
        >
          ĐĂNG NHẬP BẰNG GOOGLE
        </button>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">Có lỗi xảy ra khi tải trang. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  // ─── Màn hình khóa ───
  return (
    <div className="relative overflow-hidden">
      {/* Nền mờ từ ảnh bìa */}
      <div className="pointer-events-none absolute inset-0">
        {thumbnail ? (
          <img src={thumbnail} alt="" aria-hidden="true" className="w-full h-full object-cover blur-2xl scale-125 opacity-25" />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[#050507]/70" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="rounded-3xl border border-amber-400/20 bg-[#0c0c10]/90 backdrop-blur-xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
          {/* Ảnh bìa */}
          <div className="relative h-40 md:h-52">
            {thumbnail ? (
              <img src={thumbnail} alt={name} className="w-full h-full object-cover opacity-40" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0a]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c10] via-transparent to-transparent" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3.5 py-1.5 text-[10px] font-black tracking-widest text-amber-400 ring-1 ring-amber-400/30">
              <LockIcon className="w-3.5 h-3.5" />
              MOD VIP
            </div>
          </div>

          <div className="p-6 md:p-8 text-center">
            <h1 className="text-xl md:text-3xl font-black tracking-tight">{name}</h1>
            <p className="mt-2 text-xs text-slate-400">
              {category} · 👤 {author} · 🔄 {updatedAt}
            </p>

            {/* Giá */}
            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.08] px-6 py-4">
              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                <CoinIcon className="w-5 h-5" />
              </span>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mở khóa với</p>
                <p className="text-2xl font-black text-amber-400 tabular-nums leading-none mt-1">
                  {fmt(creditCost)} <span className="text-sm text-slate-300 font-bold">credit</span>
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Mở khóa để xem mô tả chi tiết và tải xuống mod này.
              {balance !== null && (
                <span className={insufficient ? "block mt-1 text-amber-300/90" : "block mt-1 text-slate-500"}>
                  Số dư hiện tại: ⭐ {fmt(balance)} credit
                  {insufficient ? " — không đủ, hãy nạp thêm" : ""}
                </span>
              )}
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400" role="alert">
                {errorMsg}
              </div>
            )}

            <div className="mt-7 flex flex-col sm:flex-row items-stretch justify-center gap-3">
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 font-black tracking-widest text-sm text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-[0_12px_40px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
              >
                {unlocking ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ĐANG MỞ KHÓA...
                  </>
                ) : (
                  <>
                    <LockIcon className="w-4 h-4" />
                    MỞ KHÓA {fmt(creditCost)} CREDIT
                  </>
                )}
              </button>
              <Link
                href="/credit"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black tracking-widest text-xs text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 transition-colors whitespace-nowrap"
              >
                <CoinIcon className="w-4 h-4" />
                NẠP THÊM CREDIT
              </Link>
            </div>

            <p className="mt-6 text-[11px] text-slate-500">
              Mở khóa 1 lần — mod nằm vĩnh viễn trong &quot;Mod đã mở&quot; của tài khoản.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
