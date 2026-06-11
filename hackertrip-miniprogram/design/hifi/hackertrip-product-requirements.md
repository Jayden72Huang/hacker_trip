# HackerTrip Mini Program Product Requirements

## 1. Product Definition

HackerTrip is a one-stop AI companion platform for hackathon participants.

It is not only an event discovery mini program. It should become a participant workspace that helps users discover suitable hackathons, manage participation progress, build their public identity, maintain agent/skills configurations, organize projects, and eventually publish a personal hackathon site.

The core product question is:

> What hackathon should I join, what is my current participation state, and what should I do next?

## 2. Target Users

### Primary Users

- Independent developers looking for suitable hackathons or AI competitions
- AI builders who want to package their projects into competition-ready submissions
- Hackathon participants who need schedule, submission, identity, and demo support
- Creators who want to showcase projects, GitHub, social accounts, skills, and competition history

### Secondary Users

- Team leaders recruiting teammates
- Hackathon organizers looking for higher-quality participant profiles
- Developer communities that want a better competition discovery and identity layer

## 3. Core Product Positioning

HackerTrip should feel like:

- an AI matching assistant
- a hackathon schedule cockpit
- a developer identity card builder
- an agent/skills configuration library
- a project and personal site workspace

The Claude-style chat surface is important because the user journey starts with intent, not filters:

- "我适合参加哪个黑客松？"
- "我的项目能报哪个赛道？"
- "我缺什么队友？"
- "帮我生成参赛身份卡"
- "帮我检查作品缺口"
- "帮我生成路演稿"

## 4. Product Principles

1. **AI first, feed second**
   The home page should not become a normal event list. The primary interface is an AI command surface plus a current-state dashboard.

2. **State before content**
   Users should immediately know whether they are idle, matching, registered, developing, submitting, or post-event.

3. **Identity is a product asset**
   The identity card is not a gimmick. It should store profile, projects, GitHub, social links, skills, agent configs, token usage, and participation history.

4. **Design for expansion**
   The home page must leave room for future entries: event discovery, schedule, project, identity card, agent config, skills sync, portfolio, public personal site.

5. **Tencent mini program discipline**
   Use a WeChat-native information density, touch target size, status handling, and component rhythm. Avoid web landing-page composition.

## 5. Current Design Direction

### Preserve

- Claude-like calm home state
- Bottom command/search bar
- Drawer or secondary navigation for multiple future modules
- AI assistant as the main product behavior

### Change

- Move away from pure Claude warm paper style as the final product identity
- Adopt HackerTrip blue-white exploration/workspace style
- Replace plain greeting in the home middle area with a participant status panel
- Turn the product from "event discovery feed" into "hackathon AI OS"

### Visual References

- `ig_0977d353c6752635016a252a623ae48198894a2a4cf5d279a2.png`: vertical list efficiency, strong event cards
- `ig_0977d353c6752635016a252bdc94a8819898db6846f38db122.png`: blue-white city discovery, horizontal featured events
- Existing Claude-style home screenshot: calm middle canvas plus bottom command bar

## 6. Feature Modules

### 6.1 AI Matching Assistant

Purpose: Help users find suitable hackathons through chat and structured follow-up questions.

Capabilities:

- Natural-language event search
- Match based on user profile, skills, location, project stage, preferred tracks
- Recommend competitions and explain why
- Ask missing profile questions
- Convert project description into matching tags
- Suggest next actions after matching

Key states:

- no context
- profile incomplete
- project detected
- matched events found
- no suitable event found
- user already registered

### 6.2 Event Discovery

Purpose: Let users browse and filter hackathons after AI has narrowed the field.

Capabilities:

- Featured events
- City filter
- Track filter
- Online/offline/hybrid filter
- Search by event, city, track, technology
- Bookmark
- Register/add to schedule
- Event quality should follow publish gate: theme and tracks must exist, link must be real registration/official page

### 6.3 Event Detail

Purpose: Give enough information for a participant to decide and act.

Content:

