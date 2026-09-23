"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// =====================================================
// Footer public dùng chung (§7.2) — mount trong root layout.
// Ẩn trên /admin (AdminShell riêng). Không link tới route
// chưa tồn tại (/lien-he…) — chỉ kênh hỗ trợ thật.
// =====================================================

const FANPAGE_URL = "https://web.facebook.com/dungbinhluan/";
const MESSENGER_URL = "https://m.me/dungbinhluan";

const exploreLinks = [
  { label: "Đặt trước FC 27", href: "/#dat-truoc" },
  { label: "FC 26 — chọn phiên bản", href: "/games/fc26/select" },
  { label: "Kho mod", href: "/mods" },
  { label: "Hướng dẫn", href: "/huong-dan" },
];

const linkClass =
  "text-sm text-[var(--color-body)] transition-colors hover:text-[var(--color-title)]";
const headingClass =
  "text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]";

export default function Footer() {
  const pathname = usePathname() ?? "";

  // Admin dùng AdminShell riêng — không render footer marketing
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface-1)]/40">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-10 md:px-8 md:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* 1. Thương hiệu */}
          <div className="min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-lg"
            >
              <span className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-[var(--color-accent-border)]">
                <Image
                  src="/logo.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="text-sm font-black tracking-wider text-[var(--color-title)]">
                DUNGDIBINHLUAN
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-muted)]">
              Kho mod FC 26, hướng dẫn Career Mode và bộ cài đặt game cho cộng
              đồng game thủ Việt Nam.
            </p>
          </div>

          {/* 2. Khám phá */}
          <nav aria-label="Khám phá">
            <h2 className={headingClass}>Khám phá</h2>
            <ul className="mt-4 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3. Hỗ trợ */}
          <nav aria-label="Hỗ trợ">
            <h2 className={headingClass}>Hỗ trợ</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={FANPAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Fanpage Facebook{" "}
                  <span aria-hidden="true" className="text-[var(--color-muted)]">
                    ↗
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={MESSENGER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Chat qua Messenger{" "}
                  <span aria-hidden="true" className="text-[var(--color-muted)]">
                    ↗
                  </span>
                </a>
              </li>
              <li>
                <Link href="/huong-dan" className={linkClass}>
                  Hướng dẫn cài đặt & nhận nội dung
                </Link>
              </li>
            </ul>
          </nav>

          {/* 4. Báo cáo */}
          <nav aria-label="Báo cáo">
            <h2 className={headingClass}>Báo cáo</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/dmca" className={linkClass}>
                  DMCA & báo cáo vi phạm
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] pt-6">
          <p className="text-xs text-[var(--color-muted)]">
            © 2026 DungDiBinhLuan
          </p>
          <p className="text-xs text-[var(--color-muted)]">
            FC Modding & Career Mode
          </p>
        </div>
      </div>
    </footer>
  );
}
