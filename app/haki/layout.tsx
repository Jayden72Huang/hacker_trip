import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Haki · HackerTrip',
  description: '你的黑客松 AI 数字队友 — 赛题分析、创意脑暴、项目规划、资源发现、路演准备',
};

export default function HakiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
