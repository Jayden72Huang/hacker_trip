'use client';

/**
 * ============================================================================
 *  HackerTrip — 身份卡客户端预览组件 (HTML/CSS)
 * ============================================================================
 *
 *  与 /api/identity/og 视觉同源，但纯 React + Tailwind + 内联渐变实现，
 *  **不依赖 og 路由** —— 页面靠它实时预览；即使 CF 上 og 不可用，
 *  下载 PNG 也可用 html-to-image 对本组件 DOM 截图兜底。
 *
 *  深色玻璃风：复用 globals.css 的 .glass / accent 变量与角色渐变。
 *  比例与 og 一致 (1200x630 ≈ 40/21)，容器自适应宽度。
 *
 *  props: { data: IdentityCardData; variant?: CardVariant }
 * ============================================================================
 */

import {
  ROLE_MAP,
  type IdentityCardData,
  type CardVariant,
  type HackathonRoleKey,
} from '@/lib/identity/types';

interface IdentityCardPreviewProps {
  data: IdentityCardData;
  /** identity（默认）= 角色身份卡；config = 配置卡（委托给 ConfigCardPreview 风格） */
  variant?: CardVariant;
  /** 可覆盖渲染的主角色（录入页手动切主角色时用，不传则用 data.role.primary） */
  roleKey?: HackathonRoleKey;
  /** 截图导出时附加 id，供 html-to-image 选择 DOM */
  exportId?: string;
  className?: string;
}

const GOLD = '#ffcf5c';

function isWin(placement?: string | null): boolean {
  if (!placement) return false;
  return /1st|2nd|3rd|first|second|third|winner|champion|finalist|grand|冠|亚|季|获奖|入围/i.test(
    placement,
  );
}

export default function IdentityCardPreview({
  data,
  variant = 'identity',
  roleKey,
  exportId,
  className,
}: IdentityCardPreviewProps) {
  const activeKey = roleKey ?? data.role.primary;
  const meta = ROLE_MAP[activeKey];
  const { colorFrom, colorTo, emoji, name, tagline } = meta;

  const top3 = data.career.slice(0, 3);
  const topTech = data.config.techStack.slice(0, 6);

  return (
    <div
      id={exportId}
      className={`glass relative flex w-full flex-col overflow-hidden rounded-3xl ${className ?? ''}`}
      style={{ minHeight: 'min(58vw, 360px)', background: '#05060a' }}
    >
      {/* 角色渐变光晕 */}
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-[55%] w-[45%] rounded-full"
        style={{ background: `radial-gradient(circle, ${colorFrom}55, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-[55%] w-[45%] rounded-full"
        style={{ background: `radial-gradient(circle, ${colorTo}40, transparent 70%)` }}
      />
      {/* 顶部渐变条 */}
      <div
        className="absolute inset-x-0 top-0 h-[6px]"
        style={{ background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})` }}
      />

      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        {/* 头部品牌行 */}
        <div className="flex items-center justify-between text-[clamp(11px,1.7vw,22px)]">
          <div className="flex items-center text-[#ededed]/60">
            <span className="font-bold text-[#ededed]">Hacker</span>
            <span className="font-bold" style={{ color: colorTo }}>
              Trip
            </span>
            <span className="ml-3 hidden sm:inline">· 黑客松身份卡</span>
          </div>
          <span className="text-[#ededed]/50">@{data.username}</span>
        </div>

        {/* 主体：角色名 */}
        <div className="mt-5 flex flex-1 flex-col">
          <span className="text-[clamp(12px,1.5vw,18px)] text-[#ededed]/55">我的黑客松角色</span>
          <div className="mt-1.5 flex items-center">
            <span className="mr-3 text-[clamp(32px,4.6vw,50px)] leading-none">{emoji}</span>
            <span
              className="font-extrabold leading-[1.1] text-[clamp(26px,4vw,46px)]"
              style={{
                backgroundImage: `linear-gradient(120deg, ${colorFrom}, ${colorTo})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {name}
            </span>
          </div>
          <p className="mt-[1.5%] max-w-[85%] text-[clamp(11px,1.8vw,24px)] text-[#ededed]/60">
            {tagline}
          </p>

          {/* 技术栈 chips */}
          <div className="mt-[3%] flex flex-wrap gap-2">
            {topTech.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[clamp(9px,1.4vw,19px)] text-[#ededed]"
              >
                {t}
              </span>
            ))}
          </div>

          {/* 履历摘要：获奖金色高亮 */}
          <div className="mt-[3%] flex flex-col gap-1.5">
            {top3.map((c) => {
              const win = isWin(c.placement);
              return (
                <div key={c.id} className="flex items-center text-[clamp(10px,1.5vw,20px)]">
                  <span
                    className="mr-3 inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: win ? GOLD : colorTo }}
                  />
                  <span className="mr-3 text-[#ededed]">{c.hackathonName}</span>
                  {c.placement && (
                    <span
                      className="mr-3"
                      style={{ color: win ? GOLD : 'rgba(237,237,237,0.6)', fontWeight: win ? 700 : 400 }}
                    >
                      {win ? '🏆 ' : ''}
                      {c.placement}
                    </span>
                  )}
                  {c.dateRange && (
                    <span className="text-[#ededed]/40 text-[clamp(9px,1.3vw,17px)]">
                      {c.dateRange}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部：统计条 + 邀请语 */}
        <div className="flex items-center justify-between border-t border-white/10 pt-[2.5%]">
          <div className="flex items-center gap-[6%]">
            <Stat value={data.stats.projects} label="项目" />
            <Stat value={data.stats.hackathons} label="比赛" />
            <Stat value={data.stats.awards} label="获奖" gold />
          </div>
          <div className="flex flex-col items-end">
            <span className="font-semibold text-[#ededed] text-[clamp(11px,1.6vw,22px)]">
              看看你是什么角色？
            </span>
            <span className="text-[clamp(9px,1.3vw,18px)]" style={{ color: colorTo }}>
              hackertrip.space/@{data.username}
            </span>
          </div>
        </div>
      </div>

      {/* config 变体时叠加配置卡视觉（保持 props 兼容，默认 identity 不渲染） */}
      {variant === 'config' && (
        <span className="sr-only">config variant — 请使用 ConfigCard 组件渲染配置卡</span>
      )}
    </div>
  );
}

function Stat({ value, label, gold }: { value: number; label: string; gold?: boolean }) {
  return (
    <div className="flex items-baseline">
      <span
        className="font-extrabold text-[clamp(20px,3.4vw,46px)]"
        style={{ color: gold ? GOLD : '#ededed' }}
      >
        {value}
      </span>
      <span className="ml-1.5 text-[#ededed]/55 text-[clamp(10px,1.4vw,20px)]">{label}</span>
    </div>
  );
}
