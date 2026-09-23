"use client";

// =====================================================
// ModUnlockWall — khu vực truy cập cho mod yêu cầu credit
// (UI-UPGRADE-BLUEPRINT §10.2–10.3)
//
// - Paywall CÓ PREVIEW: tóm tắt public (tên/tác giả/version/ngày/tags/
//   mô tả ngắn) + ảnh showcase public hiển thị ngay; nội dung protected
//   (long_description, download_url) chỉ lấy qua /content sau khi có quyền.
// - Ma trận trạng thái suy ra bằng deriveAccessPhase (mod-access.ts):
//   checking · guest · session-expired · balance-loading/error ·
//   insufficient · ready · unlocking · unlocked · content-error ·
//   check-error.
// - Xác nhận mở khóa bằng Dialog: tên mod, số credit trừ, số dư dự kiến.
//   Response không rõ (mất mạng/lỗi 5xx) → kiểm tra lại quyền trước khi
//   cho retry — không trừ tiền mù (§10.3, §20.4).
// - Sau unlock: giữ cơ chế POST /api/account/unlocks ghi lịch sử.
// - Quyền mod_access là VĨNH VIỄN (A02) — copy khớp lời hứa đó.
// =====================================================

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useAuth } from "@/app/components/useAuth";
import { createClient } from "@/utils/supabase/client";
import {
  fetchCreditBalance,
  invalidateCreditBalance,
} from "@/utils/credit-balance";
import {
  Badge,
  Button,
  ButtonLink,
  Dialog,
  ErrorState,
  InlineNotice,
  Skeleton,
  SkeletonText,
} from "@/app/components/ui";
import ShowcaseGallery from "./ShowcaseGallery";
import { resolveMediaSrc } from "@/lib/catalog";
import {
  balanceAfterUnlock,
  creditShortfall,
  deriveAccessPhase,
  parseAccessResponse,
  parseSpendResult,
  parseUnlockedContent,
  topupHrefForMod,
  type UnlockedModContent,
} from "./mod-access";

// ĐỒNG BỘ với lib/payment/order-status.ts SUPPORT_URL —
// không import trực tiếp vì file đó kéo payment/config (chứa
// directDownloadUrl) vào client bundle (§20.4).
const SUPPORT_URL = "https://web.facebook.com/dungbinhluan/";

interface ModUnlockWallProps {
  slug: string;
  name: string;
  author: string;
  category: string;
  version: string;
  updatedAt: string;
  tags: string[];
  thumbnail: string | null;
  /** Mô tả ngắn public — preview trước khi mở (§10.3) */
  description: string;
  creditCost: number;
}

type AccessState = "checking" | "locked" | "unlocked" | "error";
type BalanceState = "idle" | "loading" | "ok" | "error";
type ContentState = "idle" | "loading" | "ready" | "error";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

function CoinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
      />
    </svg>
  );
}

/** Một hàng metadata: nhãn + giá trị (dùng dl/divider thay badge rời — §6.3) */
function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] py-2.5 last:border-0">
      <dt className="shrink-0 text-meta text-[var(--color-muted)]">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium text-[var(--color-title)]">
        {value}
      </dd>
    </div>
  );
}

