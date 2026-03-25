const STATIC_ADMIN_EMAILS = ["dungba66@gmail.com"];

function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

export function getAdminEmails() {
  const dynamicEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
  return new Set([...STATIC_ADMIN_EMAILS.map(normalizeEmail), ...dynamicEmails]);
}

export function isAdminEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getAdminEmails().has(normalized);
}
