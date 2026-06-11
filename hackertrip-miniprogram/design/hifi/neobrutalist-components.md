# HackerTrip 小程序 · Neo-Brutalist 组件规格库

> **主题锁定 2026-06-10**：「新野兽派 Neo-Brutalist」。风格唯一真源 = `design/prd-design-v2/effect-mockups/v8-theme-explore/theme-neobrutalist-blue.png`。
> 本文件 = **组件层规格**。底层 design token（精确 hex / 字阶 / 间距数值表）由 token Agent 维护，本文件只**引用 token 名**，不重复定义数值。
> 落地基于 `tdesign-miniprogram`：每个组件标注「对应 TDesign 组件 + 需覆盖的样式」。

---

## 0.1 Token 对照表（唯一数值真源 = design-system 文档）

> ⚠️ **对齐声明（2026-06-10 汇总）**：所有精确 hex / 数值以 `neobrutalist-design-system.md` 为**唯一真源**。本组件文档早期用了一套简写 token 名（`brand.cobalt` 等），下表把它映射到 design-system 的规范名 + 正确值。**开发取值一律查规范名那一列**，简写名仅作本文阅读用。

| 本文简写 | → 规范名（真源） | 值 |
| --- | --- | --- |
| `bg.canvas` | `color.bg.canvas` | `#F4F1E8` 亮米白页面底 |
| `bg.surface` | `color.bg.surface` | `#FFFFFF` 卡面 |
| `bg.sunken` | `color.bg.sunken` | `#ECE8DB` 进度槽/内凹 |
| `brand.cobalt` | `color.brand.primary` | `#0C51ED`（**非** 2D5BFF，实测取色） |
| — 按压 | `color.brand.primaryPressed` | `#0A41BE` |
| `accent.lemon` | `color.accent.lemon` | `#FBD902`（**非** FFE600，实测取色） |
| — 按压 | `color.accent.lemonPressed` | `#E0C200` |
| `accent.mint` | `color.success.fill` / `color.success` | 底 `#3DDC84` / 字 `#13B36B` |
| `text.primary` / `secondary` / `tertiary` | `color.text.*` | `#000000` / `#3D3D3D` / `#7A7A75` |
| `line.heavy`(2px) / `line.heavyXL` | `color.border.ink` | `#000000`，标准 2px / 首屏主元素 2.5px |
| `shadow.hardSm/Md/Lg` | `color.shadow.ink` | `2/4/6 px` 同值偏移 `0 #000`，blur=0（另有 xl `8px`） |
| `radius.sm` / `radius.card` / `radius.pill` | `radius.*` | chunky 甜区 10–20px / pill 全圆 |
| `font.display` / `font.heavy` | typography（§字阶） | Title 30/900 · Subtitle 22/800 · Heading 17/700 |

> 紧急 `color.urgent` `#FF4D2E`、热度 `color.heat` `#FF7A00` 互不混用。语义见真源 §1.4。

---

## 0. 主题基调（组件通用 DNA）

新野兽派的视觉一致性来自下面 5 条「硬规则」，**每个组件都套用**，后文不再重复：

| 规则 | 说明 | 引用 token |
| --- | --- | --- |
| **硬黑边** | 每个有边界的元素（按钮/chip/卡/输入框/进度轨/徽章/tabBar 选中框）一律 `2px solid` 纯黑描边，无半透明。 | `line.heavy`（纯黑 2px）；大卡可用 `line.heavyXL` 3px |
| **硬投影（offset，无模糊）** | 关键可点元素用「黑色实心偏移投影」`box-shadow: 4px 4px 0 0 black`，**blur=0**。卡片 `6px 6px 0`，chip/小钮 `2px 2px 0`。绝不用柔和阴影。 | `shadow.hardSm` / `shadow.hardMd` / `shadow.hardLg` |
| **chunky 圆角** | 圆角偏大且统一：chip/按钮 `radius.sm`，卡 `radius.card`，徽章/pill `radius.pill`。野兽派允许「硬圆角」，但不要 0 圆角的纯方块（除海报插画区可直角）。 | `radius.*` |
| **粗重黑体** | 标题用最重字重（Heavy/Black），中文回落 `PingFang SC` 加粗；拉丁大写优先（HACKERTRIP / FEATURED）。 | `font.display` / `font.heavy` |
| **高对比配色** | 亮米白底 `bg.canvas`(=`color.bg.canvas` `#F4F1E8`)；主色电光蓝 `brand.cobalt`(=`color.brand.primary` `#0C51ED`，导航/主操作/选中)；强调 lemon `accent.lemon`(=`color.accent.lemon` `#FBD902`，FAB/倒计时/热度/高亮)；文字纯黑 `text.primary`(`#000000`)。色块大面积、边界清晰，不用渐隐。 | `bg.canvas` / `brand.cobalt` / `accent.lemon` / `text.primary`（hex 见 §0.1 对照表） |