- Event name
- Date and countdown
- Location / mode
- Tracks
- Theme
- Prize pool
- Agenda
- Organizer/sponsors
- Registration link
- AI fit explanation
- Related user project or skills match

Actions:

- **Go to official registration (primary CTA — opens the real registration link in webview; "add to schedule" is NOT registration)**
- Add to my schedule (secondary)
- Set deadline reminder (`event.remind`)
- Ask AI if this suits me
- Generate identity card for this event
- Create project submission checklist

### 6.4 Participation Status / Schedule Workspace

Purpose: Show the user's current competition state and next task.

Core fields:

- active event
- current phase
- phase progress
- next deadline
- countdown
- next task
- submission readiness
- team status
- project status

Example phases:

1. 报名
2. 组队
3. 开发中
4. 中期提交
5. 评审中
6. 优化中
7. Demo Day

### 6.5 Identity Card

Purpose: Create a reusable participant profile for matching, team formation, and public display.

Fields:

- name / nickname
- role archetype
- avatar
- bio
- skills
- preferred tracks
- GitHub account
- social accounts
- project links
- past competitions
- current event
- token usage
- agent/skills configs

Actions:

- Generate card
- Edit card
- Export/share image
- Publish public profile
- Use card for matching

### 6.6 Agent / Skills Config Library

Purpose: Let advanced users store and reuse competition-ready agent workflows.

Examples:

- project scanner
- pitch writer
- demo script assistant
- GitHub README improver
- submission checklist agent
- design critique agent
- market research agent

Fields:

- agent name
- purpose
- required inputs
- connected skills
- token usage
- last used event/project
- output examples

### 6.7 Project Portfolio

Purpose: Store and present competition works.

Fields:

- project name
- description
- repo
- demo URL
- video
- deck
- screenshots
- team members
- event submitted to
- awards
- AI-generated pitch summary

### 6.8 Skills Sync

Purpose: Connect desktop/CLI scanning results to the mini program.

Known workflow:

- desktop runs project scan
- scan creates matching result and identity/config data
- user enters pairing code in mini program
- mini program pulls scan result
- result can update identity card, project profile, and matched events

## 7. Home Page Information Architecture

> ⚠️ **PARTIALLY SUPERSEDED (2026-06-11)**: 导航定稿后，**主页 = 发现页（Discovery）**，本节描述的「状态面板控制中心」迁移到「赛程」tab（见 `interaction-flow.md` P0-2），「底部命令栏」降级为发现页/聊天页的 AI 入口。本节的状态卡分类（Active/No Active/Matching/Deadline/Post-Event）仍然有效，全部由赛程 tab 承接。

The home page is the product control center.

### Header

- menu
- current space/title
- notification
- WeChat capsule safe area

### Middle State Area

This is the most important home section.

It should not only say "晚上好，Jayden". It should show the user's current HackerTrip state.

Possible state cards:

1. **Active Competition**
   - active event
   - current phase
   - countdown
   - progress
   - next task
   - quick entries

2. **No Active Competition**
   - AI matching prompt
   - suggested profile setup
   - event discovery entry

3. **Matching In Progress**
   - currently analyzing profile/project
   - candidate event count
   - missing questions

4. **Submission Deadline Near**
   - urgent countdown
   - readiness score
   - missing assets

5. **Post-Event**
   - result summary
   - publish project
   - update identity card

### Bottom Command Bar

Persistent AI command entry.

Examples:

- "问 AI：我适合参加哪个黑客松？"
- "帮我检查 AdventureX 项目进度"
- "生成我的参赛身份卡"

Controls:

- add context
- current scope pill
- send/search button

## 8. Page and State List for High-Fidelity Design

### Priority 0: First Confirmation Page

1. Home / Idle / Active Hackathon

Purpose: Confirm the new product direction.

Required modules:

- header
- active event status panel
- phase progress
- next task
- quick entries
- recommended AI actions
- bottom command bar

### Priority 1: Core Flow

2. Home / Idle / No Active Hackathon
3. Home / AI Chat Search
4. AI Matching Results
5. Event Discovery
6. Event Detail
7. Schedule Workspace

