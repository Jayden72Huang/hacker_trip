# 微信 AI 调用适配 · 开发实施规范（WeChat AI Integration）

> 依据 PRD §25/§26。微信内嵌 AI Agent（右滑入口）用自然语言**调用小程序完成任务**。
> 核心原则：**AI 调的是 intent（能力），不是 page**。每个核心能力需三契约：① intent 声明 ② 稳定 deep-link ③ 结构化出参。
> 本文件是脚手架与每个页面开发的**强制约束**——新页面 onLoad 必须按此处理 `src` / `intent` 参数。

---

## 1. Intent Catalog（能力清单）

| Intent | NL 触发例 | 入参 | Deep-link 路径 | 出参(JSON) | 授权 | 半屏 |
|---|---|---|---|---|---|---|
| `match.events` | 帮我找适合我的黑客松 | profile?,city?,track?,stage? | `/pages/chat/chat?intent=match&src=ai` | ranked events[] + fitReason | guest | ✓ |
| `search.events` | 深圳有什么黑客松 | q,city?,mode?,dateRange? | `/pages/index/index?q=…&src=ai` | events[] | guest | ✓ |
| `event.detail` | AdventureX 还能报名吗 | slug/eventId | `/pages/detail/detail?slug=…&src=ai` | event{} + registration{} | guest | ✓ |
| `event.remind` | 提醒我 AdventureX 报名截止 | slug,when | `/pages/detail/detail?slug=…&intent=remind&src=ai` | reminder{} | login | ✓ |
| `schedule.status` | 我的赛程进度怎么样 | (已登录) | `/pages/schedule/schedule?src=ai` | status{phase,progress,nextTask,countdown} | login | ✓ |
| `identity.generate` | 生成我的参赛身份卡 | profile fields | `/pages/identity/identity?intent=generate&src=ai` | cardImageUrl + profile{} | login | ✓ |
| `project.match` | 我的项目能报哪个赛道 | projectDesc | `/pages/chat/chat?intent=projectMatch&src=ai` | tracks[] + events[] | guest | ✓ |
| `skills.sync` | 同步我桌面扫描结果 | pairCode | `/pages/sync/sync?code=…&src=ai` | syncResult{} | login | ✓ |

> 每个 Figma frame / 页面注释里标注它承接的 intent（终稿命名已带 `⇐ intent`）。

---

## 2. Deep-link 页面契约（每页必守）

- **context-free**：`onLoad(options)` 仅靠 options 参数渲染，**不依赖前序页面栈/全局状态**。AI 可能直接落到任意页。
- **自锚定 header**：每页有自己的标题 + 可达「← 返回 / 回 HackerTrip 首页」锚点，即使中途进入也不迷路。
- **稳定路径 + 参数**：路径与参数名是**公开契约**，绝不重命名/重排；所有页恒接受 `src` 和 `intent`。
- **未知参数降级**：unknown / 过期参数 → 退化到页面默认内容，**绝不白屏或报错**。

---

## 3. `src=ai` 落地态

页面 `onLoad` 检测 `options.src === 'ai'` 时：
- 顶部 banner：`来自微信AI助手` + 复述原始意图（如 `正在为你匹配黑客松…`）
- **先渲染 AI 请求的结果**（跳过常规首页/idle 流）
- **续上下文**：chat 预填从 AI Agent 交接的 context，**绝不冷启动空对话**
- 主 CTA 回深度：`在 HackerTrip 里继续`
- 归因：`source=wechat_ai`，与卡片分享裂变（`src=share`）分开统计

---

## 4. 结构化输出层

- 每个 intent 返回**文档化 JSON**（见 §1 出参），独立于视觉卡片
- `sitemap.json` 允许公开页索引（发现 / 详情 / 公开主页），同时服务 GEO/citability
- 事件结构化数据**必含**：name / dates / city / mode / tracks / prize / **真实报名 URL**（遵守 publish 质量门槛，禁伪造）

---

## 5. 半屏支持

key intent 页（`event.detail` / `identity.generate` / `match.events` 结果 / `schedule.status`）须有半屏变体：
- 首屏只给**单个核心结论**（事件答案 / 身份卡 / Top3 匹配）
- 次要详情折叠在 `展开更多` 之下
- `回 HackerTrip` / 全屏 CTA 常驻

---

## 6. 授权降级（AI 流量）

- **guest read**（无需登录）：`search.events` / `match.events` / `event.detail` / `project.match` + fit reasons
- **login required**（写操作才触发）：`identity.generate` / `event.remind` / `schedule.status` / `skills.sync`
- 登录只在**写动作**触发，附一句理由（`登录后才能保存你的身份卡`），完成后**回到同一任务**

---

## 7. 代码实现要点

- `utils/ai.js` 暴露 `parseAIEntry(options)` → `{ fromAI, intent, params, source }`，每页 `onLoad` 第一行调用。
- 页面模板：
  ```js
  onLoad(options) {
    const ai = parseAIEntry(options)          // { fromAI, intent, params, source }
    if (ai.fromAI) this.setData({ aiBanner: true, aiIntent: ai.intent })
    this.render(ai.params)                     // context-free 渲染，参数缺失走默认
  }
  ```
- 云函数出参统一结构化 `{ ok, data, error }`，对齐 §1 intent 契约。
- **intent ↔ 云函数映射**（PRD §26.2）：
  `search.events→getHackathons` · `match.events→匹配函数` · `event.detail→getHackathonDetail` · `identity.generate→saveCard` · `event.remind→addRegistration` · `skills.sync→pairSync`

---

## 8. 路由 ↔ intent 速查

| 页面 | 承接 intent |
|---|---|
| `index`(发现) | search.events / match.events 入口 |
| `chat`(AI聊天) | match.events / project.match |
| `detail`(详情) | event.detail / event.remind |
| `identity`(身份卡) | identity.generate |
| `schedule`(赛程) | schedule.status |
| `sync`(同步) | skills.sync |

> ⚠️ 跨终端契约：任何 intent / deep-link / 出参 shape 的改动，**必须先改 PRD §25 再同步本文件**，两个开发终端才不会漂移。
