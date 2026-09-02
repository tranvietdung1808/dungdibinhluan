// =====================================================
// Core logic credit — PURE, client-safe (không import supabase)
// Dùng được ở cả client & server component
// =====================================================

// Hằng số
export const BASE_RATE = 1000 // 1.000 VND = 1 credit
export const MIN_TOPUP = 50000 // Nạp tối thiểu 50k
export const MAX_TOPUP = 50000000 // Nạp tối đa 50 triệu
export const BONUS_THRESHOLD = 100000 // Từ 100k được nhận bonus
export const BONUS_PERCENT = 0.1 // Bonus 10%
export const DEFAULT_MOD_CREDIT_COST = 5 // Giá mặc định mỗi mod

// Interface
export interface CreditCalculation {
  baseCredit: number
  bonusCredit: number
  totalCredit: number
  hasBonus: boolean
}

export interface TopupPackage {
  amountVnd: number
  creditBase: number
  creditBonus: number
  creditTotal: number
  hasBonus: boolean
  popular?: boolean
}

// Tính credit từ số tiền nạp (VND)
export function calculateCredit(amountVnd: number): CreditCalculation {
  const baseCredit = Math.floor(amountVnd / BASE_RATE)
  const bonusCredit =
    amountVnd >= BONUS_THRESHOLD ? Math.floor(baseCredit * BONUS_PERCENT) : 0
  return {
    baseCredit,
    bonusCredit,
    totalCredit: baseCredit + bonusCredit,
    hasBonus: bonusCredit > 0,
  }
}

// Tính creditBase/creditBonus/creditTotal cho một gói nạp
function packageCredit(amountVnd: number) {
  const { baseCredit, bonusCredit, totalCredit } = calculateCredit(amountVnd)
  return {
    creditBase: baseCredit,
    creditBonus: bonusCredit,
    creditTotal: totalCredit,
    hasBonus: bonusCredit > 0,
  }
}

// Các gói nạp tiền sẵn (creditBase/bonus tính từ calculateCredit, không hardcode)
export const CREDIT_TOPUP_PACKAGES: TopupPackage[] = [
  { amountVnd: 50000, ...packageCredit(50000), popular: false },
  { amountVnd: 100000, ...packageCredit(100000), popular: true },
  { amountVnd: 200000, ...packageCredit(200000), popular: false },
  { amountVnd: 500000, ...packageCredit(500000), popular: true },
  { amountVnd: 1000000, ...packageCredit(1000000), popular: false },
]

// Kiểm tra số tiền nạp có hợp lệ không; trả null nếu hợp lệ
export function validateTopupAmount(amountVnd: number): string | null {
  if (!Number.isInteger(amountVnd)) return 'Số tiền nạp phải là số nguyên'
  if (amountVnd < MIN_TOPUP)
    return `Số tiền nạp tối thiểu là ${MIN_TOPUP.toLocaleString('vi-VN')} VND`
  if (amountVnd > MAX_TOPUP)
    return `Số tiền nạp tối đa là ${MAX_TOPUP.toLocaleString('vi-VN')} VND`
  if (amountVnd % 10000 !== 0) return 'Số tiền nạp phải là bội số của 10.000 VND'
  return null
}