> **按压反馈统一规则（核心交互）**：野兽派的"压下去"= 元素向投影方向位移 + 投影收缩。
> 按下时 `transform: translate(2px,2px)`，同时 `box-shadow` 从 `4px 4px 0` 收到 `2px 2px 0`（或归 0），视觉上像把按钮按到纸面上。所有带硬投影的可点元素都用这套（下文标「↘按压位移」即指此）。
> 小程序实现：`:active` 类（`hover-class` / `wx:bind 触发态`）切换 transform + box-shadow。

---

## 1. Button 按钮

**TDesign 基座**：`t-button`，`variant` 用 `base`，全部覆盖 `--td-button-*` 主题变量 + 自定义 `external-class` 加黑边/硬投影。

### 1.1 Primary（主操作 · 如「搜索」「报名」「帮我找黑客松」）
- **用途**：页面唯一主行动。
- **结构**：纯文字 或 文字+右箭头。高 48px，左右内边距 20px，圆角 `radius.sm`。
- **关键视觉**：底 `brand.cobalt`，字 `#FFFFFF`/`font.heavy` 16，`2px` 黑边 `line.heavy`，硬投影 `shadow.hardMd (4px4px0)`。
- **状态**：
  - 默认：如上。
  - **按压**：底 `brand.cobaltDark`，↘按压位移（translate 2,2 + 投影收到 2px2px0）。
  - 禁用：底 `neutral.disabled`（去饱和灰蓝），字 `#FFFFFF` 70%，**保留黑边**但投影归 0，不可点。
  - hover（开发态/真机无）：投影微涨到 `5px5px0`（仅 H5 预览用）。

### 1.2 Secondary（次操作 · 如「查看全部」旁的弱按钮、卡内副 CTA）
- **用途**：与 Primary 并列的次要行动。
- **结构/尺寸**：同 Primary。
- **关键视觉**：底 `#FFFFFF`，字 `text.primary`/`font.heavy`，`2px` 黑边，硬投影 `shadow.hardSm`。
- **状态**：选中/激活时底切 `accent.lemon`（字仍黑）；按压 ↘位移；禁用 底 `neutral.softGray` 字灰、投影归 0。

### 1.3 Ghost / Text（如「查看全部 ›」「重试」内联链接）
- **用途**：低权重导航/内联动作。
- **结构**：纯文字 + 可选小箭头/icon。无背景。
- **关键视觉**：字 `brand.cobalt`/`font.heavy` 14，**无边框无投影**（野兽派里 Ghost 是唯一不带黑边的按钮，用于区分层级）。
- **状态**：按压 字色 `brand.cobaltDark` + 文字下加 `2px` 黑实线 underline 一闪；禁用 字 `text.tertiary`。

### 1.4 FAB / 发送钮 / 圆箭头（状态面板「›」、身份卡 CTA「→」、命令栏发送）
- **用途**：单一图标动作的圆形按钮；本主题的标志性元素之一。
- **结构**：正圆，直径 40–44px，居中放 1 个 `t-icon`（箭头/发送）。
- **关键视觉**：底 `accent.lemon`（FAB 主形态）或 `brand.cobalt`（命令栏发送），icon 纯黑 `text.primary`（lemon 底）或白（cobalt 底），`2px` 黑边，硬投影 `shadow.hardMd`。**圆形 + 黑边 + 黄底 = 野兽派招牌**。
- **状态**：
  - 默认：黄底黑箭头黑边。
  - **按压**：↘按压位移 + 投影收 0，像被「按进」纸面；底色压深 `accent.lemonDark`。
  - 禁用（如发送空内容）：底 `neutral.softGray`，icon `text.tertiary`，投影归 0。

