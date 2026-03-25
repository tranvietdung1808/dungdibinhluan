export const GUIDE_FIXED_TAGS = [
  "Hướng dẫn mods",
  "Hướng dẫn Career Mode",
  "Thông tin game",
] as const

export type GuideFixedTag = (typeof GUIDE_FIXED_TAGS)[number]

const GUIDE_TAG_KEYWORDS: Record<GuideFixedTag, string[]> = {
  "Hướng dẫn mods": [
    "mod",
    "mods",
    "cai mod",
    "huong dan mod",
    "frosty",
    "facepack",
    "kitpack",
    "realism mod",
    "install mod",
  ],
  "Hướng dẫn Career Mode": [
    "career mode",
    "career",
    "manager mode",
    "chuyen nhuong",
    "doi hinh",
    "youth academy",
    "training plan",
    "chien thuat",
    "doi truong",
  ],
  "Thông tin game": [
    "ea fc",
    "fc 26",
    "fifa",
    "title update",
    "patch",
    "cap nhat",
    "tin tuc",
    "thong tin",
    "gameplay update",
  ],
}

const STOP_WORDS = new Set([
  "va",
  "voi",
  "cho",
  "trong",
  "cua",
  "nhung",
  "nhung",
  "the",
  "la",
  "mot",
  "cac",
  "khi",
  "tai",
  "sau",
  "truoc",
  "hoac",
  "tu",
  "den",
  "nay",
  "de",
  "anh",
  "em",
  "chi",
  "theo",
  "them",
  "ban",
  "duoc",
  "dang",
  "vua",
  "moi",
  "update",
  "huong",
  "dan",
  "thong",
  "tin",
  "game",
  "mode",
])

export function normalizeText(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export function inferGuideTagsFromText(title: string, content: string) {
  const normalized = normalizeText(`${title} ${stripHtml(content)}`)
  const tags = GUIDE_FIXED_TAGS.filter((tag) =>
    GUIDE_TAG_KEYWORDS[tag].some((keyword) => normalized.includes(keyword))
  )
  return tags.length > 0 ? tags : ["Thông tin game"]
}

export function extractTopicTerms(input: string, maxTerms = 14) {
  const normalized = normalizeText(input)
  const words = normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
  const frequency = new Map<string, number>()
  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1)
  }
  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([word]) => word)
}

export function parseFlexibleDate(input?: string | null) {
  if (!input) return 0
  const parsed = Date.parse(input)
  if (!Number.isNaN(parsed)) return parsed
  const normalized = input.trim()
  const ddmmyyyy = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1])
    const month = Number(ddmmyyyy[2]) - 1
    const year = Number(ddmmyyyy[3])
    const value = new Date(year, month, day).getTime()
    if (!Number.isNaN(value)) return value
  }
  return 0
}

export function overlapScore(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  let overlap = 0
  for (const item of leftSet) {
    if (rightSet.has(item)) overlap += 1
  }
  return overlap
}
