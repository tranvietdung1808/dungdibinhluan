import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/payment/config";
import { Checkout } from "../../../games/components/Checkout";

// =====================================================
// /mods/mix-mods-fc26/payment — checkout Mix Mods (§12.2, T13)
// Sản phẩm noCode + fulfillment.kind = 'link': nhận LINK TẢI
// qua email, KHÔNG có mã kích hoạt — toàn bộ copy lấy từ
// product config, không hứa code game (A03).
// =====================================================

export const metadata: Metadata = {
  title: "Thanh toán Mix Mods FC 26",
  description: "Thanh toán Mix Mods FC 26 2025–2026 — nhận link tải qua email sau khi xác nhận.",
};

const product = PRODUCTS["mix-mods"];

export default function PaymentPage() {
  return (
    <Checkout
      product={product}
      image="/mods/mixmods.jpg"
      editionLabel="Bản mod tổng hợp — cần đã có game FC 26"
      bankNote="quaque"
      backHref="/mods/mix-mods-fc26"
      backLabel="Quay lại trang Mix Mods"
    />
  );
}