---

## 2. Chip / Tag

**TDesign 基座**：筛选 chip 用 `t-check-tag`（可选中态原生支持）；展示 tag 用 `t-tag`。均覆盖样式加黑边。

### 2.1 筛选 chip（可选中 · 顶部「全部 / AI / 硬件 / 出海 / Web3 / 筛选」）
- **用途**：列表/发现页的横向筛选条，单选或多选。
- **结构**：文字（可带前置 icon，如「筛选」配漏斗）。高 34px，内边距 14px，圆角 `radius.sm`，横向间距 8px。
- **状态**：
  - **默认（未选）**：底 `#FFFFFF`，字 `text.primary`/`font.heavy` 13，`2px` 黑边，硬投影 `shadow.hardSm (2px2px0)`。
  - **选中**：底 `brand.cobalt`，字 `#FFFFFF`，黑边保留，投影保留。（效果图中「全部」即此态）
  - **按压**：↘按压位移 + 投影收 0。
  - 禁用：底 `neutral.softGray`，字 `text.tertiary`，无投影。

### 2.2 赛道 / 属性 tag（展示 · 卡内「AI」「企业出题」「全球赛」「线上+线下」）
- **用途**：纯展示标签，不可点。
- **结构**：短文字，高 24–26px，内边距 8px，圆角 `radius.xs`，`2px` 黑边，**无投影**（展示 tag 不浮起，避免噪点）。
- **配色变体**（语义化，效果图实证）：
  - 主赛道（AI 等）：底 `brand.cobalt` + 白字。
  - 中性属性（企业出题/全球赛）：底 `#FFFFFF` + 黑字 + 黑边。
  - 模式 tag「线下」：底 `brand.cobalt` 白字；「线上」：底 `accent.lemon` 黑字。
  - 地点 tag：底 `#FFFFFF` 黑字 + 前置 `brand.cobalt` 定位 icon。
  - 点缀变体（可选）：`accent.pink` / `accent.mint` 底配黑字黑边，用于稀有标签。

---

## 3. Input / 命令栏

**TDesign 基座**：`t-input` / `t-search`；命令栏为自定义复合组件（`t-input` + 两侧 `t-button` 圆钮）。

### 3.1 普通输入框 / 搜索框（发现页「搜索黑客松 / 城市 / 赛道」）
- **用途**：文本检索/表单输入。
- **结构**：左前置 `t-icon`（放大镜）+ placeholder + 右侧可内嵌 Primary「搜索」钮。高 48px，圆角 `radius.sm`，内边距 14px。
- **关键视觉**：底 `#FFFFFF`，`2px` 黑边，硬投影 `shadow.hardSm`；placeholder 字 `text.tertiary`；右「搜索」钮 = Button/Primary 缩小版（cobalt 底白字黑边）嵌在框右内侧。
- **状态**：默认 / **聚焦**（黑边加粗到 `line.heavyXL 3px` 或边色保持黑但投影涨到 `4px4px0`，提示激活）/ 填充 / 禁用（底 `neutral.softGray`）/ 报错（边切 `status.urgent` 黑边外加红，下方一行红字）。

### 3.2 底部 Claude 风命令栏（首页/聊天页核心输入面）
- **用途**：AI 命令入口（问 AI / 搜索），固定屏幕底部。
- **结构**（左→右）：
  1. 「+ 加上下文」圆钮（小 FAB，底 `#FFFFFF` 黑边，「+」黑色）
  2. placeholder 输入区（如「问 AI：我适合参加哪个黑客松？」）
  3. scope chip（当前模式/筛选，如「黑客松」，样式 = 筛选 chip 未选态缩小版）
  4. 发送圆钮（FAB/发送，cobalt 底白箭头 或 lemon 底黑箭头，黑边硬投影）
- **关键视觉**：整条为白卡，圆角 `radius.lg`，`2px` 黑边，硬投影 `shadow.hardMd`；浮在 `bg.canvas` 上。固定底部，留 home indicator 安全区。
- **状态**：空（发送钮禁用灰）/ 有内容（发送钮亮 lemon/cobalt）/ AI 生成中（发送钮换「停止生成」方块图标，底 `status.urgent`）/ 聚焦（黑边整体亮、键盘顶起）。

