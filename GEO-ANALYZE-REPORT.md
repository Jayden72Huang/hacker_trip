# GEO 九维审计报告 — hackertrip.space

> 审计日期：2026-05-26
> 目标 URL：https://hackertrip.space
> 审计模式：完整九维分析

---

## 总分：37/100（D 级 — 严重不足）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GEO 审计结果 — hackertrip.space
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  总分：37/100（D 级）

  九维得分：
  ▓▓░░░░░░░░░░░░░ 来源可信度    3/15
  ▓▓▓▓▓▓▓▓░░░░░░░ 信息独特性    8/15
  ▓▓▓▓▓░░░░░░░░░░ 事实准确性    5/12
  ▓▓▓▓░░░░░░░░░░░ 内容结构      4/12
  ▓▓▓░░░░░░░░░░░░ 主题深度      3/12
  ▓▓▓▓░░░░░░░░░░░ 语义丰富度    4/10
  ▓▓░░░░░░░░░░░░░ 技术优化      2/8
  ▓▓▓▓▓░░░░░░░░░░ 新鲜度        5/8
  ▓▓▓░░░░░░░░░░░░ 多格式        3/8

  最薄弱维度：技术优化 (2/8) — robots/sitemap/llms.txt 全部 404
  最大优化机会：FAQ Schema + 统计数据引用 → 预估 +30 分

  合规状态：⚠️ 未部署 SEO 基础设施

  预估优化后可提升至：72/100（+35 分）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔴 致命问题：Google 零收录

搜索 `site:hackertrip.space` 返回 **0 条结果**。网站完全不在 Google 索引中。

**原因分析**：
1. 未提交 Google Search Console
2. 无 sitemap.xml（线上 404）
3. 无 robots.txt（线上 404）
4. Cloudflare 部署可能存在 SSR 预渲染问题
5. 上次提交的 SEO 代码（robots.ts / sitemap.ts / llms.txt）尚未部署

---

## 九维详细分析

### 1. 来源可信度 — 3/15 🔴

| 检查项 | 状态 | 说明 |
|--------|------|------|
| robots.txt | ❌ 404 | 代码已写但未部署 |
| sitemap.xml | ❌ 404 | 代码已写但未部署 |
| llms.txt | ❌ 404 | 代码已写但未部署 |
| JSON-LD Schema | ❌ 无 | 代码已写但未部署 |
| agent.json | ✅ 200 | A2A 协议已部署 |
| HTTPS | ✅ | Cloudflare 强制 HTTPS |
| Google Search Console | ❌ | 未注册 |
| 反向链接 | ❌ | 无已知外部链接 |

### 2. 信息独特性 — 8/15 🟡

**优势**：
- 目前中文市场唯一的黑客松聚合平台（CompeteHub 是竞赛聚合，不完全对标）
- 独有功能：AI 项目匹配、ViberCard、Agent Network (A2A)
- 23 个黑客松的结构化数据通过 API 可访问

**不足**：
- 首页内容以营销为主，缺乏独特的信息密度
- 没有原创的行业分析、趋势洞察
- 用户评价看起来是虚构的（过于完美）

### 3. 事实准确性 — 5/12 🟡

**存在问题的统计数据**：
- 首页显示 "50+ partnerships" — 缺乏可验证的来源
- "98% 用户满意度" — 无调查方法说明
- Explore 页面显示 "0 projects" — 可能是数据问题
- 部分 testimonials 引用具体数字（$50K, $100K+）但无法验证

**建议**：用可验证的、有来源的数据替代

### 4. 内容结构 — 4/12 🔴

| 检查项 | 状态 |
|--------|------|
| H1 包含核心关键词 | ⚠️ H1 是 "HackerTrip" + 动态文本，缺少"黑客松平台" |
| 各页面独立 title/description | ❌ 生产环境仅有根 layout metadata |
| FAQ 区块 | ❌ 完全没有 |
| 面包屑导航 | ❌ 无 |
| 内容层级 (H1>H2>H3) | ⚠️ 部分清晰，但 h2/h3 缺乏关键词 |
| 内部链接策略 | ⚠️ 有但不够系统化 |

