/**
 * ============================================================================
 *  /u/[username] — 个人主页 (SSR + OG meta)
 * ============================================================================
 *
 *  聚合：ProfileHero(角色/统计/profileViews/组队) + IdentityCardPreview +
 *        ConfigCard + CareerTimeline + ShareDock + GenerateMineCTA。
 *
 *  数据：getIdentityByUsername(DB) → 失败/查无 → getMockIdentity(mock 兜底)。
 *  任意 username 都能渲染（本地 dev 无 DB 也走得通）。
 *
 *  generateMetadata 输出 OpenGraph + twitter card，og:image 指向
 *  /api/identity/og?username=...，保证社媒分享预览正确。
 *
 *  禁止 catch-all：本路由仅命中 /u/*，与已有顶层路由互不干扰。
 * ============================================================================
 */

import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import ProfileHero from '@/components/identity/ProfileHero';
import IdentityCardPreview from '@/components/identity/IdentityCardPreview';
import ConfigCard from '@/components/identity/ConfigCard';
import CareerTimeline from '@/components/identity/CareerTimeline';
import ShareDock from '@/components/identity/ShareDock';
import GenerateMineCTA from '@/components/identity/GenerateMineCTA';
import { getIdentityByUsername } from '@/lib/identity/queries';
import { decodeIdentity } from '@/lib/identity/share-encode';
import { getMockIdentity, MOCK_TOTAL_CARDS_GENERATED } from '@/lib/identity/mock';
import { buildOgImageUrl } from '@/lib/identity/captions';
import { ROLE_MAP, type IdentityCardData } from '@/lib/identity/types';

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ ref?: string; c?: string }>;
}

/** 分享内嵌卡(?c=) > DB > mock。任意 username 可渲染。 */
async function loadIdentity(username: string, encoded?: string): Promise<IdentityCardData> {
  // 分享链接内嵌的自建卡数据优先（裂变闭环：别人打开看到的是“你的卡”）。
  const fromShare = decodeIdentity(encoded);
  if (fromShare) return fromShare;
  const fromDb = await getIdentityByUsername(username);
  return fromDb ?? getMockIdentity(username);
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const { c } = await searchParams;
  const data = await loadIdentity(username, c);
  const role = ROLE_MAP[data.role.primary];

  const title = `${data.displayName} 是「${role.name}」${role.emoji} · 黑客松身份卡`;
  const description =
    data.bio ||
    `${data.stats.hackathons} 场黑客松 · ${data.stats.awards} 次获奖 · ${role.tagline} 看看你是什么角色？`;
  const ogImage = buildOgImageUrl(data.username, data.role.primary, SITE_URL, c);
  const pageUrl = `${SITE_URL}/u/${encodeURIComponent(data.username)}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HackerTrip',
      type: 'profile',
      locale: 'zh_CN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { ref, c } = await searchParams;
  const data = await loadIdentity(username, c);
  const isShared = ref === 'share';
  const role = ROLE_MAP[data.role.primary];

  return (
    <div className="min-h-screen" style={{ background: '#05060a' }}>
      <Navbar />

      <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-28 lg:px-10">
        {/* 头部 */}
        <ProfileHero data={data} isShared={isShared} />

        {/* 身份卡 + 右侧履历 */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <section>
              <SectionLabel>角色身份卡</SectionLabel>
              <IdentityCardPreview data={data} />
            </section>

            <section>
              <SectionLabel>开发者配置卡</SectionLabel>
              <ConfigCard config={data.config} roleKey={data.role.primary} />
            </section>
          </div>

          <div className="flex flex-col gap-8">
            <section>
              <SectionLabel>参赛履历</SectionLabel>
              {data.career.length > 0 ? (
                <CareerTimeline items={data.career} stats={data.stats} />
              ) : (
                <div
                  className="rounded-2xl px-5 py-8 text-center text-sm text-[#ededed]/40"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}
                >
                  还没有参赛履历，去 /identity 录入第一场比赛吧
                </div>
              )}
            </section>

            {/* 分享内容包 */}
            <section>
              <SectionLabel>分享</SectionLabel>
              <ShareDock data={data} />
            </section>
          </div>
        </div>

        {/* 先内容后引导：底部回流 CTA */}
        <div id="generate-mine" className="mt-12 scroll-mt-24">
          <GenerateMineCTA
            fromUsername={data.username}
            roleKey={data.role.primary}
            roleName={role.name}
            totalGenerated={MOCK_TOTAL_CARDS_GENERATED}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="mb-3 text-xs font-mono uppercase tracking-[0.25em] text-white/35">{children}</h2>
  );
}
