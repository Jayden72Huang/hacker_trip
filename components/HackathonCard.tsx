'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Trophy,
  Users,
  Ticket,
} from 'lucide-react';
import type { Hackathon } from '@/data/hackathons';

type Props = {
  hackathon: Hackathon;
  showCountdown?: boolean;
};

/**
 * 计算倒计时天数
 */
function calculateCountdown(dateRange: string): number | null {
  try {
    const monthMap: { [key: string]: number } = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const match = dateRange.match(/([A-Z][a-z]+)\s+(\d{1,2})/);
    if (!match) return null;

    const [, month, day] = match;
    const monthIndex = monthMap[month];
    if (monthIndex === undefined) return null;

    const eventDate = new Date(2026, monthIndex, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : null;
  } catch {
    return null;
  }
}

/**
 * 解析日期格式
 */
function parseDateDisplay(dateRange: string): string {
  const monthMap: { [key: string]: string } = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };

  const match = dateRange.match(/([A-Z][a-z]+)\s+(\d{1,2})(?:–(\d{1,2}))?/);
  if (!match) return dateRange;

  const [, month, startDay, endDay] = match;
  const monthNum = monthMap[month] || month;

  if (endDay) {
    return `2026.${monthNum}.${startDay.padStart(2, '0')}-${endDay.padStart(2, '0')}`;
  }
  return `2026.${monthNum}.${startDay.padStart(2, '0')}`;
}

function withReferral(url: string, campaign: string) {
  if (!url) return url;
  const hasQuery = url.includes('?');
  const delimiter = hasQuery ? '&' : '?';
  return `${url}${delimiter}utm_source=hackertrip&utm_medium=referral&utm_campaign=${campaign}`;
}

function getRegistrationAction(hackathon: Hackathon) {
  const campaignId = `hackathon_${hackathon.id}_signup_card`;
  const reg = hackathon.registration;

  if (!reg) {
    return {
      label: '报名',
      href: withReferral(hackathon.website, campaignId),
      external: true,
      note: '跳转官方站点'
    };
  }

  if (reg.mode === 'platform') {
    return {
      label: '站内报名',
      href: reg.platformPath || `/hackathon/${hackathon.id}#register`,
      external: false,
      note: '使用 HackerTrip 报名流程'
    };
  }

  const label = reg.mode === 'external-form' ? '报名表' : '官网报名';
  return {
    label,
    href: withReferral(reg.url, campaignId),
    external: true,
    note: reg.siteName || '跳转主办方网站'
  };
}

export function HackathonCard({ hackathon, showCountdown = true }: Props) {
  const formattedDate = parseDateDisplay(hackathon.dateRange);
  const countdown = showCountdown && !hackathon.isPast ? calculateCountdown(hackathon.dateRange) : null;
  const registrationAction = getRegistrationAction(hackathon);

  return (
    <div className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* 左侧：Logo + 基本信息 */}
        <div className="flex items-start gap-4 flex-1">
          {/* Logo */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-white font-sora font-bold text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
            {hackathon.shortName.charAt(0)}
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              {/* 倒计时标签 - 仅 upcoming 显示 */}
              {countdown !== null && countdown > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-white/10 font-space-mono text-xs font-medium text-indigo-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {countdown} 天后
                </div>
              )}

              {/* 主题标签 */}
              <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 font-space-mono text-xs">
                {hackathon.theme}
              </span>
            </div>

            <h3 className="font-sora text-lg font-bold text-white mb-2 truncate group-hover:text-indigo-300 transition-colors">
              {hackathon.name}
            </h3>

            <div className="flex items-center gap-4 text-gray-400 font-space-mono text-xs">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={12} className="text-gray-500" />
                {formattedDate}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-gray-500" />
                {hackathon.city}
              </div>
            </div>
          </div>
        </div>

        {/* 中间：关键指标 */}
        <div className="flex items-center gap-6 lg:gap-8 px-4 lg:border-l lg:border-r border-white/5">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-yellow-500/70 mb-1">
              <Trophy size={14} />
            </div>
            <span className="font-sora text-sm font-semibold text-white block">
              {hackathon.prizePool}
            </span>
            <span className="font-space-mono text-[10px] text-gray-500 uppercase">
              奖金
            </span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-500/70 mb-1">
              <Users size={14} />
            </div>
            <span className="font-sora text-sm font-semibold text-white block">
              {hackathon.teams.split('/')[0].trim()}
            </span>
            <span className="font-space-mono text-[10px] text-gray-500 uppercase">
              团队
            </span>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-purple-500/70 mb-1">
              <Ticket size={14} />
            </div>
            <span className="font-sora text-sm font-semibold text-white block">
              {hackathon.format === 'offline' ? '线下' : hackathon.format === 'online' ? '线上' : '混合'}
            </span>
            <span className="font-space-mono text-[10px] text-gray-500 uppercase">
              形式
            </span>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-3 lg:pl-4">
          <Link
            href={`/hackathon/${hackathon.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-space-mono text-gray-300 hover:text-white"
          >
            查看详情
          </Link>
          {registrationAction.external ? (
            <a
              href={registrationAction.href}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-space-mono text-white shadow-lg shadow-indigo-500/20"
              target="_blank"
              rel="noreferrer"
              title={registrationAction.note}
            >
              {registrationAction.label}
              <ArrowUpRight size={14} />
            </a>
          ) : (
            <Link
              href={registrationAction.href}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-space-mono text-white shadow-lg shadow-indigo-500/20"
              title={registrationAction.note}
            >
              {registrationAction.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