### 5. 主题深度 — 3/12 🔴

**严重缺陷**：
- 首页完全是营销页面，没有教育性内容
- 没有"什么是黑客松"的科普内容
- 没有"如何参加黑客松"的指南
- 没有行业趋势分析或数据报告
- 没有博客/文章深度内容

**竞品对比**：CompeteHub 在掘金、V2EX 有月度赛事汇总，获取了大量长尾关键词流量

### 6. 语义丰富度 — 4/10 🟡

- ✅ 中英双语内容
- ✅ 使用了黑客松相关术语
- ❌ 无 Schema.org 标记（生产环境）
- ❌ 无 FAQPage schema
- ❌ 无 Event schema（生产环境）
- ❌ 关键词密度不足：首页缺少 "中国黑客松平台"、"黑客松集合" 等目标词

### 7. 技术优化 — 2/8 🔴

- ❌ robots.txt: 404
- ❌ sitemap.xml: 404
- ❌ llms.txt: 404
- ❌ llms-full.txt: 404
- ❌ canonical URL: 未设置
- ✅ HTTPS: 是
- ✅ 移动端响应式: 是
- ⚠️ 页面加载速度: 未测试（SSR/Cloudflare）

### 8. 新鲜度 — 5/8 🟢

- ✅ API 返回 23 个活跃黑客松
- ✅ 数据持续更新（有 cron API）
- ⚠️ 但未被索引，新鲜度无法被搜索引擎感知
- ⚠️ 无 lastmod 信号（无 sitemap）

### 9. 多格式 — 3/8 🟡

- ✅ API 支持 JSON + Markdown 双格式
- ✅ 有 og-image.png (OG 图片)
- ❌ 无 FAQPage 结构
- ❌ 无可下载的 PDF/文档
- ❌ 无视频内容
- ❌ 无数据表格/对比图表

---

## 5 大 AI 平台特异性分析

### ChatGPT (GPTBot)
- ❌ 无 robots.txt 允许 GPTBot
- ❌ 无 llms.txt
- ⚠️ 域名太新，无品牌权威
- 预估被引用概率：**< 1%**

### Perplexity (PerplexityBot)
- ❌ 无 robots.txt 允许 PerplexityBot
- ❌ 无 FAQ Schema（Perplexity 最看重的）
- ❌ 无 PDF 文档
- 预估被引用概率：**< 1%**

### Google AI Overview (SGE)
- ❌ 未被 Google 索引
- ❌ 无 E-E-A-T 信号
- ❌ 无结构化数据
- 预估被引用概率：**0%**

### Microsoft Copilot / Bing
- ❌ 未确认 Bing 索引状态
- ❌ 无 Bing Webmaster Tools
- 预估被引用概率：**< 1%**

### Claude AI
- ❌ 无 robots.txt 允许 ClaudeBot
- ⚠️ Claude 使用 Brave Search — 未确认 Brave 索引
- 预估被引用概率：**< 1%**

---

## 优先级排序的改进建议

### 🔴 紧急（立即执行）
1. **部署 SEO 分支到生产环境** — robots.txt / sitemap.xml / llms.txt / JSON-LD 全部就绪但未上线
2. **注册 Google Search Console** — 提交 sitemap，请求索引
3. **注册 Bing Webmaster Tools** — Copilot 依赖 Bing 索引

### 🟠 高优先级（本次优化）
4. **添加 FAQ Section + FAQPage Schema** — GEO 提升 +40%
5. **添加统计数据+来源引用** — GEO 提升 +37%
6. **首页添加 "什么是 HackerTrip" 信息密度段落** — 主题深度提升
7. **H1/H2 优化嵌入目标关键词** — "中国黑客松平台"、"黑客松集合"

### 🟡 中优先级（后续迭代）
8. **创建 /about 页面** — E-E-A-T 信号
9. **在掘金/V2EX/知乎发布文章** — 反向链接 + 长尾关键词
10. **月度黑客松汇总内容** — 对标 CompeteHub 的内容策略
