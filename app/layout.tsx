import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Banana Land",
  description: "ระบบหลังบ้านตู้คีบ/ตู้เติมเงิน",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
