# HackerTrip 黑客松数据爬取与管理架构

> 本文档描述 HackerTrip 赛事数据的完整生命周期：从自动爬取、人工审核到网站/小程序双端发布，以及飞书多维表格作为管理中心的协同方式。
>
> 最后更新：2026-07-12

---

## 一、架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│  数据源层                                                        │
│  · Neon scrape_target 表（爬虫源真源，enabled/schedule 控制）      │
│  · 飞书「赛事源列表」表（可视化清单，与 scrape_target 同步维护）    │
│  · 手动采集：HackerTrip-collect / hackathon-intake skill          │
│  · 主办方自助提交（小程序端）                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  采集层（每日 08:00 自动 + 按需手动）                             │
│  scripts/daily-crawl.ts                                          │
│  Firecrawl 抓取(Jina 降级) → DeepSeek 提取 → 去重 → 准入门禁      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   Neon draft_hackathon        飞书「爬虫采集」表
   （草稿箱，status=pending）   （人工审核工作区）
                           │
                           ▼  人工审核，合格记录移入
┌─────────────────────────────────────────────────────────────────┐
│  管理中心：飞书 Base「赛事管理」（唯一事实来源）                   │
│  「赛事总表」勾选 已上线 + 上线平台（网站/小程序）                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │  npm run sync:feishu
              ┌────────────┴────────────┐
              ▼                         ▼
     Neon hackathon 表          微信云开发 hackathons 集合
     （网站 hackertrip.space）   （微信小程序）
```

核心设计原则：

1. **飞书 Base 是唯一管理中心**——所有赛事的上线与否、上线到哪个平台，都在飞书「赛事总表」里勾选控制，脚本单向发布到两端。
2. **爬取的数据永远先进草稿区**（Neon 草稿表 + 飞书爬虫采集表），人工审核后才能进入赛事总表。
3. **准入有硬门槛**：必须是真黑客松、未过期、信息真实完整，任一不满足不得上架。

---

## 二、数据源管理

### 2.1 爬虫源真源：Neon `scrape_target` 表

| 字段 | 说明 |
|------|------|
| `name` / `url` / `platform` | 源名称、抓取入口 URL、平台标识 |
| `schedule` | `daily` / `weekly`，每日爬虫只跑 `daily` |
| `enabled` | 开关，禁用即跳过 |
| `last_scraped_at` / `last_status` / `success_count` / `error_count` | 运行统计，脚本自动回写 |

**增减数据源直接改这张表即可**，无需改代码（`daily-crawl.ts` 的 `DEFAULT_TARGETS` 只是幂等 seed，表才是真源）。

### 2.2 可视化清单：飞书「赛事源列表」表

飞书赛事管理 Base 中的「赛事源列表」表是 `scrape_target` 的人类可读镜像（源名称/URL/平台标识/抓取频率/启用/备注）。**新增或禁用数据源时，两边需要同步维护**。

当前启用的 daily 源：AI赛事决金（codebuddy）、腾讯云开发者大赛、CompeteHub、Hackathon Navigator。

### 2.3 手动采集入口

- **`HackerTrip-collect` skill**：给一个 URL（公众号/小红书/活动页），自动抓取 → 提取字段 → 写入草稿箱。
- **`HackerTrip-hackathon-intake` skill**（`.claude/skills/HackerTrip-hackathon-intake/SKILL.md`）：完整的"发现 → 抓取(反爬) → 多源核实 → 准入门槛 → 入库"标准流程，是采集的操作规范。
- **网站后台**（见 `README_SCRAPER.md`）：URL 智能爬取、文本粘贴解析、Google 批量检索。

---

## 三、自动爬取流程（daily-crawl）

### 3.1 调度

- **launchd 任务**：`~/Library/LaunchAgents/space.hackertrip.daily-crawl.plist`，label `space.hackertrip.daily-crawl`，**每天 08:00** 运行（睡眠错过会唤醒补跑）。
- 直接用 `/opt/homebrew/bin/npx tsx` 执行，不经 bash（规避 macOS TCC 权限问题）。
- **日志**：`~/Library/Logs/hackertrip-daily-crawl.log`

```bash
# 手动跑一次
npx tsx scripts/daily-crawl.ts

