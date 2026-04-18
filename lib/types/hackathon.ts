// DB status enum
export type DBHackathonStatus = 'upcoming' | 'ongoing' | 'ended';
// UI status (homepage / EventDetail)
export type UIHackathonStatus = 'upcoming' | 'live' | 'closed';

export type HackathonMode = 'online' | 'offline' | 'hybrid';

export interface Organizer {
  name: string;
  logo?: string;
}

export interface Sponsor {
  name: string;
  logo?: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
}

export interface InfoCard {
  icon: 'trophy' | 'users' | 'globe' | 'mapPin' | 'clock' | 'ticket' | 'gift';
  label: string;
  value: string;
  expandedContent?: string;
}

export interface Registration {
  mode: 'official-site' | 'external-form' | 'platform';
  url: string;
  siteName?: string;
  platformPath?: string;
  note?: string;
}

export interface Track {
  title: string;
  description: string;
}

export interface AgendaItem {
  title: string;
  time: string;
  detail: string;
}

// 首页使用的统一类型（API 返回的格式）
export interface HomepageHackathon {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  city: string;
  country: string;
  venue: string;
  startDate: string;
  endDate: string;
  dateRange: string; // 计算字段: "Jan 18–19"
  isPast: boolean;   // 计算字段
  mode: HackathonMode;
  format: HackathonMode; // alias for mode, 兼容旧代码
  status: UIHackathonStatus;
  summary: string;
  description: string | null;
  prizePool: string;
  teams: string;
  theme: string;
  website: string;
  brief: string;
  hostOrganizer: string | null;
  registration: Registration | null;
  tracks: Track[];
  agenda: AgendaItem[];
  organizers: Organizer[];
  sponsors: Sponsor[];
  infoCards: InfoCard[] | null;
  location: string | null;
  logo: string | null;
  coverImage: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  participantCount: number;
}

// DB status → UI status
export function mapDBStatusToUI(status: DBHackathonStatus): UIHackathonStatus {
  switch (status) {
    case 'ongoing': return 'live';
    case 'ended': return 'closed';
    default: return 'upcoming';
  }
}

// startDate/endDate → "Jan 18–19" 格式
export function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (s.getMonth() === e.getMonth()) {
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
}

// 将 DB 行转换为 HomepageHackathon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toHomepageHackathon(row: any): HomepageHackathon {
  const now = new Date();
  const endDate = new Date(row.endDate);
  const isPast = endDate < now;

  // 处理 tracks: 可能是 string[] (旧格式) 或 {title,description}[] (新格式)
  let tracks: Track[] = [];
  if (Array.isArray(row.tracks)) {
    tracks = row.tracks.map((t: string | Track) =>
      typeof t === 'string' ? { title: t, description: '' } : t
    );
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortName: row.shortName || row.short_name || row.name.substring(0, 6),
    city: row.city || row.location || '',
    country: row.country || '中国',
    venue: row.venue || row.location || '',
    startDate: row.startDate instanceof Date ? row.startDate.toISOString() : String(row.startDate),
    endDate: row.endDate instanceof Date ? row.endDate.toISOString() : String(row.endDate),
    dateRange: formatDateRange(row.startDate, row.endDate),
    isPast,
    mode: row.mode || 'hybrid',
    format: row.mode || 'hybrid',
    status: mapDBStatusToUI(row.status || (isPast ? 'ended' : 'upcoming')),
    summary: row.summary || row.description || '',
    description: row.description || null,
    prizePool: row.prizePool || row.prize_pool || '',
    teams: row.teams || '',
    theme: row.theme || '',
    website: row.website || '',
    brief: row.brief || '',
    hostOrganizer: row.hostOrganizer || row.host_organizer || row.organizer || null,
    registration: row.registration || null,
    tracks,
    agenda: Array.isArray(row.agenda) ? row.agenda : [],
    organizers: Array.isArray(row.organizers) ? row.organizers : [],
    sponsors: Array.isArray(row.sponsors) ? row.sponsors : [],
    infoCards: row.infoCards || row.info_cards || null,
    location: row.location || null,
    logo: row.logo || null,
    coverImage: row.coverImage || row.cover_image || null,
    isFeatured: row.isFeatured ?? row.is_featured ?? false,
    isVerified: row.isVerified ?? row.is_verified ?? false,
    participantCount: row.participantCount ?? row.participant_count ?? 0,
  };
}
