#!/bin/zsh
cd "$(dirname "$0")"
mkdir -p neobrutalist-pages-v2

DISCIPLINE='NEO-BRUTALIST but RESTRAINED and PREMIUM, matching a clean reference app. CRITICAL LAYOUT RULES (most important): (1) GENEROUS WHITESPACE between sections, comfortable margins, do NOT fill the screen edge-to-edge or top-to-bottom, leave real breathing room and empty space. (2) ONE clear FOCAL HERO element per screen that visibly dominates by size and color; everything else is quiet and subordinate. (3) Heavy 2px BLACK BORDERS + hard offset black shadows (no blur) ONLY on the few PRIMARY cards and the main CTA button — NOT on every element; at most ~4 shadowed elements on the whole screen. (4) Secondary info (section labels, numbers, helper text, links) is CLEAN and BORDERLESS, separated by whitespace not boxes; build hierarchy with font weight, size and space, not by bordering everything. (5) Use illustrated sticker-style posters for events, not text-filled boxes. (6) Accent colors — electric cobalt blue #2D5BFF and lemon-yellow #FFE600 — used SPARINGLY, only on the focal element and the primary action; the rest is off-white #F4F1E8, white cards and black text. Bold heavy Chinese type. A branded looping ribbon H logo where appropriate. Premium finished WeChat mini-program mockup on a clean iPhone frame. Bottom tab bar 发现 / 赛程 / 消息 / 我的 unless it is a focused flow. Think: airy, clear, one obvious focal point — NOT a dense wall of equal black boxes.'

gen () {
  local file="neobrutalist-pages-v2/$1"; local content="$2"
  echo ">>> $1"
  local BEFORE=$(mktemp); find ~/.codex/generated_images -name '*.png' > "$BEFORE"
  timeout 280 codex exec --sandbox danger-full-access "Use your built-in image generation tool (gpt-image-1) to generate exactly 1 image (1024x1536). DO NOT write code. $DISCIPLINE PAGE: $content Report the path." 2>&1 | tail -2
  local NEW=$(comm -13 <(sort "$BEFORE") <(find ~/.codex/generated_images -name '*.png' | sort) | head -1)
  rm -f "$BEFORE"
  [ -n "$NEW" ] && cp "$NEW" "$file" && echo "<<< saved $file ($(stat -f %z "$file"))" || echo "!!! no image for $1"
}

gen "01-home.png" "Home / participant workspace. FOCAL HERO = one big status card in the upper-middle: a 活跃赛事 tag, event name AdventureX 2026, a large countdown 43天, and a slim progress bar with stage labels — this card is the only heavily-bordered, shadowed element and it dominates. Above it: a clean borderless greeting headline. Below the hero card: just a few QUIET quick-entry links (small icon + label, NO heavy boxes, plenty of space between them) and a clean bottom command input bar with one lemon send button. Lots of whitespace. Do NOT add rows of bordered stat tiles or multiple competing banners."

gen "03-chat.png" "AI matching chat. Clean airy conversation: a right user bubble 我有一个 AI Agent 项目，想找线下黑客松, a left AI reply, small borderless quick-reply chips 深圳 上海 AI Agent 冲奖. FOCAL = one embedded illustrated event result card (AttraX 春潮, match 94) with a short 为什么推荐 line — this is the one bordered/shadowed rich element. Generous spacing between messages. A clean bottom input bar. Do not fill the screen; leave whitespace."

gen "04-match.png" "Match results. FOCAL = the project profile card at top (project name + a few tech chips) — bordered and prominent. Below it, a Top 5 list where ONLY #1 is emphasized (bigger, bordered, with its match score), and #2–#5 are QUIET rows (rank number + name + small score, borderless, separated by whitespace, light hairline). Generous spacing. Not five equal heavy boxes."

gen "05-event.png" "Hackathon detail for AdventureX 2026. FOCAL HERO = a large illustrated event poster with the title at the top. Below, QUIET sections with whitespace: a row of small borderless fact chips (日期 倒计时 地点 形式 奖池), a short 简介 paragraph, a few 赛道 tags, a slim AI 适配理由 note. One primary cobalt CTA 加入报名清单 fixed at bottom (the only bold bordered button). Lots of breathing room, not boxed everywhere."

gen "06-schedule.png" "Schedule workspace. FOCAL HERO = one big block showing 距提交 5 天 + 进度 62% + a phase progress bar — bordered, dominant. Below: a QUIET task checklist (3 items, simple checkboxes, borderless rows with whitespace) and one small reminder note. Airy, not packed."

gen "07-identity.png" "Identity card studio. FOCAL HERO = ONE large identity card centered with lots of whitespace around it: avatar J, name Jayden, role AI Product Builder 深圳, a few tech chips, a small stats row. Above it a simple borderless tab switch 身份卡 / 配置卡. At the bottom two buttons 保存图片 (quiet) and 分享找队友 (primary cobalt). The card is the clear star; everything else is minimal. Generous empty space."

gen "08-sync.png" "Skills sync. FOCAL HERO = the 6-digit pairing-code input shown as big bordered boxes, centered with whitespace. Above: a short title and a small synced-result line (GitHub @jayden, 12 Skills) — quiet. Below: a clean numbered steps list (装 Skill / 进目录 / 运行 /ht-scan-project / 复制码) as borderless rows with space, and one primary cobalt 同步 button. Airy, focused on the code input."

echo "ALL DONE V2"
