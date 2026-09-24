"use client";

import { useState } from "react";
import { Field, inputClass } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";

// =====================================================
// PayOSButton — form email + nút tạo đơn PayOS (§12.2)
// - Email dùng Field + inputClass: label/hint/lỗi gắn field.
// - GIỮ email khi lỗi — người dùng sửa được, không nhập lại.
// - CTA chứa tổng tiền — không phải cuộn tìm lại giá.
// - Một accent token duy nhất (không nhận màu riêng từng edition).
// =====================================================

interface PayOSButtonProps {
  productId: string;
  /** Tổng tiền đã format, ví dụ "69.000đ" — in trong CTA */
  price: string;
  /** Label field email, ví dụ "Email nhận mã kích hoạt" / "Email nhận link tải" */
  emailLabel?: string;
  /** Gợi ý dưới field — nên truyền product.fulfillment.receiveText */
  emailHint?: string;
}

export default function PayOSButton({
  productId,
  price,
  emailLabel = "Email nhận nội dung",
  emailHint,
}: PayOSButtonProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Vui lòng nhập email để nhận nội dung sau thanh toán");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Email không đúng định dạng — kiểm tra lại trước khi thanh toán");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email: trimmed }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Chưa tạo được yêu cầu thanh toán — thử lại"
        );
        setLoading(false);
        return;
      }

      if (data && typeof data.checkoutUrl === "string" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return; // giữ loading — đang chuyển sang PayOS
      }

      setError("Chưa tạo được yêu cầu thanh toán — thử lại");
      setLoading(false);
    } catch {
      setError("Mất kết nối — kiểm tra mạng rồi thử lại");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Field label={emailLabel} hint={emailHint} error={error} required>
        {({ id, describedBy }) => (
          <input
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="you@example.com"
            className={inputClass}
          />
        )}
      </Field>

      <Button onClick={handlePay} loading={loading} size="lg" fullWidth>
        Thanh toán {price} qua QR ngân hàng
      </Button>
      <p className="text-meta text-muted">
        Quét mã QR bằng ứng dụng ngân hàng — hệ thống tự xác nhận sau khi thanh
        toán.
      </p>
    </div>
  );
}
