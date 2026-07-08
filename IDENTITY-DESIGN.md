# HackerTrip · 黑客松身份卡 / 配置卡 / 裂变 — 落地设计文档

> 冻结类型契约: `lib/identity/types.ts`。所有实现 agent **必须** `import` 它，禁止另立类型。
> 主题: 深色玻璃拟态。背景 `#05060a`；accent `--accent-1=#7c5dff` / `--accent-2=#c759ff` / `--accent-3=#4de1ff`；复用 `.glass / .glow / .shimmer`。
> 本地约束: `npm run dev` 后**不强制登录、不依赖真实 DB**，全链路 mock + localStorage 可走通。

---

## 1. 产品定位与三支柱

**一句话**: 把黑客松选手的"隐形资产"显性化成一张**会自我传播的身份卡** = 个人 IP + 社交货币。

| 支柱 | 名称 | 解决的卖点 | 数据来源 |
|---|---|---|---|
| **A** | 角色身份系统 | **传播钩子**: 给人一个"我是 XX 角色"的标签，自带"你是什么角色？"的邀请感 | 规则判定纯函数(`decideRole`)，输入 projects/participations，可手动覆盖 |
| **B** | 参赛履历资产(卖点1) | **可信度沉淀**: 时间线展示参赛/获奖/项目，已验证徽章建立信任，是"隐形资产"的账本 | `participations` + `projects`(`verificationStatus`) |
| **C** | 开发者配置卡(卖点2) | **差异化 + 找同行**: 展示装备(技术栈/工具/AI 工具/打法/组队状态)，服务"找队友/联合创始人" | `DevConfig`(localStorage MVP)，可从 `ht-scan-project` 导入 |

裂变内核 = **身份型裂变**: 用户分享的不是产品广告，而是"我的身份+作品+配置"；被分享者落到内容页(先看不强制注册)，被"我也想要一张"驱动转化。

---

## 2. 完整用户交互链路图

```
[入口] 首页 CTA / /vibecard 旁推荐 / 个人菜单
   │  路由: 任意页面 "生成我的身份卡" 按钮 → /identity/new
   ▼
[① 录入页]  /identity/new  (CSR, 登录可选)
   │  组件: <IdentityWizard>
   │  两种入口并列:
   │    (a) 手填 4 字段: 主技术栈 / AI 工具 / 打法风格 / 组队状态
   │    (b) 「一键扫描导入」→ 调 /api/identity/scan (失败→mock 降级)
   │         数据来源: ht-scan-project 输出 { project.techStack[], domain }
   │  ▼ 实时: 调 decideRole(signals) → RoleResult，右侧实时预览三张卡
   ▼
[② 实时预览]  同页右栏 (CSR)
   │  组件: <IdentityCardPreview variant="identity"> + <ConfigCardPreview> + <CareerTimeline>
   │  纯 HTML/CSS，不依赖 og 路由。用户可切主/副角色(手动覆盖 manualOverride)
   ▼
[③ 保存]  按钮「保存我的卡」
   │  写 localStorage(HT_IDENTITY_STORAGE_KEY) — 无需登录
   │  若已登录(auth()): 同时 best-effort POST /api/identity/save → DB(失败静默降级)
   │  生成 username(已登录用 users.username；未登录用 mock slug 如 'demo-builder')
   ▼
[④ 个人主页]  /u/[username]  (SSR + OG meta，登录可选)
   │  组件: <ProfileHero> + <IdentityCardPreview> + <ConfigCard> + <CareerTimeline> + <ShareDock>
   │  数据: buildIdentityCardData(username) → DB 查询失败自动降级 mock seed
   │  顶部 profileViews 社会证明计数(mock 自增)
   ▼
[⑤ 分享内容包]  <ShareDock> (CSR)
   │  ShareContent = { imageUrl(og), captions[3], shareUrl }
   │  动作: 复制图片 / 复制文案+链接 / 下载 PNG / 发 X(intent URL)
   ▼
[⑥ 被分享落地]  好友打开 shareUrl = /u/[username]?ref=share
   │  OG meta → 社媒预览显示身份卡图(/api/identity/og)
   │  落地策略: **先内容后引导** — 直接看到对方的角色卡+履历+配置，不弹注册
   │  顶部浮条: "「他是 XX 角色」—— 你是什么角色？" + 组队状态徽章
   ▼
[⑦ 生成我的 CTA]  落地页底部固定 <GenerateMineCTA>
   │  「我也要一张 →」 跳回 /identity/new?ref=<username>
   ▼
[回流]  回到 ① 形成闭环。ref 参数记入 mock 计数(可观测裂变)
```

