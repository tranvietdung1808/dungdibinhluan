"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import CheckUyTinButton from "./CheckUyTinButton";
import { checkIsAdminEmail, isStaticAdminEmail } from "@/lib/admin";

const navItems = [
  { label: "🔥 CHIA SẺ MODS", href: "/mods" },
  { label: "GAME KHÁC", href: "#games" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPending, setAuthPending] = useState(false);
  const router = useRouter();

  const syncAdminSessionCookie = useCallback(async (supabase = createClient()) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      await fetch("/api/auth/admin-session", { method: "DELETE" });
      return false;
    }
    const res = await fetch("/api/auth/admin-session", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const currentUser = data.user ?? null;
      setUser(currentUser);
      
      const adminStatus = await syncAdminSessionCookie(supabase);
      if (active) setIsAdmin(adminStatus);
      
      setAuthLoading(false);
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      const adminStatus = await syncAdminSessionCookie(supabase);
      if (active) setIsAdmin(adminStatus);
      
      setAuthLoading(false);
      setAuthPending(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [syncAdminSessionCookie]);

  const handleGoogleLogin = async () => {
    setAuthPending(true);
    const supabase = createClient();
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setAuthPending(false);
      alert("Đăng nhập Google thất bại. Vui lòng thử lại.");
    }
  };

  const handleLogout = async () => {
    try {
      setAuthPending(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch("/api/auth/admin-session", { method: "DELETE" });
      sessionStorage.removeItem("admin_authenticated");
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setAuthPending(false);
      router.refresh();
      // If we're in an admin route, reloading might be necessary to clear state
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/'; 
      }
    }
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Tài khoản";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/70 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden ring-1 ring-[#ce5a67]/40">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="font-black text-[11px] md:text-sm tracking-widest hidden sm:block">DUNGDIBINHLUAN</p>
            <p className="text-[8px] text-slate-500 tracking-[0.3em] hidden sm:block">FC MODDING AND CAREER MODE</p>
          </div>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/huong-dan"
            className="px-4 py-2 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 flex items-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            HƯỚNG DẪN/MẸO
          </Link>
          <a
            href="https://web.facebook.com/dungbinhluan/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            GROUP FACEBOOK
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <CheckUyTinButton />
          <Link
            href="/games/fc26/select"
            className="flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5 bg-[#ce5a67] rounded-xl text-[10px] md:text-[11px] font-black tracking-widest text-white hover:bg-[#b44c5c] transition-colors shadow-[0_4px_20px_rgba(206,90,103,0.3)]"
          >
            TẢI NGAY
          </Link>
          {authLoading ? (
            <div className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] text-slate-400 font-bold tracking-wide">
              ...
            </div>
          ) : user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-semibold tracking-wide text-slate-200 border border-[#ce5a67]/40 bg-[#ce5a67]/15 hover:bg-[#ce5a67]/25 transition-colors"
                >
                  Open Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                disabled={authPending}
                className="flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-black tracking-wide text-slate-200 border border-white/15 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-60"
              >
                <span className="hidden lg:inline mr-2">{displayName}</span>
                {authPending ? "..." : "ĐĂNG XUẤT"}
              </button>
            </>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={authPending}
              className="flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-semibold tracking-wide text-slate-200 border border-white/20 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-60"
            >
              {authPending ? "..." : "Login with Google"}
            </button>
          )}

          {/* Hamburger — chỉ hiện trên mobile */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 gap-1.5"
          >
            <span className={`block w-4 h-0.5 bg-white transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-4 h-0.5 bg-white transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`block w-4 h-0.5 bg-white transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/huong-dan"
            onClick={() => setOpen(false)}
            className="px-4 py-3 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            HƯỚNG DẪN/MẸO
          </Link>
          <a
            href="https://web.facebook.com/dungbinhluan/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="px-4 py-3 text-[11px] font-bold tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            GROUP FACEBOOK
          </a>
        </div>
      )}
    </nav>
  );
}
