// =====================================================
// Types cho trang quản lý tài khoản (account dashboard)
// =====================================================

export type SectionKey =
  | "overview"
  | "profile"
  | "orders"
  | "unlocked"
  | "membership"
  | "security";

export interface AccountUser {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  provider?: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface SubscriptionInfo {
  id: string;
  plan_name: string;
  expires_at: string;
  starts_at: string;
  plan_price?: number;
}

export interface SubscriptionHistory {
  id: string;
  status: "active" | "expired" | "cancelled";
  starts_at: string;
  expires_at: string;
  notes: string | null;
  plan_name: string;
  plan_price: number;
}

export interface UnlockedMod {
  id: string;
  unlocked_at: string;
  mod: {
    id: string;
    slug: string;
    name: string;
    thumbnail: string | null;
    category: string;
    tags: string[];
  } | null;
}

export interface AccountData {
  user: AccountUser;
  roles: string[];
  subscription: SubscriptionInfo | null;
  subscriptions: SubscriptionHistory[];
  mods_unlocked: UnlockedMod[];
  plans?: MembershipPlan[];
  synced_at?: string;
}

// Map API /api/admin/plans -> MembershipPlan
export function normalizePlan(raw: Record<string, unknown>): MembershipPlan {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Gói"),
    description: (raw.description as string | null) ?? null,
    price: Number(raw.price ?? 0),
    duration_days: Number(raw.duration_days ?? 30),
    features: Array.isArray(raw.features) ? (raw.features as string[]) : [],
    is_active: Boolean(raw.is_active ?? false),
    sort_order: Number(raw.sort_order ?? 0),
  };
}
