'use client';

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  Calendar,
  MapPin,
  Filter,
  Rocket,
  History,
  Trophy,
  Users,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

type HackathonMode = 'online' | 'offline' | 'hybrid';
type FilterType = 'all' | HackathonMode;
type SortType = 'date' | 'prize' | 'name';
type TabType = 'upcoming' | 'past';

interface DBHackathon {
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
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (s.getMonth() === e.getMonth()) {
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
}

function isPast(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

function daysUntil(startDate: string): number | null {
  const diff = Math.ceil((new Date(startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function modeLabel(mode: HackathonMode): string {
  return mode === 'online' ? '线上' : mode === 'offline' ? '线下' : '混合';
}

export default function ExplorePage() {
  const [hackathons, setHackathons] = useState<DBHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  useEffect(() => {
    fetch('/api/hackathons')
      .then(res => res.json())
      .then(data => setHackathons(Array.isArray(data) ? data : []))
      .catch(() => setHackathons([]))
      .finally(() => setLoading(false));
  }, []);

  const { upcoming, past } = useMemo(() => {
    let filtered = hackathons.filter((h) => {
      const matchesSearch =
        !searchQuery ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.organizer || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFormat =
        formatFilter === 'all' || h.mode === formatFilter;

      return matchesSearch && matchesFormat;
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'prize') {
        const prizeA = parseInt((a.prizePool || '0').replace(/[^0-9]/g, '')) || 0;
        const prizeB = parseInt((b.prizePool || '0').replace(/[^0-9]/g, '')) || 0;
        return prizeB - prizeA;
      }
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return {
      upcoming: filtered.filter((h) => !isPast(h.endDate)),
      past: filtered.filter((h) => isPast(h.endDate)),
    };
  }, [hackathons, searchQuery, formatFilter, sortBy]);

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <Navbar />

      <main className="pt-40 pb-20">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          {/* Tab 切换 - 带背景图 */}
          <div className="relative rounded-2xl overflow-hidden mb-10">
            {/* 背景图 */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 transition-opacity duration-500"
              style={{ backgroundImage: "url('/images/events-banner.png')" }}
            />
            {/* 左右遮罩：选中侧更亮（透明度低），未选中侧更暗 */}
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{
                background: activeTab === 'upcoming'
                  ? 'linear-gradient(to right, rgba(5,6,10,0.15) 0%, rgba(5,6,10,0.4) 50%, rgba(5,6,10,0.75) 100%)'
                  : 'linear-gradient(to right, rgba(5,6,10,0.75) 0%, rgba(5,6,10,0.4) 50%, rgba(5,6,10,0.15) 100%)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05060a]/80" />

            <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6 px-8 py-8">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`text-left transition-all ${activeTab === 'upcoming' ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={`font-sora text-3xl md:text-4xl font-bold transition-colors ${
                    activeTab === 'upcoming' ? 'text-white' : 'text-gray-400'
                  }`}>
                    Upcoming Events
                  </h1>
                  <span className={`px-2.5 py-1 rounded-full font-space-mono text-sm transition-all ${
                    activeTab === 'upcoming'
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}>
                    {upcoming.length}
                  </span>
                </div>
                <p className="font-space-mono text-sm text-gray-400">
                  发现即将举办的黑客松，立即报名参与
                </p>
              </button>

              <button
                onClick={() => setActiveTab('past')}
                className={`text-left md:text-right transition-all ${activeTab === 'past' ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
              >
                <div className="flex items-center gap-3 mb-2 md:flex-row-reverse">
                  <span className={`px-2.5 py-1 rounded-full font-space-mono text-sm transition-all ${
                    activeTab === 'past'
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}>
                    {past.length}
                  </span>
                  <h2 className={`font-sora text-2xl md:text-3xl font-bold transition-colors ${
                    activeTab === 'past' ? 'text-white' : 'text-gray-400'
                  }`}>
                    Past Events
                  </h2>
                </div>
                <p className="font-space-mono text-sm text-gray-500">
                  回顾精彩往届赛事，获取灵感启发
                </p>
              </button>
            </div>
          </div>

          {/* 搜索和筛选栏 */}
          <div className="glass rounded-2xl p-4 mb-8 border border-white/5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="搜索黑客松名称、城市、组织方..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <button
                    onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowSortDropdown(false); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-space-mono text-gray-300"
                  >
                    <Filter size={16} />
                    {formatFilter === 'all' ? '全部形式' : modeLabel(formatFilter as HackathonMode)}
                    <ChevronDown size={16} />
                  </button>
                  {showFilterDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-40 rounded-xl bg-gray-900 border border-white/10 shadow-xl overflow-hidden z-50">
                      {[
                        { value: 'all', label: '全部形式' },
                        { value: 'offline', label: '线下' },
                        { value: 'online', label: '线上' },
                        { value: 'hybrid', label: '混合' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setFormatFilter(option.value as FilterType); setShowFilterDropdown(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-space-mono transition-all ${
                            formatFilter === option.value
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => { setShowSortDropdown(!showSortDropdown); setShowFilterDropdown(false); }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-space-mono text-gray-300"
                  >
                    <Calendar size={16} />
                    {sortBy === 'date' ? '按日期' : sortBy === 'prize' ? '按奖金' : '按名称'}
                    <ChevronDown size={16} />
                  </button>
                  {showSortDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-36 rounded-xl bg-gray-900 border border-white/10 shadow-xl overflow-hidden z-50">
                      {[
                        { value: 'date', label: '按日期' },
                        { value: 'prize', label: '按奖金' },
                        { value: 'name', label: '按名称' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setSortBy(option.value as SortType); setShowSortDropdown(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-space-mono transition-all ${
                            sortBy === option.value
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 黑客松卡片列表 */}
          <section className="relative z-10">
            {loading ? (
              <div className="text-center py-20">
                <Loader2 size={32} className="text-indigo-400 animate-spin mx-auto mb-4" />
                <p className="font-space-mono text-sm text-gray-500">加载中...</p>
              </div>
            ) : (
              <>
                {activeTab === 'upcoming' && (
                  upcoming.length > 0 ? (
                    <div className="space-y-4">
                      {upcoming.map((h) => (
                        <HackathonDBCard key={h.id} hackathon={h} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={<Rocket size={24} className="text-gray-500" />} title="暂无即将举办的黑客松" subtitle="尝试调整搜索关键词或筛选条件" />
                  )
                )}
                {activeTab === 'past' && (
                  past.length > 0 ? (
                    <div className="space-y-4">
                      {past.map((h) => (
                        <HackathonDBCard key={h.id} hackathon={h} showCountdown={false} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={<History size={24} className="text-gray-500" />} title="暂无已结束的黑客松" subtitle="尝试调整搜索关键词或筛选条件" />
                  )
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function HackathonDBCard({ hackathon: h, showCountdown = true }: { hackathon: DBHackathon; showCountdown?: boolean }) {
  const dateRange = formatDateRange(h.startDate, h.endDate);
  const countdown = showCountdown ? daysUntil(h.startDate) : null;

  return (
    <Link
      href={`/hackathon/${h.id}`}
      className="block glass rounded-2xl p-6 border border-white/5 hover:border-white/15 transition-all group"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        {/* 左侧信息 */}
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

        {/* 右侧数据 */}
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

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-sora text-lg font-semibold text-gray-400 mb-2">{title}</h3>
      <p className="font-space-mono text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
