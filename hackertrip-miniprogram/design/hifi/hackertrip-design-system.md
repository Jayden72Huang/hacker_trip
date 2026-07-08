# HackerTrip Mini Program High-Fidelity Design System

## Product Positioning

HackerTrip is an AI companion workspace for hackathon participants. It combines event discovery, AI matching, schedule management, identity cards, agent/skills configuration, project portfolio, and personal site publishing.

The home page should not behave like a generic event feed. It should answer: "What is my current hackathon state, and what should I do next?"

## Visual Direction

Tencent mini program discipline plus HackerTrip blue-white exploration.

Keep the Claude-like calm command surface, but replace the warm paper identity with a sharper participant operating console:

- quiet white/ice background
- strong black Chinese typography
- blue as navigation and action color
- green for progress and completion
- orange/red for deadlines and urgent signals
- compact cards with practical hierarchy
- no decorative blobs, no purple-dominant gradient, no generic poster hero

## Reference Inputs

- Selected visual reference A: `ig_0977d353c6752635016a252a623ae48198894a2a4cf5d279a2.png`
- Selected visual reference B: `ig_0977d353c6752635016a252bdc94a8819898db6846f38db122.png`
- Existing product interaction: Claude-style home idle state plus bottom command/search bar
- Platform basis: Tencent TDesign / WeChat mini program component conventions

## Tokens

### Color

> **LOCKED 2026-06-10**: 暖白工作台 + 紫色 accent（基于用户选定的 Style Guide #04，60-30-10 配色，Purple 为 calmness/intuitiveness 的 accent；页面底改暖白以贴合 HackerTrip 产品调性）。Supersedes 所有更早版本（#165DFF / #1D64F2 / 暖橙 #C96442 全部作废）。

| Token | Value | Usage |
| --- | --- | --- |
| `bg.canvas` | `#FAF9F5` | 页面底（暖白） |
| `bg.surface` | `#FFFFFF` | 卡片、命令栏 |
| `bg.softPurple` | `#EFEDFF` | 选中 chip / kicker / 软面板 |
| `bg.softNeutral` | `#F5F4FF` | 快捷入口 / 次级 chip 底 |
| `text.primary` | `#010138` | 主标题（深蓝黑） |
| `text.secondary` | `#5F5F79` | 正文 |
| `text.tertiary` | `#9292B4` | 元信息（仅限） |
| `brand.purple` | `#4D4DE9` | 主操作 / 选中 / 进度当前段 / 图标高亮 |
| `brand.purpleDark` | `#3A3AD1` | 按压态 |
| `brand.purpleSoft` | `#7171F1` | hover / 次强调 |
| `accent.green` | `#BDF6CC` | 成功 / 已完成进度段（填充）；文字配 `#1E9E5A` |
| `accent.pink` | `#F9B9D9` | 标签点缀 |
| `accent.yellow` | `#FFDD99` | 标签点缀 |
| `status.urgent` | `#F2628A` | 截止<24h 倒计时 / 紧急（补 style guide 缺口，取粉红家族深色） |
| `line.default` | `#ECE9E1` | 暖中性边框 / 分隔（配暖白底） |
| `line.oncard` | `#EEEAF6` | 白卡内分隔线 |

字体：拉丁/数字用 Indivisible 风格几何无衬线（Figma 视觉），小程序中文回落 **PingFang SC**。
字阶（px@393）：Title 32 / Subtitle 24 / Heading 20 / 正文 16 / 次要 14 / 小字 12。
间距刻度：4 · 6 · 8 · 12 · 18 · 26 · 36 · 50 · 70 · 96 · 136 · 192；页边距 20。

### Radius

| Token | Value | Usage |
| --- | --- | --- |
| `radius.xs` | `8px` | small tags |
| `radius.sm` | `12px` | chips / buttons |
| `radius.md` | `16px` | inputs / list rows |
| `radius.card` | `20px` | cards |
| `radius.lg` | `24px` | status panel / command bar |
| `radius.pill` | `999px` | full-round chips / FAB |

### Spacing

Scale (px@393, ×2 ≈ rpx): `4 · 6 · 8 · 12 · 18 · 26 · 36 · 50 · 70 · 96 · 136 · 192`. 页边距 `20px`，卡内边距 `20px`，卡片间距 `12–16px`，区块间距 `26–36px`。

### Elevation

