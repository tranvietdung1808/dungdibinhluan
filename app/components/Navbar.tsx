"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CheckUyTinButton from "./CheckUyTinButton";
import CreditNavChip from "./CreditNavChip";
import { useAuth } from "./useAuth";
import { Button } from "./ui/Button";

// =====================================================
// Navbar public (§7.1) + MainContent offset dưới navbar.
// - Ẩn toàn bộ trên /admin (AdminShell riêng quản lý shell admin).
// - Active theo route + aria-current="page".
// - Desktop ≥1280px: logo → nav chính → credit → account → hỗ trợ.
// - Mobile <1280px: logo → credit → account/login → menu disclosure.
// =====================================================

export const FANPAGE_URL = "https://web.facebook.com/dungbinhluan/";
export const REVIEWS_URL =
  "https://web.facebook.com/dungbinhluan/posts/pfbid036HdhijihVSbeppjAq5RBhbPL5FZWQMVxpM3aCYmmbU9hvdJZwvosdBFMX8GypDfMl";
export const ZALO_URL = "https://zalo.me/0917742686";
export const TIKTOK_URL = "https://www.tiktok.com/@dungdibinhluan";

const navItems = [
  { label: "FC 27 — Mới", href: "/games/fc27/select" },
  { label: "FC 26", href: "/games/fc26/select" },
  { label: "Kho mod", href: "/mods" },
  { label: "Hướng dẫn", href: "/huong-dan" },
];

function isActivePath(pathname: string, href: string): boolean {
  const path = href.split("#")[0];
  if (path === "/games/fc27/select") return pathname.startsWith("/games/fc27");
  if (path === "/games/fc26/select") return pathname.startsWith("/games/fc26");
  return pathname === path || pathname.startsWith(`${path}/`);
}

const desktopLinkBase =
  "px-3 py-2 rounded-lg text-sm font-semibold transition-colors";
const desktopLinkInactive =
  "text-[var(--color-muted)] hover:text-[var(--color-title)] hover:bg-[var(--color-surface-2)]";
const desktopLinkActive =
  "text-[var(--color-title)] bg-[var(--color-surface-2)]";

const mobileLinkBase =
  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors";
const mobileLinkInactive =
  "text-[var(--color-body)] hover:text-[var(--color-title)] hover:bg-[var(--color-surface-2)]";
const mobileLinkActive =
  "text-[var(--color-title)] bg-[var(--color-surface-2)]";

/**
 * Wrapper nội dung dưới navbar cố định + làm đích skip link (#main-content).
 * Không phải landmark <main> vì các trang con đã tự khai báo <main>.
 * Trên /admin bỏ padding vì navbar public không render ở đó.
 */
