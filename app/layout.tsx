// app/layout.tsx
import { Be_Vietnam_Pro } from "next/font/google"; // Đổi từ Geist sang Be_Vietnam_Pro
import "./globals.css";

// Cấu hình font hỗ trợ tiếng Việt
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese"], // BẮT BUỘC phải có vietnamese ở đây
  weight: ["400", "500", "700", "900"],
});

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