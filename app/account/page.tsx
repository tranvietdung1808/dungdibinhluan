"use client";

// =====================================================
// Trang quản lý tài khoản (Account Dashboard)
// Premium Dark Gaming SaaS · accent primary / violet phụ
// Section đọc/ghi qua ?section= trên URL (A07):
//   - vào thẳng /account?section=credit mở đúng ví (T11)
//   - đổi tab → router.replace(..., { scroll: false })
//   - Back/Forward khôi phục section vì state derive từ URL
// =====================================================

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/useAuth";
import { createClient } from "@/utils/supabase/client";
import { DashboardLayout } from "./components/DashboardLayout";
import { PageHeader } from "./components/PageHeader";
import { ErrorState, PageSkeleton, daysLeft } from "./components/states";
import { OverviewSection } from "./components/OverviewSection";
import { ProfileSection } from "./components/ProfileSection";
import { OrdersSection } from "./components/OrdersSection";
import { ModLibrarySection } from "./components/ModLibrarySection";
import { MembershipSection } from "./components/MembershipSection";
import { SecuritySection } from "./components/SecuritySection";
import { CreditSection } from "./components/CreditSection";
import { Button, Card, Icon } from "./components/ui";
import {
  DEFAULT_SECTION,
  isSectionKey,
  type AccountData,
  type SectionKey,
} from "./types";

function AccountPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading: authLoading, login, logout } = useAuth();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const plansRequested = useRef(false);

  // ── A07: section là state derive từ URL (single source of truth) ──
  const rawSection = searchParams.get("section");
  const section: SectionKey = isSectionKey(rawSection) ? rawSection : DEFAULT_SECTION;

  // Param không hợp lệ → dọn URL về mặc định (không để URL "bogus" sót lại)
  useEffect(() => {
    if (rawSection != null && !isSectionKey(rawSection)) {
      router.replace("/account", { scroll: false });
    }
  }, [rawSection, router]);

  const fetchAccount = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      const res = await fetch("/api/account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      if (!res.ok) throw new Error("Không tải được dữ liệu tài khoản");
      const d = await res.json();
      setData(d.data ?? d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Luôn fetch thật khi được gọi (retry hoạt động đúng — T19).
  // Việc chỉ tự gọi 1 lần được kiểm soát qua ensurePlans/plansRequested.
  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError("");
    try {
      const res = await fetch("/api/account/plans");
      if (!res.ok) throw new Error("Không tải được danh sách gói");
      const d = await res.json();
      const plans = d.plans ?? d.data?.plans ?? [];
      setData((prev) => (prev ? { ...prev, plans } : prev));
    } catch {
      setPlansError("Chưa tải được danh sách gói membership");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Tự nạp plans tối đa 1 lần mỗi phiên xem (user đổi → reset ở effect dưới)
  const ensurePlans = useCallback(() => {
    if (plansRequested.current) return;
    plansRequested.current = true;
    void fetchPlans();
  }, [fetchPlans]);

  // T12: user đổi (logout A → login B cùng tab) → xoá dữ liệu cũ, nạp lại
  const userId = user?.id ?? null;
  useEffect(() => {
    if (authLoading) return;
    setData(null);
    setError("");
    setPlansError("");
    plansRequested.current = false;
    setLoading(true);
    void fetchAccount();
  }, [authLoading, userId, fetchAccount]);

  // Vào section membership (kể cả vào thẳng bằng URL) → đảm bảo có plans
  useEffect(() => {
    if (section === "membership") ensurePlans();
  }, [section, ensurePlans]);

  const navigate = useCallback(
    (s: SectionKey) => {
      if (!isSectionKey(s)) return;
      const params = new URLSearchParams(searchParams.toString());
      if (s === DEFAULT_SECTION) params.delete("section");
      else params.set("section", s);
      const qs = params.toString();
      router.replace(qs ? `/account?${qs}` : "/account", { scroll: false });
    },
    [router, searchParams]
  );

  const refetchAll = useCallback(() => {
    plansRequested.current = false;
    if (section === "membership") ensurePlans();
    void fetchAccount();
  }, [fetchAccount, ensurePlans, section]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Đang tải"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
        <Card className="p-8 sm:p-10 text-center max-w-md w-full">
          <div className="mx-auto w-16 h-16 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-muted">
            <Icon name="user" className="w-8 h-8" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-title">Bạn chưa đăng nhập</h1>
          <p className="mt-2 text-sm text-body leading-relaxed">
            Đăng nhập bằng Google để quản lý tài khoản, ví credit, mod đã mở và membership.
          </p>
          <Button variant="primary" size="lg" className="mt-6 w-full" onClick={login}>
            <Icon name="user" className="w-4 h-4" />
            Đăng nhập ngay
          </Button>
        </Card>
      </div>
    );
  }

  const current = data?.user;
  const displayName =
    current?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Tài khoản";
  const email = current?.email || user.email || "";
  const avatarUrl =
    current?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;
  const now = Date.now();
  // §14.3: VIP do role (admin cấp, không có subscription) là trạng thái RIÊNG,
  // tách khỏi VIP do subscription để UI không hiển thị mâu thuẫn.
  const hasVipRole = Boolean(data?.roles?.includes("vip"));
  const activeSub = data?.subscription ?? null;
  const subActive =
    activeSub != null && new Date(activeSub.expires_at).getTime() > now;
  const isVip = hasVipRole || subActive;

  const content = loading ? (
    <PageSkeleton />
  ) : error ? (
    <ErrorState message={error} onRetry={refetchAll} />
  ) : (
    <>
      {section === "overview" && (
        <OverviewSection
          isVip={isVip}
          hasVipRole={hasVipRole}
          activeSub={activeSub}
          now={now}
          subscriptionCount={data?.subscriptions?.length ?? 0}
          unlockedItems={data?.mods_unlocked ?? []}
          onNavigate={navigate}
        />
      )}
      {section === "credit" && <CreditSection />}
      {section === "profile" && (
        <ProfileSection
          displayName={displayName}
          email={email}
          avatarUrl={avatarUrl}
          memberSince={current?.created_at}
          lastSignIn={current?.last_sign_in_at}
          onSaved={fetchAccount}
        />
      )}
      {section === "orders" && (
        <OrdersSection subscriptions={data?.subscriptions ?? []} now={now} />
      )}
      {section === "unlocked" && (
        <ModLibrarySection items={data?.mods_unlocked ?? []} />
      )}
      {section === "membership" && (
        <MembershipSection
          plans={data?.plans ?? []}
          fetchPlans={fetchPlans}
          plansLoading={plansLoading}
          plansError={plansError}
          hasVip={isVip}
          hasVipRole={hasVipRole}
          activeSub={activeSub}
          now={now}
        />
      )}
      {section === "security" && (
        <SecuritySection
          email={email}
          memberSince={current?.created_at}
          lastSignIn={current?.last_sign_in_at}
          onLogout={logout}
        />
      )}
    </>
  );

  return (
    <DashboardLayout
      active={section}
      onNavigate={navigate}
      header={
        <PageHeader
          displayName={displayName}
          email={email}
          avatarUrl={avatarUrl}
          isVip={isVip}
          isAdmin={isAdmin}
          memberSince={current?.created_at}
          lastSignIn={current?.last_sign_in_at}
          vipDaysLeft={
            isVip && activeSub ? daysLeft(activeSub.expires_at, now) : undefined
          }
        />
      }
    >
      {content}
      {!loading && !error && data?.synced_at && (
        <p className="mt-8 text-[11px] text-muted/70 text-center">
          Lần cập nhật gần nhất:{" "}
          {new Date(data.synced_at).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </DashboardLayout>
  );
}

// useSearchParams cần Suspense boundary khi prerender (Next.js App Router)
export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-0 flex items-center justify-center">
          <div
            className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="Đang tải"
          />
        </div>
      }
    >
      <AccountPageClient />
    </Suspense>
  );
}
