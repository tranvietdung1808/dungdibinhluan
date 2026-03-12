import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mod Hub",
  description: "Kho mod FC 26 chất lượng cao — Faces, Kits, Gameplay, Đồ họa 4K được tuyển chọn bởi DungDiBinhLuan.",
  openGraph: {
    title: "Mod Hub | DungDiBinhLuan",
    description: "Kho mod FC 26 chất lượng cao — Faces, Kits, Gameplay, Đồ họa 4K.",
    images: [{ url: "/og-image.jpg" }],
  },
};

export { default } from "./ModsClient";
