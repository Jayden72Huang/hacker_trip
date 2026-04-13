// Deterministic random avatar for users without profile images
// Uses userId to consistently pick the same avatar + gradient for each user

const AVATAR_ICONS = [
  '/logos/hackerbot-neon-bot.svg',
  '/logos/hackerbot-neon-bot-spark.svg',
  '/logos/hackerbot-neon-bot-wink.svg',
  '/logos/hackerbot-neon-bot-core.svg',
  '/logos/hackerbot-neon-bot-mini.svg',
  '/logos/hackerbot-neon-bot-pulse.svg',
  '/logos/hackerbot-hb-monogram.svg',
  '/logos/hackerbot-terminal-shield.svg',
];

const GRADIENT_PAIRS = [
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-fuchsia-600',
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDefaultAvatar(userId: string) {
  const hash = hashCode(userId);
  return {
    icon: AVATAR_ICONS[hash % AVATAR_ICONS.length],
    gradient: GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length],
  };
}
