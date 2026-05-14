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

interface TemplateConfig {
  brandName: string;
  tagline: string;
  taglineColor: string;
  taglineSize: number;
  summaryMaxChars: number;
  ctaLine1: string;
  ctaLine2: string;
  qrUrl: string;
  urlDisplay: string;
  footer: string;
}

const defaultTemplate: TemplateConfig = {
  brandName: 'HackerTrip',
  tagline: '连接创造者，加速从 0 到 1',
  taglineColor: 'rgba(255,255,255,0.4)',
  taglineSize: 18,
  summaryMaxChars: 80,
  ctaLine1: '扫码了解详情',
  ctaLine2: '& 报名参赛',
  qrUrl: 'https://hackertrip.space',
  urlDisplay: 'hackertrip.space',
  footer: 'POWERED BY HACKERTRIP',
};

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

const TPL_STORAGE_KEY = 'hackertrip-poster-template';

function loadSavedTemplate(): TemplateConfig {
  if (typeof window === 'undefined') return defaultTemplate;
  try {
    const saved = localStorage.getItem(TPL_STORAGE_KEY);
    if (saved) return { ...defaultTemplate, ...JSON.parse(saved) };
  } catch {}
  return defaultTemplate;
}

export function PosterDesigner({ hackathon }: { hackathon: DraftHackathon }) {
  const [themeId, setThemeId] = useState(posterThemes[0].id);
  const [tpl, setTpl] = useState<TemplateConfig>(loadSavedTemplate);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [tplSaved, setTplSaved] = useState(false);

  const handleSaveTemplate = () => {
    localStorage.setItem(TPL_STORAGE_KEY, JSON.stringify(tpl));
    setTplSaved(true);
    setTimeout(() => setTplSaved(false), 2000);
  };

  const handleResetTemplate = () => {
    setTpl(defaultTemplate);
    localStorage.removeItem(TPL_STORAGE_KEY);
  };

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
    QRCode.toDataURL(tpl.qrUrl || 'https://hackertrip.space', {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [tpl.qrUrl]);

  const displayName = truncate(hackathon.shortName || hackathon.name || '未命名黑客松', 16);
  const titleSize = displayName.length <= 8 ? 76 : displayName.length <= 12 ? 62 : 50;

  const summaryLines = useMemo(
    () => wrapText(truncate(hackathon.summary || '', tpl.summaryMaxChars), 52, 3),
    [hackathon.summary, tpl.summaryMaxChars]
  );

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

  const tracks = useMemo(() => {
    const t = hackathon.tracks || [];
    return t.slice(0, 5).map((tr) => {
      const desc = tr.description ? ` — ${tr.description}` : '';
      return truncate(`${tr.title}${desc}`, 36);
    });
  }, [hackathon.tracks]);

  const organizers = useMemo(() => {
    const o = hackathon.organizers || [];
    return o.slice(0, 4).map((org: { name: string }) => org.name);
  }, [hackathon.organizers]);

  const headerY = 60;
  const titleY = 200;
  const dateY = titleSize <= 50 ? 270 : 290;
  const summaryY = dateY + 54;
  const cardsY = summaryY + summaryLines.length * 38 + 30;
  const cardW = (W - PAD * 2 - 20) / 2;
  const cardH = 90;
  const tracksY = cardsY + cardH * 2 + 20 + 30;
  const trackSpacingCalc = tracks.length <= 3 ? 56 : tracks.length <= 4 ? 50 : 44;
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

  const tplField = (label: string, key: keyof TemplateConfig) => (
    <div>
      <label className="block font-space-mono text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={tpl[key]}
        onChange={(e) => setTpl((prev) => ({ ...prev, [key]: e.target.value }))}
        className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-xs"
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <h4 className="font-space-mono text-sm font-medium text-gray-400">分享海报</h4>

      <div className="flex gap-4 items-start">
        {/* Left: Poster Preview — 2/3 width */}
        <div className="w-2/3 shrink-0 rounded-xl border border-white/10" style={{ aspectRatio: `${W}/${H}` }}>
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
              <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a5b4fc" />
                <stop offset="50%" stopColor="#c4b5fd" />
                <stop offset="100%" stopColor="#f9a8d4" />
              </linearGradient>
            </defs>

            <rect width={W} height={H} fill="url(#poster-bg)" />
            <rect width={W} height={H} fill="url(#poster-glow1)" />
            <rect width={W} height={H} fill="url(#poster-glow2)" />
            <circle cx={W - 120} cy={160} r={140} fill={theme.accent} opacity="0.08" />
            <circle cx={140} cy={H - 200} r={180} fill={theme.highlight} opacity="0.08" />

            {/* Header: logo + brand (gradient) + tagline on one line */}
            {logoDataUrl && <image href={logoDataUrl} x={PAD} y={headerY - 6} width="48" height="48" />}
            <text x={PAD + 60} y={headerY + 24} fill="url(#brand-gradient)" fontSize="28" fontWeight="700" fontFamily="Sora, sans-serif" letterSpacing="2">
              {tpl.brandName}
            </text>
            <text x={PAD + 60 + tpl.brandName.length * 18 + 16} y={headerY + 24} fill={tpl.taglineColor} fontSize={tpl.taglineSize} fontFamily="Sora, sans-serif">
              {tpl.tagline}
            </text>
            <line x1={PAD} y1={headerY + 56} x2={W - PAD} y2={headerY + 56} stroke={theme.accent} strokeOpacity="0.25" strokeWidth="1.5" />

            {/* Title */}
            <text x={PAD} y={titleY} fill="#FFFFFF" fontSize={titleSize} fontWeight="700" fontFamily="Sora, sans-serif">
              {displayName}
            </text>

            {/* Date · City · Organizers */}
            <text x={PAD} y={dateY} fill={theme.accent} fontSize="32" fontWeight="500" fontFamily="Sora, sans-serif">
              {truncate(hackathon.dateRange || '时间待定', 20)} · {truncate(hackathon.city || '城市待定', 6)}
              {organizers.length > 0 && (
                <tspan fill="rgba(255,255,255,0.45)" fontSize="24"> | {organizers.join(' · ')}</tspan>
              )}
            </text>

            {/* Summary */}
            {summaryLines.length > 0 && (
              <text fill="rgba(255,255,255,0.55)" fontSize="26" fontFamily="Sora, sans-serif">
                {summaryLines.map((line, i) => (
                  <tspan key={i} x={PAD} y={summaryY + i * 38}>{line}</tspan>
                ))}
              </text>
            )}

            {/* 4 Info Cards */}
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

            {/* Tracks */}
            {tracks.length > 0 && (() => {
              const trackSpacing = tracks.length <= 3 ? 56 : tracks.length <= 4 ? 50 : 44;
              const trackFontSize = tracks.length <= 3 ? 30 : tracks.length <= 4 ? 28 : 24;
              return (
                <g>
                  <text x={PAD} y={tracksY} fill="rgba(255,255,255,0.7)" fontSize="22" fontWeight="600" fontFamily="Sora, sans-serif" letterSpacing="2">
                    赛道
                  </text>
                  <line x1={PAD + 60} y1={tracksY - 6} x2={W - PAD} y2={tracksY - 6} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  {tracks.map((title, i) => (
                    <g key={i}>
                      <circle cx={PAD + 18} cy={tracksY + 40 + i * trackSpacing} r="6" fill={theme.accent} opacity="0.8" />
                      <text x={PAD + 38} y={tracksY + 48 + i * trackSpacing} fill="rgba(255,255,255,0.8)" fontSize={trackFontSize} fontWeight="500" fontFamily="Sora, sans-serif">
                        {title}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}

            {/* QR Code Section */}
            <rect x={PAD} y={qrY} width={W - PAD * 2} height={250} rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
            <rect x={PAD + 20} y={qrY + 15} width="220" height="220" rx="14" fill="#ffffff" />
            {qrDataUrl && <image href={qrDataUrl} x={PAD + 24} y={qrY + 19} width="212" height="212" />}
            <text x={PAD + 270} y={qrY + 75} fill="#FFFFFF" fontSize="32" fontWeight="700" fontFamily="Sora, sans-serif">
              {tpl.ctaLine1}
            </text>
            <text x={PAD + 270} y={qrY + 118} fill="#FFFFFF" fontSize="32" fontWeight="700" fontFamily="Sora, sans-serif">
              {tpl.ctaLine2}
            </text>
            <text x={PAD + 270} y={qrY + 172} fill={theme.accent} fontSize="24" fontFamily="Sora, sans-serif" letterSpacing="1">
              {tpl.urlDisplay}
            </text>

            {/* Footer */}
            <text x={W / 2} y={H - 24} fill="rgba(255,255,255,0.3)" fontSize="18" fontFamily="Sora, sans-serif" textAnchor="middle" letterSpacing="3">
              {tpl.footer}
            </text>
          </svg>
        </div>

        {/* Right: Controls Panel */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Theme Selector */}
          <div>
            <label className="block font-space-mono text-xs text-gray-500 mb-2">配色风格</label>
            <div className="grid grid-cols-2 gap-2">
              {posterThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`px-3 py-2 rounded-lg border font-space-mono text-xs transition-colors ${
                    themeId === t.id
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: t.accent }} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Template Fields */}
          <div>
            <label className="block font-space-mono text-xs text-gray-500 mb-2">模板内容</label>
            <div className="space-y-2">
              {tplField('品牌名', 'brandName')}
              {tplField('品牌标语', 'tagline')}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-space-mono text-xs text-gray-500 mb-1">标语颜色</label>
                  <input
                    type="color"
                    value={tpl.taglineColor.startsWith('rgba') ? '#9ca3af' : tpl.taglineColor}
                    onChange={(e) => setTpl((prev) => ({ ...prev, taglineColor: e.target.value }))}
                    className="w-full h-8 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-space-mono text-xs text-gray-500 mb-1">标语字号</label>
                  <input
                    type="number"
                    min={12}
                    max={32}
                    value={tpl.taglineSize}
                    onChange={(e) => setTpl((prev) => ({ ...prev, taglineSize: Number(e.target.value) || 18 }))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block font-space-mono text-xs text-gray-500 mb-1">简介字数上限</label>
                <input
                  type="number"
                  min={20}
                  max={200}
                  value={tpl.summaryMaxChars}
                  onChange={(e) => setTpl((prev) => ({ ...prev, summaryMaxChars: Number(e.target.value) || 80 }))}
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50 font-space-mono text-xs"
                />
              </div>
              {tplField('CTA 第一行', 'ctaLine1')}
              {tplField('CTA 第二行', 'ctaLine2')}
              {tplField('二维码链接', 'qrUrl')}
              {tplField('显示网址', 'urlDisplay')}
              {tplField('底部文字', 'footer')}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors font-space-mono text-xs text-green-300 border border-green-500/30"
                >
                  {tplSaved ? '已保存 ✓' : '保存模板'}
                </button>
                <button
                  onClick={handleResetTemplate}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-xs text-gray-400 border border-white/10"
                >
                  恢复默认
                </button>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div>
            <label className="block font-space-mono text-xs text-gray-500 mb-2">导出</label>
            <div className="flex gap-2">
              <button onClick={handleDownloadSvg} className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-space-mono text-xs text-gray-300 border border-white/10">
                SVG
              </button>
              <button onClick={handleDownloadPng} className="flex-1 px-3 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors font-space-mono text-xs text-indigo-200 border border-indigo-500/30">
                PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