### Priority 2: Identity and Asset Loop

8. Identity Card Overview
9. Identity Card Edit
10. Agent / Skills Config Library
11. Project Portfolio
12. Skills Sync Result

### Priority 3: Public and Growth

13. Public Personal Site Preview
14. Share Landing
15. Notifications / Inbox
16. Profile / Settings

## 9. First Prototype Acceptance Criteria

The first prototype is accepted only if:

- It clearly communicates HackerTrip as a participant AI workspace, not just an event list
- The middle area shows active competition state
- The bottom command bar keeps Claude-style AI interaction
- It visually matches the blue-white reference direction
- It leaves obvious entry points for schedule, project, identity card, and agent config
- It follows mini program proportions and touch-friendly spacing
- Text is readable and not crowded

## 10. Figma Workflow

Current status:

- Figma MCP has been connected and OAuth is complete
- The source Figma file is known
- Direct read is blocked by Figma MCP Starter plan call limit

Source file:

`https://www.figma.com/design/FL9PioBRU82uD86pajjt6p/HackerTrip-%E5%B0%8F%E7%A8%8B%E5%BA%8F-%C2%B7-Claude-%E9%A3%8E%E6%A0%BC%E8%AE%BE%E8%AE%A1?node-id=0-1&p=f&t=ImOQ1uYew3D33iCU-0`

When Figma MCP calls are available again:

1. Read source file metadata and existing pages
2. Extract current Claude-style components
3. Create or duplicate the first page for `Home / Idle / Active Hackathon`
4. Apply this product requirement and design system
5. Export screenshot for user confirmation
6. After confirmation, expand Priority 1 pages one by one

---

# Supplement (Added for PRD → Figma handoff)

> The sections below close the gaps that block direct hi-fi generation. Sections 11–13 are blocking constraints; 14–24 are completeness specs. When any older doc disagrees with this supplement, this supplement wins.

## 11. Design Source of Truth & Visual References

### 11.1 Single source of truth for color

There are conflicting color specs across the repo. The decision is final:

- **Authoritative:** `design/hifi/hackertrip-design-system.md` — blue-white workspace, primary `#165DFF`, accent/mint `#21C6A8`, coral `#FF6A3D` (latest approved palette as of 2026-06-09, supersedes earlier `#1D64F2`).
- **Deprecated (do NOT use):** `hackertrip-miniprogram/style.md` and `design.md` "Claude warm clay orange `#C96442`" palette. The "已定稿" note in `style.md` is obsolete.
- The mini program is **blue-white only**. The dark-glass / warm-paper styles are the previous web identity, not the mini program target.

### 11.2 Visual reference images (ACTION REQUIRED)

The two reference images the design system depends on are **not present in the repo**:

- `ig_0977d353c6752635016a252a623ae48198894a2a4cf5d279a2.png` — intended: vertical-list efficiency, strong event cards
- `ig_0977d353c6752635016a252bdc94a8819898db6846f38db122.png` — intended: blue-white city discovery, horizontal featured events

Until these files are placed in `design/hifi/refs/`, treat their textual descriptions above as the binding spec. Codex must not invent a different visual direction to "fill the gap."

## 12. Navigation Model & Page Flow

> ⚠️ **DEPRECATED (2026-06-10)**: §12.1–12.2 的「无 tabbar + 左抽屉」方案已作废。导航定稿为**底部 tabbar（发现 / 赛程 / 消息 / 我的）**，主页 = 发现页。最新跳转真源见 `design/hifi/interaction-flow.md`（含 J-xx 编号跳转总表）。§12.3 的跳转关系已并入该文档。

### 12.1 Decision (superseded — see interaction-flow.md)

- ~~**No bottom tabBar.** The bottom strip is reserved for the Claude-style AI command bar on every primary screen.~~
- ~~**Primary navigation = left drawer**, opened by the top-left menu icon (consistent with the current Claude-style home).~~
- ~~**Home is the hub.** All modules are reachable from Home via the drawer or via quick entries inside the status panel.~~

### 12.2 Drawer contents (ordered)

