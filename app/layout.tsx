// app/layout.tsx
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";
import StructuredData from "./components/StructuredData";
import TopProgressBar from "./components/TopProgressBar";
import MessengerButton from "./components/MessengerButton";

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
    icon: "/favicon.ico?v=20260325",
    shortcut: "/favicon.ico?v=20260325",
    apple: "/favicon.ico?v=20260325",
  },

  keywords: [
    "FC 26 mod",
    "FIFA mod",
    "FC 26 facepack",
    "FC 26 kits",
    "FIFA mods download",
    "game mod",
    "DungDiBinhLuan",
    "EA FC 26 mod",
    "EA Sports FC 26",
    "mod game bóng đá",
    "face mod FIFA",
    "kit mod EA FC",
    "download mod FC 26",
    "mod FIFA miễn phí",
    "EA Sports FC 26 Việt Nam",
    "mod bóng đá PC",
    "FIFA 26 mod download",
    "EA FC 26 graphics mod",
    "gameplay mod FC 26",
    "download FC 26 faces",
    "mod FC 26 PC",
    "tải mod FC 26",
    "career mode FC 26",
    "cài đặt mod FIFA",
    "mod update EA FC"
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
      <head>
        <StructuredData />
      </head>
      <body className={`${beVietnamPro.variable} antialiased font-sans`}>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <Navbar />
        <div className="pt-14 md:pt-16">
          {children}
        </div>
        <MessengerButton />
        <Analytics />
      </body>
    </html>
  );
}
