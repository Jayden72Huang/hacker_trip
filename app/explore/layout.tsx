import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';

export const metadata: Metadata = {
  title: '探索黑客松 — 全球赛事集合',
  description:
    '浏览全球黑客松赛事集合：AI黑客松、Web3黑客松、开源黑客松等。支持按赛道、城市、时间筛选，一键报名。HackerTrip 为你聚合最全的中国及全球黑客松比赛信息。',
  alternates: {
    canonical: `${siteUrl}/explore`,
  },
  openGraph: {
    title: '探索黑客松 — 全球赛事集合 | HackerTrip',
    description:
      '浏览全球黑客松赛事集合：AI、Web3、开源等多赛道。支持筛选和搜索，一键报名。',
    url: `${siteUrl}/explore`,
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
