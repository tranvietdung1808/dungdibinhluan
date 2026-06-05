// =====================================================
// Role-based access control system
// Supports: admin, vip, moderator, or any custom role
// =====================================================
//
// PERFORMANCE OPTIMIZATIONS:
// - Memoized static admin emails (computed once)
// - In-memory LRU cache for admin status checks (TTL: 60s)
// - Console.log removed from hot paths (only warn/error in dev)
// =====================================================

const STATIC_ADMIN_EMAILS_LIST = ["dungba66@gmail.com"];

// All valid roles in the system — add new roles here
export type UserRole = "admin" | "vip" | "moderator" | "user";

// ── Memoized static admin emails ──
let _staticAdminEmails: Set<string> | null = null;

function memoizeStaticAdminEmails(): Set<string> {
  if (_staticAdminEmails) return _staticAdminEmails;
  const dynamicEmails = (
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    process.env.ADMIN_EMAILS ||
    ""
  )
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
  _staticAdminEmails = new Set([
    ...STATIC_ADMIN_EMAILS_LIST.map(normalizeEmail),
    ...dynamicEmails,
  ]);
  return _staticAdminEmails;
}

export function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

export function getStaticAdminEmails() {
  return memoizeStaticAdminEmails();
}

export function isStaticAdminEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getStaticAdminEmails().has(normalized);
}

// ── In-memory cache for admin checks ──
// Avoids repeated DB queries for the same email within a short window.
// Valid for one request lifecycle in serverless, but helps during the same
// request where multiple components check the same user.

const ADMIN_CACHE_TTL_MS = 60_000; // 60 seconds
const adminCheckCache = new Map<string, { result: boolean; ts: number }>();

function getCachedAdminCheck(normalizedEmail: string): boolean | null {
  const entry = adminCheckCache.get(normalizedEmail);
  if (!entry) return null;
  if (Date.now() - entry.ts > ADMIN_CACHE_TTL_MS) {
    adminCheckCache.delete(normalizedEmail);
    return null;
  }
  return entry.result;
}

function setCachedAdminCheck(normalizedEmail: string, result: boolean) {
  // Simple LRU: if cache grows too large, evict oldest entries
  if (adminCheckCache.size > 500) {
    const oldest = [...adminCheckCache.entries()].sort(
      (a, b) => a[1].ts - b[1].ts
    );
    for (let i = 0; i < 100 && i < oldest.length; i++) {
      adminCheckCache.delete(oldest[i][0]);
    }
  }
  adminCheckCache.set(normalizedEmail, { result, ts: Date.now() });
}

// ── Core role functions ──

/**
 * Get all roles for a given email from the database
 */
export async function getUserRoles(
  supabaseClient: any,
  email?: string | null
): Promise<UserRole[]> {
  const normalized = normalizeEmail(email);
  if (!normalized) return [];

  const roles: UserRole[] = [];

  // Static admin emails always get the admin role
  if (getStaticAdminEmails().has(normalized)) {
    roles.push("admin");
  }

  try {
    const { data } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("email", normalized);

    if (data && Array.isArray(data)) {
      for (const row of data) {
        if (row.role && !roles.includes(row.role)) {
          roles.push(row.role);
        }
      }
    }
  } catch {
    // Table might not exist yet or connection error
  }

  return roles;
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(
  supabaseClient: any,
  email: string | null | undefined,
  role: UserRole
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // Static admin check (only for admin role)
  if (role === "admin" && getStaticAdminEmails().has(normalized)) {
    return true;
  }

  try {
    const { data, error } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("email", normalized)
      .eq("role", role)
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[hasRole] Lỗi truy vấn Supabase:", error.message);
      }
      return false;
    }

    return !!data;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[hasRole] Lỗi không xác định:", error);
    }
    return false;
  }
}

/**
 * Check if a user has ANY of the given roles
 */
export async function hasAnyRole(
  supabaseClient: any,
  email: string | null | undefined,
  roles: UserRole[]
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // Static admin check
  if (
    roles.includes("admin") &&
    getStaticAdminEmails().has(normalized)
  )
    return true;

  try {
    const { data } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("email", normalized)
      .in("role", roles)
      .limit(1);

    return !!(data && data.length > 0);
  } catch {
    return false;
  }
}

// =====================================================
// Backward-compatible function (legacy)
// =====================================================

/**
 * Check if a user is an admin (with in-memory caching).
 * Caches the result per email for 60 seconds to avoid
 * repeated DB queries in the same request lifecycle.
 */
export async function checkIsAdminEmail(
  supabaseClient: any,
  email?: string | null
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // Static admin check first (instant)
  if (getStaticAdminEmails().has(normalized)) return true;

  // Check in-memory cache
  const cached = getCachedAdminCheck(normalized);
  if (cached !== null) return cached;

  // DB query
  const result = await hasRole(supabaseClient, email, "admin");

  // Store in cache
  setCachedAdminCheck(normalized, result);
  return result;
}