亮色工作台几乎不用重投影。卡片靠 `1px line.default` 边框 + 极淡阴影 `0 1px 2px rgba(1,1,56,0.04)` 浮起；浮层/抽屉用 `0 8px 24px rgba(1,1,56,0.08)`；主按钮可选 `0 6px 16px rgba(77,77,233,0.25)`。

### Typography

中文用 `PingFang SC`；拉丁/数字用 Indivisible 风格几何无衬线（Figma 视觉，开发回落系统栈）。
系统栈：`-apple-system, "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif`

| 角色 | 字号(px@393) | 字重 | 行高 |
| --- | --- | --- | --- |
| Title | 32 | Bold | 1.25 |
| Subtitle | 24 | Bold | 1.3 |
| Heading | 20 | Bold/Semibold | 1.35 |
| Body | 16 | Medium/Regular | 1.55 |
| Secondary | 14 | Medium | 1.5 |
| Small / Meta | 12 | Medium | 1.4 |

## Core Components

### App Header

- Left: menu icon
- Center: current space/title, such as `HackerTrip`
- Right: notification button
- Must leave room for WeChat capsule.

### Participant Status Panel

The central home module. It replaces a pure greeting.

Required content:

- active event name
- current phase
- countdown to next deadline
- progress bar with stage count
- next task
- quick entries: Schedule, Project, Identity Card, Agent Config

Empty state variant:

- no active event
- AI matching prompt
- quick entries: Find Events, Generate Identity Card, Configure Skills

### Bottom Command Bar

Claude-style command entry remains.

Placeholder examples:

- `问 AI：我适合参加哪个黑客松？`
- `搜索黑客松 / 城市 / 赛道`

Secondary controls:

- add context
- current filter or mode
- send/search button

### Event Cards

Use compact information hierarchy:

- event poster/thumb or colored event mark
- event name
- date range
- city and online/offline mode
- track chips
- heat or match score
- bookmark

## First Prototype Page

`Home / Idle / Active Hackathon`

Goal: prove the new homepage logic before expanding all pages.

Screen structure:

1. Custom mini program header
2. Compact product space label
3. Participant status panel in the middle
4. Suggested next actions below the panel
5. Bottom Claude-style AI command bar

Important: The middle panel must show current hackathon state instead of only greeting text.

## Future Page Set

Expand only after the first page is confirmed:

- Home / Idle / Empty State
- Home / AI Chat Search
- Event Discovery
- Event Detail
- Schedule Workspace
- Identity Card
- Agent / Skills Config Library
- Project Portfolio
- Public Personal Site Preview

---

# 组件规范 / Components（TDesign 组件模型 + 锁定 token）

> 落地用 `tdesign-miniprogram`；下表是把 TDesign 组件套上 HackerTrip 暖白·紫 token 后的规格。每个组件标 token + 状态。

## 按钮 Button
- **Primary**：底 `brand.purple #4D4DE9`，字 `#FFFFFF`，高 48px，圆角 `radius.sm 12px`，字 16/Semibold。按压 `brand.purpleDark #3A3AD1` + scale .98。禁用 `#C8C8E6` 底/白字。
- **Secondary**：底 `bg.softNeutral #F5F4FF`，字 `brand.purple`，同尺寸。
- **Ghost/Text**：透明底，字 `brand.purple`，无边框。
- **FAB / 发送钮**：圆形 38–44px，紫底白箭头。

## Chip / 标签
- **筛选 chip（可选中）**：默认 底 `#FFFFFF`+边 `line.default`+字 `text.secondary`；选中 底 `bg.softNeutral #F5F4FF`+字 `brand.purple`+（可选 1px 紫边）。高 30–32px，圆角 `radius.pill`，字 13/Medium。
- **赛道 tag（展示）**：底 `bg.softPurple #EFEDFF` 字 `brand.purple`；点缀变体可用 `accent.pink/yellow` 底。高 28px，圆角 8–12px，字 12–13。

## 输入 / 命令栏 Input
- **普通输入**：底 `#FFFFFF`，边 `line.default`，高 44px，圆角 `radius.md 16px`，左 icon + placeholder（`text.tertiary`）。聚焦时边变 `brand.purple`。
- **底部命令栏**：白卡，圆角 `radius.lg 24px`，边 `line.default`。内含 placeholder、左「+加上下文」圆钮（`bg.canvas` 底）、scope chip（`bg.softNeutral`）、右紫色发送圆钮。固定底部，留 home indicator 安全区。

