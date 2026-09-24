import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "EA FC 27",
    template: "%s | EA FC 27 | DungDiBinhLuan",
  },
  description:
    "Mua EA FC 27 Launch Edition giá 180.000đ, thanh toán QR ngân hàng và nhận mã truy cập khu tải qua email.",
};

export default function FC27Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
