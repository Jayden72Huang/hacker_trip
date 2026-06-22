#!/bin/zsh
cd "$(dirname "$0")"
mkdir -p neobrutalist-pages

STYLE='NEO-BRUTALIST design language, consistent across all pages: bright off-white background, electric cobalt #2D5BFF + lemon-yellow #FFE600 accents, THICK 2px solid black borders on every element, hard solid-black offset drop shadows with NO blur, chunky rounded rectangles, bold heavy Chinese type, flat bold sticker-style illustrated posters with black outlines. Playful, confident, dev-tool energy. A branded looping ribbon H HackerTrip logo where appropriate. Premium finished mobile app UI on a clean iPhone frame, strong clean Chinese typography, looks like a real shipped WeChat mini-program. A bottom tab bar 发现 / 赛程 / 消息 / 我的 unless the page is a focused flow.'

gen () {
  local file="neobrutalist-pages/$1"; local content="$2"
  echo ">>> $1"
  timeout 235 codex exec --sandbox danger-full-access "Use your built-in image generation tool (gpt-image-1) to generate exactly 1 image (1024x1536). ABSOLUTELY DO NOT write or run any code; use the image tool directly. $STYLE PAGE CONTENT: $content After generating, report the path." 2>&1 | tail -2
  local latest=$(find ~/.codex/generated_images -name '*.png' -mmin -5 2>/dev/null | xargs ls -t 2>/dev/null | head -1)
  [ -n "$latest" ] && cp "$latest" "$file" && echo "<<< saved $file" || echo "!!! no image for $1"
}

gen "01-home.png" "HackerTrip Home / participant workspace. Custom header: left hamburger menu, center HackerTrip wordmark, right notification bell with red dot. Big Chinese greeting headline. A floating STATUS PANEL card: a 活跃赛事 pill tag, event name AdventureX 2026, subtitle 中国最大青年黑客松, a big countdown 43天 on the right, a 7-segment progress bar (first segment cobalt-filled) with stage labels 报名 组队 开发 中期 评审 优化 Demo, an inset 下一任务 row, meta 杭州 线下 Jul22-26 奖池 150000+. A row of 4 stat tiles. A 快捷入口 row of 4 chunky icon tiles 赛程 发现 身份卡 项目. A 推荐 AI 动作 suggestion banner. A floating bottom command bar with placeholder 问 AI 帮我检查 AdventureX 进度 and a yellow circular send button. Bottom tab bar."

gen "03-chat.png" "HackerTrip AI 匹配 chat page. Header titled AI 匹配. A conversation: a right-aligned user message bubble 我有一个 AI Agent 项目，想找线下黑客松; a left-aligned AI reply asking to confirm 城市 阶段 偏好; quick-reply chips 深圳/上海, AI Agent, 冲奖; then AI returns results as embedded sticker-style compact event cards (AttraX 春潮 match 94, AINX 浦软 match 85) each with a one-line 为什么推荐 reason. A 停止生成 button. A bottom input bar with a + 上下文 chip, a scope chip, and a yellow send button."

gen "04-match.png" "HackerTrip 匹配结果 page. A project profile card at top: project name + tech stack chips React LLM 产品设计. Then a Top 5 RANKED list of event cards, each showing a big rank number #1 to #5, event name, a match score badge (94/88/85/...), a thin progress bar, and a recommended track tag. Bottom tab bar."

gen "05-event.png" "HackerTrip 黑客松详情 page for AdventureX 2026. A big bold title, a row of key-fact chips 日期 倒计时43天 地点杭州 形式线下 奖池150000+, an intro paragraph, track tags, a 赛程 schedule preview, an AI 适配理由 callout box, and a bottom area with a primary cobalt CTA 加入报名清单 plus a secondary button 问 AI 适合我吗."

gen "06-schedule.png" "HackerTrip 赛程工作台 page. Active event status block (event name AdventureX, 距提交 5 天, 进度 62%). A 7-phase progress bar with current phase highlighted. A checklist of 3 key tasks with chunky checkboxes. A reminder card. A bottom command bar. Bottom tab bar."

gen "07-identity.png" "HackerTrip 身份卡工坊 page. A tab switch 身份卡 / 配置卡 at top. A large identity card: a circular avatar with letter J, name Jayden, role AI Product Builder 深圳, an AI 判定角色 note, tech stack chips React LLM 产品设计 增长, a stats row 参赛3 作品2 Skills12 Token1.2M. Bottom CTAs: secondary 保存图片 and primary cobalt 分享找队友. Bottom tab bar."

gen "08-sync.png" "HackerTrip Skills 同步 page. A synced-result summary card (GitHub @jayden, 已连接 12 个 Skills). A 6-digit pairing-code input shown as 6 separate chunky boxes. A 如何获得配对码 numbered step list: 装 Skill, 进目录, 运行 /ht-scan-project, 复制码. A bottom primary cobalt button 同步. Bottom tab bar."

echo "ALL DONE NEOBRUTALIST PAGES"
