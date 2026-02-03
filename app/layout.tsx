import type { Metadata } from "next";
import { Sora, Space_Mono } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HackerTrip · Hackathon Timeline 2026",
  description:
    "跟踪全球黑客松旅程，查看每站城市、时间与报名信息，规划你的 2026 参赛日程。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${spaceMono.variable} antialiased bg-[#05060a] text-white`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