---

## 4. Card 卡片

**TDesign 基座**：`t-cell` / 自定义 `view` + `external-class`；图片用 `t-image`（懒加载 + WebP）。

### 4.1 基础卡
- **用途**：通用容器（任务卡、提醒卡、结果卡）。
- **结构**：标题行 → 内容 → 可选底部操作行。内边距 18px，圆角 `radius.card`。
- **关键视觉**：底 `#FFFFFF`，`2px` 黑边，硬投影 `shadow.hardLg (6px6px0)`。野兽派卡不用淡阴影，全靠黑边+硬投影"贴纸感"。

### 4.2 赛事贴纸海报卡 · 精选大卡（首页/发现「精选推荐」走马灯）
- **用途**：重点赛事的视觉强展示，"贴纸"质感。
- **结构**（自上而下）：
  1. **海报插画区**：满宽粗线条插画（春潮/AdventureX/腾讯云 AI 黑客松风格），可直角或 `radius.card` 上圆角。左上角叠 **热度徽章**（见 §10）。
  2. 赛事名（`font.display` Heading）+ 副标题/主办。
  3. 元信息行：📅日期。
  4. tag 行：地点 tag（白底黑字+cobalt 定位 icon）+ 模式 tag（线下=cobalt / 线上=lemon）。
- **关键视觉**：整卡 `2px`（重点卡可 `3px`）黑边 + 硬投影 `shadow.hardLg`；卡片是水平走马灯，露出下一张边缘暗示可滑。可加 kicker「FEATURED / 精选」lemon 小标贴在左上。
- **状态**：默认 / 按压（整卡 ↘按压位移）/ 已收藏（书签 icon 填充 cobalt）/ loading（骨架=灰块同布局 + 黑边占位）。

### 4.3 赛事贴纸海报卡 · 普通列表卡（「更多黑客松」列表）
- **用途**：列表浏览的紧凑赛事卡。
- **结构**（左→右）：
  - 左：方形海报缩略图（`radius.sm`，`2px` 黑边）。
  - 中：赛事名（`font.heavy`）→ tag 行（赛道 tag + 属性 tag）→ 元信息行（📅日期 · 📍城市）。
  - 右上：**热度徽章**（🔥+数字，lemon pill）；右中：收藏书签 icon。
- **关键视觉**：底 `#FFFFFF`，`2px` 黑边，硬投影 `shadow.hardMd`；卡间距 12px。
- **状态**：默认 / 按压 ↘位移 / 已收藏（书签填充 cobalt）/ 已截止（整卡降饱和 + 角标黑色「已截止」贴）。

---

## 5. Status Panel 状态面板（首页核心）

**TDesign 基座**：自定义复合卡（基础卡 + Progress + FAB + 快捷入口网格）。

- **用途**：首页中部，回答"我现在的黑客松状态 + 下一步做什么"。本主题最复合的组件。
- **结构（有活跃赛事态）**：
  1. **kicker chip**「正在关注 / 正在参赛」：lemon 底黑字黑边小 pill（效果图左上）。
  2. **赛事名**（`font.display` Subtitle，如「春潮 Spring」）+ 地点/形式小 tag。
  3. **倒计时块**（右侧）：「距离报名截止」小字 + 大号天数（`font.display`，数字用 `accent.lemon` 高亮）+ lemon 圆箭头 FAB（进详情）。
  4. **匹配度 / 进度行**：「匹配度 92%」标签 + **7 段进度条**（见 §6）或匹配度长条。
  5. **下一任务行**（可选）：`bg.canvas` 底小卡 + 黑边，一行任务文案 + 勾选。
  6. **4 快捷入口**：赛程 / 项目 / 身份卡 / Agent，每个 = 白底黑边小方块 + icon + 字，硬投影 `shadow.hardSm`。
- **关键视觉**：外层白卡 `2px` 黑边 + 硬投影 `shadow.hardLg`；内部用 lemon + cobalt 点睛，黑色分隔。
- **状态**：
  - **有活跃赛事**：如上。
  - **空态变体（无活跃赛事）**：kicker 换「还没在参加」→ 一句 AI 匹配引导文案 → **Primary 按钮「帮我找黑客松」**（cobalt 黑边硬投影）→ 3 快捷入口（找赛事 / 生成身份卡 / 配置 Skills）。
  - **截止临近（<24h）**：倒计时数字与块改 `status.urgent`（红），其余不变。
  - **匹配中 / loading**：进度区与任务行用骨架灰块（保黑边）。

