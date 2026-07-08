/**
 * ============================================================================
 *  HackerTrip — 裂变分享内容包 (buildShareContent)
 * ============================================================================
 *
 *  纯函数：由 IdentityCardData + 站点 base 组装 ShareContent。
 *  captions 固定 3 条，顺序 = [invite, flex, recruit]（与 ShareCaptionVariant 对应）。
 *  imageUrl 默认指向 og 路由（identity 变体），客户端可在下载/复制时覆盖。
 *
 *  零运行时依赖，Edge / Node / Client 均可引用。
 * ============================================================================
 */

import {
  ROLE_MAP,
  LOOKING_FOR_META,
  IDENTITY_OG_ROUTE,
  IDENTITY_PROFILE_BASE,
  type IdentityCardData,
  type ShareContent,
  type ShareCaptionVariant,
} from './types';

/** 固定文案变体顺序 */
export const SHARE_CAPTION_ORDER: [ShareCaptionVariant, ShareCaptionVariant, ShareCaptionVariant] = [
  'invite',
  'flex',
  'recruit',
];

/**
 * buildShareUrl — 被分享落地页的相对 URL（带 ref 标记便于裂变观测）。
 * base 为空时返回站内相对路径（本地 dev 可直接用）。
 */
export function buildShareUrl(username: string, base?: string, encoded?: string): string {
  const q = encoded ? `?c=${encoded}&ref=share` : `?ref=share`;
  const path = `${IDENTITY_PROFILE_BASE}/${encodeURIComponent(username)}${q}`;
  if (!base) return path;
  return `${base.replace(/\/$/, '')}${path}`;
}

/** og 卡图地址（identity 变体）。encoded 存在时内嵌卡数据，还原自建卡。 */
export function buildOgImageUrl(
  username: string,
  roleKey: string,
  base?: string,
  encoded?: string,
): string {
  const qs = encoded
    ? `?c=${encoded}&type=identity&role=${encodeURIComponent(roleKey)}`
    : `?username=${encodeURIComponent(username)}&type=identity&role=${encodeURIComponent(roleKey)}`;
  const path = `${IDENTITY_OG_ROUTE}${qs}`;
  if (!base) return path;
  return `${base.replace(/\/$/, '')}${path}`;
}

/**
 * buildShareContent — 组装分享内容包。
 * @param data 身份卡聚合数据
 * @param base 站点绝对地址（可空，空则用相对路径，本地 dev 友好）
 * @param encoded 自建卡的 url-safe payload（让分享链接/og 图还原“我的卡”）
 */
export function buildShareContent(
  data: IdentityCardData,
  base?: string,
  encoded?: string,
): ShareContent {
  const role = ROLE_MAP[data.role.primary];
  const shareUrl = buildShareUrl(data.username, base, encoded);
  const imageUrl = buildOgImageUrl(data.username, data.role.primary, base, encoded);

  const top3 = data.config.techStack.slice(0, 3).join(' / ') || '全栈';
  const lf = LOOKING_FOR_META[data.config.lookingFor];

  const invite =
    `我在黑客松里是「${role.name}」${role.emoji}，看看你是什么角色 → ${shareUrl}`;
  const flex =
    `${data.stats.hackathons} 场黑客松 · ${data.stats.awards} 次获奖，这是我的选手身份卡 👉 ${shareUrl}`;
  const recruit = lf.active
    ? `${lf.label}${lf.emoji}，技术栈 ${top3}，来组队 → ${shareUrl}`
    : `我的黑客松装备：${top3}，想一起打比赛吗 → ${shareUrl}`;

  return {
    imageUrl,
    captions: [invite, flex, recruit],
    shareUrl,
    captionVariants: SHARE_CAPTION_ORDER,
  };
}
