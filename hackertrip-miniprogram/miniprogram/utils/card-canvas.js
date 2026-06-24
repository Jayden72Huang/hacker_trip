/**
 * 卡片绘制 —— Canvas 2D。深色玻璃风，与官网身份卡视觉同源。
 * 两种变体：identity（身份卡）/ config（配置卡）。
 * 逻辑尺寸固定 600x800，按 dpr 缩放，导出适配朋友圈竖图。
 */

const { ROLE_MAP, PLAY_STYLE_META, LOOKING_FOR_META } = require('./roles.js');

const W = 600;
const H = 800;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 绘制一组 chip，自动换行，返回结束 y */
function drawChips(ctx, items, x, y, maxW, opts) {
  opts = opts || {};
  const padX = 16;
  const h = 38;
  const gap = 12;
  ctx.font = '20px -apple-system, "PingFang SC", sans-serif';
  let cx = x;
  let cy = y;
  items.forEach((label) => {
    const text = String(label);
    const tw = ctx.measureText(text).width;
    const cw = tw + padX * 2;
    if (cx + cw > x + maxW) {
      cx = x;
      cy += h + gap;
    }
    ctx.fillStyle = opts.bg || 'rgba(255,255,255,0.07)';
    roundRect(ctx, cx, cy, cw, h, h / 2);
    ctx.fill();
    ctx.strokeStyle = opts.border || 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    roundRect(ctx, cx, cy, cw, h, h / 2);
    ctx.stroke();
    ctx.fillStyle = opts.color || '#d7dae2';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(text, cx + padX, cy + h / 2 + 1);
    cx += cw + gap;
  });
  return cy + h;
}

function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * 绘制卡片。
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} data 卡片数据 { variant, role, secondary[], techStack[], aiTools[], playStyle, lookingFor, hackathons, awards, projects, profile, qrImage }
 * @param {number} dpr
 */
function drawCard(ctx, data, dpr) {
  dpr = dpr || 1;
  ctx.scale(dpr, dpr);
  const role = ROLE_MAP[data.role] || ROLE_MAP.zero_to_one;
  const profile = data.profile || {};

  // 背景
  ctx.fillStyle = '#1f1e1d';
  ctx.fillRect(0, 0, W, H);

  // 顶部角色渐变光晕
  const grad = ctx.createLinearGradient(0, 0, W, 260);
  grad.addColorStop(0, hexToRgba(role.colorFrom, 0.55));
  grad.addColorStop(1, hexToRgba(role.colorTo, 0.35));
  ctx.fillStyle = grad;
  roundRect(ctx, 24, 24, W - 48, 220, 28);
  ctx.fill();

  // 卡体玻璃面板
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  roundRect(ctx, 24, 200, W - 48, H - 224, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.stroke();

  // 顶部品牌
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 22px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('HackerTrip', 52, 50);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '18px -apple-system, "PingFang SC", sans-serif';
  ctx.fillText(data.variant === 'config' ? '开发者配置卡' : '选手身份卡', 52, 82);
  if (profile.nickname) {
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = 'bold 20px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(profile.nickname, W - 52, 52, 190);
    ctx.textAlign = 'left';
  }

  // 大 emoji
  ctx.font = '90px -apple-system, "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(role.emoji, 48, 120);

  // 角色名
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px -apple-system, "PingFang SC", sans-serif';
  ctx.fillText(role.name, 170, 130);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '19px -apple-system, "PingFang SC", sans-serif';
  ctx.fillText(role.tagline, 170, 182, W - 220);

  let y = 290;

  if (data.variant === 'config') {
    // 配置卡：技术栈 / AI 工具 / 工具链
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '18px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('技术栈', 52, y);
    y = drawChips(ctx, data.techStack || [], 52, y + 28, W - 104, { bg: hexToRgba(role.colorFrom, 0.14), border: hexToRgba(role.colorFrom, 0.3), color: '#e8e3ff' }) + 28;

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('AI 工具', 52, y);
    y = drawChips(ctx, data.aiTools && data.aiTools.length ? data.aiTools : ['Claude Code', 'Cursor'], 52, y + 28, W - 104, {}) + 28;

    // 打法 + 组队徽章
    const ps = PLAY_STYLE_META[data.playStyle || 'solo'];
    const lf = LOOKING_FOR_META[data.lookingFor || 'none'];
    ctx.font = '22px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#cfd3db';
    ctx.fillText(`${ps.emoji} ${ps.label}`, 52, H - 110);
    ctx.fillStyle = lf.active ? hexToRgba(role.colorTo, 0.95) : 'rgba(255,255,255,0.6)';
    ctx.fillText(`${lf.emoji} ${lf.label}`, 52, H - 72);
  } else {
    // 身份卡：统计条 + 技术栈 + 副角色
    const stats = [
      { n: data.projects || 0, l: '项目' },
      { n: data.hackathons || 0, l: '比赛' },
      { n: data.awards || 0, l: '获奖' },
    ];
    const sw = (W - 104) / 3;
    stats.forEach((s, i) => {
      const sx = 52 + i * sw;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(s.n), sx + sw / 2, y);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '18px -apple-system, "PingFang SC", sans-serif';
      ctx.fillText(s.l, sx + sw / 2, y + 52);
    });
    ctx.textAlign = 'left';
    y += 110;

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '18px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText('技术栈', 52, y);
    y = drawChips(ctx, (data.techStack || []).slice(0, 8), 52, y + 28, W - 104, { bg: hexToRgba(role.colorFrom, 0.14), border: hexToRgba(role.colorFrom, 0.3), color: '#e8e3ff' }) + 24;

    if (data.secondary && data.secondary.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('隐藏天赋', 52, y);
      const secNames = data.secondary.map((k) => (ROLE_MAP[k] ? `${ROLE_MAP[k].emoji} ${ROLE_MAP[k].name}` : k));
      y = drawChips(ctx, secNames, 52, y + 28, W - 104, {}) + 8;
    }

    const lf = LOOKING_FOR_META[data.lookingFor || 'none'];
    if (lf.active) {
      ctx.fillStyle = hexToRgba(role.colorTo, 0.95);
      ctx.font = '22px -apple-system, "PingFang SC", sans-serif';
      ctx.fillText(`${lf.emoji} ${lf.label}`, 52, H - 72);
    }
  }

  // 右下角小程序码：扫码进入这个人的公开主页
  const qrSize = 104;
  const qrX = W - 52 - qrSize;
  const qrY = H - 184;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 34, 16);
  ctx.fill();
  if (data.qrImage) {
    ctx.drawImage(data.qrImage, qrX, qrY, qrSize, qrSize);
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    roundRect(ctx, qrX, qrY, qrSize, qrSize, 10);
    ctx.stroke();
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 18px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('小程序码', qrX + qrSize / 2, qrY + qrSize / 2);
  }
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 14px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('扫码看主页', qrX + qrSize / 2, qrY + qrSize + 8);

  // 底部水印
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '17px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('hackertrip.space', qrX - 16, H - 40);
  ctx.textAlign = 'left';
}

module.exports = { drawCard, W, H };