---

## 6. Progress 7 段进度条

**TDesign 基座**：不用 `t-progress`（连续条不符野兽派），用自定义 7 个 `view` 段。

- **用途**：表达 7 阶段赛程推进（已完成→当前→未来），或匹配度填充。
- **结构**：7 个等宽圆角段，段间距 6px，整体外可包一层 `2px` 黑边轨道（效果图中匹配度长条即黑边轨道 + 填充）。段高 12–14px，段圆角 `radius.xs`。
- **三态配色**：
  - **已完成**：填充 `brand.cobalt`（或 `accent.mint` 表"成功"），`2px` 黑边。
  - **当前段**：填充 `accent.lemon`，`2px` 黑边（黄色="你在这里"，最跳）。
  - **未来段**：底 `#FFFFFF` 或 `neutral.softGray`，`2px` 黑边（空槽）。
- **关键视觉**：每段都有黑边 = 像一排黑框积木块；这正是野兽派进度条与普通渐变进度条的根本区别。
- **状态**：随阶段推进左段逐个填充；全完成时整排 cobalt + 末尾 lemon 收尾庆祝态可选。

---

## 7. Navigation 导航

### 7.1 底部 tabBar（发现 / 赛程 / 消息 / 我的）
**TDesign 基座**：原生 `tabBar` 自绘（custom tabBar）覆盖样式。
- **用途**：四大主入口。
- **结构**：4 等分，每项 icon（24–28px）上 + 中文字下。整条顶部 `2px` 黑实线分隔，底 `#FFFFFF`，留 home indicator 安全区。
- **状态**：
  - **选中**（效果图「发现」）：icon + 字 `text.primary` 纯黑加粗，外套一个 `2px` 黑边小方框 + 浅 lemon/灰底高亮块（"被框住"的野兽派选中态）。
  - 未选：icon + 字 `text.tertiary`，线性 icon，无框。
  - 红点/未读：消息项右上 `status.urgent` 圆点 + 黑边。

### 7.2 顶栏 TopBar
**TDesign 基座**：`t-navbar`（自定义）+ 自绘标题区。
- **用途**：页面顶部导航/标题。
- **结构**：左 ☰菜单 或 ‹返回 / 中 城市选择「深圳 ▾」或页面标题 / 右 🔔通知。**右侧留微信胶囊安全区（~88px）**。
- **关键视觉**：底 `bg.canvas`（与页面同色，无单独条），图标纯黑 `font.heavy` 线性；城市选择器可做成小黑边 chip。
- **状态**：默认 / 滚动后（可加底部 `2px` 黑分隔线区分内容）/ 通知有未读（🔔 加 lemon 角标黑边）。

### 7.3 左抽屉 Drawer
**TDesign 基座**：`t-drawer`（左侧 placement）覆盖样式。
- **用途**：全局模块入口（发现 / 赛程 / 身份卡 / Agent / 作品集 / 收藏 — 通知 / 设置）。
- **结构**：左侧滑出面板（宽 ~78%），顶部用户区（头像+昵称，黑边方块头像）→ 模块列表（每行 icon + 名）→ 底部 设置/退出。面板右缘 `2px` 黑边 + 硬投影 `shadow.hardLg`，外层半透明黑遮罩。
- **状态**：**当前页高亮** = 该行底 `accent.lemon`/`brand.cobalt` + `2px` 黑边框住；其余行白底黑字；按压行 ↘位移。

---

## 8. Chat 聊天

**TDesign 基座**：自定义气泡（`view`），快捷回复用 `t-check-tag`，结果卡复用 §4.3。

### 8.1 AI 气泡（左对齐）
- **结构**：左对齐，可带小 AI 角标。底 `#FFFFFF`，`2px` 黑边，硬投影 `shadow.hardSm`，圆角 `radius.card`（左下角可切小，指向来源）。
- **状态**：生成中（末尾闪烁黑色实心方块光标，非细线）/ 完成 / 单条失败（气泡内联「重试」Ghost 按钮 + 红边提示）。

