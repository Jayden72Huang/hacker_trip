'use client';

/**
 * ============================================================================
 *  HackerTrip — 分享内容包 ShareDock (裂变 Push 端)
 * ============================================================================
 *
 *  动作：复制图片 / 复制文案+链接 / 下载 PNG / 发 X(intent)。
 *  - 三版文案（invite/flex/recruit）由 buildShareContent 生成，可逐条复制。
 *  - 图片优先用 og 路由 (/api/identity/og)；CF 上 og 不可用时，
 *    下载/复制图片回退到 canvas 客户端兜底（不依赖第三方库）。
 *
 *  深色玻璃风，复用 .glass / accent 变量。
 * ============================================================================
 */

import { useMemo, useState } from 'react';
import { Copy, Download, Image as ImageIcon, Check, Share2 } from 'lucide-react';
import { buildShareContent } from '@/lib/identity/captions';
import { encodeIdentity } from '@/lib/identity/share-encode';
import { ROLE_MAP, type IdentityCardData, type ShareCaptionVariant } from '@/lib/identity/types';
import { renderIdentityCardToCanvas } from './card-canvas';

interface ShareDockProps {
  data: IdentityCardData;
  className?: string;
}

const CAPTION_LABEL: Record<ShareCaptionVariant, string> = {
  invite: '邀请式 · 传播钩子',
  flex: '炫耀式 · 履历资产',
  recruit: '招募式 · 找队友',
};

function absoluteBase(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export default function ShareDock({ data, className }: ShareDockProps) {
  // 自建卡（source==='local'）无持久化的真实 username：把卡数据编码进 URL，
  // 使分享链接 /u/...?c=<payload> 与 og 图都能还原成“用户自己的卡”，本地无
  // DB 也能完整跑通裂变闭环。mock 卡有真实主页，不需编码。
  const encoded = useMemo(
    () => (data.source === 'local' ? encodeIdentity(data) : undefined),
    [data],
  );
  const share = useMemo(
    () => buildShareContent(data, absoluteBase(), encoded),
    [data, encoded],
  );
  const role = ROLE_MAP[data.role.primary];

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [imgState, setImgState] = useState<'idle' | 'working' | 'done' | 'fallback'>('idle');
  const [pngState, setPngState] = useState<'idle' | 'working' | 'done'>('idle');

  const copyCaption = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      /* 剪贴板不可用时静默 */
    }
  };

  /** 取卡图 blob：优先 og 路由，失败回退 canvas 客户端渲染。
   *  注意：录入页本地卡（source:'local'，username 占位 'me'）og 路由查不到真实数据
   *  （og 仅识别 mock seed），会渲染成 demo-builder。此时直接走客户端 canvas，
   *  保证下载/复制的是用户自己刚生成的卡。 */
  async function getCardBlob(): Promise<{ blob: Blob; fromOg: boolean }> {
    // og 路由现在对自建卡也能出正确图（share.imageUrl 内嵌 c=<payload>）。
    // 统一优先走 og，失败再回退客户端 canvas（CF 上 og 不可用时的兜底）。
    try {
      const res = await fetch(share.imageUrl);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0 && blob.type.startsWith('image')) {
          return { blob, fromOg: true };
        }
      }
    } catch {
      /* og 不可用 → canvas 兜底 */
    }
    const blob = await renderIdentityCardToCanvas(data);
    return { blob, fromOg: false };
  }

  const copyImage = async () => {
    setImgState('working');
    try {
      const { blob, fromOg } = await getCardBlob();
      // 优先写 PNG 到剪贴板（Safari/Chrome 支持 image/png）
      const pngBlob = blob.type === 'image/png' ? blob : await toPng(blob);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      setImgState(fromOg ? 'done' : 'fallback');
      setTimeout(() => setImgState('idle'), 2200);
    } catch {
      // 复制图片失败 → 退化为下载
      await downloadPng();
      setImgState('idle');
    }
  };

  const downloadPng = async () => {
    setPngState('working');
    try {
      const { blob } = await getCardBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hackertrip-${data.username}-identity.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setPngState('done');
      setTimeout(() => setPngState('idle'), 2200);
    } catch {
      setPngState('idle');
    }
  };

  const shareToX = () => {
    const text = share.captions[0]
      .replace(share.shareUrl, '')
      .replace(/[→👉]\s*$/u, '')
      .trim();
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(share.shareUrl)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`glass rounded-3xl p-6 sm:p-7 ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <Share2 size={18} style={{ color: role.colorTo }} />
        <h3 className="text-lg font-bold text-[#ededed]">分享我的身份卡</h3>
      </div>
      <p className="text-sm text-[#ededed]/45 mb-5">
        一张卡 = 个人 IP + 社交货币。复制图片或文案，邀请朋友看看 TA 是什么角色。
      </p>

      {/* 文案三版 */}
      <div className="flex flex-col gap-3 mb-5">
        {share.captions.map((cap, i) => {
          const variant = share.captionVariants?.[i] ?? 'invite';
          const copied = copiedIdx === i;
          return (
            <div
              key={i}
              className="rounded-2xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[11px] font-mono uppercase tracking-wider"
                  style={{ color: role.colorTo }}
                >
                  {CAPTION_LABEL[variant]}
                </span>
                <button
                  onClick={() => copyCaption(cap, i)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0"
                  style={{
                    color: copied ? '#4de1ff' : 'rgba(237,237,237,0.6)',
                    background: copied ? 'rgba(77,225,255,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${copied ? 'rgba(77,225,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <p className="text-sm text-[#ededed]/85 leading-relaxed break-all">{cap}</p>
            </div>
          );
        })}
      </div>

      {/* 动作按钮 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ActionBtn
          onClick={copyImage}
          icon={imgState === 'done' || imgState === 'fallback' ? <Check size={16} /> : <ImageIcon size={16} />}
          label={
            imgState === 'working'
              ? '生成中…'
              : imgState === 'done'
                ? '已复制图片'
                : imgState === 'fallback'
                  ? '已复制(本地)'
                  : '复制图片'
          }
          accentFrom={role.colorFrom}
          accentTo={role.colorTo}
        />
        <ActionBtn
          onClick={downloadPng}
          icon={pngState === 'done' ? <Check size={16} /> : <Download size={16} />}
          label={pngState === 'working' ? '生成中…' : pngState === 'done' ? '已下载' : '下载 PNG'}
          accentFrom={role.colorFrom}
          accentTo={role.colorTo}
        />
        <ActionBtn
          onClick={shareToX}
          icon={<XIcon />}
          label="发到 X"
          accentFrom={role.colorFrom}
          accentTo={role.colorTo}
          primary
        />
      </div>

      <p
        className="mt-4 text-center text-xs text-[#ededed]/30 font-mono truncate"
        title={share.shareUrl}
      >
        🔗 {data.source === 'local' ? '链接已内嵌你的卡片数据，可直接分享预览' : share.shareUrl}
      </p>
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  accentFrom,
  accentTo,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  accentFrom: string;
  accentTo: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={
        primary
          ? {
              color: '#05060a',
              background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
            }
          : {
              color: '#ededed',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }
      }
    >
      {icon}
      {label}
    </button>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** 任意图片 blob 转 png blob（用于剪贴板写入要求 image/png） */
async function toPng(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d ctx');
  ctx.drawImage(bitmap, 0, 0);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}
