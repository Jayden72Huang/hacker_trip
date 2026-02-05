'use client';

import { useState, useMemo } from 'react';
import { hackathons } from '@/data/hackathons';

type TimeRange = 'past-month' | 'past-half' | 'all' | 'future-month' | 'future-half';

type TimelineProps = {
  selectedId: string;
  onSelect: (id: string) => void;
  subscriptions: string[];
};

// 解析日期字符串，返回Date对象
function parseHackathonDate(dateRange: string): Date | null {
  const monthMap: { [key: string]: number } = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const match = dateRange.match(/([A-Z][a-z]+)\s+(\d{1,2})/);
  if (!match) return null;

  const [, month, day] = match;
  const monthIndex = monthMap[month];
  if (monthIndex === undefined) return null;

  return new Date(2026, monthIndex, parseInt(day));
}

// 根据时间范围筛选hackathons
function filterByTimeRange(timeRange: TimeRange) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const oneMonthLater = new Date(today);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const sixMonthsLater = new Date(today);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  return hackathons.filter(h => {
    const eventDate = parseHackathonDate(h.dateRange);
    if (!eventDate) return true;

    switch (timeRange) {
      case 'past-month':
        return eventDate < today && eventDate >= oneMonthAgo;
      case 'past-half':
        return eventDate < today && eventDate >= sixMonthsAgo;
      case 'future-month':
        return eventDate >= today && eventDate <= oneMonthLater;
      case 'future-half':
        return eventDate >= today && eventDate <= sixMonthsLater;
      case 'all':
      default:
        return true;
    }
  });
}

