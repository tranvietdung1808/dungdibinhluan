/** Bỏ dấu tiếng Việt: cách → cach, đường → duong */
export function removeVietnameseDiacritics(str: string): string {
  return str
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/** Slug URL từ tiêu đề: bỏ dấu, chữ thường, khoảng trắng → gạch ngang */
export function slugFromTitle(title: string): string {
  const base = removeVietnameseDiacritics(title).toLowerCase().trim()
  return base
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
