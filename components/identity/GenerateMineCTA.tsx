'use client';

/**
 * ============================================================================
 *  HackerTrip — 落地页回流 CTA (裂变 Pull 端闭环)
 * ============================================================================
 *
 *  "先内容后引导"：被分享者看完对方完整身份卡后，底部固定/内联 CTA
 *  「我也要一张 →」跳回 /identity/new?ref=<fromUsername>，形成裂变闭环。
 *  附社会证明计数（已有 N 人生成身份卡）。
 *
 *  深色玻璃风 + 角色渐变。
 * ============================================================================
 */

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ROLE_MAP, type HackathonRoleKey } from '@/lib/identity/types';

interface GenerateMineCTAProps {
  /** 当前主页用户名（作为回流 ref） */
  fromUsername: string;
  /** 当前页主角色名（"他是 XX 角色"钩子） */
  roleKey: HackathonRoleKey;
  roleName: string;
  /** 社会证明：全站已生成身份卡数 */
  totalGenerated: number;
}

export default function GenerateMineCTA({
  fromUsername,
  roleKey,
  roleName,
  totalGenerated,
}: GenerateMineCTAProps) {
  const meta = ROLE_MAP[roleKey];
  const href = `/identity?ref=${encodeURIComponent(fromUsername)}`;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-center"
      style={{
        background: `linear-gradient(135deg, ${meta.colorFrom}1a, ${meta.colorTo}14)`,
        border: `1px solid ${meta.colorFrom}33`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-[70%] rounded-full"
        style={{ background: `radial-gradient(circle, ${meta.colorFrom}33, transparent 70%)` }}
      />
      <div className="relative">
        <div
          className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-mono uppercase tracking-wider"
          style={{
            color: meta.colorTo,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${meta.colorTo}33`,
          }}
        >
          <span className="text-base leading-none">{meta.emoji}</span>
          TA 是「{roleName}」
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold text-[#ededed] mb-3">
          你是什么角色？
        </h3>
        <p className="text-base text-[#ededed]/50 mb-7 max-w-md mx-auto leading-relaxed">
          把你的项目、装备和参赛履历，浓缩成一张会自我传播的黑客松身份卡。
          30 秒生成，免登录预览。
        </p>

        <Link
          href={href}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-[1.03] active:scale-[0.98]"
          style={{
            color: '#05060a',
            background: `linear-gradient(135deg, ${meta.colorFrom}, ${meta.colorTo})`,
            boxShadow: `0 8px 30px ${meta.colorFrom}40`,
          }}
        >
          <Sparkles size={18} />
          我也要一张
          <ArrowRight size={18} />
        </Link>

        <p className="mt-5 text-sm text-[#ededed]/35">
          已有{' '}
          <span className="font-bold tabular-nums" style={{ color: meta.colorTo }}>
            {totalGenerated.toLocaleString()}
          </span>{' '}
          位选手生成了身份卡
        </p>
      </div>
    </div>
  );
}
