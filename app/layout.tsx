import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { HakiAssistantWidget } from "@/components/HakiAssistantWidget";
import "./globals.css";

const sora = localFont({
  src: [
    { path: "../public/fonts/sora-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/sora-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/sora-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/sora-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/sora-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-sora",
  display: "swap",
});

const spaceMono = localFont({
  src: [
    { path: "../public/fonts/space-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/space-mono-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "HackerTrip · Hackathon Timeline 2026",
  description:
    "跟踪全球黑客松旅程，查看每站城市、时间与报名信息，规划你的 2026 参赛日程。",
  keywords: ['黑客松', 'hackathon', '编程竞赛', '开发者', 'AI黑客松', 'HackerTrip', '参赛', '开发者社区'],
  authors: [{ name: 'HackerTrip' }],
  creator: 'HackerTrip',
  publisher: 'HackerTrip',
  openGraph: {
    title: 'HackerTrip · Hackathon Timeline 2026',
    description: '跟踪全球黑客松旅程，查看每站城市、时间与报名信息，规划你的 2026 参赛日程。',
    url: 'https://hackertrip.space',
    siteName: 'HackerTrip',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HackerTrip - 黑客松时间线',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HackerTrip · Hackathon Timeline 2026',
    description: '跟踪全球黑客松旅程，查看每站城市、时间与报名信息，规划你的 2026 参赛日程。',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    // 可以后续添加 Google Search Console 验证码
    // google: 'your-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7JLBTD2NCG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7JLBTD2NCG');
          `}
        </Script>
      </head>
      <body className={`${sora.variable} ${spaceMono.variable} antialiased bg-[#05060a] text-white`}>
        <SessionProvider>
          {children}
          <HakiAssistantWidget />
        </SessionProvider>
      </body>
    </html>
  );
}