## 卡片 Card
- **基础卡**：底 `#FFFFFF`，边 `line.default 1px`，圆角 `radius.card 20px`，内边距 20px，极淡阴影。
- **赛事卡（紧凑）**：赛事名(Heading) → 元信息行(📅日期·📍城市·形式) → 赛道 tag(≤2) → 底栏(匹配分 或 热度 + 收藏☆)。
- **精选大卡**：加 kicker「FEATURED」+ 更大视觉权重 + 封面色块/插画。

## 状态面板 Status Panel（首页核心）
- 白卡，圆角 `radius.lg`。内含：kicker chip(`bg.softPurple`「正在参赛」) → 赛事名(Subtitle) → 元信息 → 阶段+7段进度条 → 下一任务行(`bg.canvas` 底小卡) → 倒计时(`text.secondary`，<24h 用 `status.urgent`) → 4 快捷入口(`bg.softNeutral` 底圆角块，字紫)。
- **空态变体**：无活跃赛事 → AI 匹配引导文案 + 主按钮「帮我找黑客松」+ 3 快捷入口。

## 进度条 Progress（7 段）
- 7 个圆角段，间距 6px。已完成 `accent.green #BDF6CC`；当前 `brand.purple`；未来 `#EEEAF6`。

## 导航 Navigation
- **顶栏 TopBar**：左 ☰/返回‹，中标题(Heading)，右 🔔/⊙。留微信胶囊安全区（右 ~88px）。
- **抽屉 Drawer**：左侧滑出，列模块入口（发现/赛程/身份卡/Agent/作品集/收藏 — 通知/设置）。当前页高亮紫。
- **底部 tabBar（若采用）**：发现/赛程/消息/我的，选中 icon+字 `brand.purple` 填充，未选 `text.tertiary` 线性。
  > 导航最终形态（抽屉 vs tabBar）见 PRD §12，出图时统一。

## 聊天 Chat
- **AI 气泡**：左对齐，底 `#FFFFFF` 或透明，无边框气泡，字 `text.primary`；生成时细光标。
- **用户气泡**：右对齐，底 `bg.softPurple #EFEDFF`，字 `text.primary`，圆角 16px。
- **快捷回复 chips**：AI 追问时内联（城市/赛道/阶段）。
- **结果卡内嵌**：匹配赛事以紧凑赛事卡嵌在 AI 回复里 + 一行「为什么推荐」。

## 身份卡 Identity Card
- 大卡片：头像/角色 emoji → 角色名(Subtitle) → 统计(项目·比赛·获奖) → 主技术栈 tag → 底部「保存图片/分享找队友」。可做紫渐变质感变体用于分享图。

## 匹配分 / 热度
- 匹配分 0–100：≥85 `accent.green`(文字 `#1E9E5A`)，60–84 `brand.purple`，<60 `text.tertiary`。一张卡只显示匹配分**或**热度，不并列。

---

# 状态规范 / States

每个 P0/P1 页面必须设计以下状态：

- **Loading**：骨架块（对齐真实卡片布局），不要纯 spinner。
- **Empty**：居中图标 + 一句话 + 主 CTA。
- **Content**：正常。
- **Error**：内联重试，保留顶栏/命令栏可用。
- **Offline**：顶部 banner「网络不可用，下拉重试」，有缓存则展示。
- **Unauthed**：游客只读；写操作处才弹登录（一行理由）。
- 详见 PRD §13 状态矩阵。

---

# 图标 / Icons

- 用 **TDesign Icons**（线性为主，2px 线宽，20/24/28px），`tdesign-miniprogram` 自带 `t-icon`。
- 选中/强标态可用填充图标 + `brand.purple`。
- Figma 端配 TDesign Icons 插件保持设计开发一致。
- 入口图标见 PRD §18 清单（菜单/通知/发现/赛程/身份卡/Agent/作品集/城市/线上/赛道/收藏/倒计时/发送/加上下文）。

---

# 小程序落地 / Handoff

- 基准宽 750rpx（=375pt / 设计画布 393px）。
- 顶部留微信胶囊安全区；底部命令栏/内容留 home indicator 安全区。
- 最小触达 88rpx × 88rpx（≈44px）。
- 不做暗色（仅暖白）。
- 颜色经 TDesign 主题变量注入：`--td-brand-color: #4D4DE9` 等，统一换肤。
- 中文 PingFang SC；图片压缩转 WebP（参考项目历史 LCP 教训）。

