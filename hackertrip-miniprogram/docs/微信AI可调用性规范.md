# HackerTrip 小程序 · 微信 AI 可调用性规范

> 版本：v0.1（初稿）｜ 日期：2026-06-17
>
> **本文档的用途**：当 HackerTrip 小程序获准接入微信 AI「开发模式」时，照此文档对现有代码做「被微信 AI 调用」的适配——包括原子接口封装、数据格式归一、对话卡片、页面语义化。
>
> **它不是功能 PRD**，它约束的是「整个小程序如何被微信 AI 发现、理解、调用」这一横切能力，独立于「项目名片」等单点功能 PRD。

---

## 0. 底层逻辑：AI 凭什么「搜到你 + 参考你」

微信 AI 决定是否召唤并引用一个小程序，取决于三层，本规范按此组织：

| 层次 | AI 在判断什么 | 微信 AI 机制 | 本文对应章节 |
|------|--------------|-------------|------------|
| **被发现** Discovery | 用户这句话该不该想到 HackerTrip | 业务说明 + 意图语料 | §1 §2 |
| **被理解** Understanding | 你返回的数据/页面是什么意思 | 结构化数据 + 页面语义 | §3 §5 |
| **被调用** Invocation | 能执行什么动作、返回什么 | 原子接口 + 原子组件 | §4 §6 |

### 两种模式的落地节奏（重要）

- **自动模式**（建议立即开启，零开发）：平台审核时读小程序源码、分析页面，让 AI 直接操作页面。**依赖 §3 数据语义化 + §5 页面可读性**，不需要等内测，现在就能做。
- **开发模式**（官方明确仍在内测、暂不能正式提审）：通过 `SKILL.md` + `mcp.json` + 原子接口 + 原子组件主动暴露能力。**依赖 §1 §4 §7**，标注为「开发模式预留」，待开放后实施。

> 施工原则：**先把自动模式吃干净（§3/§5），再做开发模式（§1/§4/§7）**。

---

## 1. AI 可调用能力清单（→ `mcp.json`）【开发模式预留】

把小程序功能抽象成「原子接口」。**好消息：你现有云函数已是雏形**，适配工作主要是「补意图描述 + 规范出入参 schema + 补匹配能力」。

### 1.1 现有云函数 → 原子接口映射

| 原子接口（建议名） | 现有云函数 | 现状签名 | 适配动作 |
|---|---|---|---|
| `searchHackathons` | `getHackathons` | `(q, mode, status, sort, limit)→{ok,list}` | ✅基本可用；**缺**：`q` 只模糊匹配 `name/city/theme`，不含 `techStack/tags`（见 §1.3 缺口①） |
| `getHackathonDetail` | `getHackathonDetail` | `(id)→{ok,hackathon}` | ✅可直接用 |
| `matchHackathonsByStack` | **无，需新建** | — | 你的核心差异化能力，必须新建（见 §1.3 缺口①） |
| `registerHackathon` | `addRegistration` | `(item)→{ok}` | 需授权；建议改为传 `id` 而非整个 `item`（见缺口②） |
| `bookmarkHackathon` | `toggleBookmark` | `(id, active)→{ok,active}` | ✅可直接用，需授权 |
| `listProjectsByHackathon` | **无，需新建** | — | 项目名片功能上线后补 |
| `createProjectCard` | `saveCard` | （待核对） | 需授权 |

### 1.2 能力声明的关键：意图描述写给 AI 看

每个能力除 schema 外，必须写**自然语言意图描述**（AI 据此判断何时调用），例如：

```jsonc
{
  "name": "matchHackathonsByStack",
  "description": "当用户描述了自己的技术栈/项目方向（如 React、AI、IoT），想知道适合参加哪些黑客松时调用。返回按技术栈匹配度排序的黑客松列表。",
  "input": {
    "techStack": { "type": "array", "items": "string", "desc": "技术栈标签，如 ['React','Node','AI']" },
    "city":      { "type": "string", "required": false },
    "onlyUpcoming": { "type": "boolean", "default": true, "desc": "仅返回未结束的赛事" }
  },
  "auth": "none",
  "output": "HackathonCard[]（见 §3 数据 schema、§4 卡片 schema）"
}
```

