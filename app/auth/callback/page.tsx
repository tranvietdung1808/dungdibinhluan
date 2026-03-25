"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code");
    const nextRaw = searchParams.get("next") || "/";
    const nextPath = nextRaw.startsWith("/") ? nextRaw : "/";

    const finalizeAuth = async () => {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        await fetch("/api/auth/profile-sync", { method: "POST" });
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          await fetch("/api/auth/admin-session", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          await fetch("/api/auth/admin-session", { method: "DELETE" });
        }
      }
      router.replace(nextPath);
      router.refresh();
    };

    void finalizeAuth();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-9 h-9 border-2 border-[#ce5a67] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-300">Đang hoàn tất đăng nhập Google...</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-9 h-9 border-2 border-[#ce5a67] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-300">Đang hoàn tất đăng nhập Google...</p>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