# 立即触发 launchd 任务
launchctl kickstart -k gui/$(id -u)/space.hackertrip.daily-crawl

# 改完 plist 后重载
launchctl bootout gui/$(id -u)/space.hackertrip.daily-crawl
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/space.hackertrip.daily-crawl.plist
```

### 3.2 脚本流程（`scripts/daily-crawl.ts`）

```
1. ensureTargets()        幂等 seed 数据源到 scrape_target
2. 读取 enabled=true 且 schedule='daily' 的源
3. 每个源：Firecrawl 抓 markdown（失败降级 Jina Reader）
           → DeepSeek (deepseek-chat, json mode) 提取赛事数组
4. 按 name 去重：查 Neon hackathon + draft_hackathon + 飞书赛事总表
5. 入库门禁（见 §4）：已结束的跳过
6. 新赛事写入：
   · Neon draft_hackathon（status=pending，rawData 含 batchDate）
   · 飞书「爬虫采集」表（人工审核工作区）
   所有候选均进入人工审核队列；高置信度只用于排序，不直接发布
7. 写 scrape_log，更新 scrape_target 统计
```

技术要点：

- LLM 提取用 `DEEPSEEK_API_KEY`（`lib/extract-hackathon.ts` 绑定的 ANTHROPIC key 本地没有）；max_tokens=8192、单页限 20 条、带截断容错解析。
- 若源站有现成结构化数据（如 AI赛事决金的 `competitions.json`），优先直接取 JSON，不走 LLM 提取。

### 3.3 已知运维坑

| 坑 | 处理 |
|----|------|
| macOS TCC：项目在 `~/Desktop` 保护目录，launchd 后台进程访问被拒 | 已给 `/opt/homebrew/bin/node` 授予完全磁盘访问权限；**`brew upgrade node` 后授权失效**，需按新版本路径重加 |
| 列表页赛事多导致 DeepSeek 输出截断 | 已做 max_tokens + 限条数 + 容错解析 |
| 历史遗留源 `bonjour fancy event` 提取量为 0 | 建议在 scrape_target 禁用 |

---

## 四、准入门槛（GATE）

任何渠道进来的赛事，**全部满足以下门槛才允许上架**（详见 intake skill）：

1. **必须是真黑客松**：限时开发 + 提交可运行作品 + 评审（Hackathon/黑客松/Buildathon）。
   **严格排除**：创新创业大赛、创业路演、OPC 创业赛、论文赛道（Paper Track）、纯刷榜数据科学赛。来源网站自己的 "hackathon" 分类不可信，需逐条判断。
2. **时效性**：未结束、报名未截止。代码层由 `lib/hackathon-gate.ts` 的 `isEndedHackathon()` 把关（名字含"已结束/往届/已截止"或结束日期早于今天的直接跳过）。
3. **真实性**：报名链接 HTTP 可达且非门户站（`verifyRegistrationLink`），关键信息多源核实。
4. **完整度**：时间、地点、报名方式、主办方等核心字段齐全；不达标留草稿，`missing` 列出缺口。

发布通道：人工将「审核状态」改为「通过待上架」后，由 `npm run sync:approved` 写入赛事总表，再同步网站和小程序。代码不再允许按置信度自动发布。

上架后治理：正式表用 `is_published` 软下架，信息质量不达标可随时下架（详见记忆中的质量门槛规范）。

---

## 五、管理中心：飞书赛事管理 Base

Base 地址：`https://my.feishu.cn/base/WeUkbz9xRax4iKs8x1Lcjr6Sn4e`

| 表 | table_id | 用途 |
|----|----------|------|
| **赛事总表** | `tblHGtaEqzNtYJja` | **唯一管理中心**。审核通过的赛事在此维护，勾选「已上线」+「上线平台」（网站/小程序）控制发布 |
| **爬虫采集** | `tblv9oIouHxJI9ps` | 每日爬虫结果落地区，人工审核后移入赛事总表 |
| **赛事申请** | `tblhkHwmLGSveNJZ` | 小程序端主办方提交的赛事（从云 DB 同步过来） |
| **组织者申请** | `tblICsjnS0thnizf` | 小程序端组织者认证申请（从云 DB 同步过来） |
| **赛事源列表** | `tblaueBKae5Rt7vz` | 爬虫数据源清单（scrape_target 的镜像） |