export default function ModUnlockWall({
  slug,
  name,
  author,
  category,
  version,
  updatedAt,
  tags,
  thumbnail,
  description,
  creditCost,
}: ModUnlockWallProps) {
  const { user, loading: authLoading, login } = useAuth();

  const [access, setAccess] = useState<AccessState>("checking");
  const [modId, setModId] = useState<string | null>(null);
  const [balanceState, setBalanceState] = useState<BalanceState>("idle");
  const [balance, setBalance] = useState<number | null>(null);
  const [contentState, setContentState] = useState<ContentState>("idle");
  const [content, setContent] = useState<UnlockedModContent | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);

  // ---------- Data fetching ----------

  /** Tải nội dung protected sau khi có quyền (T07: lỗi → content-error, giữ quyền). */
  const loadContent = useCallback(async () => {
    setContentState("loading");
    try {
      const supabase = createClient();
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) {
        setSessionExpired(true);
        setAccess("locked");
        setContentState("idle");
        return;
      }
      const res = await fetch(`/api/mods/${encodeURIComponent(slug)}/content`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 401) {
        setSessionExpired(true);
        setAccess("locked");
        setContentState("idle");
        return;
      }
      if (res.status === 403) {
        // Quyền chưa ghi/không còn — quay về trạng thái khóa
        setAccess("locked");
        setContentState("idle");
        return;
      }
      if (!res.ok) {
        setContentState("error");
        return;
      }
      const parsed = parseUnlockedContent(await res.json());
      if (!parsed) {
        setContentState("error");
        return;
      }
      setContent(parsed);
      setContentState("ready");
    } catch {
      setContentState("error");
    }
  }, [slug]);

  /**
   * Kiểm tra quyền — set access = 'locked' | 'unlocked' | 'error'.
   * Dùng cả lúc mount lẫn khi response trừ credit không rõ (§10.3):
   * trả 'unlocked' thì caller chuyển thẳng sang tải nội dung.
   */
  const checkAccess = useCallback(async (): Promise<AccessState> => {
    try {
      const supabase = createClient();
      const { data: s } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (s.session?.access_token) {
        headers.Authorization = `Bearer ${s.session.access_token}`;
      } else if (user) {
        // Context nghĩ là đã login nhưng session thực tế không còn
        setSessionExpired(true);
      }
      const res = await fetch(`/api/mods/${encodeURIComponent(slug)}/access`, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) {
        setAccess("error");
        return "error";
      }
      const parsed = parseAccessResponse(await res.json());
      if (!parsed) {
        setAccess("error");
        return "error";
      }
      if (parsed.modId) setModId(parsed.modId);
      const next: AccessState = parsed.unlocked ? "unlocked" : "locked";
      setAccess(next);
      return next;
    } catch {
      setAccess("error");
      return "error";
    }
  }, [slug, user]);

  const refreshBalance = useCallback(async () => {
    setBalanceState("loading");
    const b = await fetchCreditBalance();
    if (b === null) {
      setBalanceState("error");
    } else {
      setBalance(b);
      setBalanceState("ok");
    }
  }, []);

  // Mount/auth-change: kiểm tra quyền + tải số dư (chỉ khi có user)
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    void (async () => {
      const result = await checkAccess();
      if (active && result === "unlocked") void loadContent();
    })();
    if (user) void refreshBalance();
    return () => {
      active = false;
    };
  }, [authLoading, user, checkAccess, loadContent, refreshBalance]);

  const handleLogin = async () => {
    setLoginPending(true);
    const ok = await login();
    if (!ok) {
      setLoginPending(false);
      setErrorMsg("Chưa mở được đăng nhập Google. Thử lại sau.");
    }
    // OAuth redirect — không cần reset pending
  };

  /** POST trừ credit — chỉ chạy sau khi user xác nhận trong Dialog. */
  const handleConfirmUnlock = async () => {
    if (!modId || unlocking) return;
    setUnlocking(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) {
        setSessionExpired(true);
        setConfirmOpen(false);
        return;
      }
      const res = await fetch("/api/credit/spend/mod-unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modId }),
      });
      const d = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          setSessionExpired(true);
          setConfirmOpen(false);
          return;
        }
        if (res.status === 402) {
          // Không đủ credit — cập nhật số dư thật rồi báo thiếu
          setConfirmOpen(false);
          setErrorMsg(
            (d as { error?: string } | null)?.error ?? "Không đủ credit",
          );
          void refreshBalance();
          return;
        }
        // 4xx/5xx khác: quyền có thể đã/không được ghi — kiểm tra trước
        // khi cho user trừ tiền lại (§10.3).
        if ((await checkAccess()) === "unlocked") {
          setConfirmOpen(false);
          void loadContent();
          return;
        }
        setConfirmOpen(false);
        setErrorMsg(
          (d as { error?: string } | null)?.error ??
            "Mở khóa chưa hoàn tất. Đã kiểm tra lại quyền — hãy thử lại.",
        );
        return;
      }

      // Thành công
      const result = parseSpendResult(d);
      if (result?.balanceRemaining != null) {
        setBalance(result.balanceRemaining);
        setBalanceState("ok");
      }
      invalidateCreditBalance(user?.id);
      setConfirmOpen(false);
      setAccess("unlocked");
      // Ghi lịch sử "Mod đã mở" — best-effort, không chặn nội dung
      void fetch("/api/account/unlocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modId }),
      }).catch(() => {});
      void loadContent();
    } catch {
      // Mất mạng — response không rõ: kiểm tra quyền trước khi báo lỗi
      if ((await checkAccess()) === "unlocked") {
        setConfirmOpen(false);
        void loadContent();
        return;
      }
      setConfirmOpen(false);
      setErrorMsg(
        "Chưa xác nhận được kết quả mở khóa. Nếu credit đã trừ, quyền vẫn được giữ — hãy thử lại.",
      );
    } finally {
      setUnlocking(false);
    }
  };

  const phase = deriveAccessPhase({
    authResolved: !authLoading,
    isAuthenticated: Boolean(user),
    sessionExpired,
    access,
    balance: balanceState,
    hasEnoughCredit: balance !== null ? balance >= creditCost : null,
    unlocking,
    content: contentState,
  });

  const shortfall = creditShortfall(creditCost, balance);
  const expectedAfter =
    balance !== null ? balanceAfterUnlock(balance, creditCost) : null;

  // ---------- Vùng hành động theo phase ----------

  const renderAction = () => {
    switch (phase) {
      case "checking":
      case "balance-loading":
        return (
          <div className="space-y-3" aria-label="Đang kiểm tra quyền mở khóa">
            <Skeleton className="h-16 w-full" rounded="rounded-xl" />
            <Skeleton className="h-11 w-full" rounded="rounded-[10px]" />
          </div>
        );

      case "check-error":
        return (
          <ErrorState
            title="Chưa kiểm tra được quyền truy cập"
            description="Kiểm tra kết nối rồi thử lại."
            retryLabel="Thử lại"
            onRetry={() => {
              setAccess("checking");
              void (async () => {
                if ((await checkAccess()) === "unlocked") void loadContent();
              })();
            }}
          />
        );

      case "guest":
        return (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[var(--color-body)]">
              Đăng nhập bằng Google để mở khóa bằng credit. Quyền mod được lưu
              vĩnh viễn vào tài khoản của bạn.
            </p>
            <Button
              size="lg"
              fullWidth
              onClick={handleLogin}
              loading={loginPending}
            >
              <GoogleIcon />
              Đăng nhập để mở khóa
            </Button>
          </div>
        );

      case "session-expired":
        return (
          <div className="space-y-3">
            <InlineNotice tone="warning" title="Phiên đăng nhập đã hết hạn">
              Đăng nhập lại để tiếp tục — bạn sẽ quay về đúng trang mod này.
            </InlineNotice>
            <Button
              size="lg"
              fullWidth
              onClick={handleLogin}
              loading={loginPending}
            >
              <GoogleIcon />
              Đăng nhập lại bằng Google
            </Button>
          </div>
        );

      case "balance-error":
        return (
          <div className="space-y-3">
            <InlineNotice tone="warning" title="Chưa tải được số dư credit">
              Chưa xác định được số dư — chưa thể mở khóa. Thử tải lại số dư.
            </InlineNotice>
            <Button variant="secondary" fullWidth onClick={refreshBalance}>
              Tải lại số dư
            </Button>
          </div>
        );

      case "insufficient":
        return (
          <div className="space-y-3">
            <InlineNotice tone="credit" title={`Mod cần ${fmt(creditCost)} credit`}>
              Bạn có <span className="tabular">{fmt(balance ?? 0)}</span> credit,
              còn thiếu{" "}
              <span className="font-semibold tabular">
                {fmt(shortfall ?? creditCost)}
              </span>{" "}
              credit.
            </InlineNotice>
            <ButtonLink href={topupHrefForMod(slug)} size="lg" fullWidth>
              <CoinIcon />
              Nạp credit
            </ButtonLink>
            <Button variant="ghost" fullWidth onClick={refreshBalance}>
              Tải lại số dư
            </Button>
          </div>
        );

      case "ready":
      case "unlocking":
        return (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--color-credit-border)] bg-[var(--color-credit-subtle)] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-credit)] text-[var(--color-on-accent)]">
                  <CoinIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-meta text-[var(--color-muted)]">
                    Mở khóa với
                  </p>
                  <p className="text-lg font-bold leading-tight text-[var(--color-credit-strong)] tabular">
                    {fmt(creditCost)} credit
                  </p>
                </div>
              </div>
              <dl className="mt-3 space-y-1 border-t border-[var(--color-credit-border)] pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-muted)]">Số dư hiện tại</dt>
                  <dd className="tabular font-medium text-[var(--color-title)]">
                    {fmt(balance ?? 0)} credit
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--color-muted)]">
                    Số dư sau khi mở
                  </dt>
                  <dd className="tabular font-medium text-[var(--color-ok)]">
                    {fmt(expectedAfter ?? 0)} credit
                  </dd>
                </div>
              </dl>
            </div>
            <Button
              size="lg"
              fullWidth
              onClick={() => setConfirmOpen(true)}
              loading={unlocking}
            >
              <LockIcon />
              Mở khóa với {fmt(creditCost)} credit
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // ---------- Layout: unlocked → nội dung đầy đủ ----------

  if (phase === "unlocked" || phase === "content-error") {
    return (
      <div className="space-y-8">
        <InlineNotice tone="success" title="Mod đã được mở khóa">
          Quyền mod lưu vĩnh viễn trong mục &quot;Mod đã mở&quot; của tài khoản.
        </InlineNotice>

        {/* Hero */}
        <div className="relative h-56 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] md:h-80">
          {(resolveMediaSrc(content?.thumbnail) ?? thumbnail) ? (
            <Image
              src={(resolveMediaSrc(content?.thumbnail) ?? thumbnail) as string}
              alt={name}
              fill
              className="object-cover object-center opacity-70"
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority
            />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface-0)] via-transparent to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="success">Đã mở</Badge>
              <Badge tone="neutral">{content?.category || category}</Badge>
            </div>
            <h1 className="text-h1 text-[var(--color-title)] drop-shadow">
              {content?.name || name}
            </h1>
          </div>
        </div>

        {/* Meta */}
        <dl className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] px-5">
          <MetaRow label="Tác giả" value={content?.author || author} />
          <MetaRow
            label="Phiên bản mod"
            value={content?.version || version || "—"}
          />
          <MetaRow label="Cập nhật" value={updatedAt || "—"} />
        </dl>

        {/* Nội dung protected */}
        {contentState === "loading" || contentState === "idle" ? (
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 md:p-6">
            <SkeletonText lines={4} />
          </div>
        ) : contentState === "error" ? (
          // T07: quyền giữ nguyên — chỉ retry nội dung, không trả tiền lại
          <ErrorState
            title="Mod đã được mở. Nội dung chưa tải được"
            description="Quyền của bạn vẫn còn — chỉ cần tải lại nội dung."
            retryLabel="Tải lại nội dung"
            onRetry={() => void loadContent()}
          />
        ) : (
          <>
            {content?.long_description || content?.description ? (
              <section
                aria-label="Mô tả chi tiết"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 md:p-6"
              >
                <h2 className="text-h3 mb-3 text-[var(--color-title)]">
                  Mô tả
                </h2>
                <div
                  className="whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-body)]"
                  dangerouslySetInnerHTML={{
                    __html:
                      content.long_description || content.description || "",
                  }}
                />
              </section>
            ) : null}

            {content?.download_url ? (
              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] p-5 sm:flex-row sm:items-center md:p-6">
                <div>
                  <p className="text-meta text-[var(--color-muted)]">
                    Sẵn sàng cài đặt
                  </p>
                  <p className="mt-0.5 text-h3 text-[var(--color-title)]">
                    Tải mod
                  </p>
                </div>
                <ButtonLink
                  href={content.download_url}
                  external
                  size="lg"
                  className="shrink-0"
                >
                  Tải xuống
                </ButtonLink>
              </div>
            ) : (
              // Chưa có link tải — hướng hỗ trợ, KHÔNG hứa hẹn
              <InlineNotice tone="warning" title="Chưa có link tải">
                Admin chưa cập nhật link tải cho mod này. Liên hệ hỗ trợ để
                được cấp link.
                <div className="mt-3">
                  <ButtonLink href={SUPPORT_URL} external variant="secondary" size="sm">
                    Liên hệ hỗ trợ
                  </ButtonLink>
                </div>
              </InlineNotice>
            )}
          </>
        )}

        <p className="text-meta text-center text-[var(--color-muted)]">
          Lưu ý: bản mod chỉ dành cho người đã có game.
        </p>
      </div>
    );
  }

  // ---------- Layout: locked → preview public + access panel ----------

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Gallery preview: cover + showcase public (§10.3) */}
      <div className="order-2 space-y-4 lg:order-none lg:col-span-3">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 720px"
              priority
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center text-[var(--color-muted)]"
            >
              <LockIcon className="h-10 w-10" />
            </div>
          )}
        </div>
        <ShowcaseGallery
          slug={slug}
          hideWhenEmpty
          heading="Ảnh preview trong game"
        />
      </div>

      {/* Summary + access panel */}
      <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-6">
        <div className="order-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{category}</Badge>
            <Badge tone="credit">
              <LockIcon className="h-3.5 w-3.5" />
              <span className="tabular">{fmt(creditCost)} credit</span>
            </Badge>
          </div>
          <h1 className="mt-3 text-h1 text-[var(--color-title)]">{name}</h1>
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <dl className="mt-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] px-5">
            <MetaRow label="Tác giả" value={author} />
            {/* version "TU x.y.z" = bản cập nhật GAME — ghi rõ để không
                nhầm với phiên bản mod (§10.1) */}
            <MetaRow
              label={/^TU[\s.]/i.test(version.trim()) ? "Tương thích" : "Phiên bản mod"}
              value={
                /^TU[\s.]/i.test(version.trim())
                  ? `FC 26 — ${version.trim()}`
                  : version || "—"
              }
            />
            <MetaRow label="Cập nhật" value={updatedAt || "—"} />
            <MetaRow label="Loại quyền" value={`${fmt(creditCost)} credit`} />
          </dl>
          {description ? (
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-body)]">
              {description}
            </p>
          ) : null}
          <p className="mt-3 text-meta text-[var(--color-muted)]">
            Mô tả chi tiết và link tải sẽ hiện sau khi mở khóa.
          </p>
        </div>

        <div className="order-3">
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-1)] p-5 md:p-6">
            {renderAction()}
            {errorMsg && (
              <InlineNotice tone="danger" className="mt-3">
                {errorMsg}
              </InlineNotice>
            )}
            <p className="mt-4 text-meta text-[var(--color-muted)]">
              Mở khóa 1 lần — mod nằm vĩnh viễn trong &quot;Mod đã mở&quot; của
              tài khoản.
            </p>
          </div>
        </div>
      </div>

      {/* Dialog xác nhận: tên mod + credit trừ + số dư dự kiến (§10.3) */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        label={`Xác nhận mở khóa ${name}`}
      >
        <h2 className="text-h3 text-[var(--color-title)]">
          Mở khóa &quot;{name}&quot;?
        </h2>
        <dl className="mt-4 space-y-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Sẽ trừ</dt>
            <dd className="tabular font-semibold text-[var(--color-credit-strong)]">
              {fmt(creditCost)} credit
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">Số dư hiện tại</dt>
            <dd className="tabular font-medium text-[var(--color-title)]">
              {balance !== null ? `${fmt(balance)} credit` : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[var(--color-line)] pt-2">
            <dt className="text-[var(--color-muted)]">
              Số dư dự kiến còn lại
            </dt>
            <dd className="tabular font-semibold text-[var(--color-ok)]">
              {expectedAfter !== null ? `${fmt(expectedAfter)} credit` : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-meta text-[var(--color-muted)]">
          Số dư thực tế và quyền mở khóa được xác nhận từ server. Mở 1 lần —
          quyền giữ vĩnh viễn.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => setConfirmOpen(false)}
            disabled={unlocking}
          >
            Hủy
          </Button>
          <Button onClick={handleConfirmUnlock} loading={unlocking}>
            <CoinIcon />
            Xác nhận — trừ {fmt(creditCost)} credit
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
