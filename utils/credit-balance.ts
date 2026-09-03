"use client";

// =====================================================
// Helper đọc số dư credit NHANH cho navbar / lock wall
// - Cache 60s trong sessionStorage → hiện ngay khi quay lại
// - Đọc trực tiếp Supabase REST (1 vòng mạng, không qua serverless),
//   RLS đảm bảo user chỉ đọc được ví của chính mình.
// - Fallback về /api/credit/balance nếu REST fail.
// =====================================================

import { createClient } from "@/utils/supabase/client";

const CACHE_KEY = "credit_balance_cache";
const CACHE_TTL_MS = 60_000;

export function readCachedCreditBalance(): number | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { balance: number; ts: number };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.balance;
  } catch {
    return null;
  }
}

export function writeCachedCreditBalance(balance: number) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ balance, ts: Date.now() }));
  } catch {
    // bỏ qua (private mode / quota)
  }
}

export function clearCachedCreditBalance() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // bỏ qua
  }
}

export async function fetchCreditBalance(): Promise<number | null> {
  // 1) Cache nhanh
  const cached = readCachedCreditBalance();
  if (cached !== null) return cached;

  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    // 2) Đọc trực tiếp Supabase REST (nhanh, 1 hop)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && anonKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/credit_wallets?user_id=eq.${session.user.id}&select=balance`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{ balance: number }>;
        const balance = rows[0]?.balance ?? 0;
        writeCachedCreditBalance(balance);
        return balance;
      }
    }

    // 3) Fallback qua API
    const apiRes = await fetch("/api/credit/balance", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!apiRes.ok) return null;
    const d = await apiRes.json();
    if (typeof d.balance === "number") {
      writeCachedCreditBalance(d.balance);
      return d.balance;
    }
    return null;
  } catch {
    return null;
  }
}
