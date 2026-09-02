"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CheckUyTinButton from "./CheckUyTinButton";
import CreditNavChip from "./CreditNavChip";
import { useAuth } from "./useAuth";

const navItems = [
  { label: "🔥 CHIA SẺ MODS", href: "/mods" },
  { label: "GAME KHÁC", href: "#games" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const { user, isAdmin, loading: authLoading, login } = useAuth();

  const handleGoogleLogin = async () => {
    setAuthPending(true);
    await login();
    // OAuth redirect happens — pending state resets on return
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Tài khoản";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface-0)]/70 backdrop-blur-xl border-b border-line">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 md:gap-3 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden ring-1 ring-coral/40">
            <Image
              src="/logo.png"
              alt="Logo"
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <p className="font-black text-[11px] md:text-sm tracking-widest hidden sm:block">
              DUNGDIBINHLUAN
            </p>
            <p className="text-[8px] text-muted tracking-[0.3em] hidden sm:block">
              FC MODDING AND CAREER MODE
            </p>
          </div>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-[11px] font-bold tracking-widest text-muted hover:text-white transition-colors rounded-lg hover:bg-surface-2"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/huong-dan"
            className="px-4 py-2 text-[11px] font-bold tracking-widest text-muted hover:text-white transition-colors rounded-lg hover:bg-surface-2 flex items-center gap-2"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            HƯỚNG DẪN/MẸO
          </Link>
          <a
            href="https://web.facebook.com/dungbinhluan/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-[11px] font-bold tracking-widest text-muted hover:text-white transition-colors rounded-lg hover:bg-surface-2"
          >
            GROUP FACEBOOK
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <CheckUyTinButton />
          {user && <CreditNavChip />}
          {authLoading ? (
            <div className="px-3 py-2 rounded-xl border border-line bg-surface-1 text-[10px] text-muted font-bold tracking-wide">
              ...
            </div>
          ) : user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-semibold tracking-wide text-body border border-coral/40 bg-coral/15 hover:bg-coral/25 transition-colors"
                >
                  Open Admin Panel
                </Link>
              )}
              <Link
                href="/account"
                title="Quản lý tài khoản"
                className="flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-black tracking-wide text-white border border-coral/40 bg-coral/15 hover:bg-coral/25 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-[10px] overflow-hidden">
                  {user?.user_metadata?.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.user_metadata.picture as string} alt="" className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="hidden sm:inline">TÀI KHOẢN</span>
              </Link>
            </>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={authPending}
              className="flex-shrink-0 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-semibold tracking-wide text-body border border-line bg-surface-1 hover:bg-surface-2 transition-colors disabled:opacity-60"
            >
              {authPending ? "..." : "Login with Google"}
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg bg-surface-1 border border-line gap-1.5"
          >
            <span
              className={`block w-4 h-0.5 bg-white transition-all duration-300 ${
                open ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-4 h-0.5 bg-white transition-all duration-300 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-4 h-0.5 bg-white transition-all duration-300 ${
                open ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {open && (
        <div className="md:hidden border-t border-line bg-[var(--color-surface-0)]/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1">
          {user && (
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-[11px] font-bold tracking-widest text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors"
            >
              👤 TÀI KHOẢN CỦA TÔI
            </Link>
          )}
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-[11px] font-bold tracking-widest text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/huong-dan"
            onClick={() => setOpen(false)}
            className="px-4 py-3 text-[11px] font-bold tracking-widest text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            HƯỚNG DẪN/MẸO
          </Link>
          <a
            href="https://web.facebook.com/dungbinhluan/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="px-4 py-3 text-[11px] font-bold tracking-widest text-muted hover:text-white hover:bg-surface-2 rounded-xl transition-colors"
          >
            GROUP FACEBOOK
          </a>
        </div>
      )}
    </nav>
  );
}
