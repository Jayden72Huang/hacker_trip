# HackerTrip 小程序 · 设计→开发执行总纲（Build Handoff）

> 定稿 2026-06-17（修正版）。后续「设计稿 + 小程序开发」的唯一执行真源。
> ⚠️ 改版/新页前**必读** `hifi-build-log.md`（含终稿 frame id、硬规则、Figma API 坑），勿重做已完成的页。

---

## 0. 一句话方针

**界面框架走矢量（精确可交付）+ 海报/头像走图片占位（开发接后端）+ 全部组件复用真源组件库（统一）。**

---

## 1. 当前真实状态（重要）

**✅ 9 页 Hi-Fi 矢量终稿已于 2026-06-11 全部完成**，在 Figma page「02 Hi-Fi 页面设计稿」，统一 **393×852**，标准结构（fixed 顶栏/底栏 + 可滚动 __content），命名带 intent 映射：

| 页 | 终稿 frame id | 对应 intent |
|---|---|---|
| 01 发现 Discovery | `214:25` | search.events |
| 02 赛程 Schedule | `227:44` | schedule.status |
| 03 聊天 Chat/匹配 | `233:44` | match.events · project.match |
| 04 匹配结果 Match | `243:44` | project.match |
| 05 赛事详情 Event | `235:44` | event.detail · event.remind |
| 06 身份卡 Identity | `244:44` | identity.generate |
| 07 Skills 同步 Sync | `243:128` | skills.sync |
| 08 消息 Inbox | `247:44` | event.remind 承接 |
| 09 我的 Profile | `247:115` | identity.generate 入口 |

> 海报位 = 色块占位（正确，不用插画/AI）。logo = 矢量环带 H（已在终稿内）。

---

## 2. 尺寸 / 基准规范

- **画布**：每页 **393 × 852 px**（iPhone 14/15，= 750rpx 宽），1px ≈ **1.908 rpx**
- **标准页面结构**（`hifi-build-log.md` 第 6 条，所有页必守）：root 393×852 + `overflowDirection=VERTICAL` + `clipsContent`；子节点 = `__content`（滚动内容，padding 16/底部留 110 防遮挡）→ `__topbar(fixed)` → 底栏（tabbar/命令栏/详情双 CTA）；`numberOfFixedChildren` = 固定子节点数。**禁止随内容变高的页面 frame**——视口恒定，内容长度由 __content 承载。
- **页边距 16**，区块间距 24-32，卡间距 12，**8px 栅格**
- **系统组件官方固定尺寸**：状态栏 54(灵动岛)/47(14) · 导航栏 44 · 自定义导航总高 ≈98 · 胶囊 **87×32 右距 7**（右上禁可点）· 底部安全区 34 · tabBar 50+34 · 内容安全区 顶98~底818(有tabBar到768)

---

## 3. 组件库（page「01 效果图+设计规范」152:2 内，实例化复用）

### A 基础（192:2）
Button/Primary `192:7` · Secondary `192:15` · Ghost `192:23` · FAB/Lemon `192:25` · FAB/Cobalt `192:27`；Chip/Filter Default `192:33`/Selected `192:35`；Tag Track/Neutral/Offline/Online/Location `192:41/43/45/47/49`；Badge Heat `192:53`/MatchScore High/Mid/Low `192:55/57/59`

### B 复合（193:2）
Input/Search `193:5` · Input/CommandBar `193:11` · Card/EventListItem `193:18` · Progress/Phases7 `193:32` · Navigation/TabBar `193:50`

> 字体：中文 **Noto Sans SC**（标题 Black/Bold，正文 Regular/Medium）。改组件实例文字用 `getStyledTextSegments(['fontName'])` 取原字体再 load；实例内不能删子节点，改内部图标先 `detachInstance()`。
> Token 数值唯一真源：`neobrutalist-design-system.md`。

---

## 4. 矢量 vs 图片分工（铁律）

| 走矢量（设计稿精确做） | 走图片占位（开发接后端） |
|---|---|
| 系统栏/卡片/按钮/chips/tag/输入框/进度条/tabBar/文字/图标/边框投影圆角 | 活动海报、用户头像、插画、照片 |

海报/头像在设计稿 = 占位框，开发接后端真实图。**不用 AI 生成图片素材**（矢量做不出插画属正常，因为它本就是运行时的图片数据）。

---

## 5. 页面缺口（PRD 16 页 vs 已完成 9 页）

已完成 9 页（§1）。**待补 P2/P3 页**（按 `interaction-flow.md` J-xx + PRD）：
- 身份卡编辑（P2）· Agent/Skills 配置库（P2）· 作品集 Portfolio（P2）
- 公开主页预览（P3）· 分享落地页（P3）· 登录（auth）· 设置（P3）
- 详情页「去官方报名」webview 态
- P0/P1 状态变体（loading/empty/error/offline/unauthed）

补页方式：复用 §3 组件库 + §2 标准结构在「02 Hi-Fi」page 拼装，命名 `XX-name/state · 终稿`。

---

## 6. 设计 → 开发映射（小程序代码）

- 技术栈：原生小程序 + `tdesign-miniprogram` + CloudBase；`navigationStyle: custom`；单位 rpx（px×1.908）

| 设计组件 | 小程序实现 |
|---|---|
| 系统栏/自定义导航 | 自定义 navbar 组件（读 statusBarHeight 动态避让，胶囊安全区 §2） |
| Button / Chip / Tag / Search | t-button / t-check-tag / t-tag / t-search（配色按规范） |
| Card/EventListItem | 自定义卡 + t-image（海报 lazy-load，src 后端） |
| Progress/Phases7 | t-steps 或自定义 7 段 |
| TabBar | **custom-tab-bar 自定义组件**（野兽派样式，只开发 1 个、4 主页自动复用，选中电光蓝） |

> ⚠️ **导航机制铁律（2026-06-18 查证官方设计指南定）**：tabBar 是微信官方机制——**仅在「标签页」显示**（4 主页：发现/赛程/消息/我的，`switchTab` 切换）。**次级页（详情/聊天/匹配/身份卡/同步/作品集/登录/设置/Agent库/编辑/分享/公开）经 `navigateTo` 打开，机制上没有 tabBar**，官方要求「左上角返回」。原生 tabBar 样式固定（图标+文字+纯色）做不出野兽派 → 4 主页用 `custom-tab-bar`。**只有 4 主页有 tabBar，其余 12 页无 tabBar + 左上返回。**
| 图标 | t-icon（TDesign icon，PRD §18 清单） |

- 路由：index/detail/chat/match/schedule/portfolio/inbox/profile/identity/identity-edit/public-site/agent/sync/login/settings
- 深链/AI 适配（PRD §25）：每页接 `src=ai`/`intent=` 参数，context-free 可直达；终稿命名已标 intent 映射。

---

## 7. 下一步执行顺序（正确版）

1. **用户确认 9 页终稿**（§1）
2. 按 `interaction-flow.md` J-xx 表用 `setReactionsAsync` 接 Figma 原型跳转
3. 补 §5 的 P2/P3 缺页 + 状态变体
4. 设计定稿 → 按 §6 映射开发小程序（可借助 Codex 写代码骨架）

> 待你决策：海报图来源（开发接后端真实活动海报 / 图库，默认占位）。
