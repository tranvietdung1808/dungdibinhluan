"use client";

// =====================================================
// Helper đọc số dư credit NHANH cho navbar / lock wall
// - Cache 60s trong sessionStorage → hiện ngay khi quay lại
// - §13.3 / T12: cache key gắn user ID — logout A, login B
//   trên cùng tab KHÔNG thấy số dư A. Mọi key cũ không có
//   userId được dọn khi gặp.
// - Đọc trực tiếp Supabase REST (1 vòng mạng, không qua serverless),
//   RLS đảm bảo user chỉ đọc được ví của chính mình.
// - Fallback về /api/credit/balance nếu REST fail.
// =====================================================

import { createClient } from "@/utils/supabase/client";

const CACHE_PREFIX = "credit_balance_cache:";
/** Key chung cũ (trước khi gắn userId) — dọn để tránh lộ số dư giữa 2 tài khoản */
const LEGACY_CACHE_KEY = "credit_balance_cache";
const CACHE_TTL_MS = 60_000;

const BALANCE_CHANGED_EVENT = "credit-balance-changed";

function keyFor(userId: string) {
  return `${CACHE_PREFIX}${userId}`;
}

function readEntry(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { balance?: number; ts?: number };
    if (typeof parsed.balance !== "number" || typeof parsed.ts !== "number") {
      return null;
    }
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.balance;
  } catch {
    return null;
  }
}

/** Đọc số dư cache của ĐÚNG userId (không có userId → không đọc cache dùng chung) */
export function readCachedCreditBalance(userId: string): number | null {
  try {
    return readEntry(keyFor(userId));
  } catch {
    return null;
  }
}

export function writeCachedCreditBalance(userId: string, balance: number) {
  try {
    // Dọn key chung cũ nếu còn sót từ phiên trước
    sessionStorage.removeItem(LEGACY_CACHE_KEY);
    sessionStorage.setItem(
      keyFor(userId),
      JSON.stringify({ balance, ts: Date.now() })
    );
  } catch {
    // bỏ qua (private mode / quota)
  }
}

/**
 * Xóa cache số dư.
 * - Có userId → chỉ xóa cache của user đó.
 * - Không tham số → xóa cache của MỌI user trong tab (dùng khi không biết
 *   phiên hiện tại, ví dụ logout / đổi tài khoản / sau khi nạp).
 */
export function clearCachedCreditBalance(userId?: string) {
  try {
    sessionStorage.removeItem(LEGACY_CACHE_KEY);
    if (userId) {
      sessionStorage.removeItem(keyFor(userId));
      return;
    }
    const staleKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) staleKeys.push(key);
    }
    staleKeys.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // bỏ qua
  }
}

/**
 * Invalidate thống nhất (§13.3): xóa cache + báo cho mọi consumer
 * (CreditNavChip, ...) tự fetch lại số dư mới.
 * Gọi sau khi: nạp thành công, mở khóa mod, logout/đổi tài khoản.
 */
export function invalidateCreditBalance(userId?: string) {
  clearCachedCreditBalance(userId);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BALANCE_CHANGED_EVENT));
  }
}

export async function fetchCreditBalance(): Promise<number | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      // Không còn phiên → dọn mọi cache để tài khoản sau không đọc nhầm (T12)
      clearCachedCreditBalance();
      return null;
    }

    const userId = session.user.id;

    // 1) Cache nhanh — chỉ cache gắn đúng userId hiện tại
    const cached = readCachedCreditBalance(userId);
    if (cached !== null) return cached;

    // 2) Đọc trực tiếp Supabase REST (nhanh, 1 hop)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && anonKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/credit_wallets?user_id=eq.${userId}&select=balance`,
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
        writeCachedCreditBalance(userId, balance);
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
      writeCachedCreditBalance(userId, d.balance);
      return d.balance;
    }
    return null;
  } catch {
    return null;
  }
}
