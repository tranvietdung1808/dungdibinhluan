import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "EA FC 26",
    template: "%s | EA FC 26 | DungDiBinhLuan",
  },
  description:
    "Trang truy cập và tải EA FC 26, bao gồm các luồng chọn phiên bản, thanh toán và kích hoạt tải xuống.",
};

export default function FC26Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
