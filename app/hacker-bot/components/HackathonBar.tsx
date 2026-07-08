'use client';

import { useState, useEffect } from 'react';
import { Trophy, ChevronDown, Clock, Timer, UserPlus, Plus } from 'lucide-react';
import Image from 'next/image';
import type { TeamMember } from './HackerBot';
import { getDefaultAvatar } from '../utils/avatars';

export interface HackathonInfo {
  id: string;
  name: string;
  tagline: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'ongoing' | 'ended';
  tracks?: string[];
  prizePool?: string;
  location?: string;
  website?: string;
  organizer?: string;
  description?: string;
}

interface HackathonBarProps {
  hackathon: HackathonInfo | null;
  teamMembers: TeamMember[];
  onClickTitle: () => void;
  onInvite: () => void;
}

export function HackathonBar({
  hackathon,
  teamMembers,
  onClickTitle,
  onInvite,
}: HackathonBarProps) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* Hackathon title + tagline */}
      <button
        onClick={onClickTitle}
        className="flex items-center gap-2 min-w-0 flex-shrink group"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Trophy size={14} className="text-amber-400" />
        </div>
        {hackathon ? (
          <div className="min-w-0 flex items-center gap-1.5">
            <span className="font-sora text-sm font-semibold text-gray-200 truncate max-w-[240px] group-hover:text-white transition-colors">
              {hackathon.name}
            </span>
            <ChevronDown
              size={13}
              className="text-gray-600 flex-shrink-0 group-hover:text-gray-400 transition-colors"
            />
          </div>
        ) : (
          <span className="font-space-mono text-xs text-gray-500 italic">
            关联比赛
          </span>
        )}
      </button>

      {/* Countdown / Progress */}
      <div className="flex-shrink-0">
        {hackathon ? (
          <CountdownOrProgress hackathon={hackathon} />
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03]">
            <Clock size={13} className="text-gray-600" />
            <span className="font-space-mono text-xs text-gray-600">--:--:--</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/8 flex-shrink-0" />

      {/* Team avatars + invite */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex -space-x-2">
          {teamMembers.slice(0, 4).map((member) => (
            <div
              key={member.userId}
              className="relative"
              title={`${member.name}${member.role === 'leader' ? ' (leader)' : ''}`}
            >
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full ring-2 ring-[#05060a] object-cover"
                />
              ) : (
                <div className={`w-7 h-7 rounded-full ring-2 ring-[#05060a] bg-gradient-to-br ${getDefaultAvatar(member.userId).gradient} flex items-center justify-center overflow-hidden p-0.5`}>
                  <Image
                    src={getDefaultAvatar(member.userId).icon}
                    alt={member.name}
                    width={18}
                    height={18}
                    className="opacity-90"
                  />
                </div>
              )}
              {member.role === 'leader' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-[#05060a]" />
              )}
            </div>
          ))}
          {teamMembers.length > 4 && (
            <div className="w-7 h-7 rounded-full ring-2 ring-[#05060a] bg-white/10 flex items-center justify-center">
              <span className="text-[9px] text-gray-400 font-bold">
                +{teamMembers.length - 4}
              </span>
            </div>
          )}
        </div>

        {teamMembers.length === 0 && (
          <span className="font-space-mono text-xs text-gray-500">
            暂无队友
          </span>
        )}

        <button
          onClick={onInvite}
          className="w-7 h-7 rounded-full border border-dashed border-white/15 hover:border-indigo-400/40 flex items-center justify-center transition-colors group"
          title="邀请队友"
        >
          <Plus size={12} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
        </button>
      </div>
    </div>
  );
}

function CountdownOrProgress({ hackathon }: { hackathon: HackathonInfo }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const start = hackathon.startDate.getTime();
  const end = hackathon.endDate.getTime();
  const current = now.getTime();

  // Upcoming: show progress to start
  if (current < start) {
    const totalWait = start - Date.now();
    const days = Math.floor(totalWait / (1000 * 60 * 60 * 24));
    const hours = Math.floor((totalWait % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/8 border border-blue-500/15">
        <Clock size={13} className="text-blue-400" />
        <span className="font-space-mono text-xs text-blue-400 font-medium">
          {days > 0 ? `${days}天${hours}时后开赛` : `${hours}小时后开赛`}
        </span>
      </div>
    );
  }

  // Ongoing: show countdown
  if (current < end) {
    const remaining = end - current;
    const h = Math.floor(remaining / (1000 * 60 * 60));
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((remaining % (1000 * 60)) / 1000);

    const isUrgent = remaining < 3 * 60 * 60 * 1000; // < 3h

    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
          isUrgent
            ? 'bg-red-500/8 border-red-500/20'
            : 'bg-emerald-500/8 border-emerald-500/15'
        }`}
      >
        <Timer
          size={13}
          className={isUrgent ? 'text-red-400 animate-pulse' : 'text-emerald-400'}
        />
        <span
          className={`font-space-mono text-sm font-bold tabular-nums ${
            isUrgent ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:
          {String(s).padStart(2, '0')}
        </span>
      </div>
    );
  }

  // Ended
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <span className="font-space-mono text-xs text-gray-500">已结束</span>
    </div>
  );
}