每一步均有过渡动画(`animate-fade-up`)，UI 上可见可点。

---

## 3. 路由设计

| 路由 | 渲染 | 职责 | OG meta |
|---|---|---|---|
| `/identity/new` | CSR(`"use client"`) | 录入向导 + 实时预览 + 保存。读 localStorage 回填 | 静态默认 |
| `/u/[username]` | SSR(server component) | 个人主页。`buildIdentityCardData` DB→mock 降级。**禁止 catch-all**，仅命中 `/u/*` | 动态: `generateMetadata` 输出 `openGraph.images=[/api/identity/og?...]` |
| `/api/identity/og` | Edge(`runtime='edge'`)，`next/og` ImageResponse | 渲染 1200x630 卡图。query: `variant,username,role,...`(`CardRenderParams` 序列化) | — |
| `/api/identity/scan` | Node route | 接 ht-scan-project 结果→`RoleSignals`；本地无扫描时返回 mock | — |
| `/api/identity/save` | Node route | 已登录写 DB(best-effort)；未登录返回 200 + echo。**绝不抛错阻断前端** | — |
| `/api/identity/view` | Edge/Node | profileViews 自增(mock: 内存/KV 可后置；本地用随机种子) | — |

### `/@username` → `/u/[username]` rewrite
新增 `middleware.ts`(项目根)。**白名单保护**: 仅当 `pathname` 以 `/@` 开头才 rewrite，其余路径(explore/hackathon/products/works/vibecard/arsenal/community/haki/organize/api/_next/静态资源)一律 `NextResponse.next()`。

```ts
// middleware.ts (要点，非完整)
export const config = { matcher: ['/@:username*'] }; // 仅匹配 @ 前缀，零误伤
export function middleware(req) {
  const u = req.nextUrl.pathname.slice(2); // 去掉 '/@'
  return NextResponse.rewrite(new URL(`/u/${u}`, req.url));
}
```
> 若项目已有 middleware，必须合并而非覆盖；matcher 收窄到 `/@` 避免拦截已有路由与 `_next/static`、图片。

### next/og 在 Cloudflare 的兼容兜底
og 路由标 `runtime='edge'`。**关键约束**: 预览组件(`<IdentityCardPreview>`)是纯 HTML/CSS，与 og 图视觉同源但**不依赖 og 路由** —— 即使 CF 上 og 失效，页面预览、保存、文案复制、下载 PNG(走客户端 `html-to-image` 兜底)全部正常。下载 PNG 优先用 og URL，失败回退客户端截图。

---

## 4. 数据模型

### 复用现有表(不新建)
- `participations` → `CareerItem`(hackathonName/dateRange/role/placement/projectId/track)
- `projects` → 项目数、`techStack`、`awards`、`verificationStatus`(推导 `verified`)、`hackathonName`
- `users` → username(URL)/name/image/bio/github/twitter/skills/`lookingForTeam`

### 配置卡持久化(MVP)
`DevConfig` 存 **localStorage**(`HT_IDENTITY_STORAGE_KEY`)。
**DB 持久化为后续**: 可加 `users.devConfig jsonb` 列或新 `dev_config` 表，类型不变(直接存 `DevConfig`)。`/api/identity/save` 预留写入点，当前 best-effort。

### Mock 种子(`lib/identity/mock.ts`，3 个角色示例)
| username | 角色(primary/secondary) | 履历 | 配置卡亮点 | lookingFor |
|---|---|---|---|---|
| `demo-builder` | 从零到一搭建者 / 死线快枪 | 3 场比赛·2 获奖(1st, finalist) | Next.js+TS, Claude Code, solo | cofounder |
| `demo-alchemist` | 深不见底炼丹师 / 数据占卜师 | 4 场·1 获奖 | Python+PyTorch+LangChain, Cursor, duo | teammate |
| `demo-carver` | 像素级雕花匠 / 一页封神叙事者 | 2 场·1 获奖(finalist) | React+Tailwind+Framer, v0+Figma, squad | none |

`buildIdentityCardData(username)`: 先尝试 DB 查询；任意失败(无连接/无记录)→ 命中 mock 表；未知 username → 返回 `demo-builder` 兜底并标 `source:'mock'`。

---

## 5. 角色判定系统(纯函数 `decideRole`)