### 8.2 用户气泡（右对齐）
- **结构**：右对齐，底 `brand.cobalt`，字 `#FFFFFF`/`font.heavy`，`2px` 黑边，硬投影，圆角 `radius.card`（右下角切小）。

### 8.3 快捷回复 chips（AI 追问内联）
- **用途**：城市 / 赛道 / 阶段等结构化追问选项。
- **结构/状态**：= 筛选 chip（§2.1），未选白底黑边、点选 cobalt 底白字；横向 wrap，按压 ↘位移。

### 8.4 结果卡内嵌
- **结构**：AI 回复内嵌紧凑赛事卡（复用 §4.3 普通列表卡）+ 一行「为什么推荐」说明（`text.secondary`）。卡保留黑边硬投影，点击进详情。

---

## 9. Identity Card 身份卡

**TDesign 基座**：自定义大卡 + 导出用 canvas 绘制（分享图）。

- **用途**：生成可分享的选手身份卡（匹配 / 组队 / 展示）。
- **结构**：头像/角色 emoji（黑边方块）→ 角色名（`font.display` Subtitle）→ 统计行（项目 · 比赛 · 获奖，每项数字大号 + 标签小字）→ 主技术栈 tag 行 → 底部「保存图片 / 分享找队友」双按钮（Primary + Secondary）。
- **关键视觉变体**：
  - **页内态（野兽派质感）**：白底 `3px` 黑边 + 硬投影 `shadow.hardLg`；标题与统计数字纯黑粗体；技术栈用赛道 tag（cobalt/lemon 黑边）。
  - **分享渐变质感变体**：用于导出图，可在野兽派骨架上叠 `brand.cobalt → accent.lemon` 对角硬过渡色块（保留黑边与粗体），右下角 HackerTrip logo 贴纸；导出 canvas 固定尺寸（如 1080×1350）。
- **状态**：空（一键生成 CTA）/ 已生成 / 编辑中 / 未登录（行动时弹登录）。

---

## 10. 匹配分 / 热度 徽章

**TDesign 基座**：`t-tag`（pill 形态）覆盖样式，或自绘小 pill。

### 10.1 热度徽章（🔥 + 数字 · 卡片角标）
- **用途**：赛事卡左上/右上展示热度（如「🔥1.2k」「🔥856」「🔥723」）。
- **结构**：pill，🔥 icon + 数字（`font.heavy` 12），高 22px，圆角 `radius.pill`，内边距 8px。
- **关键视觉**：底 `accent.lemon`，字纯黑，`2px` 黑边，无投影或极小硬投影。lemon+黑=高识别角标。

### 10.2 匹配分徽章（0–100 · 阈值配色）
- **用途**：一张卡只显示**匹配分或热度，不并列**。
- **结构**：pill 或「匹配度 92%」标签 + 进度长条（见 §6）。
- **阈值配色**（沿用语义，套野兽派黑边）：
  - **≥85**：底 `color.success.fill` `#3DDC84` / 字 `color.success` `#13B36B`（深绿），`2px` 黑边 —— 强匹配。
  - **60–84**：底 `brand.cobalt` / 字白，黑边 —— 中匹配（效果图「92%」用 cobalt 填充长条即此族）。
  - **<60**：底 `#FFFFFF` / 字 `text.tertiary`，黑边 —— 弱匹配。

---

## 落地备忘（Handoff）

- 基准宽 750rpx（=375pt / 画布 393px，效果图导出 ×2）。
- TDesign 主题变量注入：`--td-brand-color: <brand.cobalt>`；黑边/硬投影靠 `external-class` 覆盖（TDesign 默认无硬投影，需全量自定义 `box-shadow` + `border`）。
- 硬投影用 `box-shadow: Npx Npx 0 0 #000`（blur=0），**不要** rgba 柔光。
- 按压态统一在 `:active` / `hover-class` 切 `transform: translate(2px,2px)` + 投影收缩。
- 不做暗色（仅亮米白 `bg.canvas`）。海报插画/缩略图压缩转 WebP（项目历史 LCP 教训）。
- 最小触达 88rpx × 88rpx（≈44px）。
- 精确 hex / 字阶 / 间距数值见 token Agent 维护的 token 表，本文件引用名为准。