> 描述要写「**用户想干什么时调用**」，不要写技术注释。这是「被发现」的命脉。

### 1.3 必须补的能力缺口

- **缺口①｜技术栈匹配是核心却缺失**：`getHackathons` 的关键词只搜 `name/city/theme`。而 hackertrip 的差异化正是「按技术栈匹配」。**必须新建 `matchHackathonsByStack`**，匹配 `techStack[]`、`tracks[]`、`tags[]` 三个数组字段并打分排序。
- **缺口②｜报名接口入参过重**：`addRegistration` 现在要求前端传整个 `item` 对象，AI 侧不持有完整对象。应支持 `registerHackathon(id)`，由云函数自行查库补全。
- **缺口③｜「已截止/已结束」过滤不可靠**：`registrationDeadline` 当前大量为 `null`，`isPast` 为人工标注。AI 不应把已结束赛事当作「可报名」推荐。需在数据层补全截止时间或由 `startDate` 推导状态（见 §3.3）。

---

## 2. 触发意图与示例语料（→ 决定「被搜到」）

PRD/规范里必须列一张「用户怎么问 → 命中哪个能力」的映射，并为每个能力配 ≥5 条真实问法。**这部分缺失，AI 扫到你也不知道何时该用你。**

| 用户可能说 | 命中能力 |
|-----------|---------|
| "最近有什么 AI 黑客松"、"周末上海的 hackathon"、"有没有线上的黑客松" | `searchHackathons` |
| "我会 React 和 Node，能参加哪些比赛"、"我想做硬件项目参赛"、"适合 AI 方向的黑客松" | `matchHackathonsByStack` |
| "XX 黑客松什么时候、在哪、奖金多少"、"详细介绍下这场比赛" | `getHackathonDetail` |
| "帮我报名 XX"、"我要参加这个" | `registerHackathon` |
| "收藏这个"、"先存一下" | `bookmarkHackathon` |
| "这场比赛都有哪些项目"、"看看获奖作品" | `listProjectsByHackathon` |

> 落地建议：把这张表做成可维护的 `intents.md`，随能力增减同步更新。

---

## 3. 结构化数据规范（→ 决定「被理解」）

### 3.1 黑客松实体标准字段（基于现有 `data/hackathons.js`）

现有字段已较完整，**机读性良好**。标准 schema：

| 字段 | 类型 | 说明 | AI 用途 |
|---|---|---|---|
| `id` | string | 业务主键（如 `ht-00`） | 调用 detail/register 的 key |
| `name` / `shortName` | string | 全称 / 简称 | 展示与检索 |
| `startDate` / `endDate` | string `YYYY-MM-DD` | 起止 | 时间筛选、状态推导 |
| `registrationDeadline` | string\|null | 报名截止 | **可报名性判断（需补全）** |
| `city` / `country` / `location` | string | 地点 | 地点筛选 |
| `mode` | `offline`\|`online`\|`hybrid` | 线上线下 | 模式筛选 |
| `theme` | string | 主题 | 语义匹配 |
| `tracks[]` | string[] | 赛道 | 技术栈匹配 |
| `techStack[]` | string[] | 技术栈 | **核心匹配字段** |
| `tags[]` | string[] | 标签 | 语义匹配 |
| `prizePool` | string | 奖金 | 卡片亮点 |
| `summary` | string | 一句话简介 | 卡片正文 / AI 引用 |
| `website` | string | 官网 | CTA 外链 |
| `isPast` | boolean | 是否已结束 | 状态（建议改为推导，见 §3.3） |

### 3.2 硬规则：关键信息必须机读

