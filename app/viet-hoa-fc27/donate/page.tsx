import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/payment/config";
import { Checkout } from "../../games/components/Checkout";

export const metadata: Metadata = {
  title: "Donate Việt hóa EA FC 27 — hỗ trợ cài đặt qua UltraViewer",
  description:
    "Donate 99.000đ để được admin DungDiBinhLuan cài bản Việt hóa EA FC 27 trực tiếp qua UltraViewer.",
  robots: { index: false },
};

const product = PRODUCTS["fc27-viet-hoa"];

export default function VietHoaDonatePage() {
  return (
    <Checkout
      product={product}
      image="/viet-hoa-fc27/kickoff.webp"
      imageAlt="EA FC 27 Việt hóa"
      editionLabel="Hỗ trợ cài đặt qua UltraViewer"
      bankNote="VIETHOA FC27"
      backHref="/viet-hoa-fc27"
      backLabel="Quay lại trang Việt hóa FC 27"
    />
  );
}
