import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'showcase');

const WIDTH = 800;
const HEIGHT = 1000;

// SVG icon paths for each project (replacing emojis)
const icons = {
  hookflow: `
    <g transform="translate(355, 100)">
      <rect x="0" y="0" width="90" height="65" rx="10" fill="none" stroke="#7c5dff" stroke-width="3"/>
      <polygon points="35,18 35,47 60,32" fill="#7c5dff"/>
      <rect x="10" y="72" width="70" height="4" rx="2" fill="#7c5dff" opacity="0.5"/>
      <rect x="20" y="82" width="50" height="4" rx="2" fill="#7c5dff" opacity="0.3"/>
    </g>`,
  snapaudit: `
    <g transform="translate(362, 95)">
      <path d="M38 5 L70 20 L70 55 C70 75 38 90 38 90 C38 90 6 75 6 55 L6 20 Z" fill="none" stroke="#c759ff" stroke-width="3"/>
      <path d="M25 47 L35 57 L55 37" fill="none" stroke="#c759ff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`,
  dataforge: `
    <g transform="translate(355, 100)">
      <rect x="0" y="50" width="18" height="35" rx="3" fill="#4de1ff" opacity="0.6"/>
      <rect x="24" y="30" width="18" height="55" rx="3" fill="#4de1ff" opacity="0.8"/>
      <rect x="48" y="10" width="18" height="75" rx="3" fill="#4de1ff"/>
      <rect x="72" y="40" width="18" height="45" rx="3" fill="#4de1ff" opacity="0.7"/>
      <line x1="0" y1="88" x2="90" y2="88" stroke="#4de1ff" stroke-width="1.5" opacity="0.4"/>
    </g>`,
  voicedao: `
    <g transform="translate(360, 98)">
      <rect x="5" y="0" width="70" height="55" rx="8" fill="none" stroke="#7c5dff" stroke-width="3"/>
      <rect x="15" y="60" width="50" height="8" rx="4" fill="#c759ff" opacity="0.5"/>
      <rect x="30" y="72" width="20" height="15" rx="2" fill="#7c5dff" opacity="0.4"/>
      <circle cx="30" cy="22" r="5" fill="#7c5dff" opacity="0.7"/>
      <circle cx="50" cy="22" r="5" fill="#c759ff" opacity="0.7"/>
      <path d="M22 38 L30 32 L38 38" fill="none" stroke="#7c5dff" stroke-width="2" stroke-linecap="round"/>
      <path d="M42 38 L50 32 L58 38" fill="none" stroke="#c759ff" stroke-width="2" stroke-linecap="round"/>
    </g>`,
};

