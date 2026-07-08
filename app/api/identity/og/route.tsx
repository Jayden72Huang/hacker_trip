/**
 * ============================================================================
 *  HackerTrip — 身份卡 / 配置卡 OG 图渲染 (next/og · Satori)
 * ============================================================================
 *
 *  GET /api/identity/og?username=demo-builder&type=identity
 *  GET /api/identity/og?username=demo-builder&type=config
 *
 *  - 输出 1200x630 PNG (CARD_DIMENSIONS)，用于社媒分享预览 / 下载。
 *  - type=identity：大角色名 + emoji + 渐变 + 统计条 + 项目/技术栈/赛事 +
 *    获奖金色高亮 + 底部 hackertrip.space/@username + "看看你是什么角色？"。
 *  - type=config：技术栈 / 工具链 / AI 工具 chip 墙 + 打法 + 组队状态徽章。
 *  - 配色按主角色 ROLE_MAP[roleKey].colorFrom→colorTo 渐变。
 *  - 无 username → 用第一个 mock 用户兜底。
 *
 *  runtime = 'nodejs'：
 *    本地 dev 即可出图，不依赖外部字体二进制。
 *    ⚠️ Cloudflare/OpenNext 兼容风险：next/og 在 CF Workers 上可能因 WASM/字体
 *    加载受限而不可用。本方案的「双轨同源」设计保证页面仍可用：
 *      - 页面预览走纯 HTML/CSS 组件 <IdentityCardPreview>（不依赖本路由）。
 *      - 下载 PNG 优先用本路由，失败时前端回退到客户端截图。
 *    若部署后 CF 上本路由 500，可将 OG 图托管到 Node 兼容的渲染服务，
 *    或在 og meta 中回退到静态预生成图，页面体验不受影响。
 * ============================================================================
 */

import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { getMockIdentity } from '@/lib/identity/mock';
import { decodeIdentity } from '@/lib/identity/share-encode';
import {
  ROLE_MAP,
  PLAY_STYLE_META,
  LOOKING_FOR_META,
  CARD_DIMENSIONS,
  type IdentityCardData,
  type CardVariant,
  type HackathonRoleKey,
} from '@/lib/identity/types';

// next/og 在本地 dev 走 nodejs runtime 最稳；见文件头 CF 兼容说明。
export const runtime = 'nodejs';

/* ----------------------------------------------------------------------------
 * 工具
 * -------------------------------------------------------------------------- */

const BG = '#05060a';
const FG = '#ededed';
const MUTED = 'rgba(237,237,237,0.62)';
const GOLD = '#ffcf5c';
const CARD_BORDER = 'rgba(255,255,255,0.10)';

/** 半透明白底（玻璃卡近似，Satori 不支持 backdrop-filter，用纯色近似） */
const glassBg = 'rgba(255,255,255,0.05)';

/** 名次是否计入获奖 */
function isWin(placement?: string | null): boolean {
  if (!placement) return false;
  return /1st|2nd|3rd|first|second|third|winner|champion|finalist|grand|冠|亚|季|获奖|入围/i.test(
    placement,
  );
}

function pickRoleKey(raw: string | null, fallback: HackathonRoleKey): HackathonRoleKey {
  if (raw && raw in ROLE_MAP) return raw as HackathonRoleKey;
  return fallback;
}

/* ----------------------------------------------------------------------------
 * 卡片 1: 角色身份卡
 * -------------------------------------------------------------------------- */