1. 首页 Home
2. 发现黑客松 Event Discovery
3. 我的赛程 Schedule Workspace
4. 身份卡 Identity Card
5. Agent / Skills 库
6. 作品集 Project Portfolio
7. ——分隔——
8. 通知 Notifications
9. 设置 Settings

### 12.3 Page flow (primary jumps)

```
Home (Idle/Active/Matching/Deadline/Post-Event)
 ├─ command bar ───────────▶ AI Chat Search ──▶ AI Matching Results ──▶ Event Detail
 ├─ quick entry: Find Events ▶ Event Discovery ──────────────────────▶ Event Detail
 ├─ quick entry: Schedule ───▶ Schedule Workspace
 ├─ quick entry: Identity ───▶ Identity Card ──▶ Identity Card Edit ──▶ Public Site Preview
 ├─ quick entry: Agent ──────▶ Agent / Skills Library
 └─ drawer ──────────────────▶ any module above + Notifications + Settings

Event Detail actions:
  Add to schedule ─▶ Schedule Workspace
  Generate identity card ─▶ Identity Card
  Create submission checklist ─▶ Project Portfolio

Skills Sync (pairing code) ─▶ updates Identity Card / Project Portfolio / Matching Results
```

Codex must annotate these jumps as Figma prototype links and notes on each frame (this is the interaction-logic layer the review step checks).

## 13. Per-Page State Matrix

Every Priority 0/1 page must be designed with these states. P2/P3 pages need at least empty + content.

| State | When | Visual requirement |
| --- | --- | --- |
| Loading | data fetching | skeleton blocks matching card layout, no spinner-only screens |
| Empty | no data yet | centered icon + one-line copy + primary CTA |
| Content | normal | the designed module set |
| Error | request failed | inline retry, keep header/command bar usable |
| Offline | no network | top banner `网络不可用，下拉重试`, cached content if any |
| Unauthed | not logged in | gated module shows login CTA, never a blank screen |
| No permission | denied scope (e.g. avatar) | graceful fallback, never block the whole page |

## 14. AI Conversation Interaction Spec

The chat surface is the core behavior and must be fully specified, not implied.

- **Message bubbles:** user bubble right-aligned `bg.softBlue`; AI response left-aligned on `bg.canvas`, no bubble border, strong black text.
- **Streaming:** AI text streams token-by-token; show a thin animated caret while generating; allow "停止生成".
- **Structured follow-up:** when profile data is missing, AI renders inline chips/quick-replies (e.g. `选择城市` / `选择赛道`) instead of free text only.
- **Event results in chat:** matched events render as **compact event cards embedded in the AI reply**, each with name, date, city/mode, two tracks, match score, and a `查看详情` link to Event Detail.
- **Reasoning line:** each recommended event shows a one-line `为什么推荐：…` fit reason.
- **Empty/first turn:** show 3–4 suggested prompt chips (the `问 AI：…` examples) above the command bar.
- **Errors mid-chat:** failed turn shows a retry affordance on that message, conversation state is preserved.

## 15. Auth / First-Run / Onboarding

PRD previously omitted login and first-run entirely; a login page already exists in the codebase.

- **Login:** WeChat-compliant authorization page (头像/昵称 via WeChat profile; no forced phone number).
- **First run after login:** Home shows the **No Active Competition** state with an AI matching prompt — do not force a long onboarding form.
- **Progressive profile:** profile fields are collected lazily through the AI matching follow-up chips, not a wizard.
- **Identity card creation:** first visit to Identity Card shows an empty state with `一键生成身份卡` that pre-fills from WeChat profile + any Skills Sync data.

## 16. Sample Data Set — REAL HackerTrip data (use these exact values in hi-fi)

> Source: live `GET https://hackertrip.space/api/hackathons` (snapshot 2026-06-09). Use real events so the hi-fi reads as a real product, not a placeholder. AdventureX stays the hero. Dates are as published; swap for whatever is live at build time if needed.

### 16.1 Active / registered event — Status Panel hero (keep AdventureX)