### 审核工作流

```
爬虫采集表（每日新增）
   │  逐条核实：真黑客松？未过期？链接可达？信息完整？
   ├─ 合格 → 复制/移入「赛事总表」，补全字段，勾「已上线」选「上线平台」
   └─ 不合格 → 删除或留在采集表标记
              ↓
        npm run sync:feishu   （发布到网站 + 小程序）
```

---

## 六、双端同步

### 6.1 飞书 → 网站 + 小程序：`npm run sync:feishu`

脚本：`scripts/sync-from-feishu.ts`

- 读取飞书「赛事总表」，按「已上线」勾选 +「上线平台」多选，发布到：
  - **Neon `hackathon` 表** →  网站 hackertrip.space（Vercel，main 分支自动部署）
  - **微信云开发 `hackathons` 集合** → 微信小程序
- 以 `feishu_id`（赛事ID 字段，如 `ht-05`）作为跨库关联键。

```bash
npm run sync:feishu                    # 全量同步
npx tsx scripts/sync-from-feishu.ts --dry-run   # 预览不写入
npx tsx scripts/sync-from-feishu.ts --id ht-05  # 只同步某条
```

### 6.2 小程序审核台 → 飞书：`npm run sync:admin`

脚本：`scripts/sync-admin-to-feishu.ts`

把小程序云 DB 的 UGC 审核数据同步到飞书可见：

- `hackathon_drafts`（主办方提交）→ 飞书「赛事申请」
- `organizer_applications` → 飞书「组织者申请」
- 已通过的赛事草稿 → 自动回写飞书「赛事总表」

依赖：**微信开发者工具需处于打开状态**（脚本通过 DevTools Automator `127.0.0.1:9420` 访问云 DB）。飞书写入通过 `lark-cli`（需 `lark-cli auth login` 用户身份）。

### 6.3 小程序端管理

小程序内置管理员「审核工作台」（入口：我的 → 设置 → 审核工作台，仅管理员可见），可直接审核主办方提交的赛事和组织者申请。详见 `hackertrip-miniprogram/docs/admin-hackathon-management.md`。

---

## 七、数据存储一览

| 存储 | 表/集合 | 角色 |
|------|---------|------|
| Neon (Postgres) | `hackathon` | 网站正式数据（`is_published` 控制展示） |
| Neon | `draft_hackathon` | 爬虫草稿箱（status=pending 待审） |
| Neon | `scrape_target` / `scrape_log` | 爬虫源配置 / 运行日志 |
| 飞书 Base | 5 张表（见 §5） | 管理中心 + 审核工作区 |
| 微信云开发 | `hackathons` | 小程序正式数据 |
| 微信云开发 | `hackathon_drafts` / `organizer_applications` | 小程序 UGC 审核队列 |

---

## 八、日常操作速查

| 场景 | 操作 |
|------|------|
| 新增爬虫源 | INSERT `scrape_target`（name/url/platform/schedule/enabled）+ 飞书「赛事源列表」加一行 |
| 手动导入某个黑客松 | 对 Claude 说链接，触发 `HackerTrip-collect` skill |
| 审核今日爬取结果 | 打开飞书「爬虫采集」表 → 核实 → 移入「赛事总表」 |
| 发布/下架赛事 | 飞书「赛事总表」勾/取消「已上线」→ `npm run sync:feishu` |
| 查看爬虫运行情况 | `tail -50 ~/Library/Logs/hackertrip-daily-crawl.log` 或查 `scrape_log` 表 |
| 清理过期草稿 | `npx tsx scripts/cleanup-ended-drafts.ts --apply`（默认演练） |
| 同步小程序 UGC 到飞书 | 开着微信开发者工具跑 `npm run sync:admin` |

---

## 相关文档

- `README_SCRAPER.md` — 网站后台爬虫系统功能介绍（URL 爬取/文本解析/草稿箱）
- `.claude/skills/HackerTrip-hackathon-intake/SKILL.md` — 采集准入操作规范（AI 执行标准）
- `hackertrip-miniprogram/docs/admin-hackathon-management.md` — 小程序审核工作台说明
