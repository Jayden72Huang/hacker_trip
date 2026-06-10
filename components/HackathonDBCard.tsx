import Link from 'next/link';
import { Calendar, MapPin, Trophy, Users, ArrowUpRight } from 'lucide-react';

export type HackathonMode = 'online' | 'offline' | 'hybrid';

export interface DBHackathon {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  website: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  mode: HackathonMode;
  location: string | null;
  prizePool: string | null;
  organizer: string | null;
  tracks: string[];
  tags: string[];
  status: 'upcoming' | 'ongoing' | 'ended';
  participantCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  // /api/hackathons 实际返回的扩展字段（搜索匹配用）
  shortName?: string | null;
  city?: string | null;
  theme?: string | null;
  summary?: string | null;
  hostOrganizer?: string | null;
  organizers?: { name: string }[];
  sponsors?: { name: string }[];
}

/**
 * 搜索匹配：覆盖名称/城市/主题/简介/主办方/赞助商。
 * 注意 organizer 是历史遗留空列，真实主办方在 hostOrganizer 和 organizers[]。
 */
export function matchesHackathonSearch(h: DBHackathon, query: string): boolean {
  if (!query) return true;
  const haystack = [
    h.name,
    h.shortName,
    h.location,
    h.city,
    h.organizer,
    h.hostOrganizer,
    h.theme,
    h.summary,
    ...(h.organizers || []).map((o) => o.name),
    ...(h.sponsors || []).map((s) => s.name),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (s.getMonth() === e.getMonth()) {
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
}

export function isPast(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

export function daysUntil(startDate: string): number | null {
  const diff = Math.ceil((new Date(startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export function modeLabel(mode: HackathonMode): string {
  return mode === 'online' ? '线上' : mode === 'offline' ? '线下' : '混合';
}

export function HackathonDBCard({ hackathon: h, showCountdown = true }: { hackathon: DBHackathon; showCountdown?: boolean }) {
  const dateRange = formatDateRange(h.startDate, h.endDate);
  const countdown = showCountdown ? daysUntil(h.startDate) : null;

  return (
    <Link
      href={`/hackathon/${h.id}`}
      className="block glass rounded-2xl p-6 border border-white/5 hover:border-white/15 transition-all group"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-sora text-lg font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
              {h.name}
            </h3>
            {h.isVerified && (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-space-mono">
                已认证
              </span>
            )}
            {h.isFeatured && (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-space-mono">
                精选
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-space-mono text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {dateRange}
            </span>
            {h.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {h.location}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              h.mode === 'online' ? 'bg-cyan-500/20 text-cyan-400' :
              h.mode === 'offline' ? 'bg-orange-500/20 text-orange-400' :
              'bg-purple-500/20 text-purple-400'
            }`}>
              {modeLabel(h.mode)}
            </span>
          </div>

          {h.description && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-1">{h.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          {h.prizePool && (
            <div className="text-center">
              <div className="flex items-center gap-1 text-yellow-400">
                <Trophy size={14} />
                <span className="font-sora text-sm font-semibold">{h.prizePool}</span>
              </div>
              <span className="text-xs text-gray-500 font-space-mono">奖金</span>
            </div>
          )}
          {h.participantCount > 0 && (
            <div className="text-center">
              <div className="flex items-center gap-1 text-cyan-400">
                <Users size={14} />
                <span className="font-sora text-sm font-semibold">{h.participantCount}</span>
              </div>
              <span className="text-xs text-gray-500 font-space-mono">参与</span>
            </div>
          )}
          {countdown && (
            <div className="text-center px-3 py-1.5 rounded-lg bg-indigo-500/15">
              <span className="font-sora text-lg font-bold text-indigo-400">{countdown}</span>
              <span className="text-xs text-gray-500 font-space-mono block">天后开始</span>
            </div>
          )}
          <ArrowUpRight size={20} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