- **Event:** `AdventureX 2026 — 中国最大青年黑客松`
- **City / mode:** 杭州 · 线下 · `Jul 22–26`
- **Prize / scale:** `$150,000+` · 800+ Hackers
- **Tracks:** 软件/网站开发 · 硬件创新 · 科技创新
- **Theme:** `A New Generation. Another Leap of Faith!`
- **Phase:** 报名（第 1/7 阶段）· 进度 14%
- **Next task:** `完善报名申请（AdventureX United Portal）`
- **Countdown:** to 开赛 · `43 天`
- **Website:** https://adventure-x.org/

### 16.2 Discovery / recommendation cards — real events pool

| Event | City · Mode · Date | Prize | Tracks (≤2 shown) | Match |
| --- | --- | --- | --- | --- |
| AttraX 春潮·Spring 黑客松 | 深圳 · 线下 · Apr 23–26 | 15w+ 现金 | 软件社交 · AI硬件 | 94 |
| BEYOND HACK DAY | 澳门 · 线下 · May 28–30 | 百万级 | 具身智能 · AI硬件 | 88 |
| AINX 浦软黑客松 | 上海 · 线下 · Jun 13–14 | ¥10,000+ | AI Agent · 智能硬件 | 85 |
| Flux 南客松 S2 | 南京 · 线下 · Apr 30–May 3 | 5w+ | 生产力效率 · 创意体验 | 80 |
| 腾讯云 AI 赛 | 全国五赛区 · 混合 · Apr 15–Sep 18 | ¥450,000 | Skill 赛道 · Agent 赛道 | 76 |
| Sea × OpenAI Codex | 新加坡 · 线下 · Jun 6 | $50,000 积分 | AI Coding Agents · AI-native | 72 |

### 16.3 "Deadline near" state variant — use the nearest real event

- **Event:** `AINX 浦软黑客松` · 上海 · 线下 · `Jun 13–14`（距今 4 天）
- **Urgent countdown:** 报名截止 · `1 天 08:20:00`
- **Readiness:** 60% · 缺：`项目一句话介绍`

### 16.4 Identity card sample

- 昵称 `Jayden` · 角色 `AI Product Builder` · 城市 `深圳`
- 技能 `React / LLM / 产品设计 / 增长`
- GitHub `@jayden` · 参赛 `3` · 作品 `2` · Skills `12`
- Token 本月 `1.2M`

## 17. Phase Model Mapping

| # | Phase | Default next task | Quick entries surfaced |
| --- | --- | --- | --- |
| 1 | 报名 | 完善报名信息 | Event Detail, Identity Card |
| 2 | 组队 | 寻找队友 / 确认队伍 | Identity Card, Project |
| 3 | 开发中 | 推进当前里程碑 | Project, Schedule |
| 4 | 中期提交 | 提交中期材料 | Project, Schedule |
| 5 | 评审中 | 等待结果 / 补充材料 | Project |
| 6 | 优化中 | 打磨 Demo / 路演稿 | Project, Agent (pitch writer) |
| 7 | Demo Day | 上台路演 / 提交终稿 | Project, Identity Card |

- **Progress bar:** 7 segments. Completed = `accent.mint`, current = `brand.blue`, upcoming = `line.default`.
- **Deadline color:** `status.coral` when countdown < 24h, otherwise `text.secondary`.

## 18. Icon Inventory (T-Design base)

Pick from TDesign icon set; one icon per entry, line style, 40rpx default.

| Entry | Icon intent |
| --- | --- |
| 菜单 | menu |
| 通知 | notification |
| 发现黑客松 | search / compass |
| 我的赛程 | calendar |
| 身份卡 | id-card / user-circle |
| Agent/Skills | app / grid |
| 作品集 | folder |
| 城市/线下 | location |
| 线上 | link / globe |
| 赛道 chip | tag |
| 收藏 | bookmark |
| 倒计时 | time |
| 命令栏发送 | send / arrow-up |
| 添加上下文 | add-circle |

## 19. Device / Safe Area / Dark Mode