- ❌ 不允许把 名称/时间/地点/奖金 只画在图片里——AI 读不到图片语义。
- ✅ 上述字段必须以**文本/结构化数据**存在于页面 DOM 或接口返回中。
- 卡片图（项目名片 PNG）仅作展示增强，**不得作为唯一信息载体**。

### 3.3 数据补全 TODO（影响 AI 推荐质量）

1. **状态归一**：新增派生字段 `status ∈ {upcoming, ongoing, ended}`，由 `startDate/endDate` 对当前日期推导，替代手工 `isPast`。AI 默认只推荐 `upcoming/ongoing`。
2. **报名截止补全**：尽量补 `registrationDeadline`；缺失时以 `startDate` 兜底判断可报名性。
3. **技术栈词表归一**：`techStack/tracks/tags` 存在同义词（"AI"/"人工智能"、"硬件"/"IoT"），建议建一份同义词映射，提升 `matchHackathonsByStack` 命中率。

---

## 4. 对话卡片规范（→ 原子组件）【开发模式预留】

AI 在对话流里渲染的「黑客松卡片」。你已有 `components/hackathon-card`，适配为可被 AI 调用返回的卡片 schema：

```jsonc
// HackathonCard —— 原子接口返回、原子组件渲染
{
  "title":    "{shortName 或 name}",
  "subtitle": "{startDate} · {location} · {mode 中文}",
  "highlight":"{prizePool}",          // 亮点徽标
  "tags":     ["{techStack 前3个}"],
  "body":     "{summary}",            // ≤60 字
  "status":   "upcoming|ongoing|ended",
  "actions": [
    { "label": "查看详情", "type": "navigate", "path": "/pages/detail/detail?id={id}" },
    { "label": "报名",     "type": "invoke",   "ability": "registerHackathon", "args": { "id": "{id}" }, "auth": "required" }
  ]
}
```

要求：① 卡片字段全部来自 §3 标准字段，不新造；② `ended` 状态的卡片不展示「报名」action；③ 复用现有 `hackathon-card` 的视觉，仅抽象数据契约。

---

## 5. 页面语义可读性规范（→ 服务自动模式，立即落地）

自动模式靠读源码 + 分析页面。对现有 9 个页面逐一要求：

| 页面 | 角色 | 语义化要求 |
|---|---|---|
| `index` | 首页/搜索入口 | `navigationBarTitleText` 表达「黑客松发现」；搜索/筛选用标准 `input`/`picker`；列表项含可读文本结构 |
| `result` | 匹配结果 | 每条结果的 名称/时间/地点/技术栈 以文本呈现；匹配理由可读 |
| `detail` | 赛事详情 | 全部 §3 字段以文本块呈现，奖金/截止/赛道不要只放图；报名 CTA 用标准 `button` |
| `card` | 项目名片 | 名片图旁**必须**附文本版关键信息（项目名/赛事/技术栈），不能只有 PNG |
| `share` | 分享 | 分享标题/描述语义化 |
| `profile` / `recent` / `sync` / `login` | 用户态 | 标题语义化；登录/授权用标准组件，便于 AI 识别授权边界 |

通用红线：
- `navigationBarTitleText` 每页语义化（非统一「HackerTrip」）。
- 关键 CTA 用原生 `button`/`navigator`，**不要纯自绘 view + tap**，否则 AI 难识别可操作性。
- 列表项语义结构清晰（标题/副标题/标签分层），避免一坨文本或纯图片。

---

## 6. 授权与调用边界

| 能力 | 授权 | AI 调用规则 |
|---|---|---|
| `searchHackathons` / `matchHackathonsByStack` / `getHackathonDetail` / `listProjectsByHackathon` | 免登录 | 可被 AI 直接调用并展示 |
| `registerHackathon` / `bookmarkHackathon` / `createProjectCard` | 需用户授权 | AI 执行前**必须二次确认**；未登录时返回引导登录的结构化提示，而非静默失败 |

