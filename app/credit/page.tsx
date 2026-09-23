"use client";

// =====================================================
// /credit — Trang nạp credit (UI-UPGRADE-BLUEPRINT §13)
// - §13.1: desktop 2/3 chọn gói + 1/3 tóm tắt; mobile 1 cột,
//   tóm tắt sát CTA. Thứ tự: header → số dư/đăng nhập →
//   radio gói → custom + validation → bảng tính → CTA PayOS.
// - §13.2: gói từ /api/credit/prices (không copy mảng giá);
//   1 nguồn amount duy nhất; ?amount= được validate (T08);
//   custom amount sync vào ?amount= trước OAuth redirect.
// - A09: validateTopupAmount chạy ngay trên client — lỗi
//   min/max/bội số hiện dưới field, KHÔNG tạo đơn.
// - A10: breakdown base + bonus = total; % lấy từ
//   BONUS_PERCENT/BONUS_THRESHOLD; nhãn "Gợi ý" thay "Phổ biến".
// - §17.1: balance / packages / submit là 3 resource riêng —
//   loading, error (có retry), empty không đánh đồng nhau.
// =====================================================

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/useAuth";
import { createClient } from "@/utils/supabase/client";
import {
  BASE_RATE,
  BONUS_PERCENT,
  BONUS_THRESHOLD,
  MAX_TOPUP,
  MIN_TOPUP,
  calculateCredit,
  validateTopupAmount,
  type TopupPackage,
} from "@/lib/credit-core";
import { fetchCreditBalance } from "@/utils/credit-balance";
import { sanitizeInternalPath } from "@/lib/payment/order-status";
import {
  Badge,
  Breadcrumb,
  Button,
  ButtonLink,
  Card,
  Container,
  EmptyState,
  ErrorState,
  Field,
  InlineNotice,
  Skeleton,
  inputClass,
} from "@/app/components/ui";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
const vnd = (n: number) => `${fmt(n)}đ`;
const BONUS_PERCENT_LABEL = Math.round(BONUS_PERCENT * 100);

type ResourceState = "loading" | "ready" | "error";
type BalanceState = "idle" | "loading" | "ok" | "error";

// ─── Icon coin (SVG, không emoji) ───
function CoinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

