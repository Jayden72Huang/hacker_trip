'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DraftHackathon } from '@/scrapers/core/types';
import type { InfoCard } from '@/data/hackathons';
import QRCode from 'qrcode';

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
  { id: 'neon', name: '霓虹紫', background: ['#16062E', '#4C1D95'], accent: '#F472B6', highlight: '#C4B5FD' },
];

const W = 1080;
const H = 1350;
const PAD = 80;

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let current = '';
  let count = 0;
  for (const char of Array.from(text)) {
    const w = char.charCodeAt(0) > 255 ? 2 : 1;
    if (count + w > maxChars && current) {
      lines.push(current);
      current = char;
      count = w;
    } else {
      current += char;
      count += w;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.slice(0, -1) + '…';
  }
  return lines;
}

function makeSvgDataUrl(svgString: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

export function PosterDesigner({ hackathon }: { hackathon: DraftHackathon }) {
  const [themeId, setThemeId] = useState(posterThemes[0].id);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');

  const theme = useMemo(
    () => posterThemes.find((t) => t.id === themeId) || posterThemes[0],
    [themeId]
  );

  useEffect(() => {
    fetch('/logo.png')
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => setLogoDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    QRCode.toDataURL('https://hackertrip.space', {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, []);

  // Title: prefer shortName, truncate to 16 chars max
  const displayName = truncate(hackathon.shortName || hackathon.name || '未命名黑客松', 16);
  const titleSize = displayName.length <= 8 ? 76 : displayName.length <= 12 ? 62 : 50;

  // Summary: max 2 lines, ~20 chars per line
  const summaryLines = useMemo(
    () => wrapText(truncate(hackathon.summary || '', 60), 36, 2),
    [hackathon.summary]
  );

  // 4 info cards from editor's infoCards, or fallback to auto-generated
  const cards = useMemo(() => {
    const editorCards = (hackathon as unknown as Record<string, unknown>).infoCards as InfoCard[] | undefined;
    if (editorCards && editorCards.length >= 4) {
      return editorCards.slice(0, 4).map((c) => ({
        label: truncate(c.label, 6),
        value: truncate(c.value, 12),
      }));
    }
    return [
      { label: '奖金池', value: truncate(hackathon.prizePool || '—', 12) },
      { label: '规模', value: truncate(hackathon.teams || '—', 12) },
      { label: '主题', value: truncate(hackathon.theme || '—', 12) },
      { label: '地点', value: truncate(hackathon.venue || hackathon.city || '—', 12) },
    ];
  }, [hackathon]);

  // Tracks: max 4 tracks, title only
  const tracks = useMemo(() => {
    const t = hackathon.tracks || [];
    return t.slice(0, 4).map((tr) => truncate(tr.title, 18));
  }, [hackathon.tracks]);

  // ---- Fixed Y Layout ----
  const headerY = 60;
  const titleY = 200;
  const dateY = titleSize <= 50 ? 270 : 290;
  const summaryY = dateY + 54;
  const cardsY = summaryY + summaryLines.length * 38 + 30;
  const cardW = (W - PAD * 2 - 20) / 2; // 2 columns with 20px gap
  const cardH = 90;
  const tracksY = cardsY + cardH * 2 + 20 + 30;
  const qrY = 1040;

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hackathon.shortName || 'hackathon'}-poster.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${hackathon.shortName || 'hackathon'}-poster.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = makeSvgDataUrl(svgString);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-space-mono text-sm font-medium text-gray-400">分享海报</h4>
          <p className="font-space-mono text-xs text-gray-500 mt-1">
            自动生成带二维码的分享海报，扫码可进入 HackerTrip 平台
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={themeId}
            onChange={(e) => setThemeId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-xs"
          >
            {posterThemes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button onClick={handleDownloadSvg} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-xs text-gray-300">
            下载 SVG
          </button>
          <button onClick={handleDownloadPng} className="px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors font-space-mono text-xs text-indigo-200">
            下载 PNG
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
        <div className="w-full overflow-hidden rounded-2xl border border-white/10">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="poster-bg" x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0%" stopColor={theme.background[0]} />
                <stop offset="100%" stopColor={theme.background[1]} />
              </linearGradient>
              <radialGradient id="poster-glow1" cx="0.85" cy="0.1" r="0.5">
                <stop offset="0%" stopColor={theme.accent} stopOpacity="0.18" />
                <stop offset="100%" stopColor={theme.background[0]} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="poster-glow2" cx="0.15" cy="0.9" r="0.5">
                <stop offset="0%" stopColor={theme.highlight} stopOpacity="0.12" />
                <stop offset="100%" stopColor={theme.background[0]} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background */}
            <rect width={W} height={H} fill="url(#poster-bg)" />
            <rect width={W} height={H} fill="url(#poster-glow1)" />
            <rect width={W} height={H} fill="url(#poster-glow2)" />
            <circle cx={W - 120} cy={160} r={140} fill={theme.accent} opacity="0.08" />
            <circle cx={140} cy={H - 200} r={180} fill={theme.highlight} opacity="0.08" />

            {/* Header: Logo + Brand */}
            {logoDataUrl && <image href={logoDataUrl} x={PAD} y={headerY - 6} width="48" height="48" />}
            <text x={PAD + 60} y={headerY + 28} fill="rgba(255,255,255,0.85)" fontSize="24" fontWeight="600" fontFamily="Sora, sans-serif" letterSpacing="3">
              HACKERTRIP
            </text>
            <line x1={PAD} y1={headerY + 52} x2={W - PAD} y2={headerY + 52} stroke={theme.accent} strokeOpacity="0.25" strokeWidth="1.5" />

            {/* Title — single line, truncated */}
            <text x={PAD} y={titleY} fill="#FFFFFF" fontSize={titleSize} fontWeight="700" fontFamily="Sora, sans-serif">
              {displayName}
            </text>

            {/* Date · City */}
            <text x={PAD} y={dateY} fill={theme.accent} fontSize="32" fontWeight="500" fontFamily="Sora, sans-serif">
              {truncate(hackathon.dateRange || '时间待定', 20)} · {truncate(hackathon.city || '城市待定', 6)}
            </text>

            {/* Summary */}
            {summaryLines.length > 0 && (
              <text fill="rgba(255,255,255,0.55)" fontSize="26" fontFamily="Sora, sans-serif">
                {summaryLines.map((line, i) => (
                  <tspan key={i} x={PAD} y={summaryY + i * 38}>{line}</tspan>
                ))}
              </text>
            )}

            {/* 4 Info Cards — 2×2 grid */}
            {cards.map((card, i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              const x = PAD + col * (cardW + 20);
              const y = cardsY + row * (cardH + 16);
              return (
                <g key={i}>
                  <rect x={x} y={y} width={cardW} height={cardH} rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
                  <text x={x + 24} y={y + 36} fill={theme.accent} fontSize="20" fontFamily="Sora, sans-serif" opacity="0.9">
                    {card.label}
                  </text>
                  <text x={x + 24} y={y + 68} fill="#FFFFFF" fontSize="26" fontWeight="600" fontFamily="Sora, sans-serif">
                    {card.value}
                  </text>
                </g>
              );
            })}

            {/* Tracks Section */}
            {tracks.length > 0 && (
              <g>
                <text x={PAD} y={tracksY} fill="rgba(255,255,255,0.7)" fontSize="22" fontWeight="600" fontFamily="Sora, sans-serif" letterSpacing="2">
                  赛道
                </text>
                <line x1={PAD + 60} y1={tracksY - 6} x2={W - PAD} y2={tracksY - 6} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                {tracks.map((title, i) => (
                  <g key={i}>
                    <circle cx={PAD + 16} cy={tracksY + 38 + i * 44} r="5" fill={theme.accent} opacity="0.7" />
                    <text x={PAD + 34} y={tracksY + 44 + i * 44} fill="rgba(255,255,255,0.75)" fontSize="24" fontFamily="Sora, sans-serif">
                      {title}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* QR Code Section */}
            <rect x={PAD} y={qrY} width={W - PAD * 2} height={250} rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
            <rect x={PAD + 20} y={qrY + 15} width="220" height="220" rx="14" fill="#ffffff" />
            {qrDataUrl && <image href={qrDataUrl} x={PAD + 24} y={qrY + 19} width="212" height="212" />}
            <text x={PAD + 270} y={qrY + 75} fill="#FFFFFF" fontSize="32" fontWeight="700" fontFamily="Sora, sans-serif">
              扫码了解详情
            </text>
            <text x={PAD + 270} y={qrY + 118} fill="#FFFFFF" fontSize="32" fontWeight="700" fontFamily="Sora, sans-serif">
              & 报名参赛
            </text>
            <text x={PAD + 270} y={qrY + 172} fill={theme.accent} fontSize="24" fontFamily="Sora, sans-serif" letterSpacing="1">
              hackertrip.space
            </text>

            {/* Footer */}
            <text x={W / 2} y={H - 24} fill="rgba(255,255,255,0.3)" fontSize="18" fontFamily="Sora, sans-serif" textAnchor="middle" letterSpacing="3">
              POWERED BY HACKERTRIP
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