export function Timeline({ selectedId, onSelect, subscriptions }: TimelineProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // 根据时间范围筛选
  const filteredHackathons = useMemo(() => {
    return filterByTimeRange(timeRange);
  }, [timeRange]);

  // 获取时间点的颜色样式
  const getDotStyle = (hackathon: typeof hackathons[0], isSelected: boolean) => {
    const isSubscribed = subscriptions.includes(hackathon.id);
    const isPast = hackathon.isPast;

    if (isSelected) {
      // 选中状态
      if (isSubscribed) {
        // 已订阅：彩色发光
        return {
          dot: 'bg-gradient-to-r from-indigo-400 to-purple-400 scale-150 shadow-lg shadow-indigo-500/50',
          glow: 'w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30 blur-lg animate-pulse'
        };
      } else {
        // 未订阅：白色发光
        return {
          dot: 'bg-white scale-150 shadow-lg shadow-white/50',
          glow: 'w-12 h-12 bg-white opacity-25 blur-lg animate-pulse'
        };
      }
    }

    if (isPast) {
      // 已结束
      if (isSubscribed) {
        // 已订阅且结束：橙色
        return {
          dot: 'bg-gradient-to-r from-orange-400 to-amber-400 group-hover:scale-125',
          glow: 'w-8 h-8 bg-orange-500 opacity-10 group-hover:opacity-20'
        };
      } else {
        // 未订阅且结束：灰色
        return {
          dot: 'bg-gray-600 group-hover:bg-gray-500 group-hover:scale-110',
          glow: ''
        };
      }
    }

    // 未来的黑客松
    if (isSubscribed) {
      // 已订阅：彩色
      return {
        dot: 'bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:scale-125',
        glow: 'w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-10 group-hover:opacity-20'
      };
    } else {
      // 未订阅：白色点
      return {
        dot: 'bg-white/70 group-hover:bg-white group-hover:scale-110',
        glow: ''
      };
    }
  };

  const timeRangeButtons: { key: TimeRange; label: string; position: 'left' | 'center' | 'right' }[] = [
    { key: 'past-half', label: '过去半年', position: 'left' },
    { key: 'past-month', label: '过去1月', position: 'left' },
    { key: 'all', label: '2026', position: 'center' },
    { key: 'future-month', label: '未来1月', position: 'right' },
    { key: 'future-half', label: '未来半年', position: 'right' },
  ];

  return (
    <section id="timeline" className="relative mt-20 md:mt-30 pb-12 md:pb-12 lg:pb-16">
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center gap-12">
          {/* 标题 */}
          <div className="glass rounded-2xl px-6 py-3 flex items-center gap-4">
            <h2 className="font-sora text-xl md:text-2xl font-bold">
              <span className="bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent">
                Hackathon{' '}
              </span>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Timeline
              </span>
            </h2>
            <div className="w-px h-6 bg-white/20" />
            <button
              onClick={() => setTimeRange('all')}
              className={`font-sora text-xl md:text-2xl font-bold transition-all ${
                timeRange === 'all'
                  ? 'bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              2026
            </button>
          </div>

          {/* 时间线内容 */}
          {filteredHackathons.length > 0 ? (
            <div className="w-full flex items-center gap-6">
              {/* 左侧：过去时间按钮 */}
              <div className="flex items-center gap-2 shrink-0">
                {timeRangeButtons
                  .filter(btn => btn.position === 'left')
                  .map(btn => (
                    <button
                      key={btn.key}
                      onClick={() => setTimeRange(btn.key)}
                      className={`px-3 py-1.5 rounded-full font-space-mono text-xs font-medium transition-all whitespace-nowrap ${
                        timeRange === btn.key
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
              </div>

              {/* 中间：时间线 */}
              <div className="flex-1">
                {/* 名字行 */}
                <div className="flex justify-between items-center mb-6">
                  {filteredHackathons.map((h) => (
                    <div key={h.id} className="flex-1 flex justify-center">
                      <button
                        onClick={() => onSelect(h.id)}
                        className={`font-sora text-xs md:text-sm font-bold transition-all cursor-pointer ${selectedId === h.id
                            ? 'text-white scale-110'
                            : h.isPast
                              ? 'text-gray-400 hover:text-gray-200'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                      >
                        {h.shortName}
                      </button>
                    </div>
                  ))}
                </div>

                {/* 时间线点 */}
                <div className="relative h-24 mb-6">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-full" />
                  <div className="absolute inset-0 flex justify-between items-center">
                    {filteredHackathons.map((h) => {
                      const dotStyle = getDotStyle(h, selectedId === h.id);
                      return (
                        <div key={h.id} className="flex-1 flex justify-center">
                          <button onClick={() => onSelect(h.id)} className="relative cursor-pointer group">
                            {dotStyle.glow && (
                              <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity ${dotStyle.glow}`} />
                            )}
                            <div
                              className={`relative w-4 h-4 rounded-full transition-all duration-300 ${dotStyle.dot}`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 日期行 */}
                <div className="flex justify-between items-center mb-3">
                  {filteredHackathons.map((h) => (
                    <div key={h.id} className="flex-1 flex justify-center">
                      <button
                        onClick={() => onSelect(h.id)}
                        className={`font-space-mono text-xs md:text-sm font-medium transition-colors cursor-pointer ${selectedId === h.id
                            ? 'text-indigo-300'
                            : h.isPast
                              ? 'text-gray-500'
                              : 'text-gray-600'
                          }`}
                      >
                        {h.dateRange}
                      </button>
                    </div>
                  ))}
                </div>

                {/* 城市行 */}
                <div className="flex justify-between items-center">
                  {filteredHackathons.map((h) => (
                    <div key={h.id} className="flex-1 flex justify-center">
                      <button
                        onClick={() => onSelect(h.id)}
                        className={`font-space-mono text-[11px] md:text-xs transition-colors cursor-pointer ${selectedId === h.id
                            ? 'text-gray-400'
                            : h.isPast
                              ? 'text-gray-600'
                              : 'text-gray-700'
                          }`}
                      >
                        {h.city}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 右侧：未来时间按钮 */}
              <div className="flex items-center gap-2 shrink-0">
                {timeRangeButtons
                  .filter(btn => btn.position === 'right')
                  .map(btn => (
                    <button
                      key={btn.key}
                      onClick={() => setTimeRange(btn.key)}
                      className={`px-3 py-1.5 rounded-full font-space-mono text-xs font-medium transition-all whitespace-nowrap ${
                        timeRange === btn.key
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="w-full py-16 flex flex-col items-center gap-4">
              <p className="font-space-mono text-gray-500 text-sm">该时间段内暂无黑客松活动</p>
              <button
                onClick={() => setTimeRange('all')}
                className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 font-space-mono text-sm hover:bg-white/10 transition-colors"
              >
                查看全部
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
