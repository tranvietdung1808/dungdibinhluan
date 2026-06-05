// =====================================================
// Shared server-side authentication middleware
// =====================================================
// Centralizes token verification + admin check to:
// - Eliminate code duplication across 3+ route files
// - Cache token→user lookups in-memory (TTL: 30s)
// - Only call supabaseAdmin.auth.getUser() once per token
// - Only call checkIsAdminEmail() once per email
//
// Usage:
//   import { ensureAdmin, getUserFromToken } from "@/lib/server/auth";
//   const admin = await ensureAdmin(request);
//   if (!admin) return errorResponse("Forbidden", 403);
// =====================================================

import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkIsAdminEmail } from "@/lib/admin";
import type { User } from "@supabase/supabase-js";

// ── Token → User cache ──
// In serverless, this cache is only valid for the current request
// lifecycle or warm instance. TTL is kept short (30s) to handle
// token revocation while still avoiding round-trips in the same
// request context where multiple API handlers verify the same token.

const TOKEN_CACHE_TTL_MS = 30_000;
const tokenUserCache = new Map<
  string,
  { user: User | null; ts: number }
>();

const MAX_CACHE_SIZE = 200;

function getCachedUser(token: string): User | null | undefined {
  const entry = tokenUserCache.get(token);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > TOKEN_CACHE_TTL_MS) {
    tokenUserCache.delete(token);
    return undefined;
  }
  return entry.user;
}

function setCachedUser(token: string, user: User | null) {
  if (tokenUserCache.size >= MAX_CACHE_SIZE) {
    const first = tokenUserCache.keys().next().value;
    if (first) tokenUserCache.delete(first);
  }
  tokenUserCache.set(token, { user, ts: Date.now() });
}

/**
 * Extract Bearer token from Authorization header.
 */
export function extractToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
}

/**
 * Verify token against Supabase and return the user.
 * Uses an in-memory cache to avoid repeated calls for the same token.
 */
export async function getUserFromToken(
  token: string
): Promise<User | null> {
  if (!token) return null;

  // Check cache first
  const cached = getCachedUser(token);
  if (cached !== undefined) return cached;

  // Verify with Supabase
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = error || !data.user ? null : data.user;

  // Cache the result (even null results to avoid spam on invalid tokens)
  setCachedUser(token, user);
  return user;
}

/**
 * Shared admin verification middleware.
 * Extracts token → verifies user → checks admin role.
 * Returns the user if admin, null otherwise.
 */
export async function ensureAdmin(
  request: NextRequest
): Promise<User | null> {
  const token = extractToken(request);
  if (!token) return null;

  const user = await getUserFromToken(token);
  if (!user || !user.email) return null;

  const isAdmin = await checkIsAdminEmail(supabaseAdmin, user.email);
  return isAdmin ? user : null;
}