const posters = [
  {
    filename: 'hookflow-poster.png',
    accent: '#7c5dff',
    accentEnd: '#7c5dff',
    icon: icons.hookflow,
    name: 'HookFlow',
    tagline: 'AI 电商视频生成，3分钟产出爆款带货短视频',
    steps: ['粘贴商品链接', 'AI生成爆款开头', '一键出片'],
    stats: { upvotes: '467', impressions: '52K', stars: '1,800' },
  },
  {
    filename: 'snapaudit-poster.png',
    accent: '#c759ff',
    accentEnd: '#c759ff',
    icon: icons.snapaudit,
    name: 'SnapAudit',
    tagline: '30秒智能合约安全扫描',
    steps: ['上传合约地址', '自动检测漏洞', '生成审计报告'],
    stats: { upvotes: '189', impressions: '15K', stars: '860' },
  },
  {
    filename: 'dataforge-poster.png',
    accent: '#4de1ff',
    accentEnd: '#4de1ff',
    icon: icons.dataforge,
    name: 'DataForge',
    tagline: '零代码构建链上数据仪表盘',
    steps: ['选择链', '拖拽指标', '实时可视化'],
    stats: { upvotes: '275', impressions: '22K', stars: '950' },
  },
  {
    filename: 'voicedao-poster.png',
    accent: '#7c5dff',
    accentEnd: '#c759ff',
    icon: icons.voicedao,
    name: 'VoiceDAO',
    tagline: '语音投票的去中心化治理方案',
    steps: ['语音验证身份', '匿名投票', '链上计票'],
    stats: { upvotes: '410', impressions: '35K', stars: '1,500' },
  },
];

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSvg(poster) {
  const { accent, accentEnd, icon, name, tagline, steps, stats } = poster;

  const accentDim = accent + '40';
  const accentMid = accent + '80';

  const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent}" />
      <stop offset="100%" stop-color="${accentEnd}" />
    </linearGradient>
    <linearGradient id="accentGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.12" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="dividerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0" />
      <stop offset="20%" stop-color="${accent}" stop-opacity="1" />
      <stop offset="80%" stop-color="${accentEnd}" stop-opacity="1" />
      <stop offset="100%" stop-color="${accentEnd}" stop-opacity="0" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="softGlow">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0a0a0a" />

  <!-- Subtle radial glow -->
  <rect x="0" y="0" width="${WIDTH}" height="380" fill="url(#accentGlow)" />

  <!-- Top gradient bar -->
  <rect x="0" y="0" width="${WIDTH}" height="6" fill="url(#topBar)" />

  <!-- Subtle grid pattern -->
  <g opacity="0.025">
    ${Array.from({ length: 21 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="${WIDTH}" y2="${i * 50}" stroke="white" stroke-width="0.5" />`).join('\n    ')}
    ${Array.from({ length: 17 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="${HEIGHT}" stroke="white" stroke-width="0.5" />`).join('\n    ')}
  </g>

  <!-- Icon -->
  <g filter="url(#softGlow)">
    ${icon}
  </g>

  <!-- Decorative circle ring -->
  <circle cx="${WIDTH / 2}" cy="145" r="72" fill="none" stroke="${accentDim}" stroke-width="1" stroke-dasharray="6 8" />

  <!-- Project name -->
  <text x="${WIDTH / 2}" y="275" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="bold" fill="white" letter-spacing="2">${escapeXml(name)}</text>

  <!-- Small accent line under name -->
  <rect x="${WIDTH / 2 - 30}" y="293" width="60" height="3" rx="1.5" fill="url(#topBar)" />

  <!-- Tagline -->
  <text x="${WIDTH / 2}" y="345" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#999">${escapeXml(tagline)}</text>

  <!-- Divider -->
  <rect x="100" y="395" width="600" height="1" fill="url(#dividerGrad)" />

  <!-- Pitch label -->
  <text x="${WIDTH / 2}" y="448" text-anchor="middle" font-family="monospace" font-size="13" fill="${accent}" letter-spacing="3">PITCH WORKFLOW</text>

  <!-- 3-step workflow -->
  <g font-family="Arial, Helvetica, sans-serif">
    <!-- Step 1 -->
    <rect x="80" y="478" width="186" height="70" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="173" y="505" text-anchor="middle" font-size="11" fill="${accent}" font-weight="bold" letter-spacing="1">STEP 1</text>
    <text x="173" y="530" text-anchor="middle" font-size="15" fill="#c8c8c8">${escapeXml(steps[0])}</text>

    <!-- Arrow 1 -->
    <g transform="translate(280, 505)">
      <line x1="0" y1="8" x2="18" y2="8" stroke="${accentMid}" stroke-width="2" stroke-linecap="round"/>
      <polyline points="13,3 19,8 13,13" fill="none" stroke="${accentMid}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <!-- Step 2 -->
    <rect x="307" y="478" width="186" height="70" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="400" y="505" text-anchor="middle" font-size="11" fill="${accent}" font-weight="bold" letter-spacing="1">STEP 2</text>
    <text x="400" y="530" text-anchor="middle" font-size="15" fill="#c8c8c8">${escapeXml(steps[1])}</text>

    <!-- Arrow 2 -->
    <g transform="translate(507, 505)">
      <line x1="0" y1="8" x2="18" y2="8" stroke="${accentMid}" stroke-width="2" stroke-linecap="round"/>
      <polyline points="13,3 19,8 13,13" fill="none" stroke="${accentMid}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <!-- Step 3 -->
    <rect x="534" y="478" width="186" height="70" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="627" y="505" text-anchor="middle" font-size="11" fill="${accent}" font-weight="bold" letter-spacing="1">STEP 3</text>
    <text x="627" y="530" text-anchor="middle" font-size="15" fill="#c8c8c8">${escapeXml(steps[2])}</text>
  </g>

  <!-- Second divider -->
  <rect x="100" y="610" width="600" height="1" fill="url(#dividerGrad)" />

  <!-- Stats label -->
  <text x="${WIDTH / 2}" y="655" text-anchor="middle" font-family="monospace" font-size="13" fill="#555" letter-spacing="3">TRACTION</text>

  <!-- Stats section -->
  <g font-family="Arial, Helvetica, sans-serif">
    <!-- Stat box 1: Upvotes -->
    <rect x="80" y="675" width="200" height="85" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
    <text x="180" y="706" text-anchor="middle" font-size="11" fill="#555" letter-spacing="2">UPVOTES</text>
    <text x="180" y="740" text-anchor="middle" font-size="28" font-weight="bold" fill="white">${escapeXml(stats.upvotes)}</text>

    <!-- Stat box 2: Impressions -->
    <rect x="300" y="675" width="200" height="85" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
    <text x="400" y="706" text-anchor="middle" font-size="11" fill="#555" letter-spacing="2">IMPRESSIONS</text>
    <text x="400" y="740" text-anchor="middle" font-size="28" font-weight="bold" fill="white">${escapeXml(stats.impressions)}</text>

    <!-- Stat box 3: Stars -->
    <rect x="520" y="675" width="200" height="85" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
    <text x="620" y="706" text-anchor="middle" font-size="11" fill="#555" letter-spacing="2">STARS</text>
    <text x="620" y="740" text-anchor="middle" font-size="28" font-weight="bold" fill="white">${escapeXml(stats.stars)}</text>
  </g>

  <!-- Bottom section -->
  <rect x="0" y="830" width="${WIDTH}" height="170" fill="rgba(255,255,255,0.015)" />
  <rect x="0" y="830" width="${WIDTH}" height="1" fill="rgba(255,255,255,0.05)" />

  <!-- Powered by -->
  <text x="${WIDTH / 2}" y="878" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#444" letter-spacing="2">POWERED BY</text>

  <!-- HackerTrip brand -->
  <text x="${WIDTH / 2}" y="920" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" fill="${accent}" letter-spacing="3" filter="url(#glow)">HackerTrip</text>

  <!-- URL -->
  <text x="${WIDTH / 2}" y="958" text-anchor="middle" font-family="monospace" font-size="14" fill="#333" letter-spacing="2">hackertrip.space</text>
</svg>`;

  return svg;
}

async function generatePoster(poster) {
  const svg = buildSvg(poster);
  const svgBuffer = Buffer.from(svg);

  await sharp(svgBuffer)
    .resize(WIDTH, HEIGHT)
    .png({ quality: 95 })
    .toFile(path.join(OUTPUT_DIR, poster.filename));

  console.log(`Generated: ${poster.filename}`);
}

async function main() {
  for (const poster of posters) {
    await generatePoster(poster);
  }
  console.log('\nAll 4 posters generated in public/showcase/');
}

main().catch(console.error);
