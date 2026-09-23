/** Format giá VND theo locale vi — một nguồn cho select/checkout/summary */
export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}