- **Base width:** 750rpx (= 375pt). Design canvas 750rpx wide.
- **Top safe area:** reserve WeChat capsule zone (right ~88px / status bar height); custom header must not overlap the capsule.
- **Bottom safe area:** command bar sits above the home indicator; add bottom inset padding.
- **Dark mode:** **NOT supported in the mini program.** Blue-white only. (The dark theme belongs to the web product, not here.)

## 20. Skills Sync Pairing States

Five states required:

1. **Enter code** — 6-digit input + `配对` button, helper text `在桌面端运行项目扫描后获取配对码`.
2. **Pending** — `正在拉取扫描结果…` with skeleton.
3. **Success** — summary of what was pulled (matched events / identity updates / project) + `应用到身份卡`.
4. **Failed** — `配对失败，请检查配对码` + retry.
5. **Expired** — `配对码已过期，请在桌面端重新生成`.

## 21. Notifications & Settings (content spec)

### Notifications / Inbox

- Grouped: 截止提醒 / 匹配结果 / 系统消息.
- Each item: icon + title + one-line body + time + unread dot.
- Empty state: `暂无通知`.

### Profile / Settings

- 账号（WeChat 头像/昵称）
- 通知开关（截止提醒 / 匹配推送）
- 隐私协议 / 用户协议 链接
- 清除缓存
- 退出登录
- 版本号

## 22. Match Score & Heat Definition

- **Match score:** integer `0–100`. Shown as `匹配度 92`.
  - ≥ 85 → `accent.mint` ; 60–84 → `brand.blue` ; < 60 → `text.tertiary`.
- **Heat (optional secondary):** `🔥 + 报名人数` or `热度` label; never replaces match score on a recommendation card.
- A card shows **match score OR heat, not both**, to avoid clutter.

## 23. Accessibility / Contrast

- Body and titles must meet ≥ 4.5:1 contrast on their background.
- `text.tertiary #8792A6` is for **metadata only** (date, city), never for primary or interactive text.
- Minimum touch target: 88rpx × 88rpx.
- Selected/active states must be distinguishable by more than color alone (weight or fill change).

## 24. Copy Guidelines

- Chinese-first UI; keep brand/tech terms in English (HackerTrip, Agent, Demo, GitHub, Token).
- Buttons use verb-first short labels: `生成身份卡`, `加入赛程`, `查看详情`.
- Empty states: one encouraging sentence + one CTA, no long paragraphs.
- Countdown format: `2 天 06:14:30` (days + hh:mm:ss).

## 25. WeChat AI Invocation Adaptation (微信AI调用适配)

> Context: WeChat is rolling out an embedded AI Agent (right-swipe entry) that uses natural language to **call mini programs to complete user tasks** (discover, filter, register, generate). Compliance review started 2026-06. The official developer protocol (intent manifest field names) is not fully public yet; design to these primitives now and map to official fields when published. The unit of invocation is a **capability (intent)**, NOT a page. HackerTrip must expose its features as callable intents, deep-linkable pages, and machine-readable results.

### 25.1 Core principle

The WeChat AI Agent lives **outside** the mini program. It will:

1. Match a user request to a HackerTrip **intent**
2. Deep-link into a specific page with parameters (possibly half-screen)
3. Receive a **structured result** to render in the agent surface
4. Hand the user off to the mini program for deeper actions

So every core feature needs three contracts: an **intent declaration**, a **stable deep-link entry**, and a **structured output**.

### 25.2 Intent Catalog (design every page to back one or more intents)

