'use client';

import { X, Trophy, Calendar, MapPin, Globe, Users, Tag, ExternalLink } from 'lucide-react';
import type { HackathonInfo } from './HackathonBar';

interface HackathonDetailPopupProps {
  hackathon: HackathonInfo;
  onClose: () => void;
}

export function HackathonDetailPopup({ hackathon, onClose }: HackathonDetailPopupProps) {
  const formatDate = (d: Date) =>
    d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup - positioned below hackathon bar */}
      <div className="absolute left-16 top-0 z-50 w-[420px] max-h-[70vh] overflow-y-auto rounded-xl bg-[#0c0d12] border border-white/[0.08] shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Trophy size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-sora text-sm font-bold text-white">
                {hackathon.name}
              </h3>
              <p className="font-space-mono text-xs text-gray-400 mt-0.5">
                {hackathon.tagline}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Grid */}
        <div className="p-4 space-y-3">
          {/* Date */}
          <InfoRow
            icon={<Calendar size={13} className="text-blue-400" />}
            label="时间"
            value={`${formatDate(hackathon.startDate)} — ${formatDate(hackathon.endDate)}`}
          />

          {/* Location */}
          {hackathon.location && (
            <InfoRow
              icon={<MapPin size={13} className="text-emerald-400" />}
              label="地点"
              value={hackathon.location}
            />
          )}

          {/* Organizer */}
          {hackathon.organizer && (
            <InfoRow
              icon={<Users size={13} className="text-purple-400" />}
              label="主办方"
              value={hackathon.organizer}
            />
          )}

          {/* Prize Pool */}
          {hackathon.prizePool && (
            <InfoRow
              icon={<Trophy size={13} className="text-amber-400" />}
              label="奖金池"
              value={hackathon.prizePool}
            />
          )}

          {/* Website */}
          {hackathon.website && (
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-cyan-400 flex-shrink-0" />
              <span className="font-space-mono text-[10px] text-gray-500 w-12 flex-shrink-0">
                官网
              </span>
              <a
                href={hackathon.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-space-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 truncate"
              >
                {hackathon.website.replace(/^https?:\/\//, '')}
                <ExternalLink size={10} />
              </a>
            </div>
          )}

          {/* Tracks */}
          {hackathon.tracks && hackathon.tracks.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 mb-2">
                <Tag size={12} className="text-indigo-400" />
                <span className="font-space-mono text-[10px] text-gray-500">
                  赛道
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hackathon.tracks.map((track) => (
                  <span
                    key={track}
                    className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 font-space-mono text-[10px] text-indigo-300"
                  >
                    {track}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {hackathon.description && (
            <div className="pt-2 border-t border-white/5">
              <p className="font-space-mono text-xs text-gray-400 leading-relaxed">
                {hackathon.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-space-mono text-[10px] text-gray-500 w-12 flex-shrink-0">
        {label}
      </span>
      <span className="font-space-mono text-xs text-gray-300 truncate">
        {value}
      </span>
    </div>
  );
}
