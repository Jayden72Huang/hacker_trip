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
  title: {
    default: 'HackerTrip — 中国黑客松聚合平台 | 发现、匹配、参赛',
    template: '%s | HackerTrip',
  },
  description:
    '中国领先的黑客松信息聚合平台。聚合全球 AI、Web3、开源黑客松赛事，提供 AI 智能匹配、组队和一站式参赛服务。发现适合你的黑客松比赛。',
  keywords: [
    'HackerTrip', 'hackertrip',
    '黑客松', '黑客松平台', '中国黑客松平台', '黑客松集合', '黑客松聚合',
    'hackathon', 'hackathon platform', 'hackathon China',
    '编程竞赛', '开发者社区', '开发者活动',
    'AI黑客松', 'Web3黑客松', '开源黑客松',
    '黑客松报名', '黑客松比赛', '黑客松时间线',
    '组队', '参赛', 'hackathon finder',
  ],
  authors: [{ name: 'HackerTrip' }],
  creator: 'HackerTrip',
  publisher: 'HackerTrip',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'HackerTrip — 中国黑客松聚合平台',
    description: '聚合全球黑客松赛事，AI 智能匹配你的项目和技术栈，一站式发现、报名、组队、参赛。',
    url: siteUrl,
    siteName: 'HackerTrip',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HackerTrip — 中国黑客松聚合平台',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HackerTrip — 中国黑客松聚合平台',
    description: '聚合全球黑客松赛事，AI 智能匹配，一站式参赛服务。',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': `${siteUrl}/#organization`,
                  name: 'HackerTrip',
                  url: siteUrl,
                  logo: {
                    '@type': 'ImageObject',
                    url: `${siteUrl}/logo.png`,
                  },
                  description: '中国领先的黑客松信息聚合平台，帮助开发者发现、报名和参加全球黑客松比赛。',
                  sameAs: ['https://github.com/jaydenhtt/hacker_trip'],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${siteUrl}/#website`,
                  url: siteUrl,
                  name: 'HackerTrip',
                  description: '中国黑客松聚合平台 — 发现、匹配、参赛',
                  publisher: { '@id': `${siteUrl}/#organization` },
                  inLanguage: 'zh-CN',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${siteUrl}/explore?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'WebPage',
                  '@id': `${siteUrl}/#webpage`,
                  url: siteUrl,
                  name: 'HackerTrip — 中国黑客松聚合平台',
                  isPartOf: { '@id': `${siteUrl}/#website` },
                  about: { '@id': `${siteUrl}/#organization` },
                  description: '聚合全球 AI、Web3、开源黑客松赛事，AI 智能匹配项目和技术栈，一站式发现、报名、组队、参赛。',
                  inLanguage: 'zh-CN',
                },
              ],
            }),
          }}
        />
        <link rel="alternate" type="text/plain" href={`${siteUrl}/llms.txt`} title="LLMs.txt" />
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