| Intent | NL trigger example | Inputs | Deep-link path | Structured output | Auth | Half-screen |
| --- | --- | --- | --- | --- | --- | --- |
| `match.events` | 帮我找适合我的黑客松 | profile?, city?, track?, stage? | `/pages/chat?intent=match&src=ai` | ranked events[] + fit reasons | guest read | ✓ |
| `search.events` | 深圳有什么黑客松 | q, city?, mode?, dateRange? | `/pages/discovery?q=…&src=ai` | events[] | guest read | ✓ |
| `event.detail` | AdventureX 还能报名吗 | slug/eventId | `/pages/event?slug=…&src=ai` | event{} + registration{} | guest read | ✓ |
| `event.remind` | 提醒我 AdventureX 报名截止 | slug, when | `/pages/event?slug=…&intent=remind&src=ai` | reminder{} | login | ✓ |
| `schedule.status` | 我的赛程进度怎么样 | (logged-in user) | `/pages/schedule?src=ai` | status{phase,progress,nextTask,countdown} | login | ✓ |
| `identity.generate` | 生成我的参赛身份卡 | profile fields | `/pages/identity?intent=generate&src=ai` | cardImageUrl + profile{} | login | ✓ |
| `project.match` | 我的项目能报哪个赛道 | projectDesc | `/pages/chat?intent=projectMatch&src=ai` | tracks[] + events[] | guest read | ✓ |
| `skills.sync` | 同步我桌面扫描的结果 | pairCode | `/pages/sync?code=…&src=ai` | syncResult{} | login | ✓ |

Designers/Codex: each Figma frame must note which intent(s) it backs.

### 25.3 Deep-link / page contract (fixes drawer-vs-direct-entry gap)

Because the AI drops users onto any page directly:

- **Context-free pages:** every page renders correctly from its URL params alone, with no dependency on prior in-app navigation state.
- **Self-anchored header:** every page shows its own title + a `回到 HackerTrip 首页` anchor, even when entered mid-flow.
- **Stable paths + params:** never reorder or rename path params; treat them as a public contract. Always accept `src=ai` and `intent=…`.
- **Graceful unknown params:** unknown/expired params degrade to the page's default content, never a blank/error screen.

### 25.4 AI-referral landing state (`src=ai`)

When a page is opened from the WeChat AI Agent, show a dedicated landing variant:

- Top banner: `来自微信AI助手` + the original intent restated (`正在为你匹配黑客松…`).
- Show the AI-requested result **first** (skip the normal home/idle flow).
- Continue, do not restart, the conversation: pre-fill the in-app chat with context handed off from the agent.
- Primary CTA back to depth: `在 HackerTrip 里继续`.
- Distinct analytics attribution: tag session `source=wechat_ai`, separate from card-share virality.

### 25.5 Two-layer AI clarification

- **WeChat AI (external):** discovery + invocation + structured result rendering. HackerTrip exposes intents to it.
- **HackerTrip AI (internal, §14):** deep follow-up, generation (identity card, pitch), multi-turn refinement.
- The internal chat must **resume** from the external intent/context, never present a cold empty chat to an AI-referred user.

### 25.6 Machine-readable output layer

- Each intent returns a documented JSON shape (see 25.2), independent of the visual card.
- Configure `sitemap.json` to allow indexing of public pages (discovery, event detail, public profile).
- Event structured data must include: name, dates, city, mode, tracks, prize, official registration URL (real, per the publish quality gate).
- This doubles as GEO/citability: the same structured data lets WeChat AI cite and re-render HackerTrip content accurately.

### 25.7 Half-screen support

Key intent pages (`event.detail`, `identity.generate`, `match.events` results, `schedule.status`) must have a half-screen variant:

- First screen shows the single core conclusion (the event answer, the card, the match list top 3).
- Secondary detail collapses below the fold or behind `展开更多`.
- The `回到 HackerTrip` / full-screen CTA stays visible.

### 25.8 Auth degradation for AI traffic

- **Guest read:** matching results, search, event detail, fit reasons — no login.
- **Login required (progressive):** generate/save identity card, set reminders, view personal schedule, skills sync.
- Trigger login only at the write action, with a one-line reason (`登录后才能保存你的身份卡`), then return to the same task.

### 25.9 Compliance / category notes

- WeChat AI invocation raises content/category scrutiny (national-level product).
- Keep mini program category correct (tool / information service) and all event data real (publish quality gate: real tracks + real registration links).
- No fabricated events, prizes, or registration URLs — AI-surfaced false info is a high compliance risk.

### 25.10 Cross-terminal note