输入 `RoleSignals`，输出 `RoleResult`(primary + 最多 2 secondary)。元数据见 `ROLES`。

| key | 名称 | 一句话 | 判定信号 | colorFrom→To |
|---|---|---|---|---|
| zero_to_one | 从零到一搭建者 🚀 | 空白仓库到 Demo 一把梭 | fullstack/next/mvp 命中 + projectCount 高 | `#7c5dff`→`#4de1ff` |
| model_alchemist | 深不见底炼丹师 🧪 | 把模型炼成想要的形状 | llm/ai/rag/pytorch/agent 命中 | `#c759ff`→`#7c5dff` |
| pixel_carver | 像素级雕花匠 🎨 | 对齐到 1px | ui/tailwind/figma/animation 命中 | `#4de1ff`→`#c759ff` |
| narrative_god | 一页封神叙事者 🎤 | 把评委讲到鼓掌 | pitch/story/demo + winCount 高 | `#ff7eb6`→`#7c5dff` |
| deadline_gunner | 死线快枪 🔫 | 最后两小时之神 | shippingVelocity 高 / fast/ship 命中 | `#ff5d8f`→`#ffb24d` |
| hexagon_allround | 六边形全能战士 🛡️ | 一个人一支队 | 技术栈跨 ≥3 大类 + solo | `#7c5dff`→`#ffb24d` |
| infra_plumber | 管道工 🔧 | 半夜不报警 | backend/docker/postgres/devops 命中 | `#4de1ff`→`#3b82f6` |
| data_diviner | 数据占卜师 🔮 | 图表会说话 | data/pandas/sql/viz 命中 | `#4de1ff`→`#34d399` |
| chain_ronin | 链上浪人 ⛓️ | 链上即家 | web3/solidity/wallet/defi 命中 | `#c759ff`→`#ffb24d` |
| glue_integrator | 万物胶水侠 🧩 | 集成就是超能力 | api/webhook/n8n/workflow 命中 | `#34d399`→`#7c5dff` |

### 判定算法(权重)
对每个角色累加得分，`reasons[]` 记录命中项(供"为什么是这个角色"透明面板):
1. **techStack 命中** `signalKeywords`: 每命中 +3。
2. **taglineKeywords 命中**: 每命中 +2。
3. **获奖加权**: narrative_god / deadline_gunner 对 `winCount` 敏感(每次获奖 +2)。
4. **数量加权**: `projectCount≥3` 给 zero_to_one +4；`techStack` 跨 ≥3 大类给 hexagon_allround +5。
5. **角色加权**: `participantRoles` 含 organizer/judge → narrative_god +2。
6. **velocity**: `shippingVelocity≥1.2` → deadline_gunner +4。

排序取最高为 `primary`；其后得分 >0 且 ≠primary 的前 2 个为 `secondary`。全 0(冷启动)→ 默认 `DEFAULT_ROLE_RESULT`(zero_to_one)。`manualOverride=true` 时跳过覆盖、保留用户选择。
**纯函数无副作用**，Edge/客户端/SSR 三端可复用。

---

## 6. 配置卡设计

字段(`DevConfig`)与预置选项(`DEV_CONFIG_PRESETS`):

| 字段 | 含义 | 预置选项(可自由追加) |
|---|---|---|
| `techStack[]` | 语言/框架 | TypeScript, Python, Rust, Go, Next.js, React, FastAPI, PyTorch, LangChain… |
| `tools[]` | 工具链 | VS Code, Neovim, Cursor, Vercel, Cloudflare, Docker, Figma, Neon… |
| `aiTools[]` | AI 工具/模型 | Claude, Claude Code, Cursor, Copilot, ChatGPT, Gemini, v0, Codex… |
| `env` | 环境一句话 | 自由文本 "macOS + Neovim + tmux" |
| `playStyle` | 打法 | solo🐺 / duo👯 / squad🛡️ / flexible🌀(`PLAY_STYLE_META`) |
| `strengths[]` | 擅长方向 | AI Agent, 全栈, UI/动效, 数据可视化, 增长/裂变… |
| `lookingFor` | 组队意向 | none😌 / teammate🤝 / cofounder🚀(`LOOKING_FOR_META`，active 状态高亮) |

### 卡片视觉布局(配置卡)
玻璃卡(`.glass`)，左上角色 emoji + 渐变描边，主体三行 chip 组(技术栈/AI 工具/工具链)，底部一行: 打法徽章 + 组队状态徽章(active 时 `.glow` 脉冲)。配色取 `primary` 角色的 `colorFrom→colorTo` 渐变作顶栏。

