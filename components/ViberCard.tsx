'use client';

import Image from 'next/image';

export interface ViberCardData {
  name: string;
  username: string;
  image: string | null;
  github: string | null;
  level: number;
  title: string;
  titleColor: string;
  hackathons: number;
  teams: number;
  streak: number;
  matchScore: number;
  skills: string[];
  projects: string[];
  damc: { D: number; A: number; M: number; C: number } | null;
  totalTokens: string;
  serialNo: string;
}

function StatCell({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="relative px-3 py-2.5 text-center rounded-lg overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(124,93,255,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      <div className="text-base font-bold font-mono tracking-tight" style={{ color: accent || '#ededed' }}>
        {value}
      </div>
      <div className="text-[8px] font-mono uppercase tracking-[0.15em] text-white/25 mt-0.5">{label}</div>
    </div>
  );
}

function DamcBar({ letter, value, color }: { letter: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono font-bold" style={{ color }}>{letter}</span>
        <span className="text-[9px] font-mono text-white/30">{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

export function ViberCard({ data }: { data: ViberCardData }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        aspectRatio: '1.586 / 1',
        width: '100%',
        maxWidth: '480px',
        background: 'linear-gradient(145deg, #1a1a2e 0%, #141428 30%, #0f0f22 60%, #0a0a1a 100%)',
        border: '1px solid rgba(124,93,255,0.15)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 1px rgba(124,93,255,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Brushed metal texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1] opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 3px)',
        }}
      />

      {/* Scanline overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[2] opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.5) 1px, rgba(255,255,255,0.5) 2px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Glass shine — purple tint */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'linear-gradient(115deg, transparent 25%, rgba(124,93,255,0.06) 42%, rgba(77,225,255,0.08) 48%, rgba(124,93,255,0.04) 54%, transparent 70%)',
        }}
      />

      {/* Corner HUD decorations */}
      <svg aria-hidden className="absolute top-3 left-3 w-4 h-4 text-[var(--accent-1)] opacity-30 z-[4]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M0 6V1h5M0 10v5h5" />
      </svg>
      <svg aria-hidden className="absolute top-3 right-3 w-4 h-4 text-[var(--accent-3)] opacity-30 z-[4]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 6V1h-5M16 10v5h-5" />
      </svg>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col px-5 py-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/20 font-mono">ViberCard</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_6px_var(--accent-1)]" style={{ background: data.titleColor }} />
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold" style={{ color: data.titleColor }}>
              Lv.{data.level}
            </span>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(124,93,255,0.2)] to-transparent mb-3" />

        {/* Profile row */}
        <div className="flex items-center gap-3 mb-3">
          {data.image ? (
            <Image
              src={data.image}
              alt=""
              width={40}
              height={40}
              className="rounded-lg shrink-0"
              style={{
                border: '1px solid rgba(124,93,255,0.2)',
                boxShadow: '0 0 12px rgba(124,93,255,0.15)',
              }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, #7c5dff 0%, #c759ff 100%)',
                boxShadow: '0 0 12px rgba(124,93,255,0.3)',
              }}
            >
              {(data.name || '?')[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-white truncate tracking-tight">{data.name}</div>
            <div className="text-[11px] text-white/35 font-mono">@{data.username}</div>
          </div>
          <div
            className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0"
            style={{
              color: data.titleColor,
              border: `1px solid ${data.titleColor}30`,
              background: `${data.titleColor}10`,
              boxShadow: `0 0 8px ${data.titleColor}15`,
            }}
          >
            {data.title}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <StatCell label="黑客松" value={data.hackathons} accent="#7c5dff" />
          <StatCell label="组队" value={data.teams} accent="#c759ff" />
          <StatCell label="连胜" value={data.streak} accent="#4de1ff" />
          <StatCell label="匹配" value={data.matchScore} accent="#ededed" />
        </div>

        {/* DAMC + Tokens row */}
        <div className="flex gap-3 mb-3 flex-1 min-h-0">
          {/* DAMC */}
          {data.damc && (
            <div className="flex-1">
              <div className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/20 mb-1.5">DAMC</div>
              <div className="flex gap-1.5">
                <DamcBar letter="D" value={data.damc.D} color="#7c5dff" />
                <DamcBar letter="A" value={data.damc.A} color="#c759ff" />
                <DamcBar letter="M" value={data.damc.M} color="#4de1ff" />
                <DamcBar letter="C" value={data.damc.C} color="#ff6b9d" />
              </div>
            </div>
          )}
          {/* Token consumption */}
          <div className={data.damc ? 'w-24 shrink-0' : 'flex-1'}>
            <div className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/20 mb-1.5">Tokens</div>
            <div
              className="rounded-lg px-2 py-2 text-center"
              style={{
                background: 'rgba(124,93,255,0.06)',
                border: '1px solid rgba(124,93,255,0.1)',
              }}
            >
              <div className="text-lg font-bold font-mono text-[#4de1ff] tracking-tight leading-none">
                {data.totalTokens}
              </div>
              <div className="text-[7px] font-mono uppercase text-white/20 mt-1">consumed</div>
            </div>
          </div>
        </div>

        {/* Skills tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {data.skills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded text-[10px] font-mono text-white/50"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {skill}
            </span>
          ))}
          {data.skills.length > 6 && (
            <span className="px-2 py-0.5 text-[10px] font-mono text-white/25">
              +{data.skills.length - 6}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid rgba(124,93,255,0.08)' }}>
          <div className="flex gap-2 text-white/15">
            {data.github && (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          {data.projects.length > 0 && (
            <div className="flex gap-1">
              {data.projects.slice(0, 3).map((p) => (
                <span
                  key={p}
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono text-white/30"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          <span className="text-[9px] font-mono text-white/15 tracking-wider">
            {data.serialNo}
          </span>
        </div>
      </div>
    </div>
  );
}