export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");
  return (
    <div
      id="main-content"
      tabIndex={-1}
      className={isAdmin ? undefined : "pt-14 md:pt-16"}
    >
      {children}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { user, isAdmin, loading: authLoading, login, logout } = useAuth();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);

  // Menu là disclosure: đóng khi chuyển route — reset derived-state
  // ngay trong render (không dùng effect để tránh cascading render).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
    setAccountOpen(false);
  }

  // Escape đóng mobile menu, trả focus về nút burger
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Account dropdown: click ngoài + Escape đóng, trả focus về nút
  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAccountOpen(false);
        accountBtnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  // Admin dùng AdminShell riêng — không render navbar public
  if (pathname.startsWith("/admin")) return null;

  const handleGoogleLogin = async () => {
    setAuthPending(true);
    setLoginError(null);
    const ok = await login();
    // Redirect OAuth thành công thì không quay lại; lỗi → mở lại nút + báo.
    setAuthPending(false);
    if (!ok) setLoginError("Chưa đăng nhập được. Vui lòng thử lại.");
  };

  const handleLogout = async () => {
    setAccountOpen(false);
    setOpen(false);
    await logout();
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Tài khoản";

  const avatar = (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-2)] text-xs font-bold text-[var(--color-title)]">
      {user?.user_metadata?.picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.user_metadata.picture as string}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        displayName.charAt(0).toUpperCase()
      )}
    </span>
  );

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 top-0 z-[var(--layer-navbar)] border-b border-[var(--color-line)] bg-[var(--color-surface-0)]/70 backdrop-blur-xl"
    >
      <div className="relative mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 md:h-16 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex flex-shrink-0 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80"
        >
          <span className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-[var(--color-accent-border)] md:h-9 md:w-9">
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </span>
          <span>
            <span className="block text-sm font-black tracking-wider text-[var(--color-title)]">
              DUNGDIBINHLUAN
            </span>
            <span className="hidden text-xs tracking-[0.18em] text-[var(--color-muted)] sm:block">
              FC MODDING & CAREER MODE
            </span>
          </span>
        </Link>

        {/* Desktop nav — thu gọn dưới 1280px */}
        <div className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${desktopLinkBase} ${
                  active ? desktopLinkActive : desktopLinkInactive
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && <CreditNavChip />}

          {authLoading ? (
            // Giữ kích thước cố định trong lúc kiểm tra phiên — không đẩy menu
            <div
              role="status"
              aria-label="Đang kiểm tra đăng nhập"
              className="h-11 w-[104px] animate-pulse rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-1)]"
            />
          ) : user ? (
            <>
              {/* Mobile: avatar link thẳng tới /account */}
              <Link
                href="/account"
                aria-label="Tài khoản của tôi"
                className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] xl:hidden"
              >
                {avatar}
              </Link>

              {/* Desktop: account menu dropdown */}
              <div className="relative hidden xl:block" ref={accountRef}>
                <button
                  ref={accountBtnRef}
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-expanded={accountOpen}
                  aria-haspopup="true"
                  aria-controls="account-menu"
                  className="flex h-11 items-center gap-2 rounded-[10px] border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] px-3.5 text-sm font-semibold text-[var(--color-title)] transition-colors hover:border-[var(--color-accent)]/60"
                >
                  {avatar}
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-3.5 w-3.5 transition-transform ${accountOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {accountOpen && (
                  <div
                    id="account-menu"
                    className="absolute right-0 top-full z-[var(--layer-popover)] mt-2 w-56 overflow-hidden rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] py-1.5 shadow-2xl"
                  >
                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2.5 text-sm text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-title)]"
                    >
                      Tài khoản của tôi
                    </Link>
                    <Link
                      href="/credit"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2.5 text-sm text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-title)]"
                    >
                      Ví credit — nạp thêm
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setAccountOpen(false)}
                        className="block px-4 py-2.5 text-sm text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-title)]"
                      >
                        Quản trị
                      </Link>
                    )}
                    <div className="my-1 border-t border-[var(--color-line)]" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 text-left text-sm text-[var(--color-body)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-title)]"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Button
              variant="secondary"
              size="md"
              loading={authPending}
              onClick={handleGoogleLogin}
              className="relative"
            >
              Đăng nhập
            </Button>
          )}

          {/* Hỗ trợ gọn — desktop; mobile nằm trong menu */}
          <div className="hidden xl:block">
            <CheckUyTinButton />
          </div>

          {/* Hamburger — mobile */}
          <button
            ref={burgerRef}
            type="button"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-1)] xl:hidden"
          >
            <span
              className={`block h-0.5 w-4 bg-[var(--color-title)] transition-all duration-300 ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-4 bg-[var(--color-title)] transition-all duration-300 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-4 bg-[var(--color-title)] transition-all duration-300 ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* Lỗi đăng nhập — nút đã mở lại, báo ngay dưới navbar */}
        {loginError && (
          <div
            role="alert"
            className="absolute right-4 top-full z-[var(--layer-popover)] mt-2 flex items-center gap-3 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-surface-1)] px-4 py-2.5 text-sm text-[var(--color-danger)] shadow-xl"
          >
            {loginError}
            <button
              type="button"
              onClick={() => setLoginError(null)}
              aria-label="Đóng thông báo"
              className="text-[var(--color-muted)] hover:text-[var(--color-title)]"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu — disclosure (Escape / chọn link / đổi route để đóng) */}
      {open && (
        <div
          id="mobile-navigation"
          className="border-t border-[var(--color-line)] bg-[var(--color-surface-0)]/95 px-4 py-3 backdrop-blur-xl xl:hidden"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`${mobileLinkBase} ${
                    active ? mobileLinkActive : mobileLinkInactive
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {user && (
              <>
                <div
                  className="mx-1 my-2 border-t border-[var(--color-line)]"
                  aria-hidden="true"
                />
                <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                  Tài khoản
                </p>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className={`${mobileLinkBase} ${mobileLinkInactive}`}
                >
                  Tài khoản của tôi
                </Link>
                <Link
                  href="/credit"
                  onClick={() => setOpen(false)}
                  className={`${mobileLinkBase} ${mobileLinkInactive}`}
                >
                  Ví credit — nạp thêm
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setOpen(false)}
                    className={`${mobileLinkBase} ${mobileLinkInactive}`}
                  >
                    Quản trị
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${mobileLinkBase} ${mobileLinkInactive} w-full text-left`}
                >
                  Đăng xuất
                </button>
              </>
            )}

            <div
              className="mx-1 my-2 border-t border-[var(--color-line)]"
              aria-hidden="true"
            />
            <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Hỗ trợ & cộng đồng
            </p>
            <a
              href={FANPAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={`${mobileLinkBase} ${mobileLinkInactive}`}
            >
              Fanpage Facebook <span aria-hidden="true">↗</span>
            </a>
            <a
              href={REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={`${mobileLinkBase} ${mobileLinkInactive}`}
            >
              Đánh giá khách hàng <span aria-hidden="true">↗</span>
            </a>
            <a
              href={ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={`${mobileLinkBase} ${mobileLinkInactive}`}
            >
              Zalo: 0917 742 686 <span aria-hidden="true">↗</span>
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={`${mobileLinkBase} ${mobileLinkInactive}`}
            >
              TikTok <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