---

## 7. 卡片渲染方案

**双轨同源**: og 路由(分享/社媒预览) + 客户端预览组件(页面展示)，共用 `CardRenderParams` 契约，视觉一致。

### A. next/og 路由 `/api/identity/og`
- `runtime='edge'`，返回 `ImageResponse`，尺寸 `CARD_DIMENSIONS`(1200x630)。
- query 序列化 `CardRenderParams`(`variant/username/role/secondary/stats/lookingFor`)。
- 两种 `variant`:
  - `identity`: 大角色名 + emoji + 渐变背景(`ROLE_MAP[roleKey].colorFrom/To`) + 统计条 `N 项目·M 比赛·X 获奖` + 头像 + 履历前 3 摘要。
  - `config`: 技术栈/AI 工具 chip 墙 + 打法 + 组队状态徽章。
- Satori 限制: 仅用基础 flex/绝对定位、内联 style、系统/内嵌字体(Sora 走 woff fetch 或 fallback sans)。

### B. 客户端预览组件(不依赖 og)
`components/identity/IdentityCardPreview.tsx`(`variant` prop)+ `ConfigCardPreview.tsx`，纯 React + Tailwind，复用 `.glass/.glow`。同一份 `CardRenderParams` 喂入。
**下载 PNG**: 优先 fetch og URL；失败 → `html-to-image` 对预览 DOM 截图兜底(CF 上 og 不可用也能出图)。

---

## 8. 裂变机制

### Push 端(`<ShareDock>`)
- **三版文案**(`captions[3]`，顺序固定 `[invite, flex, recruit]`):
  - `invite`: "我在黑客松里是「{role}」，看看你是什么角色 → {url}"
  - `flex`: "{N} 场黑客松 · {X} 次获奖，这是我的选手身份卡 👉 {url}"
  - `recruit`: "{lookingFor 文案}，技术栈 {top3}，来组队 → {url}"
- **动作**: 复制图片(`navigator.clipboard` 写 blob，参考 `/vibecard` 实现) / 复制文案+链接 / 下载 PNG / 发 X(`https://twitter.com/intent/tweet?text=...&url=...`)。

### Pull 端(`/u/[username]` 落地页)
- **先内容后引导**: 不弹注册，先渲染对方完整身份卡 + 履历 + 配置。
- **社会证明**: 顶部 `profileViews` 计数(mock 自增) + "已有 N 人生成身份卡"。
- **组队状态钩子**: `lookingFor` active 时显示高亮徽章 + "私信/找 TA 组队"(复用现有私信入口)。
- **固定 CTA**: 底部 `<GenerateMineCTA>` "我也要一张 →" 带 `ref` 回流。

### OG meta 正确性
`/u/[username]` 的 `generateMetadata` 输出 `openGraph.{title,description,images}` 与 `twitter.card='summary_large_image'`，`images` 指向 `/api/identity/og?variant=identity&...`。本地 dev(node runtime)即可出图,可用 X Card Validator / 微信调试预览。

---

## 9. 本地测试指南(`npm run dev` 后逐步验证)

| # | 访问 URL | 预期现象 |
|---|---|---|
| 1 | `/identity/new` | 录入向导出现；右栏三张卡(身份/配置/履历)实时预览，深色玻璃风格 |
| 2 | 在录入页点「一键扫描导入」 | 无真实扫描时回落 mock，角色被判定并填充，预览更新(过渡动画) |
| 3 | 改技术栈/AI 工具/打法/组队 | `decideRole` 重算，主角色名与配色实时变化；可手动切主角色(锁定) |
| 4 | 点「保存我的卡」 | 写 localStorage；toast 成功；未登录也成功(不报错) |
| 5 | `/u/demo-builder` | SSR 出"从零到一搭建者"卡 + 3 场履历 + 配置卡 + profileViews 计数 + ShareDock |
| 6 | `/u/demo-alchemist`、`/u/demo-carver` | 另两个角色示例正确渲染,配色/履历各异 |
| 7 | `/api/identity/og?variant=identity&username=demo-builder&role=zero_to_one` | 直接返回 1200x630 PNG,渐变+角色名+统计条 |
| 8 | `/@demo-builder` | middleware rewrite 到 `/u/demo-builder`,页面正常(已有路由如 `/explore` 不受影响) |
| 9 | ShareDock 点"复制文案"/"下载 PNG"/"发 X" | 剪贴板有文案+链接;PNG 下载(og 或客户端兜底);X intent 新窗口带预填文案 |
| 10 | `/u/demo-builder?ref=share` | 落地页先内容后引导,底部"我也要一张"→ 跳 `/identity/new?ref=demo-builder` |
| 11 | 查看 `/u/demo-builder` 页面源码 | `<meta property="og:image">` 指向 og 路由,`twitter:card=summary_large_image` |
| 12 | `npm run build` | 类型检查通过,无报错(部署前必做) |

