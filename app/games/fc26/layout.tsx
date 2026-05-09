import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "EA FC 26 - Key Bản Quyền Offline & Mod",
    template: "%s | EA FC 26 | DungDiBinhLuan",
  },
  description:
    "Nhận key bản quyền offline EA FC 26, bao gồm các luồng chọn phiên bản, thanh toán và kích hoạt tải mod.",
};

export default function FC26Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
