import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/payment/config";
import { Checkout } from "../../games/components/Checkout";

export const metadata: Metadata = {
  title: "Thanh toán combo EA FC 27 + Việt hóa",
  description:
    "Combo siêu sale EA FC 27 + Việt hóa — nhận mã tải game qua email, admin cài Việt hóa qua UltraViewer.",
  robots: { index: false },
};

const product = PRODUCTS["fc27-combo"];

export default function ComboCheckoutPage() {
  return (
    <Checkout
      product={product}
      image="/games/fc27/fc27-city.webp"
      imageAlt="Combo EA FC 27 + Việt hóa"
      editionLabel="Siêu sale · Game + Việt hóa"
      bankNote="COMBO FC27"
      backHref="/sieu-sale"
      backLabel="Quay lại Siêu sale"
      codeEntryHref="/games/fc27"
    />
  );
}
