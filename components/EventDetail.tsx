'use client';

import { useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  FileText,
  Gift,
  Globe2,
  Info,
  MapPin,
  Radio,
  Ticket,
  Trophy,
  Users,
} from 'lucide-react';
import type { Hackathon } from '@/data/hackathons';

type Props = {
  hackathon: Hackathon;
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
 * 获取状态显示信息
 */
function getStatusInfo(hackathon: Hackathon) {
  if (hackathon.isPast || hackathon.status === 'closed') {
    return {
      text: '已结束',
      color: 'bg-gray-600/80',
      textColor: 'text-gray-300',
      dotColor: 'bg-gray-400'
    };
  }

  if (hackathon.status === 'live') {
    return {
      text: '进行中',
      color: 'bg-green-500/20',
      textColor: 'text-green-400',
      dotColor: 'bg-green-500',
      pulse: true
    };
  }

  const countdown = calculateCountdown(hackathon.dateRange);
  if (countdown !== null && countdown > 0) {
    return {
      text: `倒计时 ${countdown} 天`,
      color: 'bg-indigo-500/20',
      textColor: 'text-indigo-400',
      dotColor: 'bg-indigo-500'
    };
  }

  return {
    text: '即将开始',
    color: 'bg-indigo-500/20',
    textColor: 'text-indigo-400',
    dotColor: 'bg-indigo-500'
  };
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

export function EventDetail({ hackathon }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusInfo = getStatusInfo(hackathon);
  const formattedDate = parseDateDisplay(hackathon.dateRange);

  const organizers = hackathon.organizers || [];
  const sponsors = hackathon.sponsors || [];

  return (
    <section className="relative pb-20">
      <div className="w-full max-w-[1240px] mx-auto px-6 lg:px-10">
        <div className="glass rounded-[32px] overflow-hidden border border-white/5 bg-white/[0.02]">
          {/* ====== Hero Section within Card ====== */}
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full ${statusInfo.color} border border-white/5 flex items-center gap-2`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor} ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${statusInfo.textColor}`}>{statusInfo.text}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{hackathon.format}</span>
                </div>

                <h3 className="font-sans text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                  {hackathon.name}
                </h3>

                <div className="flex items-center gap-6 text-gray-400 font-mono text-xs tracking-wide">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-indigo-400/60" />
                    {formattedDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-indigo-400/60" />
                    {hackathon.city}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[180px]">
                <a
                  href={hackathon.website}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-6 rounded-xl bg-white text-black font-sans text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  Register Now
                  <ArrowUpRight size={16} />
                </a>
                <a
                  href={hackathon.brief}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-sans text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  View Brief
                </a>
              </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { icon: Trophy, label: 'Prize Pool', value: hackathon.prizePool, color: 'text-yellow-500' },
                { icon: Users, label: 'Teams', value: hackathon.teams, color: 'text-blue-500' },
                { icon: Globe2, label: 'Theme', value: hackathon.theme, color: 'text-purple-500' },
                { icon: MapPin, label: 'Venue', value: hackathon.venue, color: 'text-green-500' },
              ].map((stat, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                  <stat.icon size={18} className={`${stat.color} opacity-60`} />
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{stat.label}</p>
                    <p className="text-sm font-sans font-bold text-white truncate">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">About the event</span>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>
              <p className="font-sans text-lg text-gray-300 leading-relaxed max-w-4xl">
                {hackathon.summary}
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="group flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-widest hover:text-indigo-300 transition-colors"
              >
                {isExpanded ? 'Collapse Details' : 'View Full Agenda & Tracks'}
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {/* ====== Expanded Area ====== */}
          <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-8 md:px-12 pb-12 pt-8 border-t border-white/5 bg-black/20">
              <div className="grid lg:grid-cols-2 gap-16">
                {/* Tracks */}
                <div className="space-y-8">
                  <h4 className="font-sans text-xl font-bold text-white flex items-center gap-3">
                    Tracks
                    <div className="h-px flex-1 bg-white/5" />
                  </h4>
                  <div className="space-y-6">
                    {hackathon.tracks.map((track, i) => (
                      <div key={i} className="group relative pl-6 border-l border-white/10 hover:border-indigo-500/50 transition-colors">
                        <div className="absolute -left-[1px] top-0 w-[1px] h-0 bg-indigo-500 group-hover:h-full transition-all duration-500" />
                        <h5 className="font-sans text-base font-bold text-white mb-2">{track.title}</h5>
                        <p className="font-sans text-sm text-gray-400 leading-relaxed">{track.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agenda */}
                <div className="space-y-8">
                  <h4 className="font-sans text-xl font-bold text-white flex items-center gap-3">
                    Agenda
                    <div className="h-px flex-1 bg-white/5" />
                  </h4>
                  <div className="space-y-8">
                    {hackathon.agenda.map((item, i) => (
                      <div key={i} className="flex gap-6">
                        <div className="flex flex-col items-center gap-2 pt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          <div className="w-[1px] flex-1 bg-white/5" />
                        </div>
                        <div className="space-y-1">
                          <span className="font-mono text-[10px] uppercase tracking-tighter text-indigo-400">{item.time}</span>
                          <h5 className="font-sans text-sm font-bold text-white">{item.title}</h5>
                          <p className="font-sans text-xs text-gray-500 leading-relaxed">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Partners placeholder refined */}
              {(organizers.length > 0 || sponsors.length > 0) && (
                <div className="mt-20 pt-16 border-t border-white/5 space-y-10">
                  <div className="text-center space-y-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-gray-600">Partners & Sponsors</span>
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                    {[...organizers, ...sponsors].map((p, i) => (
                      <div key={i} className="h-6 flex items-center">
                        {p.logo ? (
                          <img src={p.logo} alt={p.name} className="h-full w-auto object-contain" />
                        ) : (
                          <span className="font-sans text-sm font-bold text-white">{p.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

