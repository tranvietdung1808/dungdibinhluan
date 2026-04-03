const STATIC_ADMIN_EMAILS = ["dungba66@gmail.com"];

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

export async function checkIsAdminEmail(supabaseClient: any, email?: string | null): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  
  if (getStaticAdminEmails().has(normalized)) return true;

  try {
     const { data } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("email", normalized)
        .maybeSingle();
        
     return data?.role === "admin";
  } catch (error) {
     return false; // Table might not exist yet or connection error
  }
}
