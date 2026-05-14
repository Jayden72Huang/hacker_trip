'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DraftHackathon } from '@/scrapers/core/types';
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

function calcUnits(text: string) {
  return Array.from(text).reduce((s, ch) => s + (ch.charCodeAt(0) > 255 ? 1 : 0.6), 0);
}

function wrapText(text: string, maxUnits: number, maxLines: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  let current = '';
  let units = 0;
  for (const char of Array.from(text)) {
    const w = char.charCodeAt(0) > 255 ? 1 : 0.6;
    if (units + w > maxUnits && current) {
      lines.push(current);
      current = char;
      units = w;
    } else {
      current += char;
      units += w;
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

function titleStyle(name: string) {
  const u = calcUnits(name);
  if (u <= 10) return { size: 80, max: 10, lh: 96 };
  if (u <= 15) return { size: 66, max: 13, lh: 80 };
  if (u <= 22) return { size: 54, max: 16, lh: 66 };
  return { size: 44, max: 20, lh: 54 };
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

  const name = hackathon.name || '未命名黑客松';
  const ts = useMemo(() => titleStyle(name), [name]);
  const titleLines = useMemo(() => wrapText(name, ts.max, 2), [name, ts.max]);
  const summaryLines = useMemo(
    () => wrapText(hackathon.summary || '', 20, 3),
    [hackathon.summary]
  );

  const formatMap: Record<string, string> = { offline: '线下', online: '线上', hybrid: '混合' };
  const infoItems = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    if (hackathon.format) items.push({ label: '形式', value: formatMap[hackathon.format] || hackathon.format });
    if (hackathon.prizePool) items.push({ label: '奖金', value: hackathon.prizePool.length > 14 ? hackathon.prizePool.slice(0, 14) + '…' : hackathon.prizePool });
    if (hackathon.teams) items.push({ label: '规模', value: hackathon.teams.length > 14 ? hackathon.teams.slice(0, 14) + '…' : hackathon.teams });
    if (hackathon.theme) items.push({ label: '主题', value: hackathon.theme.length > 14 ? hackathon.theme.slice(0, 14) + '…' : hackathon.theme });
    return items.slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hackathon.format, hackathon.prizePool, hackathon.teams, hackathon.theme]);

  // Dynamic Y layout
  const headerY = 70;
  const titleY = 200;
  const titleEndY = titleY + titleLines.length * ts.lh;
  const dateY = titleEndY + 30;
  const summaryY = dateY + 56;
  const summaryEndY = summaryY + summaryLines.length * 40;

  const infoRows = Math.ceil(infoItems.length / 2);
  const infoH = infoRows * 70 + 30;
  const infoY = summaryEndY + 40;

  const qrY = Math.max(infoY + infoH + 40, 1000);
  const qrBoxH = 260;

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
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
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
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
          <h4 className="font-space-mono text-sm font-medium text-gray-400">
            分享海报
          </h4>
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
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
          >
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

            {/* Decorative circles */}
            <circle cx={W - 120} cy={160} r={140} fill={theme.accent} opacity="0.08" />
            <circle cx={140} cy={H - 200} r={180} fill={theme.highlight} opacity="0.08" />

            {/* Header: Logo + Brand */}
            {logoDataUrl && (
              <image href={logoDataUrl} x={PAD} y={headerY - 8} width="52" height="52" />
            )}
            <text
              x={PAD + 64}
              y={headerY + 30}
              fill="rgba(255,255,255,0.85)"
              fontSize="26"
              fontWeight="600"
              fontFamily="Sora, sans-serif"
              letterSpacing="3"
            >
              HACKERTRIP
            </text>
            <line
              x1={PAD}
              y1={headerY + 60}
              x2={W - PAD}
              y2={headerY + 60}
              stroke={theme.accent}
              strokeOpacity="0.25"
              strokeWidth="1.5"
            />

            {/* Title */}
            <text fill="#FFFFFF" fontSize={ts.size} fontWeight="700" fontFamily="Sora, sans-serif">
              {titleLines.map((line, i) => (
                <tspan key={i} x={PAD} y={titleY + i * ts.lh}>
                  {line}
                </tspan>
              ))}
            </text>

            {/* Date · City */}
            <text
              x={PAD}
              y={dateY}
              fill={theme.accent}
              fontSize="34"
              fontWeight="500"
              fontFamily="Sora, sans-serif"
            >
              {hackathon.dateRange || '时间待定'} · {hackathon.city || '城市待定'}
            </text>

            {/* Venue */}
            {hackathon.venue && (
              <text
                x={PAD}
                y={dateY + 36}
                fill="rgba(255,255,255,0.5)"
                fontSize="24"
                fontFamily="Sora, sans-serif"
              >
                {hackathon.venue}
              </text>
            )}

            {/* Summary */}
            {summaryLines.length > 0 && (
              <text fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="Sora, sans-serif">
                {summaryLines.map((line, i) => (
                  <tspan key={i} x={PAD} y={summaryY + i * 40}>
                    {line}
                  </tspan>
                ))}
              </text>
            )}

            {/* Info Grid */}
            {infoItems.length > 0 && (
              <g>
                <rect
                  x={PAD}
                  y={infoY}
                  width={W - PAD * 2}
                  height={infoH}
                  rx="20"
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.08)"
                />
                {infoItems.map((item, i) => {
                  const col = i % 2;
                  const row = Math.floor(i / 2);
                  const x = PAD + 40 + col * 430;
                  const y = infoY + 48 + row * 70;
                  return (
                    <g key={i}>
                      <text x={x} y={y} fill={theme.accent} fontSize="20" fontFamily="Sora, sans-serif" opacity="0.8">
                        {item.label}
                      </text>
                      <text x={x + 70} y={y} fill="#FFFFFF" fontSize="24" fontWeight="500" fontFamily="Sora, sans-serif">
                        {item.value}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* QR Code Section */}
            <rect
              x={PAD}
              y={qrY}
              width={W - PAD * 2}
              height={qrBoxH}
              rx="24"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.1)"
            />

            {/* QR code with white bg for scannability */}
            <rect x={PAD + 24} y={qrY + 18} width="224" height="224" rx="16" fill="#ffffff" />
            {qrDataUrl && (
              <image href={qrDataUrl} x={PAD + 28} y={qrY + 22} width="216" height="216" />
            )}

            {/* CTA text */}
            <text
              x={PAD + 280}
              y={qrY + 80}
              fill="#FFFFFF"
              fontSize="34"
              fontWeight="700"
              fontFamily="Sora, sans-serif"
            >
              扫码了解详情
            </text>
            <text
              x={PAD + 280}
              y={qrY + 124}
              fill="#FFFFFF"
              fontSize="34"
              fontWeight="700"
              fontFamily="Sora, sans-serif"
            >
              & 报名参赛
            </text>
            <text
              x={PAD + 280}
              y={qrY + 178}
              fill={theme.accent}
              fontSize="26"
              fontFamily="Sora, sans-serif"
              letterSpacing="1"
            >
              hackertrip.space
            </text>

            {/* Footer */}
            <text
              x={W / 2}
              y={H - 28}
              fill="rgba(255,255,255,0.3)"
              fontSize="18"
              fontFamily="Sora, sans-serif"
              textAnchor="middle"
              letterSpacing="3"
            >
              POWERED BY HACKERTRIP
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