实现要点：写操作云函数统一返回 `{ ok, needAuth?, message }`，`needAuth` 时 AI 走授权引导流程。

---

## 7. SKILL.md 业务说明大纲（→ 开发模式根文档）【预留】

```
# HackerTrip 黑客松向导
## 这个小程序是什么
  一站式黑客松信息平台：发现、按技术栈匹配、报名、生成项目名片。
## 适合在什么对话场景被调用
  用户提到：找黑客松 / hackathon / 编程比赛 / 按技术栈选赛事 / 报名参赛 / 展示参赛项目
## 能做什么（能力索引 → 指向 mcp.json）
  搜索、技术栈匹配、查看详情、报名、收藏、查看赛事项目
## 不做什么（边界）
  不提供赛事报名代缴费；不保证第三方官网信息实时一致
## 典型流程
  发现 → 详情 → 报名 / 收藏；或 技术栈匹配 → 详情 → 报名
## 数据时效
  赛事数据由平台聚合，X 小时更新；已结束赛事标记 ended，不作可报名推荐
```

---

## 8. 分阶段落地路线（施工清单）

### 阶段一 · 自动模式适配（现在做，不依赖内测）
- [ ] §3.3 新增派生 `status` 字段，云函数与本地数据同步
- [ ] §3.3 补全/兜底 `registrationDeadline`
- [ ] §5 各页面 `navigationBarTitleText` 语义化
- [ ] §5 `detail` 页关键字段全部文本化，CTA 改原生 `button`
- [ ] §5 `card` 页名片图旁补文本版关键信息
- [ ] 后台开启「自动模式」并提交授权

### 阶段二 · 开发模式预备（等内测开放）
- [ ] §1.3 缺口①：新建 `matchHackathonsByStack` 云函数（匹配 techStack/tracks/tags + 打分）
- [ ] §1.3 缺口②：`addRegistration` 支持仅传 `id`
- [ ] §1 编写 `mcp.json` 能力声明（含意图描述 + schema）
- [ ] §4 将 `hackathon-card` 抽象为原子组件 + 卡片数据契约
- [ ] §7 编写 `SKILL.md`
- [ ] §2 维护 `intents.md` 意图语料
- [ ] 申请开发模式评测 → 提审

### 阶段三 · 数据质量优化（持续）
- [ ] §3.3 技术栈/标签同义词归一表
- [ ] 接入「项目名片」后补 `listProjectsByHackathon` / `createProjectCard`

---

## 附录 A · mcp.json 能力声明草案（节选，供阶段二填充）

```jsonc
{
  "name": "hackertrip",
  "version": "1.0.0",
  "abilities": [
    {
      "name": "searchHackathons",
      "description": "用户想浏览/按关键词、城市、线上线下、时间筛选黑客松时调用。",
      "input": { "q": "string?", "mode": "offline|online|hybrid?", "status": "upcoming|ended?", "limit": "number?" },
      "auth": "none",
      "output": "HackathonCard[]"
    },
    {
      "name": "matchHackathonsByStack",
      "description": "用户描述了技术栈或项目方向，想知道适合参加哪些黑客松时调用。",
      "input": { "techStack": "string[]", "city": "string?", "onlyUpcoming": "boolean=true" },
      "auth": "none",
      "output": "HackathonCard[]"
    },
    {
      "name": "getHackathonDetail",
      "description": "用户想了解某一场黑客松的完整信息时调用。",
      "input": { "id": "string" },
      "auth": "none",
      "output": "HackathonDetail"
    },
    {
      "name": "registerHackathon",
      "description": "用户明确想报名某场黑客松时调用。需用户授权，执行前须二次确认。",
      "input": { "id": "string" },
      "auth": "required",
      "output": "{ ok, needAuth? }"
    }
  ]
}
```

> 本草案字段与现有云函数对齐；待开发模式开放后，按官方 `mcp.json` 正式 schema 校正字段名。
