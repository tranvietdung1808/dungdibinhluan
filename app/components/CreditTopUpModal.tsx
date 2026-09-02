"use client";

// ─── Modal nạp credit ───
// Hiển thị các gói nạp credit, cho phép user chọn gói và tiến hành thanh toán qua PayOS.
// TODO: Tích hợp PayOS API thay vì alert placeholder.

import { useState, useCallback, useEffect } from "react";

interface CreditTopUpModalProps {
  /** Mở/tắt modal */
  open: boolean;
  /** Callback đóng modal */
  onClose: () => void;
  /** Số dư hiện tại (nếu có) */
  balance?: number;
}

/** Các gói nạp credit */
const PACKAGES = [
  { amountVnd: 50000, creditTotal: 50, bonus: 0, popular: false },
  { amountVnd: 100000, creditTotal: 110, bonus: 10, popular: false },
  { amountVnd: 200000, creditTotal: 230, bonus: 30, popular: true },
  { amountVnd: 500000, creditTotal: 600, bonus: 100, popular: false },
];

/** Format số tiền VND sang chuỗi hiển thị (e.g. 50.000đ) */
function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

export default function CreditTopUpModal({
  open,
  onClose,
  balance,
}: CreditTopUpModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  // Reset selection khi modal mở lại
  useEffect(() => {
    if (open) {
      setSelectedAmount(null);
    }
  }, [open]);

  // Đóng modal khi click backdrop
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Gói được chọn
  const selectedPackage = PACKAGES.find((p) => p.amountVnd === selectedAmount);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Card modal */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-white tracking-wide">
            ✨ Nạp Credit
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Đóng"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Số dư hiện tại */}
        {balance !== undefined && (
          <p className="text-sm text-gray-400 mb-4">
            Số dư hiện tại: ⭐ {balance}
          </p>
        )}

        {/* Grid gói nạp */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedAmount === pkg.amountVnd;
            return (
              <button
                key={pkg.amountVnd}
                onClick={() => setSelectedAmount(pkg.amountVnd)}
                className={`relative border rounded-xl p-3 text-center transition cursor-pointer ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-gray-700 hover:border-amber-500 bg-transparent"
                }`}
              >
                {/* Badge Phổ biến */}
                {pkg.popular && (
                  <span className="absolute -top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                    Phổ biến
                  </span>
                )}
                <p className="text-base font-bold text-white">
                  {formatVnd(pkg.amountVnd)}
                </p>
                <p className="text-sm text-gray-400">
                  ⭐ {pkg.creditTotal} credit
                </p>
                {pkg.bonus > 0 && (
                  <span className="inline-block mt-1 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    +{pkg.bonus} bonus
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live preview */}
        {selectedPackage && selectedPackage.bonus > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
            <p className="text-sm text-amber-300 font-semibold">
              Nhận được: ⭐ {selectedPackage.creditTotal} credit (+
              {selectedPackage.bonus} bonus)
            </p>
          </div>
        )}

        {/* Nút CTA */}
        <button
          onClick={() => {
            if (selectedPackage) {
              alert(
                `Đang kết nối PayOS...\nGói: ${formatVnd(selectedPackage.amountVnd)}`,
              );
            }
          }}
          disabled={!selectedPackage}
          className="w-full py-3 rounded-xl text-sm font-black tracking-wide bg-coral text-white hover:bg-coral-strong transition-colors shadow-[0_4px_20px_rgba(240,96,120,0.3)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          {selectedPackage
            ? `Nạp ngay 💰 ${formatVnd(selectedPackage.amountVnd)}`
            : "Chọn gói nạp"}
        </button>
      </div>
    </div>
  );
}