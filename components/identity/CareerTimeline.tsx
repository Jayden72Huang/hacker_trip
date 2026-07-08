'use client';

/**
 * ============================================================================
 *  HackerTrip — 参赛履历时间线 (CareerTimeline)
 * ============================================================================
 *
 *  按时间倒序展示参加过的黑客松 + 获奖 + 项目（卖点1：隐形资产账本）。
 *  - 获奖项金色高亮 + 🏆。
 *  - 已验证项显示青色"已验证"徽章（verified = project.verificationStatus==='approved'）。
 *  - 顶部统计条：N 项目 · M 比赛 · X 获奖。
 *
 *  深色玻璃风，复用 globals.css accent 变量。
 *  props: { items: CareerItem[]; stats?: IdentityStats }
 * ============================================================================
 */

import {
  type CareerItem,
  type IdentityStats,
  type ParticipationRole,
} from '@/lib/identity/types';

interface CareerTimelineProps {
  items: CareerItem[];
  /** 可选统计条（不传则按 items 现算） */
  stats?: IdentityStats;
  className?: string;
}

const GOLD = '#ffcf5c';
const ACCENT_3 = '#4de1ff';

const ROLE_LABEL: Record<ParticipationRole, string> = {
  participant: '参赛',
  winner: '获奖',
  organizer: '组织者',
  mentor: '导师',
  judge: '评委',
};

function isWin(placement?: string | null): boolean {
  if (!placement) return false;
  return /1st|2nd|3rd|first|second|third|winner|champion|finalist|grand|冠|亚|季|获奖|入围/i.test(
    placement,
  );
}

/** 从 dateRange ("2026.07" / "2026.03–2026.04") 取首个用于排序的数值 */
function sortKey(dateRange?: string | null): number {
  if (!dateRange) return 0;
  const m = dateRange.match(/(\d{4})[.\-/](\d{1,2})/);
  if (!m) return 0;
  return Number(m[1]) * 100 + Number(m[2]);
}

function computeStats(items: CareerItem[]): IdentityStats {
  return {
    projects: items.filter((i) => i.projectName).length,
    hackathons: items.length,
    awards: items.filter((i) => isWin(i.placement)).length,
  };
}

export default function CareerTimeline({ items, stats, className }: CareerTimelineProps) {
  const sorted = [...items].sort((a, b) => sortKey(b.dateRange) - sortKey(a.dateRange));
  const s = stats ?? computeStats(items);

  return (
    <div className={`flex flex-col gap-5 ${className ?? ''}`}>
      {/* 统计条 */}
      <div className="glass flex items-center justify-around rounded-2xl px-4 py-4">
        <StatCell value={s.projects} label="项目" />
        <Divider />
        <StatCell value={s.hackathons} label="比赛" />
        <Divider />
        <StatCell value={s.awards} label="获奖" gold />
      </div>

      {/* 时间线 */}
      <div className="relative pl-6">
        {/* 竖线 */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{ background: 'linear-gradient(180deg, #7c5dff, #4de1ff, transparent)' }}
        />
        <ol className="flex flex-col gap-4">
          {sorted.map((item, idx) => {
            const win = isWin(item.placement);
            return (
              <li
                key={item.id}
                className="animate-fade-up relative"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* 节点圆点 */}
                <span
                  className="absolute -left-[22px] top-3 h-3.5 w-3.5 rounded-full border-2"
                  style={{
                    background: win ? GOLD : '#05060a',
                    borderColor: win ? GOLD : ACCENT_3,
                    boxShadow: win ? `0 0 12px ${GOLD}88` : 'none',
                  }}
                />
                <div className="glass rounded-2xl p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-base font-semibold text-[#ededed]">
                      {item.hackathonName}
                    </span>
                    {item.dateRange && (
                      <span className="text-xs text-[#ededed]/45">{item.dateRange}</span>
                    )}
                    {item.verified && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          color: ACCENT_3,
                          background: 'rgba(77,225,255,0.12)',
                          border: '1px solid rgba(77,225,255,0.35)',
                        }}
                      >
                        ✓ 已验证
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs"
                      style={{
                        color: 'rgba(237,237,237,0.7)',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {ROLE_LABEL[item.role]}
                    </span>
                    {item.placement && (
                      <span
                        className="text-sm font-semibold"
                        style={{ color: win ? GOLD : 'rgba(237,237,237,0.7)' }}
                      >
                        {win ? '🏆 ' : ''}
                        {item.placement}
                      </span>
                    )}
                    {item.track && (
                      <span className="text-xs text-[#ededed]/45">· {item.track}</span>
                    )}
                  </div>

                  {item.projectName && (
                    <div className="mt-2 border-t border-white/[0.06] pt-2">
                      <span className="text-sm font-medium text-[#ededed]/90">
                        {item.projectName}
                      </span>
                      {item.projectTagline && (
                        <p className="mt-0.5 text-xs text-[#ededed]/55">{item.projectTagline}</p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function StatCell({ value, label, gold }: { value: number; label: string; gold?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-2xl font-extrabold"
        style={{ color: gold ? GOLD : '#ededed' }}
      >
        {value}
      </span>
      <span className="text-xs text-[#ededed]/50">{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="h-8 w-px bg-white/10" />;
}
