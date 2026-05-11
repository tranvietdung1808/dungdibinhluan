export type ProductId = 'fc26-normal' | 'fc26-mods' | 'mix-mods'

export interface ProductConfig {
  id: ProductId
  name: string
  price: number
  codePrefix: 'DUNG' | 'MODS'
  returnUrl: string
  codeEntryUrl: string
}

const BASE = "https://www.dungdibinhluan.com"

export const PRODUCTS: Record<ProductId, ProductConfig> = {
  'fc26-normal': {
    id: 'fc26-normal',
    name: 'FC26 Standard Edition',
    price: 149000,
    codePrefix: 'DUNG',
    returnUrl: '/games/fc26?edition=normal',
    codeEntryUrl: `${BASE}/games/fc26?edition=normal`,
  },
  'fc26-mods': {
    id: 'fc26-mods',
    name: 'FC26 Full Mods Edition',
    price: 269000,
    codePrefix: 'MODS',
    returnUrl: '/games/fc26?edition=mods',
    codeEntryUrl: `${BASE}/games/fc26?edition=mods`,
  },
  'mix-mods': {
    id: 'mix-mods',
    name: 'Mix Mods FC26 2025-2026',
    price: 169000,
    codePrefix: 'MODS',
    returnUrl: '/mods/mix-mods-fc26',
    codeEntryUrl: `${BASE}/mods/mix-mods-fc26`,
  },
}

export function getProduct(id: string): ProductConfig | null {
  return PRODUCTS[id as ProductId] ?? null
}
