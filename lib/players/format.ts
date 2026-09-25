// =====================================================
// lib/players/format — format số/nhãn cho UI danh bạ cầu thủ
// Blueprint §5.4, §9: số nguyên EUR; rút gọn chỉ ở danh sách;
// thiếu số liệu → "Chưa có".
// =====================================================

const eurFull = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** €123.456.789 — trang chi tiết, số đầy đủ */
export function formatEurFull(value: number | null | undefined): string {
  return value == null ? "Chưa có" : eurFull.format(value);
}

/**
 * Rút gọn cho danh sách: ≥1tr → "€105 tr" ; ≥1k → "€850 nghìn" ; nhỏ → đầy đủ.
 * Sort/lọc KHÔNG dùng chuỗi này — vẫn dùng số nguyên gốc.
 */
export function formatEurCompact(value: number | null | undefined): string {
  if (value == null) return "Chưa có";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    const rounded = m >= 100 ? Math.round(m) : Math.round(m * 10) / 10;
    return `€${rounded.toLocaleString("vi-VN")} tr`;
  }
  if (value >= 1_000) {
    return `€${Math.round(value / 1_000).toLocaleString("vi-VN")} nghìn`;
  }
  return eurFull.format(value);
}

/** Tuổi theo ngày tham chiếu của bộ dữ liệu (data_date), không theo hôm nay. */
export function calcAgeAt(birthdate: string | null, dataDate: string | null): number | null {
  if (!birthdate || !dataDate) return null;
  const birth = new Date(`${birthdate}T00:00:00Z`);
  const ref = new Date(`${dataDate}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) return null;
  let age = ref.getUTCFullYear() - birth.getUTCFullYear();
  const hadBirthday =
    ref.getUTCMonth() > birth.getUTCMonth() ||
    (ref.getUTCMonth() === birth.getUTCMonth() &&
      ref.getUTCDate() >= birth.getUTCDate());
  if (!hadBirthday) age -= 1;
  return age >= 0 && age <= 80 ? age : null;
}

/** Nhãn chân thuận từ mã EA (1 = phải, 2 = trái). */
export function preferredFootLabel(foot: number | null): string | null {
  if (foot === 1) return "Phải";
  if (foot === 2) return "Trái";
  return null;
}

/** Nhãn giới tính từ mã EA (0 = nam, 1 = nữ). */
export function genderLabel(gender: number | null): string | null {
  if (gender === 0) return "Nam";
  if (gender === 1) return "Nữ";
  return null;
}

/** "fc26" → "FC 26" — nhãn bản game đúng dữ liệu, không tự đổi nhãn. */
export function gameVersionLabel(gameVersion: string): string {
  const m = /^fc(\d+)$/i.exec(gameVersion.trim());
  return m ? `FC ${m[1]}` : gameVersion;
}

/** Nhãn cơ sở giá ở trang chi tiết (§5.4). */
export function baseValueKindLabel(
  kind: "market" | "career" | "unknown"
): string | null {
  if (kind === "market") return "Giá thị trường";
  if (kind === "career") return "Giá Career";
  return null;
}
