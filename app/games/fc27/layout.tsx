import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/payment/config";
import { formatVnd } from "../components/format";

export const metadata: Metadata = {
  title: {
    default: "EA FC 27",
    template: "%s | EA FC 27 | DungDiBinhLuan",
  },
  description: `Siêu sale EA FC 27 Standard Edition chỉ ${formatVnd(PRODUCTS["fc27-standard"].price)}, combo game + Việt hóa ${formatVnd(PRODUCTS["fc27-combo"].price)}. Thanh toán QR ngân hàng và nhận mã truy cập khu tải qua email.`,
};

export default function FC27Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
