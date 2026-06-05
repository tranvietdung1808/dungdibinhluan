"use client";

// =====================================================
// Shared useAuth hook — eliminates duplicate auth logic
// between Navbar and CommunityComments
// =====================================================

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { isStaticAdminEmail } from "@/lib/admin";

type UseAuthResult = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncAdminStatus = useCallback(
    async (token: string | undefined): Promise<boolean> => {
      if (!token) return false;
      try {
        const res = await fetch("/api/auth/admin-session", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser?.email) {
        // Instant static admin check (0ms)
        if (isStaticAdminEmail(currentUser.email)) {
          setIsAdmin(true);
          return;
        }

        // Cache check from localStorage
        const cacheKey = `isAdmin_${currentUser.email}`;
        if (localStorage.getItem(cacheKey) === "true") {
          setIsAdmin(true);
        }

        // Background sync (non-blocking)
        const adminStatus = await syncAdminStatus(
          session?.access_token
        );
        if (active) {
          setIsAdmin(adminStatus);
          localStorage.setItem(cacheKey, String(adminStatus));
        }
      } else {
        if (active) setIsAdmin(false);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser?.email) {
          if (isStaticAdminEmail(currentUser.email)) {
            setIsAdmin(true);
            return;
          }

          const cacheKey = `isAdmin_${currentUser.email}`;
          if (localStorage.getItem(cacheKey) === "true") {
            setIsAdmin(true);
          }

          const adminStatus = await syncAdminStatus(
            session?.access_token
          );
          if (active) {
            setIsAdmin(adminStatus);
            localStorage.setItem(cacheKey, String(adminStatus));
          }
        } else {
          if (active) setIsAdmin(false);
        }
      }
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [syncAdminStatus]);

  const login = useCallback(async () => {
    const supabase = createClient();
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const redirectTo = `${
      window.location.origin
    }/auth/callback?next=${encodeURIComponent(currentPath)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    try {
      await fetch("/api/auth/admin-session", { method: "DELETE" });
    } catch {
      // ignore
    }
    sessionStorage.removeItem("admin_authenticated");
    // Clear admin cache
    if (user?.email) {
      localStorage.removeItem(`isAdmin_${user.email}`);
    }
    setUser(null);
    setIsAdmin(false);
  }, [user]);

  return { user, isAdmin, loading, login, logout };
}