function IdentityCard(data: IdentityCardData, roleKey: HackathonRoleKey) {
  const meta = ROLE_MAP[roleKey];
  const { colorFrom, colorTo, emoji, name, tagline } = meta;
  const top3 = data.career.slice(0, 3);
  const topTech = data.config.techStack.slice(0, 5);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: BG,
        position: 'relative',
        fontFamily: '"Noto Sans SC", sans-serif',
        color: FG,
        padding: '64px 72px',
      }}
    >
      {/* 角色渐变光晕背景 */}
      <div
        style={{
          position: 'absolute',
          top: -160,
          right: -120,
          width: 620,
          height: 620,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${colorFrom}55, transparent 70%)`,
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -200,
          left: -160,
          width: 560,
          height: 560,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${colorTo}40, transparent 70%)`,
          display: 'flex',
        }}
      />
      {/* 顶部渐变条 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
          display: 'flex',
        }}
      />

      {/* 头部品牌行 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 26, color: MUTED }}>
          <span style={{ color: FG, fontWeight: 700 }}>Hacker</span>
          <span style={{ color: colorTo, fontWeight: 700 }}>Trip</span>
          <span style={{ marginLeft: 16, color: MUTED }}>· 黑客松身份卡</span>
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: MUTED }}>@{data.username}</div>
      </div>

      {/* 主体：角色名 视觉重心 */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 54, flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, color: MUTED }}>
          <span>我的黑客松角色</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 116, display: 'flex', marginRight: 24 }}>{emoji}</span>
          <span
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.04,
              backgroundImage: `linear-gradient(120deg, ${colorFrom}, ${colorTo})`,
              backgroundClip: 'text',
              color: 'transparent',
              display: 'flex',
            }}
          >
            {name}
          </span>
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: MUTED, marginTop: 18, maxWidth: 920 }}>
          {tagline}
        </div>

        {/* 技术栈 chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 30 }}>
          {topTech.map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                fontSize: 24,
                color: FG,
                background: glassBg,
                border: `1px solid ${CARD_BORDER}`,
                borderRadius: 9999,
                padding: '8px 20px',
                marginRight: 12,
                marginBottom: 12,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* 履历摘要：最近赛事 + 获奖金色高亮 */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26 }}>
          {top3.map((c) => {
            const win = isWin(c.placement);
            return (
              <div
                key={c.id}
                style={{ display: 'flex', alignItems: 'center', marginBottom: 10, fontSize: 25 }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    background: win ? GOLD : colorTo,
                    marginRight: 16,
                  }}
                />
                <span style={{ display: 'flex', color: FG, marginRight: 14 }}>
                  {c.hackathonName}
                </span>
                {c.placement ? (
                  <span
                    style={{
                      display: 'flex',
                      color: win ? GOLD : MUTED,
                      fontWeight: win ? 700 : 400,
                      marginRight: 14,
                    }}
                  >
                    {win ? '🏆 ' : ''}
                    {c.placement}
                  </span>
                ) : null}
                {c.dateRange ? (
                  <span style={{ display: 'flex', color: MUTED, fontSize: 22 }}>{c.dateRange}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部：统计条 + 邀请语 + 域名 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${CARD_BORDER}`,
          paddingTop: 26,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Stat value={data.stats.projects} label="项目" />
          <Stat value={data.stats.hackathons} label="比赛" />
          <Stat value={data.stats.awards} label="获奖" gold />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ display: 'flex', fontSize: 28, color: FG, fontWeight: 600 }}>
            看看你是什么角色？
          </span>
          <span style={{ display: 'flex', fontSize: 24, color: colorTo, marginTop: 4 }}>
            hackertrip.space/@{data.username}
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, gold }: { value: number; label: string; gold?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', marginRight: 40 }}>
      <span
        style={{
          display: 'flex',
          fontSize: 48,
          fontWeight: 800,
          color: gold ? GOLD : FG,
        }}
      >
        {value}
      </span>
      <span style={{ display: 'flex', fontSize: 24, color: MUTED, marginLeft: 10 }}>{label}</span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * 卡片 2: 开发者配置卡
 * -------------------------------------------------------------------------- */

function ConfigCardOg(data: IdentityCardData, roleKey: HackathonRoleKey) {
  const meta = ROLE_MAP[roleKey];
  const { colorFrom, colorTo, emoji } = meta;
  const { config } = data;
  const play = PLAY_STYLE_META[config.playStyle];
  const lf = LOOKING_FOR_META[config.lookingFor];

  const ChipRow = ({
    title,
    items,
    accent,
  }: {
    title: string;
    items: string[];
    accent: string;
  }) => (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 26 }}>
      <span style={{ display: 'flex', fontSize: 24, color: MUTED, marginBottom: 12 }}>{title}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {items.slice(0, 7).map((t) => (
          <div
            key={t}
            style={{
              display: 'flex',
              fontSize: 26,
              color: FG,
              background: glassBg,
              border: `1px solid ${accent}55`,
              borderRadius: 14,
              padding: '8px 20px',
              marginRight: 14,
              marginBottom: 14,
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: BG,
        position: 'relative',
        fontFamily: '"Noto Sans SC", sans-serif',
        color: FG,
        padding: '60px 72px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -160,
          right: -120,
          width: 560,
          height: 560,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${colorFrom}45, transparent 70%)`,
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
          display: 'flex',
        }}
      />

      {/* 头部 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ display: 'flex', fontSize: 56, marginRight: 18 }}>{emoji}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ display: 'flex', fontSize: 44, fontWeight: 800, color: FG }}>
              {data.displayName}
            </span>
            <span style={{ display: 'flex', fontSize: 26, color: MUTED, marginTop: 2 }}>
              开发者配置卡 · @{data.username}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: MUTED }}>
          <span style={{ color: FG, fontWeight: 700 }}>Hacker</span>
          <span style={{ color: colorTo, fontWeight: 700 }}>Trip</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30, flexGrow: 1 }}>
        <ChipRow title="技术栈" items={config.techStack} accent={colorFrom} />
        <ChipRow title="AI 工具" items={config.aiTools} accent={colorTo} />
        <ChipRow title="工具链" items={config.tools} accent={colorFrom} />
      </div>

      {/* 底部徽章：打法 + 组队状态 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: `1px solid ${CARD_BORDER}`,
          paddingTop: 26,
        }}
      >
        <Badge text={`${play.emoji} ${play.label}`} accent={colorFrom} />
        <Badge
          text={`${lf.emoji} ${lf.label}`}
          accent={lf.active ? GOLD : colorTo}
          highlight={lf.active}
        />
        {config.env ? (
          <span style={{ display: 'flex', fontSize: 24, color: MUTED, marginLeft: 'auto' }}>
            {config.env}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Badge({
  text,
  accent,
  highlight,
}: {
  text: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        fontSize: 28,
        fontWeight: 600,
        color: highlight ? '#05060a' : FG,
        background: highlight ? accent : glassBg,
        border: `1px solid ${accent}`,
        borderRadius: 9999,
        padding: '10px 26px',
        marginRight: 18,
      }}
    >
      {text}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * CJK 字体加载（Satori 无内建中文字形 → 中文会变成 tofu 方框）
 *
 * 主路径：读取仓库内置的子集字体 public/fonts/cjk-card-subset.woff
 *   （Source Han 子集，仅含卡面用到的字形，~150KB，零网络依赖，
 *    本地 dev 与 Cloudflare 均可用）。
 * 兜底：内置子集不可读时，按需向 Google Fonts 请求 woff 子集（需出网）。
 * 全部失败 → 返回 null，退回 sans-serif（拉丁正常，仅中文 tofu），
 *   不影响页面预览（页面走纯 HTML 组件，本路由仅用于社媒/下载）。
 * -------------------------------------------------------------------------- */

// 内置子集字体缓存（首次读盘后常驻）。
let bundledFont: ArrayBuffer | null | undefined;

async function loadBundledCjkFont(): Promise<ArrayBuffer | null> {
  if (bundledFont !== undefined) return bundledFont;
  try {
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const fontPath = join(process.cwd(), 'public', 'fonts', 'cjk-card-subset.woff');
    const buf = await readFile(fontPath);
    // 转成独立 ArrayBuffer
    bundledFont = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    return bundledFont;
  } catch {
    bundledFont = null;
    return null;
  }
}

// Google Fonts 网络兜底缓存。
const fontCache = new Map<string, ArrayBuffer | null>();

async function loadRemoteCjkFont(text: string): Promise<ArrayBuffer | null> {
  const cjk = Array.from(new Set(text.split('').filter((c) => /[㐀-鿿·—…]/.test(c)))).join('');
  if (!cjk) return null;
  if (fontCache.has(cjk)) return fontCache.get(cjk) ?? null;
  try {
    const cssUrl = `https://fonts.googleapis.com/css?family=Noto+Sans+SC:700&text=${encodeURIComponent(cjk)}`;
    const cssRes = await fetch(cssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1)' },
    });
    const css = await cssRes.text();
    const m = css.match(/src:\s*url\(([^)]+)\)/);
    if (!m) {
      fontCache.set(cjk, null);
      return null;
    }
    const buf = await (await fetch(m[1])).arrayBuffer();
    fontCache.set(cjk, buf);
    return buf;
  } catch {
    fontCache.set(cjk, null);
    return null;
  }
}

/** 优先内置子集；缺失时网络兜底。 */
async function loadCjkFont(text: string): Promise<ArrayBuffer | null> {
  const bundled = await loadBundledCjkFont();
  if (bundled) return bundled;
  return loadRemoteCjkFont(text);
}

/* ----------------------------------------------------------------------------
 * 路由处理
 * -------------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const typeParam = (searchParams.get('type') ?? 'identity') as CardVariant;
  const variant: CardVariant = typeParam === 'config' ? 'config' : 'identity';

  // 优先解码分享 URL 内嵌的卡数据（自建卡 ?c=<payload>），让 og 图还原成
  // 用户自己的卡；无 c 时回退 mock（DB 持久化后置，未知 username 兜底 demo-builder）。
  const data = decodeIdentity(searchParams.get('c')) ?? getMockIdentity(username);

  // 主角色：query role 优先（覆盖场景），否则用判定结果。
  const roleKey = pickRoleKey(searchParams.get('role'), data.role.primary);

  const element = variant === 'config' ? ConfigCardOg(data, roleKey) : IdentityCard(data, roleKey);

  // 收集卡面可能出现的中文（角色名/tagline/赛事名/项目名/统计/固定文案），
  // 请求对应字形子集。
  const meta = ROLE_MAP[roleKey];
  const cardText = [
    meta.name,
    meta.tagline,
    '黑客松身份卡',
    '我的黑客松角色',
    '开发者配置卡',
    '看看你是什么角色？',
    '项目',
    '比赛',
    '获奖',
    '技术栈',
    'AI 工具',
    '工具链',
    data.displayName,
    ...data.career.flatMap((c) => [c.hackathonName, c.projectName ?? '', c.placement ?? '']),
    ...data.config.techStack,
    PLAY_STYLE_META[data.config.playStyle].label,
    LOOKING_FOR_META[data.config.lookingFor].label,
  ].join(' ');

  const cjkFont = await loadCjkFont(cardText);

  return new ImageResponse(element, {
    width: CARD_DIMENSIONS.width,
    height: CARD_DIMENSIONS.height,
    fonts: cjkFont
      ? [{ name: 'Noto Sans SC', data: cjkFont, weight: 700, style: 'normal' }]
      : undefined,
  });
}
