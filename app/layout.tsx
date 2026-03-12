// app/layout.tsx
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "DungDiBinhLuan — Tất cả về ",
    template: "%s | DungDiBinhLuan",
  },
  description: "Bộ cài đặt game đầy đủ, tối ưu hiệu năng. Mod FC 26, FIFA chất lượng cao được tuyển chọn bởi DungDiBinhLuan.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
  canonical: "https://dungdibinhluan.com",
},
  keywords: ["FC 26 mod", "FIFA mod", "game set up", "DungDiBinhLuan", "facepack", "kits mod"],
  authors: [{ name: "DungDiBinhLuan" }],
  creator: "DungDiBinhLuan",
  metadataBase: new URL("https://dungdibinhluan.com"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://dungdibinhluan.com",
    siteName: "DungDiBinhLuan",
    title: "DungDiBinhLuan — All In One Game Set Up",
    description: "Bộ cài đặt game đầy đủ, tối ưu hiệu năng. Mod FC 26 chất lượng cao.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DungDiBinhLuan — All In One Game Set Up",
    description: "Bộ cài đặt game đầy đủ, tối ưu hiệu năng.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${beVietnamPro.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
