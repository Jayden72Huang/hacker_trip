'use client';

/**
 * ============================================================================
 *  HackerTrip — 开发者配置卡展示组件 (HTML/CSS)
 * ============================================================================
 *
 *  展示一个人的"装备/配置"：技术栈 / 工具链 / AI 工具 / 打法 / 组队状态 + 擅长方向。
 *  深色玻璃风（.glass + 角色渐变顶栏），与 og config 卡视觉同源。
 *
 *  组队状态徽章：lookingFor 为 active（teammate/cofounder）时高亮 + .glow 脉冲。
 *
 *  props: { config: DevConfig; roleKey?: HackathonRoleKey; displayName?: string }
 *  也支持直接传 IdentityCardData（取其 config + role.primary）。
 * ============================================================================
 */

import {
  ROLE_MAP,
  PLAY_STYLE_META,
  LOOKING_FOR_META,
  type DevConfig,
  type HackathonRoleKey,
} from '@/lib/identity/types';

interface ConfigCardProps {
  config: DevConfig;
  /** 用于顶栏渐变与 emoji；不传则用中性 accent */
  roleKey?: HackathonRoleKey;
  /** 截图导出 id（html-to-image 兜底） */
  exportId?: string;
  className?: string;
}

const ACCENT_FROM = '#7c5dff';
const ACCENT_TO = '#4de1ff';

export default function ConfigCard({ config, roleKey, exportId, className }: ConfigCardProps) {
  const meta = roleKey ? ROLE_MAP[roleKey] : null;
  const colorFrom = meta?.colorFrom ?? ACCENT_FROM;
  const colorTo = meta?.colorTo ?? ACCENT_TO;
  const emoji = meta?.emoji ?? '🛠️';

  const play = PLAY_STYLE_META[config.playStyle];
  const lf = LOOKING_FOR_META[config.lookingFor];

  return (
    <div
      id={exportId}
      className={`glass relative overflow-hidden rounded-3xl ${className ?? ''}`}
      style={{ background: '#05060a' }}
    >
      {/* 顶部渐变条 */}
      <div
        className="absolute inset-x-0 top-0 h-[6px]"
        style={{ background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}
      />
      {/* 角色光晕 */}
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full"
        style={{ background: `radial-gradient(circle, ${colorFrom}40, transparent 70%)` }}
      />

      <div className="relative flex flex-col gap-5 p-6 sm:p-8">
        {/* 头部 */}
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{
              background: `linear-gradient(135deg, ${colorFrom}33, ${colorTo}33)`,
              border: `1px solid ${colorFrom}55`,
            }}
          >
            {emoji}
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#ededed]">开发者配置卡</span>
            <span className="text-sm text-[#ededed]/50">装备 · 工具链 · 打法</span>
          </div>
        </div>

        {/* chip 组 */}
        <ChipGroup title="技术栈" items={config.techStack} accent={colorFrom} />
        <ChipGroup title="AI 工具" items={config.aiTools} accent={colorTo} />
        <ChipGroup title="工具链" items={config.tools} accent={colorFrom} />
        {config.strengths.length > 0 && (
          <ChipGroup title="擅长方向" items={config.strengths} accent={colorTo} solid />
        )}

        {/* 开发环境 */}
        {config.env && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-[#ededed]/45">开发环境</span>
            <span className="font-mono text-sm text-[#ededed]/80">{config.env}</span>
          </div>
        )}

        {/* 底部徽章：打法 + 组队状态 */}
        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
          <span
            className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium text-[#ededed]"
            style={{ borderColor: `${colorFrom}55`, background: 'rgba(255,255,255,0.05)' }}
          >
            <span>{play.emoji}</span>
            {play.label}
          </span>

          <span
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
              lf.active ? 'glow' : ''
            }`}
            style={
              lf.active
                ? {
                    color: '#05060a',
                    background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
                  }
                : {
                    color: 'rgba(237,237,237,0.7)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }
            }
          >
            <span>{lf.emoji}</span>
            {lf.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function ChipGroup({
  title,
  items,
  accent,
  solid,
}: {
  title: string;
  items: string[];
  accent: string;
  solid?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-[#ededed]/45">{title}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <span
            key={t}
            className="rounded-xl px-3 py-1.5 text-sm text-[#ededed]"
            style={{
              background: solid ? `${accent}22` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${accent}${solid ? '66' : '40'}`,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