// ─── Radio card một gói nạp (A10: base + bonus = total) ───
function PackageRadioCard({
  pkg,
  selected,
  disabled,
  onSelect,
}: {
  pkg: TopupPackage;
  selected: boolean;
  disabled: boolean;
  onSelect: (amountVnd: number) => void;
}) {
  return (
    <label
      className={`relative block rounded-2xl border p-4 text-left transition-colors duration-150 cursor-pointer ${
        selected
          ? "border-[var(--color-credit-border)] bg-[var(--color-credit-subtle)]"
          : "border-[var(--color-line)] bg-[var(--color-surface-1)] hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-2)]"
      } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-focus-ring)] ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <input
        type="radio"
        name="topup-package"
        value={pkg.amountVnd}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(pkg.amountVnd)}
        className="sr-only"
      />
      {pkg.popular && (
        <span className="absolute -top-2.5 right-3">
          <Badge tone="credit">Gợi ý</Badge>
        </span>
      )}
      <p className="text-lg font-bold text-title tabular">{vnd(pkg.amountVnd)}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-base font-bold text-credit tabular">
        <CoinIcon />
        {fmt(pkg.creditTotal)} credit
      </p>
      <p className="mt-1 text-meta tabular">
        {pkg.hasBonus ? (
          <span className="text-ok">
            {fmt(pkg.creditBase)} + {fmt(pkg.creditBonus)} tặng (+
            {BONUS_PERCENT_LABEL}%)
          </span>
        ) : (
          <span className="text-muted">
            Từ {vnd(BONUS_THRESHOLD)} được tặng +{BONUS_PERCENT_LABEL}%
          </span>
        )}
      </p>
    </label>
  );
}

// ─── Một dòng trong bảng tính tóm tắt ───
function SummaryRow({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "credit" | "ok";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`tabular text-sm ${
          tone === "credit"
            ? "font-bold text-credit"
            : tone === "ok"
              ? "font-semibold text-ok"
              : strong
                ? "font-semibold text-title"
                : "text-body"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CreditPage() {
  return (
    <Suspense fallback={null}>
      <CreditPageContent />
    </Suspense>
  );
}

function CreditPageContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();

  // §5.3: đường dẫn quay lại sau khi nạp (vd trang mod đang mở) —
  // chỉ nhận path nội bộ hợp lệ, truyền xuống server để gắn vào returnUrl.
  const nextPath = sanitizeInternalPath(searchParams.get("next"));

  // ── Resource: packages (loading/error/empty riêng — §17.1) ──
  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [pkgState, setPkgState] = useState<ResourceState>("loading");
  const [pkgRunId, setPkgRunId] = useState(0);
  const presetApplied = useRef(false);

  // ── Resource: balance ──
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceState, setBalanceState] = useState<BalanceState>("idle");

  // ── Form: một nguồn amount duy nhất (gói XOR custom) ──
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customRaw, setCustomRaw] = useState("");

  // ── Mutation: tạo đơn ──
  const [creating, setCreating] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ── Packages từ API (§13.2 — không copy mảng giá) ──
  useEffect(() => {
    let cancelled = false;
    setPkgState("loading");
    (async () => {
      try {
        const res = await fetch("/api/credit/prices", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = (await res.json()) as {
          packages?: TopupPackage[];
          data?: { packages?: TopupPackage[] };
        };
        const list = d.packages ?? d.data?.packages ?? [];
        if (cancelled) return;
        setPackages(list);
        setPkgState("ready");

        // ?amount= phải validate — không tin mọi preset (§13.2, T08)
        if (!presetApplied.current) {
          presetApplied.current = true;
          const rawPreset = searchParams.get("amount");
          const preset = rawPreset ? Number(rawPreset) : NaN;
          if (Number.isFinite(preset) && preset > 0) {
            if (list.some((p) => p.amountVnd === preset)) {
              setSelectedAmount(preset);
            } else {
              // Không trùng gói → đổ vào ô custom; nếu sai rule
              // (vd 55.000) lỗi hiện ngay dưới field, không tạo đơn.
              setCustomRaw(fmt(preset));
              setSelectedAmount(null);
            }
          } else {
            const popular = list.find((p) => p.popular);
            setSelectedAmount(popular?.amountVnd ?? list[0]?.amountVnd ?? null);
          }
        }
      } catch {
        if (!cancelled) {
          setPackages([]);
          setPkgState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pkgRunId, searchParams]);

  // ── Balance: fetch khi đã đăng nhập; refresh khi có invalidate ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBalance(null);
      setBalanceState("idle");
      return;
    }
    let cancelled = false;
    const load = async () => {
      setBalanceState("loading");
      const b = await fetchCreditBalance();
      if (cancelled) return;
      if (b === null) {
        setBalanceState("error");
      } else {
        setBalance(b);
        setBalanceState("ok");
      }
    };
    void load();
    const onChanged = () => void load();
    window.addEventListener("credit-balance-changed", onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("credit-balance-changed", onChanged);
    };
  }, [user, authLoading]);

  const retryBalance = useCallback(() => {
    setBalanceState("loading");
    void fetchCreditBalance().then((b) => {
      if (b === null) setBalanceState("error");
      else {
        setBalance(b);
        setBalanceState("ok");
      }
    });
  }, []);

  // ── Số tiền hiệu lực + validation client (A09) ──
  const customDigits = customRaw.replace(/[^\d]/g, "");
  const customActive = customDigits.length > 0;
  const customAmount = customActive ? Number(customDigits) : null;
  const customError =
    customActive && customAmount !== null
      ? validateTopupAmount(customAmount)
      : null;
  const amountVnd = customActive
    ? (customAmount ?? 0)
    : (selectedAmount ?? 0);
  const amountValid = amountVnd > 0 && !customError;
  const credit = useMemo(
    () => (amountValid ? calculateCredit(amountVnd) : null),
    [amountValid, amountVnd]
  );

  // Sync amount hợp lệ vào ?amount= để OAuth giữ return context (§13.2)
  const syncAmountToUrl = useCallback(() => {
    if (!amountValid) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("amount") === String(amountVnd)) return;
      url.searchParams.set("amount", String(amountVnd));
      window.history.replaceState(null, "", url);
    } catch {
      // bỏ qua — không chặn luồng chính
    }
  }, [amountValid, amountVnd]);

  useEffect(() => {
    syncAmountToUrl();
  }, [syncAmountToUrl]);

  const handleLogin = useCallback(async () => {
    setLoginError("");
    syncAmountToUrl(); // đảm bảo ?amount= ghi xong trước redirect
    const ok = await login();
    if (!ok) setLoginError("Chưa mở được đăng nhập Google — thử lại.");
  }, [login, syncAmountToUrl]);

  const handleTopUp = useCallback(async () => {
    setSubmitError("");
    setSessionExpired(false);
    if (!user) {
      // Guest: CTA = đăng nhập; ?amount= đã được sync nếu hợp lệ
      void handleLogin();
      return;
    }
    if (!amountValid) return;
    setCreating(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSessionExpired(true);
        return;
      }
      const res = await fetch("/api/credit/topup/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amountVnd, next: nextPath ?? undefined }),
      });
      const d = (await res.json()) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (res.status === 401) {
        setSessionExpired(true);
        return;
      }
      if (!res.ok || !d.checkoutUrl) {
        throw new Error(d.error ?? "Chưa tạo được yêu cầu thanh toán");
      }
      window.location.href = d.checkoutUrl;
    } catch (e) {
      // Lỗi nằm cạnh tóm tắt, giữ nguyên lựa chọn (§13.2)
      setSubmitError(
        e instanceof Error ? e.message : "Đã có lỗi xảy ra, thử lại sau"
      );
    } finally {
      setCreating(false);
    }
  }, [amountValid, amountVnd, user, handleLogin, nextPath]);

  const ctaLabel = creating
    ? "Đang tạo đơn…"
    : !user
      ? "Đăng nhập để nạp credit"
      : credit
        ? `Nạp ${vnd(amountVnd)} qua PayOS`
        : "Chọn số tiền nạp";

  return (
    <main className="min-h-screen bg-surface-0 pb-16 pt-8 md:pt-10 text-body">
      <Container>
        <Breadcrumb
          items={[{ label: "Trang chủ", href: "/" }, { label: "Nạp credit" }]}
        />

        {/* 1. Header — giải thích credit dùng để mở mod */}
        <header className="mt-6 max-w-2xl">
          <Badge tone="credit">
            <CoinIcon className="h-3.5 w-3.5" />
            {vnd(BASE_RATE)} = 1 credit
          </Badge>
          <h1 className="mt-4 text-h1 text-title">Nạp credit</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Credit là đơn vị dùng để mở khóa mod trên DungDiBinhLuan. Nạp tối
            thiểu {vnd(MIN_TOPUP)} — từ {vnd(BONUS_THRESHOLD)} trở lên được tặng
            thêm +{BONUS_PERCENT_LABEL}% credit. Thanh toán qua PayOS.
          </p>
          {nextPath && (
            <InlineNotice tone="accent" className="mt-4">
              Sau khi nạp xong, bạn có thể quay lại trang mod để mở khóa — credit
              không tự trừ.
            </InlineNotice>
          )}
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:items-start">
          {/* ═══ Cột trái (2/3 desktop): số dư → gói → custom ═══ */}
          <div className="space-y-6 lg:col-span-2">
            {/* 2. Số dư hiện tại / trạng thái cần đăng nhập */}
            <Card>
              {authLoading || (user && balanceState === "loading") ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10" rounded="rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              ) : !user ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-title">
                      Đăng nhập để nạp credit
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Credit được lưu vào ví tài khoản của bạn — đăng nhập để
                      nạp và theo dõi số dư. Lựa chọn gói hiện tại được giữ lại.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => void handleLogin()}
                    className="shrink-0"
                  >
                    Đăng nhập bằng Google
                  </Button>
                </div>
              ) : balanceState === "error" ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-title">
                      Chưa tải được số dư
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Bạn vẫn có thể nạp credit — số dư sẽ hiển thị lại sau.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={retryBalance}
                    className="shrink-0"
                  >
                    Thử lại
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-credit-border)] bg-[var(--color-credit-subtle)] text-credit">
                      <CoinIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-meta text-muted">Số dư hiện tại</p>
                      <p className="text-2xl font-bold text-credit tabular">
                        {fmt(balance ?? 0)}{" "}
                        <span className="text-sm font-semibold text-muted">
                          credit
                        </span>
                      </p>
                    </div>
                  </div>
                  <ButtonLink
                    href="/account?section=credit"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 self-start sm:self-center"
                  >
                    Xem ví credit
                  </ButtonLink>
                </div>
              )}
            </Card>

            {/* 3. Gói nạp — radio cards */}
            <section aria-labelledby="pkg-heading">
              <h2 id="pkg-heading" className="text-h3 text-title">
                Chọn gói nạp
              </h2>
              <div className="mt-4">
                {pkgState === "loading" ? (
                  <div
                    className="grid grid-cols-2 gap-3 md:grid-cols-3"
                    aria-busy="true"
                    aria-label="Đang tải danh sách gói"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-[104px]"
                        rounded="rounded-2xl"
                      />
                    ))}
                  </div>
                ) : pkgState === "error" ? (
                  <ErrorState
                    title="Chưa tải được danh sách gói"
                    description="Bạn vẫn có thể nhập số tiền tùy chỉnh bên dưới, hoặc thử tải lại."
                    onRetry={() => setPkgRunId((i) => i + 1)}
                  />
                ) : packages.length === 0 ? (
                  <EmptyState
                    title="Chưa có gói nạp nào"
                    description="Bạn vẫn có thể nhập số tiền tùy chỉnh bên dưới."
                  />
                ) : (
                  <fieldset disabled={creating}>
                    <legend className="sr-only">Gói nạp credit</legend>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {packages.map((p) => (
                        <PackageRadioCard
                          key={p.amountVnd}
                          pkg={p}
                          disabled={creating}
                          selected={
                            !customActive && selectedAmount === p.amountVnd
                          }
                          onSelect={(v) => {
                            // Chọn gói xóa custom — một nguồn amount (§13.2)
                            setSelectedAmount(v);
                            setCustomRaw("");
                            setSubmitError("");
                          }}
                        />
                      ))}
                    </div>
                  </fieldset>
                )}
              </div>
            </section>

            {/* 4. Số tiền tùy chỉnh — validation ngay dưới field */}
            <Field
              label="Hoặc nhập số tiền tùy chỉnh"
              hint={`Tối thiểu ${vnd(MIN_TOPUP)} · tối đa ${vnd(MAX_TOPUP)} · bội số của ${vnd(10000)}`}
              error={customError}
            >
              {({ id, describedBy }) => (
                <div className="relative">
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={customError ? true : undefined}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Ví dụ: 150.000"
                    value={customRaw}
                    disabled={creating}
                    onChange={(e) => {
                      // Sửa custom bỏ selected gói (§13.2)
                      setCustomRaw(e.target.value.replace(/[^\d]/g, ""));
                      setSelectedAmount(null);
                      setSubmitError("");
                    }}
                    onBlur={() => {
                      // Format khi blur — không làm nhảy con trỏ lúc gõ
                      if (customDigits) setCustomRaw(fmt(Number(customDigits)));
                    }}
                    className={`${inputClass} tabular pr-10`}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted"
                  >
                    đ
                  </span>
                </div>
              )}
            </Field>
          </div>

          {/* ═══ Cột phải (1/3): 5. bảng tính → 6. CTA PayOS ═══ */}
          <Card className="space-y-4 lg:sticky lg:top-20">
            <h2 className="text-h3 text-title">Tóm tắt</h2>
            <div className="space-y-2.5">
              <SummaryRow
                label="Tiền thanh toán"
                value={amountValid ? vnd(amountVnd) : "—"}
                strong
              />
              <SummaryRow
                label="Credit gốc"
                value={credit ? `${fmt(credit.baseCredit)} credit` : "—"}
              />
              <SummaryRow
                label={`Tặng thêm (+${BONUS_PERCENT_LABEL}% từ ${vnd(BONUS_THRESHOLD)})`}
                value={credit ? `+${fmt(credit.bonusCredit)} credit` : "—"}
                tone={credit?.hasBonus ? "ok" : undefined}
              />
            </div>
            <div className="border-t border-[var(--color-line)] pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-semibold text-title">
                  Tổng nhận
                </span>
                <span className="text-price tabular text-credit">
                  {credit ? fmt(credit.totalCredit) : "—"}
                  <span className="ml-1 text-sm font-semibold text-muted">
                    credit
                  </span>
                </span>
              </div>
            </div>

            <Button
              size="lg"
              fullWidth
              loading={creating}
              disabled={user ? !amountValid : false}
              onClick={() => void handleTopUp()}
            >
              {ctaLabel}
            </Button>

            {sessionExpired && (
              <InlineNotice tone="warning" title="Phiên đăng nhập đã hết hạn">
                <span className="block">
                  Vui lòng đăng nhập lại để tiếp tục — gói đã chọn được giữ
                  nguyên.
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => void handleLogin()}
                >
                  Đăng nhập lại
                </Button>
              </InlineNotice>
            )}
            {submitError && (
              <InlineNotice tone="danger" title="Chưa tạo được yêu cầu thanh toán">
                {submitError}
              </InlineNotice>
            )}
            {loginError && (
              <InlineNotice tone="danger">{loginError}</InlineNotice>
            )}

            <p className="text-meta leading-relaxed text-muted">
              Sau khi PayOS xác nhận thanh toán, credit được cộng tự động vào
              ví — thường trong vài giây. Bạn có thể theo dõi số dư ở navbar
              hoặc mục ví credit trong tài khoản.
            </p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
