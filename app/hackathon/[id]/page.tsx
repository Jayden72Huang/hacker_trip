import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  FileText,
  Globe2,
  MapPin,
  Ticket,
  Trophy,
  Users,
} from 'lucide-react';
import { db } from '@/lib/db';
import { hackathons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { toHomepageHackathon, type HomepageHackathon } from '@/lib/types/hackathon';
import { RegistrationForm } from './RegistrationForm';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function withReferral(url: string, campaign: string) {
  if (!url) return url;
  const hasQuery = url.includes('?');
  const delimiter = hasQuery ? '&' : '?';
  return `${url}${delimiter}utm_source=hackertrip&utm_medium=referral&utm_campaign=${campaign}`;
}

function getRegistrationAction(hackathon: HomepageHackathon) {
  const campaignId = `hackathon_${hackathon.id}_detail`;
  const reg = hackathon.registration;

  if (!reg) {
    return {
      label: '官网报名',
      href: withReferral(hackathon.website, campaignId),
      external: true,
      note: '将跳转至主办方官网',
      mode: 'official-site' as const,
    };
  }

  if (reg.mode === 'platform') {
    return {
      label: '站内报名',
      href: reg.platformPath || `/hackathon/${hackathon.id}#register`,
      external: false,
      note: reg.note || 'HackerTrip 提供的报名和后续流程',
      mode: reg.mode,
    };
  }

  const label = reg.mode === 'external-form' ? '填写报名表' : '官网报名';
  return {
    label,
    href: withReferral(reg.url, campaignId),
    external: true,
    note: reg.siteName || '跳转至主办方站点',
    mode: reg.mode,
  };
}

const badgeStyles: Record<string, string> = {
  'official-site': 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30',
  'external-form': 'bg-amber-500/15 text-amber-100 border-amber-500/30',
  platform: 'bg-green-500/15 text-green-100 border-green-500/30',
};

export default async function HackathonDetailPage({ params }: Params) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.id, id))
    .limit(1);

  if (!row) {
    notFound();
  }

  const hackathon = toHomepageHackathon(row);
  const registrationAction = getRegistrationAction(hackathon);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white pb-16">
      <div className="max-w-5xl mx-auto px-6 pt-10 space-y-10">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            返回首页
          </Link>
          <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${badgeStyles[registrationAction.mode]}`}>
            {registrationAction.mode === 'platform'
              ? 'HackerTrip 站内报名'
              : registrationAction.mode === 'external-form'
                ? '主办方报名表'
                : '官方站点报名'}
          </div>
        </div>

        {/* Hero */}
        <header className="glass border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3">
              <p className="text-sm text-gray-400 uppercase tracking-[0.2em]">Hackathon • 2026</p>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {hackathon.name}
              </h1>
              <div className="flex items-center gap-4 text-gray-300 font-mono text-sm flex-wrap">
                <span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-indigo-400" />{hackathon.dateRange}</span>
                <span className="inline-flex items-center gap-2"><MapPin size={16} className="text-indigo-400" />{hackathon.city} · {hackathon.venue}</span>
                {hackathon.hostOrganizer && (
                  <span className="inline-flex items-center gap-2"><Building2 size={16} className="text-indigo-400" />{hackathon.hostOrganizer}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {registrationAction.external ? (
                <a
                  href={registrationAction.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
                >
                  {registrationAction.label}
                  <ArrowUpRight size={16} />
                </a>
              ) : (
                <Link
                  href={registrationAction.href}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-colors"
                >
                  {registrationAction.label}
                </Link>
              )}
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
              >
                更多赛事
              </Link>
            </div>
          </div>

          <p className="text-gray-400 leading-relaxed">{hackathon.summary}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<Trophy size={16} />} label="奖金池" value={hackathon.prizePool} />
            <StatCard icon={<Users size={16} />} label="团队规模" value={hackathon.teams} />
            <StatCard icon={<Globe2 size={16} />} label="赛题主题" value={hackathon.theme} />
            <StatCard icon={<Ticket size={16} />} label="参赛形式" value={hackathon.format === 'offline' ? '线下' : hackathon.format === 'online' ? '线上' : '线上+线下'} />
          </div>

          {registrationAction.note && (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              {registrationAction.note}
            </div>
          )}
        </header>

        {/* Tracks */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <h2 className="text-xl font-semibold">赛道 / Tracks</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hackathon.tracks.map((track, idx) => (
              <div key={idx} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                  <BadgeCheck size={16} className="text-indigo-300" />
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{track.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Agenda */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <h2 className="text-xl font-semibold">日程 / Agenda</h2>
          </div>
          <div className="space-y-3">
            {hackathon.agenda.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-100 font-mono text-xs">{item.time}</div>
                <div>
                  <p className="text-white font-semibold">{item.title}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-semibold">资源 & 跳转</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ResourceLink
              icon={<Globe2 size={16} />}
              title="主办方网站"
              href={withReferral(hackathon.website, `hackathon_${hackathon.id}_detail`)}
              description="使用 UTM 标记来自 HackerTrip 的流量"
            />
            <ResourceLink
              icon={<FileText size={16} />}
              title="赛事手册 / Brief"
              href={hackathon.brief}
              description="查看规则、评分标准与场地信息"
            />
          </div>
        </section>

        {/* Platform registration */}
        {registrationAction.mode === 'platform' && (
          <section id="register" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h2 className="text-xl font-semibold">站内报名</h2>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
              <p className="text-gray-300 text-sm">
                主办方暂未提供官网，我们将收集你的报名信息并在确认席位后邮件通知。
              </p>
              <RegistrationForm hackathonName={hackathon.shortName} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">{icon}{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function ResourceLink({ icon, title, href, description }: { icon: ReactNode; title: string; href: string; description: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/15 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-white font-semibold flex items-center gap-1">
          {title}
          <ArrowUpRight size={14} />
        </p>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </a>
  );
}
