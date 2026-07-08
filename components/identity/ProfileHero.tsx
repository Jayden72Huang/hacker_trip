'use client';

/**
 * ============================================================================
 *  HackerTrip — 个人主页头部 ProfileHero
 * ============================================================================
 *
 *  头像 + 名字 + 角色徽章 + bio + 统计条 + profileViews(社会证明，客户端自增)
 *  + 组队状态徽章（lookingFor active 时高亮 + .glow）。
 *
 *  profileViews：挂载后 fetch /api/identity/view 自增（mock 可观测）；
 *  失败则用 SSR 传入的基线，不阻塞。
 *
 *  深色玻璃风 + 角色渐变。
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Eye, MapPin, Github, Sparkles } from 'lucide-react';
import {
  ROLE_MAP,
  LOOKING_FOR_META,
  type IdentityCardData,
} from '@/lib/identity/types';

interface ProfileHeroProps {
  data: IdentityCardData;
  /** 落地来源标记（?ref=share 时显示"你是什么角色"浮条） */
  isShared?: boolean;
}

export default function ProfileHero({ data, isShared }: ProfileHeroProps) {
  const meta = ROLE_MAP[data.role.primary];
  const lf = LOOKING_FOR_META[data.config.lookingFor];
  const [views, setViews] = useState(data.profileViews);

  useEffect(() => {
    let active = true;
    fetch(`/api/identity/view?username=${encodeURIComponent(data.username)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (active && j?.ok && typeof j.views === 'number') setViews(j.views);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [data.username]);

  const initial = (data.displayName || data.username || '?').charAt(0).toUpperCase();

  return (
    <div className="relative">
      {/* 顶部裂变浮条：被分享落地时强化"你是什么角色" */}
      {isShared && (
        <div
          className="animate-fade-up mb-5 flex flex-wrap items-center justify-center gap-2 rounded-2xl px-5 py-3 text-center text-sm"
          style={{
            background: `linear-gradient(90deg, ${meta.colorFrom}1f, ${meta.colorTo}1a)`,
            border: `1px solid ${meta.colorFrom}33`,
          }}
        >
          <span className="text-[#ededed]/80">
            <span className="font-semibold text-[#ededed]">
              {data.displayName} 是「{meta.name}」{meta.emoji}
            </span>
            <span className="mx-2 text-[#ededed]/30">·</span>
            你是什么角色？
          </span>
          <a
            href="#generate-mine"
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ color: meta.colorTo, border: `1px solid ${meta.colorTo}44` }}
          >
            <Sparkles size={12} />
            生成我的
          </a>
        </div>
      )}

      <div className="glass relative overflow-hidden rounded-3xl p-7 sm:p-9">
        {/* 角色光晕 */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${meta.colorFrom}33, transparent 70%)` }}
        />
        {/* 顶部渐变条 */}
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${meta.colorFrom}, ${meta.colorTo})` }}
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* 头像 */}
          <div className="shrink-0">
            {data.avatar ? (
              <Image
                src={data.avatar}
                alt={data.displayName}
                width={96}
                height={96}
                className="h-24 w-24 rounded-2xl object-cover"
                style={{ border: `2px solid ${meta.colorFrom}66` }}
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-2xl text-4xl font-extrabold"
                style={{
                  background: `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`,
                  color: '#05060a',
                }}
              >
                {initial}
              </div>
            )}
          </div>

          {/* 信息 */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#ededed] sm:text-3xl">
                {data.displayName}
              </h1>
              <span className="font-mono text-sm text-[#ededed]/40">@{data.username}</span>
              {data.source === 'mock' && (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-[#ededed]/45">
                  示例数据
                </span>
              )}
            </div>

            {/* 角色徽章 */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
                style={{
                  background: `linear-gradient(90deg, ${meta.colorFrom}, ${meta.colorTo})`,
                  color: '#05060a',
                }}
              >
                <span>{meta.emoji}</span>
                {meta.name}
              </span>
              {data.role.secondary.map((sk) => {
                const sm = ROLE_MAP[sk];
                return (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                    style={{
                      color: 'rgba(237,237,237,0.75)',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${sm.colorFrom}44`,
                    }}
                  >
                    <span>{sm.emoji}</span>
                    {sm.name}
                  </span>
                );
              })}
            </div>

            {data.bio && <p className="text-sm text-[#ededed]/55 leading-relaxed">{data.bio}</p>}

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#ededed]/45">
              {data.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {data.location}
                </span>
              )}
              {data.github && (
                <a
                  href={`https://github.com/${data.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#ededed]/80 transition-colors"
                >
                  <Github size={12} />
                  {data.github}
                </a>
              )}
              <span className="inline-flex items-center gap-1">
                <Eye size={12} />
                <span className="tabular-nums">{views.toLocaleString()}</span> 次浏览
              </span>
            </div>
          </div>

          {/* 组队状态 */}
          {lf.active && (
            <div className="shrink-0 self-start sm:self-center">
              <span
                className="glow inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
                style={{
                  color: '#05060a',
                  background: `linear-gradient(90deg, ${meta.colorFrom}, ${meta.colorTo})`,
                }}
              >
                <span>{lf.emoji}</span>
                {lf.label}
              </span>
            </div>
          )}
        </div>

        {/* 统计条 */}
        <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
          <HeroStat value={data.stats.projects} label="项目" />
          <HeroStat value={data.stats.hackathons} label="比赛" />
          <HeroStat value={data.stats.awards} label="获奖" gold />
        </div>
      </div>
    </div>
  );
}

function HeroStat({ value, label, gold }: { value: number; label: string; gold?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-3xl font-extrabold tabular-nums"
        style={{ color: gold ? '#ffcf5c' : '#ededed' }}
      >
        {value}
      </span>
      <span className="text-xs text-[#ededed]/50">{label}</span>
    </div>
  );
}
