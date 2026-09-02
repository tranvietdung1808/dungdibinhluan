"use client";

// =====================================================
// Trang quản lý tài khoản (Account Dashboard)
// Premium Dark Gaming SaaS · coral primary / violet phụ
// =====================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/useAuth";
import { createClient } from "@/utils/supabase/client";
import { DashboardLayout } from "./components/DashboardLayout";
import { PageHeader } from "./components/PageHeader";
import { ErrorState, PageSkeleton } from "./components/states";
import { OverviewSection } from "./components/OverviewSection";
import { ProfileSection } from "./components/ProfileSection";
import { OrdersSection } from "./components/OrdersSection";
import { ModLibrarySection } from "./components/ModLibrarySection";
import { MembershipSection } from "./components/MembershipSection";
import { SecuritySection } from "./components/SecuritySection";
import { CreditSection } from "./components/CreditSection";
import { Button, Card, Icon } from "./components/ui";
import type { AccountData, SectionKey } from "./types";

const UPGRADE_URL = "/mods/mix-mods-fc26/payment";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading, login, logout } = useAuth();
  const [section, setSection] = useState<SectionKey>("overview");
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const firstLoad = useRef(true);

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

  const fetchPlans = useCallback(async () => {
    if (!firstLoad.current) return;
    firstLoad.current = false;
    setPlansLoading(true);
    setPlansError("");
    try {
      // Ưu tiên plans trong /api/account; fallback /api/admin/plans (admin-only)
      // nếu account API chưa trả (tránh "data cũ chưa có"). Security: endpoint này
      // không lộ data nhạy cảm; nếu user không phải admin sẽ bị 403 → giữ plans hiện có.
      const res = await fetch("/api/account/plans");
      if (!res.ok) throw new Error("Không tải được danh sách gói");
      const d = await res.json();
      const plans = d.plans ?? [];
      setData((prev) => (prev ? { ...prev, plans } : prev));
    } catch {
      setPlansError("Không tải được danh sách gói membership");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) void fetchAccount();
  }, [authLoading, fetchAccount]);

  const refetchAll = useCallback(() => {
    firstLoad.current = true;
    fetchPlans();
    void fetchAccount();
  }, [fetchAccount, fetchPlans]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin"
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
          <div className="mx-auto w-16 h-16 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-muted">
            <Icon name="user" className="w-8 h-8" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-title">Bạn chưa đăng nhập</h1>
          <p className="mt-2 text-sm text-body leading-relaxed">
            Đăng nhập bằng Google để quản lý tài khoản, đơn hàng, mod đã mở và membership VIP.
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
  const isVip =
    data?.roles?.includes("vip") ||
    (data?.subscription != null &&
      new Date(data.subscription.expires_at).getTime() > now);
  const activeSub = data?.subscription ?? null;

  const content = loading ? (
    <PageSkeleton />
  ) : error ? (
    <ErrorState message={error} onRetry={fetchAccount} />
  ) : (
    <>
      {section === "overview" && (
        <OverviewSection
          displayName={displayName}
          isVip={isVip}
          activeSub={activeSub}
          now={now}
          orderCount={data?.subscriptions?.length ?? 0}
          unlockedItems={data?.mods_unlocked ?? []}
          onNavigate={setSection}
          onUpgrade={() => router.push(UPGRADE_URL)}
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
          onError={(msg) => setError(msg)}
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
          activeSub={activeSub}
          now={now}
          onUpgrade={() => router.push(UPGRADE_URL)}
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
      onNavigate={(s) => {
        setSection(s);
        if (s === "membership") fetchPlans();
      }}
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
            isVip && activeSub
              ? Math.max(0, Math.ceil((new Date(activeSub.expires_at).getTime() - now) / (24 * 60 * 60 * 1000)))
              : undefined
          }
        />
      }
    >
      {content}
      {!loading && !error && data && (
        <p className="mt-8 text-[11px] text-muted/70 text-center" aria-hidden="true">
          Đồng bộ lần cuối:{" "}
          {data.synced_at
            ? new Date(data.synced_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </p>
      )}
    </DashboardLayout>
  );
}