This section is the shared contract between the two dev terminals (this PRD terminal + the Codex/Figma terminal), which cannot message each other directly. Any change to intents, deep-link paths, or output shapes must be edited here first so both terminals stay aligned.

## 26. AI Assistant Agent Design (AI 黑客松助手)

> Decision (2026-06-09): the **brain is pluggable** — the moat is the shared tool/data layer, not the model. Mini program uses **Hunyuan (混元)** via the cloud-dev AI component (free token quota from the 2026 AI growth plan); web keeps the existing Claude/Anthropic agent. Both call the same model-agnostic tools. Do NOT build a generic Q&A bot.

### 26.1 Chosen approach

- **Shell:** WeChat cloud-dev AI conversation component for chat UI + conversation persistence.
- **Brain (mini program):** **Hunyuan (混元)** via cloud-dev — uses the free token/compute quota from the 2026 AI growth plan. Requires Hunyuan function-calling; keep tool params simple and convergent.
- **Brain (web):** existing Claude/Anthropic agent (`app/api/agent/chat`, `lib/openclaw/client`) stays for complex multi-turn reasoning.
- **Model switch:** back end must keep a **configurable model switch** (Hunyuan ↔ own key) so service survives quota expiry/limits — do not hardcode the model.
- **Not now:** WeChat 智能体平台 / A2A (not open yet) — but the tool schema below is designed to map directly to it later.

### 26.2 Tools = intents = existing data functions (one schema, every brain)

The brain is pluggable; swapping Claude ↔ Hunyuan changes nothing in this layer. The same tool definitions serve the in-app chat (Hunyuan), the web agent (Claude), and (later) WeChat A2A. The agent answers by calling tools, never from memory.

| Tool (= §25 intent) | Backed by | Auth |
| --- | --- | --- |
| `search_events` | `getHackathons` / `api/hackathons` | guest |
| `match_events` | `api/match` | guest |
| `get_event_detail` | `getHackathonDetail` | guest |
| `project_match` | `api/match` (project description) | guest |
| `generate_identity_card` | `saveCard` + generation step | login |
| `set_reminder` | `addRegistration` | login |
| `skills_sync` | `pairSync` | login |

### 26.3 Scope boundary (what the agent will and will not answer)

- **In scope (call a tool):** find/match events, event facts (dates, tracks, registration, deadline), project→track matching, identity card generation, reminders, skills sync.
- **Out of scope (refuse → redirect):** generic hackathon encyclopedia questions ("什么是黑客松", "怎么准备"). Respond briefly and steer to an actionable tool: `这类通用问题先不展开 — 要我直接帮你找适合你的黑客松吗？`
- **No tool match + no data:** never hallucinate an event. Say so and offer search.

### 26.4 Conversation behavior (ties to §14 UI)

- Tool calls render as **embedded result cards** in the reply (event cards, identity card preview), not raw text.
- Each recommendation shows a one-line `为什么推荐：…` grounded in the tool result.
- Multi-turn: the agent asks **one** missing-profile question at a time via quick-reply chips (city / track / stage), not a form.
- Streaming with `停止生成`; failed tool call shows inline retry, conversation preserved.

### 26.5 Auth degradation (ties to §25.8)

- Guest can run all read tools (search / match / detail / project_match) with no login.
- Write tools (`generate_identity_card`, `set_reminder`, `skills_sync`) trigger login **only at the action**, with a one-line reason, then resume the same task.

### 26.6 Entry points (where the assistant appears)

- Bottom command bar on Home and Discovery (primary, §13).
- Event Detail action `问 AI 这个适合我吗` → opens chat pre-loaded with that event (`get_event_detail` context).
- `src=ai` landing (§25.4): chat resumes the WeChat-AI handoff context, never cold-starts.

### 26.7 Design deliverables for Codex

Frames that must reflect this agent design:

- `02 AI 匹配聊天`: show a tool-call result (embedded event cards), a quick-reply chip turn, and the `src=ai` resumed-context banner variant.
- Event Detail: include the `问 AI 这个适合我吗` entry.
- Annotate on each chat frame which tools/intents the turn exercises.

