# 社交平台热点爬取工具指南（for AI Agent）

> 面向 Claude / Codex 等 AI Agent 的爬虫工具选型参考。
> 目标场景：爬取豆瓣热门小组、微博热门话题这类中文社交平台热点数据。
> 整理日期：2026-07-13

---

## 一、核心结论（TL;DR）

1. **拿"热门话题/热搜榜"不要写爬虫**——用热榜聚合项目（DailyHotApi / TrendRadar）直取 JSON，零反爬成本。
2. **深挖帖子/评论才需要真爬虫**——微博用 MediaCrawler，豆瓣用反检测浏览器（agent-reach / Camoufox）。
3. **通用网页给 LLM 喂数据**——本地免费用 Crawl4AI，云端省心用 Firecrawl。

---

## 二、工具矩阵（全部开源/免费）

### A 类：热榜聚合（首选，拿热门话题零成本）

| 项目 | 开源地址 | 说明 |
|------|---------|------|
| **DailyHotApi** | https://github.com/imsyy/DailyHotApi | 今日热榜聚合 API：微博热搜、豆瓣、知乎、B站等几十个平台，返回结构化 JSON，支持 RSS 模式，可一键部署 Vercel。**拿微博热门话题的最短路径** |
| **TrendRadar** | https://github.com/sansan0/TrendRadar | AI 舆情监控：聚合 35 个平台热点，关键词筛选，**支持 MCP 接入（Agent 可直接对话分析）**，支持推送到微信/飞书/钉钉/Telegram，Docker 部署 |
| **newsnow** | https://github.com/ourongxing/newsnow | 实时热点聚合（TrendRadar 的数据源之一），界面优雅，可自部署 |
| **RSSHub** | https://github.com/DIYgod/RSSHub | 万物皆可 RSS：有现成路由覆盖微博热搜、**豆瓣小组**（`/douban/group/:id`）、豆瓣话题等，配合任意 RSS 阅读能力即可订阅 |

**免费公开接口（无需部署）：**

```bash
# 微博热搜榜（免登录，直接 curl）
curl "https://weibo.com/ajax/side/hotSearch"
```

### B 类：平台深度爬虫（要帖子/评论/小组内容时用）

| 项目 | 开源地址 | 说明 |
|------|---------|------|
| **MediaCrawler** | https://github.com/NanmiCoder/MediaCrawler | ~28k star。**微博**帖子/评论、小红书、抖音、快手、B站、知乎、贴吧全覆盖。Playwright 模拟真浏览器 + 扫码登录缓存 + IP 代理池，无需逆向。**微博深度爬取的事实标准**。注意：不支持豆瓣 |
| **XHS-Downloader** | https://github.com/JoeanAmier/XHS-Downloader | 小红书作品采集（如需扩展小红书场景） |
| **xiaohongshu-mcp** | https://github.com/xpzouying/xiaohongshu-mcp | 小红书 MCP 服务，Agent 可直接调用搜索/读帖/发布 |

### C 类：通用 LLM 友好爬虫（任意网页 → 干净 markdown）

| 项目 | 开源地址 | 说明 |
|------|---------|------|
| **Crawl4AI** | https://github.com/unclecode/crawl4AI | 68k+ star，Apache 2.0。本地运行、免 API 费用，输出 LLM 友好的 markdown，专为 RAG/Agent 设计。**自托管首选** |
| **Firecrawl** | https://github.com/firecrawl/firecrawl | 云端托管（有免费额度），JS 渲染 + 反爬处理 + 干净 markdown，还有 search/crawl/map/agent 全家桶。**省心首选**，自托管版是 AGPL |
| **Jina Reader** | https://github.com/jina-ai/reader | 免费降级方案：任意 URL 前加 `https://r.jina.ai/` 即返回 markdown，无需部署 |
| **Camoufox** | https://github.com/daijro/camoufox | 反检测 Firefox（指纹伪装），过风控严的站点（豆瓣/微信文章）的底层利器 |

### D 类：Agent Skill（Claude Code 可直接安装的封装）

| Skill | 开源地址 / 安装 | 说明 |
|-------|----------------|------|
| **agent-reach** | https://github.com/Panniantong/xfetch （npm: `npm i -g xreach-cli`） | 一个 CLI 通吃 13+ 平台：Twitter/Reddit/YouTube/GitHub/B站/小红书/抖音/微信公众号/LinkedIn/RSS/网页抓取，内置 Camoufox 反检测。**装完即给 Agent 一双"上网的手"** |
| **Firecrawl skills** | https://github.com/firecrawl/firecrawl （文档 https://docs.firecrawl.dev） | scrape/search/crawl/browser 等一组 skill，需 API key（有免费额度） |

---

## 三、针对目标场景的具体打法

### 场景 1：微博热门话题

```
方案 A（最省力）：curl https://weibo.com/ajax/side/hotSearch → 直接拿 JSON
方案 B（要更多平台）：部署 DailyHotApi（Vercel 免费），GET /weibo 等端点
方案 C（要长期监控+推送）：TrendRadar 自托管，关键词筛选后推飞书/微信
```

### 场景 2：豆瓣热门小组名字

豆瓣没有公开 API，风控较严（频率限制 + 未登录内容截断），推荐：

```
方案 A：agent-reach 抓 https://www.douban.com/group/explore（小组发现页），
        LLM 从 markdown 中提取小组名/成员数/简介
方案 B：RSSHub 豆瓣路由订阅特定小组的新帖（/douban/group/:groupid）
注意：控制频率（间隔 3-5 秒），带真实 UA，必要时用 Camoufox
```

### 场景 3：深挖内容（组内帖子、微博评论区）

```
微博 → MediaCrawler（扫码登录一次，缓存登录态，按关键词/ID 爬帖子+评论）
豆瓣 → agent-reach / Camoufox 逐页抓 + LLM 提取（无现成专用爬虫）
```

### 推荐流水线架构（已在生产验证过的模式）

```
数据源清单（DB 表管理，enabled/schedule 控制）
  → 定时任务（launchd/cron 每日跑）
  → 抓取：结构化 JSON 优先 > Firecrawl/agent-reach > Jina Reader 降级
  → LLM 提取（DeepSeek/Claude json mode，限条数 + 截断容错）
  → 按名称去重（查已有库）
  → 写入草稿区，人工审核后发布
```

要点：**源站有现成 JSON 就别走 LLM 提取**（省钱且零幻觉）；LLM 提取一定限制单次条数并做截断容错。

---

## 四、合规与反爬注意事项

1. **只爬公开数据**，不碰需要登录才能看的隐私内容；遵守平台 robots 与服务条款，数据不用于转售。
2. **控制频率**：单站间隔 3-5 秒起步，夜间跑批，别把人家服务器当压测对象。
3. **登录态谨慎**：MediaCrawler 这类需要扫码登录的工具，用小号，风控封号自负。
4. **豆瓣/微博风控特点**：豆瓣看频率和 Cookie 新鲜度，微博看 UA + 游客 Cookie；被 418/403 就加代理池或降频，不要硬重试。
5. LLM 提取的结果**必须过一遍人工或规则校验**再入库（分类标签、日期、链接可达性都可能出错）。
