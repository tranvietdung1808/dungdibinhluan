// app/layout.tsx
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";
import "./globals.css";
import Navbar, { MainContent } from "./components/Navbar";
import Footer from "./components/Footer";
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
    default: "DungDiBinhLuan — EA FC 27, Mod FC 26 & Career Mode",
    template: "%s | DungDiBinhLuan",
  },

  description:
    "Mua EA FC 27, tải mod FC 26, facepack, kits và khám phá hướng dẫn Career Mode tại DungDiBinhLuan.",

  metadataBase: new URL("https://dungdibinhluan.com"),

  icons: {
    icon: "/favicon.ico?v=20260325",
    shortcut: "/favicon.ico?v=20260325",
    apple: "/favicon.ico?v=20260325",
  },

  keywords: [
    "EA FC 27",
    "mua FC 27",
    "tải FC 27",
    "EA Sports FC 27 Việt Nam",
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
    "mod update EA FC",
  ],

  authors: [{ name: "DungDiBinhLuan" }],
  creator: "DungDiBinhLuan",

  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://dungdibinhluan.com",
    siteName: "DungDiBinhLuan",
    title: "DungDiBinhLuan — EA FC 27 & Mod bóng đá",
    description:
      "Mua EA FC 27 và khám phá mod FC 26, facepack, kits cùng hướng dẫn Career Mode.",
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
    title: "DungDiBinhLuan — EA FC 27 & Mod bóng đá",
    description: "Mua FC 27 và khám phá mod game bóng đá chất lượng cao.",
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
        {/* Skip link — hiện khi focus bằng bàn phím */}
        <a
          href="#main-content"
          className="fixed left-4 top-3 z-[var(--layer-toast)] -translate-y-[300%] rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-bold text-[var(--color-on-accent)] shadow-lg transition-transform duration-150 focus:translate-y-0"
        >
          Bỏ qua tới nội dung
        </a>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <Navbar />
        <MainContent>{children}</MainContent>
        <Footer />
        <MessengerButton />
        <Analytics />
      </body>
    </html>
  );
}
