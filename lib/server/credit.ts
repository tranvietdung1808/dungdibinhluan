import { supabaseAdmin } from '@/lib/supabase'
import { DEFAULT_MOD_CREDIT_COST } from '@/lib/credit-core'

// =====================================================
// Hệ thống credit — phần server (database)
// Các hằng số & hàm tính toán pure được re-export từ
// @/lib/credit-core (client-safe, dùng chung client/server)
// =====================================================

export {
  BASE_RATE,
  MIN_TOPUP,
  BONUS_THRESHOLD,
  BONUS_PERCENT,
  DEFAULT_MOD_CREDIT_COST,
  CREDIT_TOPUP_PACKAGES,
  calculateCredit,
  validateTopupAmount,
} from '@/lib/credit-core'
export type { CreditCalculation, TopupPackage } from '@/lib/credit-core'

// Interface (server)
export interface CreditWallet {
  balance: number
  totalEarned: number
  totalSpent: number
}

export interface CreditTransaction {
  id: string
  type: string
  amount: number
  balance_after: number
  reference_type: string | null
  reference_id: string | null
  description: string | null
  created_at: string
}

export interface AddCreditsParams {
  userId: string
  amount: number
  referenceType?: string | null
  referenceId?: string | null
  description?: string | null
}

export interface DeductCreditsParams {
  userId: string
  amount: number
  referenceType?: string | null
  referenceId?: string | null
  description?: string | null
}

// =====================================================
// Hàm database (dùng supabaseAdmin)
// =====================================================

// Lấy ví credit của user; nếu chưa tồn tại thì tạo mới
export async function getCreditWallet(userId: string): Promise<CreditWallet> {
  const { data } = await supabaseAdmin
    .from('credit_wallets')
    .select('balance, total_earned, total_spent')
    .eq('user_id', userId)
    .maybeSingle()

  if (data) {
    return {
      balance: data.balance as number,
      totalEarned: data.total_earned as number,
      totalSpent: data.total_spent as number,
    }
  }

  // Chưa có ví → tạo mới (race-safe: nhiều request đồng thời không lỗi unique)
  await supabaseAdmin
    .from('credit_wallets')
    .upsert(
      { user_id: userId, balance: 0, total_earned: 0, total_spent: 0 },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )

  const { data: created } = await supabaseAdmin
    .from('credit_wallets')
    .select('balance, total_earned, total_spent')
    .eq('user_id', userId)
    .maybeSingle()

  return created
    ? {
        balance: created.balance as number,
        totalEarned: created.total_earned as number,
        totalSpent: created.total_spent as number,
      }
    : { balance: 0, totalEarned: 0, totalSpent: 0 }
}

// Đọc giá mở khóa mod; fallback về DEFAULT_MOD_CREDIT_COST
export async function getModCreditCost(modId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('mod_unlock_prices')
    .select('credit_cost')
    .eq('mod_id', modId)
    .maybeSingle()

  return (data?.credit_cost as number) ?? DEFAULT_MOD_CREDIT_COST
}

// =====================================================
// Cấu hình "mở khóa bằng credit" cho mod (theo slug)
// enabled = có dòng trong mod_unlock_prices
// =====================================================
export interface ModCreditConfig {
  modId: string | null
  enabled: boolean
  creditCost: number | null
}

// Lấy config credit theo slug (join mods -> mod_unlock_prices)
export async function getModCreditConfigBySlug(slug: string): Promise<ModCreditConfig> {
  try {
    const { data, error } = await supabaseAdmin
      .from('mods')
      .select('id, mod_unlock_prices(credit_cost)')
      .eq('slug', slug)
      .maybeSingle()

    if (error || !data) return { modId: null, enabled: false, creditCost: null }

    // postgREST embed "mods -> mod_unlock_prices" có thể trả object hoặc array
    const row = data as {
      id: string
      mod_unlock_prices?: { credit_cost: number } | { credit_cost: number }[] | null
    }
    const price = Array.isArray(row.mod_unlock_prices)
      ? row.mod_unlock_prices[0]
      : row.mod_unlock_prices
    return {
      modId: row.id,
      enabled: price != null,
      creditCost: price?.credit_cost ?? null,
    }
  } catch {
    return { modId: null, enabled: false, creditCost: null }
  }
}

// Bật yêu cầu mở khóa credit với mức giá cụ thể
export async function setModCreditConfig(modId: string, creditCost: number): Promise<void> {
  const cost = Number.isFinite(creditCost) ? Math.max(1, Math.floor(creditCost)) : DEFAULT_MOD_CREDIT_COST
  const { error } = await supabaseAdmin
    .from('mod_unlock_prices')
    .upsert({ mod_id: modId, credit_cost: cost }, { onConflict: 'mod_id' })

  if (error) throw new Error('Không lưu được cấu hình credit: ' + error.message)
}

// Tắt yêu cầu mở khóa credit
export async function clearModCreditConfig(modId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('mod_unlock_prices')
    .delete()
    .eq('mod_id', modId)

  if (error) throw new Error('Không xóa được cấu hình credit: ' + error.message)
}

// Bản đồ mod_id -> credit_cost (dùng cho list mods)
export async function getCreditPricesMap(): Promise<Record<string, number>> {
  const { data } = await supabaseAdmin
    .from('mod_unlock_prices')
    .select('mod_id, credit_cost')

  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    map[row.mod_id as string] = row.credit_cost as number
  }
  return map
}

// Cộng credit vào ví user (topup) — ATOMIC qua RPC Postgres
// Nếu reference trùng (ví dụ webhook retry cùng orderCode) → unique violation
// (23505) → coi như đã xử lý, không cộng đúp.
export async function addCredits({
  userId,
  amount,
  referenceType = null,
  referenceId = null,
  description = null,
}: AddCreditsParams): Promise<void> {
  if (amount <= 0) throw new Error('Số credit cộng phải lớn hơn 0')

  const { error } = await supabaseAdmin.rpc('credit_add', {
    p_user_id: userId,
    p_amount: amount,
    p_ref_type: referenceType,
    p_ref_id: referenceId,
    p_desc: description,
  })

  if (error) {
    if (error.code === '23505') return // duplicate reference → đã xử lý
    throw new Error('Không thể cộng credit: ' + error.message)
  }
}

// Trừ credit với kiểm tra đủ số dư — ATOMIC qua RPC Postgres
// WHERE balance >= amount chống double-spend khi nhiều request đồng thời.
export async function deductCredits({
  userId,
  amount,
  referenceType = null,
  referenceId = null,
  description = null,
}: DeductCreditsParams): Promise<{ balanceAfter: number }> {
  if (amount <= 0) throw new Error('Số credit trừ phải lớn hơn 0')

  const { data, error } = await supabaseAdmin.rpc('credit_deduct', {
    p_user_id: userId,
    p_amount: amount,
    p_ref_type: referenceType,
    p_ref_id: referenceId,
    p_desc: description,
  })

  if (error) {
    if (error.message?.includes('INSUFFICIENT_CREDIT')) {
      throw new Error('Bạn không đủ credit')
    }
    throw new Error('Không thể trừ credit: ' + error.message)
  }

  return { balanceAfter: data as number }
}

// Lịch sử giao dịch credit của user
export async function getCreditTransactions(
  userId: string,
  limit = 30
): Promise<CreditTransaction[]> {
  const { data } = await supabaseAdmin
    .from('credit_transactions')
    .select('id, type, amount, balance_after, reference_type, reference_id, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as CreditTransaction[]
}
