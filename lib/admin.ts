// =====================================================
// Role-based access control system
// Supports: admin, vip, moderator, or any custom role
// =====================================================

const STATIC_ADMIN_EMAILS = ["dungba66@gmail.com"];

// All valid roles in the system — add new roles here
export type UserRole = "admin" | "vip" | "moderator" | "user";

export function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

export function getStaticAdminEmails() {
  const dynamicEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
  return new Set([...STATIC_ADMIN_EMAILS.map(normalizeEmail), ...dynamicEmails]);
}

export function isStaticAdminEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getStaticAdminEmails().has(normalized);
}

// =====================================================
// Core role functions — query the user_roles table
// =====================================================

/**
 * Get all roles for a given email from the database
 */
export async function getUserRoles(supabaseClient: any, email?: string | null): Promise<UserRole[]> {
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
export async function hasRole(supabaseClient: any, email: string | null | undefined, role: UserRole): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // Static admin check (only for admin role)
  if (role === "admin" && getStaticAdminEmails().has(normalized)) return true;

  try {
    const { data } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("email", normalized)
      .eq("role", role)
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Check if a user has ANY of the given roles
 */
export async function hasAnyRole(supabaseClient: any, email: string | null | undefined, roles: UserRole[]): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // Static admin check
  if (roles.includes("admin") && getStaticAdminEmails().has(normalized)) return true;

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
 * Check if a user is an admin (backward compatible)
 */
export async function checkIsAdminEmail(supabaseClient: any, email?: string | null): Promise<boolean> {
  return hasRole(supabaseClient, email, "admin");
}
