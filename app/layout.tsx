// app/layout.tsx
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Navbar from "./components/Navbar";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "DungDiBinhLuan — Mod Game FC 26, FIFA, Facepack",
    template: "%s | DungDiBinhLuan",
  },

  description:
    "Tải mod FC 26, FIFA, facepack, kits và bộ cài đặt game tối ưu hiệu năng. Mod chất lượng cao được tuyển chọn bởi DungDiBinhLuan.",

  metadataBase: new URL("https://dungdibinhluan.com"),

  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },

  alternates: {
    canonical: "https://dungdibinhluan.com",
  },

  keywords: [
    "FC 26 mod",
    "FIFA mod",
    "FC 26 facepack",
    "FC 26 kits",
    "FIFA mods download",
    "game mod",
    "DungDiBinhLuan",
  ],

  authors: [{ name: "DungDiBinhLuan" }],
  creator: "DungDiBinhLuan",

  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://dungdibinhluan.com",
    siteName: "DungDiBinhLuan",
    title: "DungDiBinhLuan — Mod FC 26, FIFA chất lượng cao",
    description:
      "Website chia sẻ mod FC 26, FIFA, facepack, kits và bộ cài đặt game tối ưu hiệu năng.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DungDiBinhLuan Game Mods",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "DungDiBinhLuan — Mod FC 26, FIFA",
    description: "Website chia sẻ mod game chất lượng cao.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
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
        <Navbar />
        <div className="pt-14 md:pt-16">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}