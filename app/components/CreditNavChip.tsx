"use client";

// ─── Credit Chip hiển thị số dư credit trên Navbar ───
// Khi balance < 10, chip sẽ nhấp nháy (animate-pulse) và chuyển sang màu đỏ để thu hút sự chú ý.

interface CreditNavChipProps {
  /** Số dư credit hiện tại của user */
  balance: number;
  /** Callback khi click vào chip (mở modal nạp credit) */
  onClick: () => void;
}

/** Icon đồng xu SVG inline 18x18 */
function CoinIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

export default function CreditNavChip({ balance, onClick }: CreditNavChipProps) {
  const isLow = balance < 10;

  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
        isLow
          ? "animate-pulse bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-red-500/20"
          : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-orange-500/20"
      }`}
      title={isLow ? "Số dư sắp hết, nạp ngay!" : `Số dư: ${balance} credit`}
    >
      <CoinIcon />
      <span>⭐ {balance}</span>
    </button>
  );
}