---

## 10. 文件清单(后续实现)

### 数据层
- `lib/identity/types.ts` ✅ **已冻结** — 全部类型契约 + ROLES/预置常量。
- `lib/identity/decide-role.ts` — `decideRole(signals): RoleResult` 纯函数(权重见 §5)。
- `lib/identity/signals.ts` — `buildSignals(projects, participations)` 从原始数据→`RoleSignals`(归一小写/去重)。
- `lib/identity/build-card-data.ts` — `buildIdentityCardData(username): IdentityCardData`,DB 查询 + mock 降级。
- `lib/identity/mock.ts` — 3 个示例用户 seed(`demo-builder/alchemist/carver`) + 兜底逻辑。
- `lib/identity/captions.ts` — `buildShareContent(data): ShareContent`,三版文案模板。

### 卡片渲染
- `app/api/identity/og/route.tsx` — Edge `next/og` ImageResponse,读 `CardRenderParams`。
- `components/identity/IdentityCardPreview.tsx` — 客户端身份卡(`variant` prop),og 视觉同源。
- `components/identity/ConfigCardPreview.tsx` — 配置卡预览(chip 墙 + 徽章)。
- `components/identity/CareerTimeline.tsx` — 履历时间线 + 已验证徽章。

### 页面
- `app/identity/new/page.tsx` — 录入页外壳(CSR)。
- `components/identity/IdentityWizard.tsx` — 4 字段表单 + 扫描导入 + 实时预览 + 保存。
- `app/u/[username]/page.tsx` — 个人主页(SSR + `generateMetadata` OG)。
- `components/identity/ProfileHero.tsx` — 主页头部(头像/角色/统计/profileViews)。
- `middleware.ts` — `/@username`→`/u/[username]` rewrite(matcher 收窄到 `/@`)。

### 裂变
- `components/identity/ShareDock.tsx` — 分享内容包(复制图/复制文案链接/下载 PNG/发 X)。
- `components/identity/GenerateMineCTA.tsx` — 落地页底部回流 CTA + ref。
- `app/api/identity/scan/route.ts` — 接 ht-scan-project 结果/mock 降级。
- `app/api/identity/save/route.ts` — best-effort 写 DB(未登录不报错)。
- `app/api/identity/view/route.ts` — profileViews 自增(mock)。

### 修改(现有)
- `next.config.ts` — 若 og 用外部头像源,确认 `images.remotePatterns` 已含 `googleusercontent.com`/`avatars.githubusercontent.com`(已配)。
- 首页/导航 — 加「生成我的身份卡」入口(位置待用户确认后再动)。

---

## 给后续实现 agent 的注意事项

1. **类型只认 `lib/identity/types.ts`**,任何卡片/判定/分享逻辑直接 import,不得另立同义类型。
2. **不强制登录、不依赖 DB**: 所有页面 mock + localStorage 可走通;DB 查询写成 try/catch 降级,`/api/identity/save` 未登录返回 200 不抛错。
3. **og 与预览双轨同源**: 视觉以 `CardRenderParams` 为唯一输入,CF 上 og 失效时页面预览/下载 PNG 必须仍可用(`html-to-image` 兜底)。
4. **middleware matcher 必须收窄到 `/@`**,严禁 `app/[username]` catch-all,严禁误伤已有顶层路由与 `_next`/静态资源。
5. **深色主题**: 复用 `.glass/.glow/.shimmer` 与 accent 变量,禁止浅色/Google 风格;实现 opacity/transform 动画后必须验证文字可见(项目历史踩坑)。
6. **schema 事实校正**: `users.id` 是 `text`(非 uuid);`awards` 在 `projects` 表(非 participations);`verified` 由 `projects.verificationStatus==='approved'` 推导。
7. **布局位置先确认**: 首页/导航加入口前,按项目规范先文字描述位置等用户确认。
8. 每次改动后 `npm run build` 验证类型通过再继续。
```
