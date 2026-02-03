'use client';

import { useMemo, useRef, useState } from 'react';
import type { DraftHackathon } from '@/scrapers/core/types';

type PosterTheme = {
  id: string;
  name: string;
  background: [string, string];
  accent: string;
  highlight: string;
};

const posterThemes: PosterTheme[] = [
  { id: 'aurora', name: '极光蓝', background: ['#0B1020', '#2E1065'], accent: '#22D3EE', highlight: '#A5B4FC' },
  { id: 'sunset', name: '日落橙', background: ['#1C0B10', '#7C2D12'], accent: '#FDBA74', highlight: '#FDE68A' },
  { id: 'forest', name: '森林绿', background: ['#051B12', '#064E3B'], accent: '#34D399', highlight: '#6EE7B7' },
  { id: 'neon', name: '霓虹紫', background: ['#16062E', '#4C1D95'], accent: '#F472B6', highlight: '#C4B5FD' }
];

const posterSize = { width: 1080, height: 1350 };

function formatLabel(value?: string) {
  if (!value) return '';
  if (value === 'offline') return '线下';
  if (value === 'online') return '线上';
  if (value === 'hybrid') return '混合';
  return value;
}

function wrapText(text: string, maxUnits: number) {
  if (!text) return [''];
  const lines: string[] = [];
  let current = '';
  let units = 0;

  for (const char of Array.from(text)) {
    const isWide = char.charCodeAt(0) > 255;
    const charUnits = isWide ? 1 : 0.6;
    if (units + charUnits > maxUnits) {
      lines.push(current);
      current = char;
      units = charUnits;
    } else {
      current += char;
      units += charUnits;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 3);
}

function makeSvgDataUrl(svgString: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

export function PosterDesigner({ hackathon }: { hackathon: DraftHackathon }) {
  const [themeId, setThemeId] = useState(posterThemes[0].id);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const theme = useMemo(
    () => posterThemes.find(t => t.id === themeId) || posterThemes[0],
    [themeId]
  );

  const titleLines = useMemo(() => wrapText(hackathon.name || '未命名黑客松', 9.5), [hackathon.name]);
  const summaryLines = useMemo(() => wrapText(hackathon.summary || '快速集结开发者，打造下一代创新产品。', 18), [hackathon.summary]);

  const tags = useMemo(() => {
    const items = [
      formatLabel(hackathon.format),
      hackathon.theme,
      hackathon.prizePool ? `奖金 ${hackathon.prizePool}` : '',
      hackathon.teams ? `队伍 ${hackathon.teams}` : ''
    ].filter(Boolean) as string[];
    return items.slice(0, 3);
  }, [hackathon.format, hackathon.prizePool, hackathon.theme, hackathon.teams]);

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${hackathon.shortName || 'hackathon'}-poster.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = posterSize.width;
      canvas.height = posterSize.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${hackathon.shortName || 'hackathon'}-poster.png`;
        anchor.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = makeSvgDataUrl(svgString);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-space-mono text-sm font-medium text-gray-400">
            封面海报
          </h4>
          <p className="font-space-mono text-xs text-gray-500 mt-1">
            自动基于草稿信息生成海报，可下载 SVG/PNG
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={themeId}
            onChange={(e) => setThemeId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-xs"
          >
            {posterThemes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleDownloadSvg}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-xs text-gray-300"
          >
            下载 SVG
          </button>
          <button
            onClick={handleDownloadPng}
            className="px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors font-space-mono text-xs text-indigo-200"
          >
            下载 PNG
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="w-full overflow-hidden rounded-2xl border border-white/10">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${posterSize.width} ${posterSize.height}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.background[0]} />
                <stop offset="100%" stopColor={theme.background[1]} />
              </linearGradient>
              <radialGradient id="glow" cx="0.15" cy="0.1" r="0.8">
                <stop offset="0%" stopColor={theme.highlight} stopOpacity="0.6" />
                <stop offset="100%" stopColor={theme.background[0]} stopOpacity="0" />
              </radialGradient>
              <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="20" stdDeviation="30" floodColor="#000" floodOpacity="0.35" />
              </filter>
            </defs>

            <rect width="1080" height="1350" fill="url(#bg)" />
            <rect width="1080" height="1350" fill="url(#glow)" />

            <circle cx="880" cy="210" r="160" fill={theme.accent} opacity="0.12" />
            <circle cx="200" cy="1100" r="220" fill={theme.highlight} opacity="0.12" />

            <rect x="80" y="90" width="920" height="1170" rx="48" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />

            <text x="140" y="210" fill={theme.highlight} fontSize="28" fontFamily="Space Mono, sans-serif" letterSpacing="4">
              HACKERTRIP PRESENTS
            </text>

            <text fill="#FFFFFF" fontSize="86" fontFamily="Sora, sans-serif" fontWeight="700">
              {titleLines.map((line, index) => (
                <tspan key={line + index} x="140" y={320 + index * 96}>
                  {line}
                </tspan>
              ))}
            </text>

            <text x="140" y="620" fill="rgba(255,255,255,0.8)" fontSize="36" fontFamily="Space Mono, sans-serif">
              {hackathon.dateRange || '时间待定'} · {hackathon.city || '城市待定'}
            </text>

            <text fill="rgba(255,255,255,0.7)" fontSize="28" fontFamily="Space Mono, sans-serif">
              {summaryLines.map((line, index) => (
                <tspan key={line + index} x="140" y={700 + index * 40}>
                  {line}
                </tspan>
              ))}
            </text>

            <g filter="url(#softShadow)">
              <rect x="140" y="820" width="800" height="210" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.08)" />
              <text x="180" y="875" fill="#FFFFFF" fontSize="26" fontFamily="Space Mono, sans-serif">
                亮点
              </text>

              {tags.map((tag, index) => {
                const x = 180 + index * 250;
                return (
                  <g key={tag + index}>
                    <rect x={x} y="910" width="220" height="64" rx="32" fill="rgba(255,255,255,0.12)" />
                    <text x={x + 24} y="950" fill="#FFFFFF" fontSize="26" fontFamily="Space Mono, sans-serif">
                      {tag}
                    </text>
                  </g>
                );
              })}
            </g>

            <g>
              <rect x="140" y="1060" width="180" height="180" rx="20" fill="rgba(255,255,255,0.12)" />
              <rect x="160" y="1080" width="140" height="140" rx="14" fill="rgba(255,255,255,0.2)" />
              <text x="170" y="1160" fill="rgba(255,255,255,0.8)" fontSize="20" fontFamily="Space Mono, sans-serif">
                二维码
              </text>
            </g>

            <text x="360" y="1110" fill="rgba(255,255,255,0.7)" fontSize="26" fontFamily="Space Mono, sans-serif">
              官网
            </text>
            <text x="360" y="1150" fill="#FFFFFF" fontSize="30" fontFamily="Space Mono, sans-serif">
              {hackathon.website ? hackathon.website.replace(/^https?:\/\//, '') : '待补充'}
            </text>

            <text x="360" y="1210" fill="rgba(255,255,255,0.6)" fontSize="22" fontFamily="Space Mono, sans-serif">
              {hackathon.venue ? `地点 ${hackathon.venue}` : '地点待定'}
            </text>

            <text x="140" y="1290" fill="rgba(255,255,255,0.5)" fontSize="22" fontFamily="Space Mono, sans-serif" letterSpacing="3">
              DESIGN BY HACKERTRIP STUDIO
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
