#!/bin/zsh
cd "$(dirname "$0")"

SHARED='These are premium, richly-designed, FINISHED high-fidelity mobile app UI mockup renders (on a clean iPhone frame) for a WeChat mini-program HackerTrip (an AI companion for hackathon participants). Show the Discover Hackathons page, VISUALLY RICH and complete: a branded looping ribbon H HackerTrip logo, illustrated/stylized event poster thumbnails, a status panel, and a bottom tab bar. CONTENT (Chinese UI): location 深圳 top-left, WeChat capsule top-right; big headline 发现黑客松 + subtitle 找到最适合你的赛事 + small line AI 帮你匹配，一键生成选手身份卡, with a branded H logo near the headline; a search bar 搜索黑客松 / 城市 / 赛道; filter chips 全部 / AI / 硬件 / 出海 / Web3 / 筛选; a 正在关注 status panel for 春潮 Spring showing 距离报名截止 12 天 and 匹配度 92% with a progress bar; a 精选推荐 carousel of 3 illustrated event poster cards (春潮 Spring 深圳黑客松 04.23-04.25 深圳 线下; AdventureX 2026 07.15-07.17 杭州 线下; 腾讯云 AI 黑客松 06.01-06.02) each with track tags and a flame heat count; a 更多黑客松 list with BEYOND HACK DAY (05.18-05.19 深圳) and Global AI Hackathon 2026 (06.20-06.22 北京) each with a small poster, tags, heat, bookmark; a wide CTA banner 生成我的身份卡 / AI 匹配最佳黑客松，一键生成; a bottom tab bar 发现 / 赛程 / 消息 / 我的. Strong clean Chinese typography, premium finish, looks like a real shipped app.'

gen () {
  local file="$1"; local style="$2"
  echo ">>> generating $file"
  timeout 230 codex exec --sandbox danger-full-access "Use your built-in image generation tool (gpt-image-1) to generate exactly 1 image and save it as $file (1024x1536). ABSOLUTELY DO NOT write or run any Python/PIL/HTML/canvas/code; use the image generation tool directly. $SHARED DESIGN LANGUAGE FOR THIS IMAGE: $style After generating, report the file path." 2>&1 | tail -3
  echo "<<< done $file"
}

gen "theme-swiss-orange.png"      "SWISS / INTERNATIONAL TYPOGRAPHIC. Bone-white background #F4F1EA, ink black, ONE bold signal-orange #FF5A1F accent. Strict modular grid, oversized grotesk headlines, thin hairline rules, flat bold color-blocked geometric event posters (no gradients, no glow). Disciplined, editorial, magazine-grade, confident negative space but still rich."
gen "theme-glass-aurora.png"      "GLASSMORPHISM + AURORA. Soft aurora mesh-gradient background blending aqua-teal into soft periwinkle, frosted translucent cards with subtle 1px white inner borders and gentle glow, premium Apple-like depth. Event posters are vivid photographic/3D scenes seen through frosted glass. Luminous, premium, airy."
gen "theme-neobrutalist-blue.png" "NEO-BRUTALIST. Bright off-white, electric cobalt #2D5BFF + lemon-yellow #FFE600 accents. THICK 2px solid black borders on every element, hard solid-black offset drop shadows with no blur, chunky rounded rectangles, bold heavy type. Flat bold event posters with black outlines. Playful, confident, dev-tool energy."
gen "theme-clay-coral.png"        "CLAYMORPHISM 3D. Warm peach-cream background #FFF1E6, soft coral #FF7A5C + soft mint accents. Puffy soft-extruded 3D clay UI elements with gentle inner and outer soft shadows, pillowy rounded buttons, tactile. Event icons rendered as cute soft 3D clay scenes. Friendly premium."
gen "theme-riso-duotone.png"      "RISOGRAPH DUOTONE PRINT. Off-white paper with visible grain/halftone texture, cobalt-blue + fluoro-pink two-ink overprint aesthetic with slight misregistration. Bold condensed type, screenprinted-style city event posters in duotone. Artsy, indie, hand-made print feel."

echo "ALL DONE"
