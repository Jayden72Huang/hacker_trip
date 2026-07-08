/**
 * ============================================================================
 *  HackerTrip — 客户端 Canvas 卡图兜底渲染 (无第三方依赖)
 * ============================================================================
 *
 *  当 og 路由 (/api/identity/og) 在 Cloudflare 上不可用时，
 *  下载/复制图片回退到本模块：用浏览器原生 Canvas 2D 绘制一张
 *  1200x630 身份卡 PNG，视觉与 og 同源（角色渐变 + 角色名 + 统计条）。
 *
 *  纯客户端、零 npm 依赖，避免引入 html-to-image。
 * ============================================================================
 */

import { ROLE_MAP, CARD_DIMENSIONS, type IdentityCardData } from '@/lib/identity/types';

const BG = '#05060a';
const FG = '#ededed';
const MUTED = 'rgba(237,237,237,0.62)';
const GOLD = '#ffcf5c';

function isWin(placement?: string | null): boolean {
  if (!placement) return false;
  return /1st|2nd|3rd|first|second|third|winner|champion|finalist|grand|冠|亚|季|获奖|入围/i.test(
    placement,
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * renderIdentityCardToCanvas — 绘制身份卡并返回 PNG Blob。
 */
export async function renderIdentityCardToCanvas(data: IdentityCardData): Promise<Blob> {
  const W = CARD_DIMENSIONS.width;
  const H = CARD_DIMENSIONS.height;
  const meta = ROLE_MAP[data.role.primary];

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 背景
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // 角色渐变光晕（右上 / 左下）
  const glow1 = ctx.createRadialGradient(W - 120, -160 + 310, 60, W - 120, -160 + 310, 360);
  glow1.addColorStop(0, hexA(meta.colorFrom, 0.34));
  glow1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(-160 + 280, H + 200 - 280, 60, -160 + 280, H + 200 - 280, 340);
  glow2.addColorStop(0, hexA(meta.colorTo, 0.25));
  glow2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // 顶部渐变条
  const topbar = ctx.createLinearGradient(0, 0, W, 0);
  topbar.addColorStop(0, meta.colorFrom);
  topbar.addColorStop(1, meta.colorTo);
  ctx.fillStyle = topbar;
  ctx.fillRect(0, 0, W, 8);

  const PX = 72;

  // 头部品牌行
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 26px Sora, system-ui, sans-serif';
  ctx.fillStyle = FG;
  ctx.fillText('Hacker', PX, 72);
  const hackerW = ctx.measureText('Hacker').width;
  ctx.fillStyle = meta.colorTo;
  ctx.fillText('Trip', PX + hackerW, 72);
  const tripW = ctx.measureText('Trip').width;
  ctx.font = '400 24px Sora, system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText('· 黑客松身份卡', PX + hackerW + tripW + 14, 72);

  ctx.textAlign = 'right';
  ctx.fillText(`@${data.username}`, W - PX, 72);
  ctx.textAlign = 'left';

  // 小标题
  ctx.font = '400 30px Sora, system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText('我的黑客松角色', PX, 168);

  // emoji + 角色名（渐变）
  ctx.font = '90px sans-serif';
  ctx.fillStyle = FG;
  ctx.fillText(meta.emoji, PX, 268);
  const emojiW = ctx.measureText(meta.emoji).width;

  const nameGrad = ctx.createLinearGradient(PX + emojiW + 24, 0, PX + emojiW + 24 + 600, 0);
  nameGrad.addColorStop(0, meta.colorFrom);
  nameGrad.addColorStop(1, meta.colorTo);
  ctx.font = '800 84px Sora, system-ui, sans-serif';
  ctx.fillStyle = nameGrad;
  ctx.fillText(meta.name, PX + emojiW + 24, 262);

  // tagline
  ctx.font = '400 30px Sora, system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  wrapText(ctx, meta.tagline, PX, 320, W - PX * 2, 40);

  // 技术栈 chips
  let chipX = PX;
  const chipY = 380;
  ctx.font = '400 24px Sora, system-ui, sans-serif';
  for (const t of data.config.techStack.slice(0, 5)) {
    const tw = ctx.measureText(t).width;
    const cw = tw + 40;
    if (chipX + cw > W - PX) break;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, chipX, chipY, cw, 44, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    roundRect(ctx, chipX, chipY, cw, 44, 22);
    ctx.stroke();
    ctx.fillStyle = FG;
    ctx.fillText(t, chipX + 20, chipY + 30);
    chipX += cw + 12;
  }

  // 履历前 3
  let rowY = 478;
  ctx.font = '400 25px Sora, system-ui, sans-serif';
  for (const c of data.career.slice(0, 3)) {
    const win = isWin(c.placement);
    ctx.fillStyle = win ? GOLD : meta.colorTo;
    ctx.beginPath();
    ctx.arc(PX + 5, rowY - 8, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = FG;
    ctx.fillText(c.hackathonName, PX + 24, rowY);
    let tx = PX + 24 + ctx.measureText(c.hackathonName).width + 16;
    if (c.placement) {
      ctx.fillStyle = win ? GOLD : MUTED;
      const ptxt = `${win ? '🏆 ' : ''}${c.placement}`;
      ctx.fillText(ptxt, tx, rowY);
      tx += ctx.measureText(ptxt).width + 16;
    }
    if (c.dateRange) {
      ctx.fillStyle = 'rgba(237,237,237,0.4)';
      ctx.font = '400 22px Sora, system-ui, sans-serif';
      ctx.fillText(c.dateRange, tx, rowY);
      ctx.font = '400 25px Sora, system-ui, sans-serif';
    }
    rowY += 40;
  }

  // 底部分隔线
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PX, H - 96);
  ctx.lineTo(W - PX, H - 96);
  ctx.stroke();

  // 统计条
  drawStat(ctx, PX, H - 40, String(data.stats.projects), '项目', FG);
  const w1 = statWidth(ctx, String(data.stats.projects), '项目');
  drawStat(ctx, PX + w1 + 40, H - 40, String(data.stats.hackathons), '比赛', FG);
  const w2 = statWidth(ctx, String(data.stats.hackathons), '比赛');
  drawStat(ctx, PX + w1 + w2 + 80, H - 40, String(data.stats.awards), '获奖', GOLD);

  // 右下邀请语
  ctx.textAlign = 'right';
  ctx.font = '600 28px Sora, system-ui, sans-serif';
  ctx.fillStyle = FG;
  ctx.fillText('看看你是什么角色？', W - PX, H - 56);
  ctx.font = '400 24px Sora, system-ui, sans-serif';
  ctx.fillStyle = meta.colorTo;
  ctx.fillText(`hackertrip.space/@${data.username}`, W - PX, H - 24);
  ctx.textAlign = 'left';

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}

function statWidth(ctx: CanvasRenderingContext2D, value: string, label: string): number {
  ctx.font = '800 48px Sora, system-ui, sans-serif';
  const vw = ctx.measureText(value).width;
  ctx.font = '400 24px Sora, system-ui, sans-serif';
  const lw = ctx.measureText(label).width;
  return vw + 10 + lw;
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: string,
  label: string,
  color: string,
) {
  ctx.font = '800 48px Sora, system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
  const vw = ctx.measureText(value).width;
  ctx.font = '400 24px Sora, system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText(label, x + vw + 10, y);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  // 中文按字符断行
  let line = '';
  let curY = y;
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = ch;
      curY += lineHeight;
      if (curY > y + lineHeight) break; // 最多 2 行
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, curY);
}

/** hex(#rrggbb) + alpha(0..1) → rgba() */
function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
