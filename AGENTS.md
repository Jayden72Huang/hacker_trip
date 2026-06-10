# AGENTS.md — HackerTrip

面向 AI 编码代理（Codex / Cursor / Claude Code 等）的项目指南。UI 设计规范与历史踩坑详见 `CLAUDE.md`。

## 项目概述

HackerTrip（hackertrip.space）是一个黑客松发现与参与平台：聚合国内外黑客松信息、AI 助手（Haki）、开发者身份卡片（Identity Card）、组队匹配、作品提交与社区。中文为主，品牌名/技术术语保留英文。

| 层 | 技术 |
|----|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| 语言 | TypeScript 5（strict 模式） |
| 样式 | Tailwind CSS 4（无 config 文件，主题在 `app/globals.css`） |
| 数据库 | Neon Postgres + Drizzle ORM |
| 认证 | next-auth v5（GitHub / Google OAuth + Resend 邮箱登录） |
| AI | Anthropic Claude SDK、DeepSeek、Firecrawl 抓取 |
| 存储 | Cloudflare R2（S3 兼容 API） |
| 部署 | **Vercel**（push main 自动部署） |

⚠️ 仓库中的 `wrangler.toml`、`open-next.config.ts` 和 `build:cf` / `preview:cf` / `deploy:cf` 脚本是早期 Cloudflare 方案残留，**未实际启用**，不要据此判断部署方式。

## 常用命令

```bash
npm run dev      # 本地开发服务器
npm run build    # 生产构建（提交前必须通过）
npm run start    # 启动生产服务器
npm run lint     # ESLint 检查

# 数据库（Drizzle）
npx drizzle-kit generate   # 根据 lib/db/schema.ts 生成迁移 SQL
npx drizzle-kit push       # 将 schema 推送到 Neon
```

**没有测试框架**（无 jest/vitest/playwright）。验证标准 = `npm run build` 无报错 + `npm run lint` 通过 + 手动验证页面效果。

## 架构概览

```
app/                  # Next.js App Router
  page.tsx            # 首页
  api/                # 30+ API routes（见下方分组）
  explore/ haki/ identity/ dashboard/ admin/ organizer/
  u/[username]/       # 公开用户主页（/@username 经 middleware 重写至此）
components/           # 共享 React 组件（Navbar、HackathonCard 等）
lib/
  auth.ts             # next-auth v5 配置（providers、DrizzleAdapter、session 回调）
  db/schema.ts        # Drizzle schema（37 表 + 7 enum，含 NextAuth 表）
drizzle/              # SQL 迁移文件（drizzle-kit 生成）
middleware.ts         # 受保护路由 + /@username 重写
scripts/              # 数据脚本（黑客松爬取/导入、图片生成等）
data/                 # 静态数据（hackathons.ts、drafts.json 等）
public/               # 静态资源
```

### API routes 主要分组（`app/api/`）

- **黑客松数据**: `hackathons`、`import-url`、`parse-text`、`scrape`、`drafts`、`cron`（每日爬取）
- **AI 功能**: `haki`（Claude 驱动的助手）、`recommendations`、`match`、`generate-image`
- **用户/身份**: `user`、`identity`、`agent-card`、`works`、`articles`、`messages`
- **运营**: `admin`、`organizer`、`subscribe`、`waitlist`、`stats`、`notifications`

### 认证流

`lib/auth.ts` 定义 providers 和 DrizzleAdapter；`middleware.ts` 保护 `/admin`、`/dashboard`、`/settings`、`/haki`、`/messages`、`/organize/create`、`/works/submit` 等路由，未登录重定向到 `/?callbackUrl=...`。

### 子项目（独立目录，不参与主站构建）

- `hackertrip-miniprogram/` — 微信小程序（原生 + 云开发），9 页面 + 8 云函数，设计规范真源在 `design/hifi/`
- `hackertrip-cli/` — CLI 工具（项目扫描 → 黑客松匹配）

### 生成/草稿目录（代理应忽略，不要读取或修改）

`.firecrawl/`、`generated_images/`、`generated-walkers/`、`.next/`

## 关键文件

| 文件 | 作用 |
|------|------|
| `app/globals.css` | **主题唯一真源**：CSS 变量（--background/--accent-1/2/3 等）+ `.glass`/`.glow`/`.shimmer` 工具类 |
| `next.config.ts` | 图片域名白名单（`images.remotePatterns`）+ 重定向 |
| `middleware.ts` | 路由保护与重写 |
| `lib/auth.ts` | 认证配置 |
| `lib/db/schema.ts` | 数据库 schema |
| `drizzle.config.ts` | Drizzle 迁移配置 |
| `CLAUDE.md` | UI 设计规范、布局变更流程、历史踩坑记录 |
| `.env.local` | 环境变量（DATABASE_URL、AUTH_*、R2_* 等）——**绝不修改、绝不提交** |

## 编码规范

- **TypeScript**: strict 模式，避免 `any`；组件 props 用 `interface` 定义
- **路径别名**: `@/*` 指向项目根目录（如 `import { auth } from "@/lib/auth"`）
- **组件**: 默认 Server Component；需要交互/hooks 时标注 `"use client"`
- **样式**: 优先 Tailwind 工具类，避免内联 style；自定义样式写入 `globals.css` 并使用 CSS 变量；复用 `.glass`/`.glow`/`.shimmer` 等现有工具类
- **主题**: 深色主题，**绝不使用浅色/白色风格**；具体色值以 `app/globals.css` 当前值为准（不要依赖文档中的旧色值）
- **文件组织**: 页面 `app/[route]/page.tsx`；组件就近放置或入 `components/`；新文件一律 TypeScript
- **文案语言**: 中文为主，品牌名/技术术语保留英文
- **图片**: 添加外部图片源时**立即**同步 `next.config.ts` 的 `remotePatterns`（否则线上 crash）；大图必须压缩转 WebP，不要原图直出

## 工作流与注意事项

1. **复杂改动（>3 文件）先给方案**，用户确认后再编码；一次只做一个功能，确认后继续
2. **每次修改后跑 `npm run build`**，失败立刻修复，不要在坏代码上叠加改动
3. **绝不修改 `.env.local`** 或任何含密钥的文件，除非用户明确要求
4. **UI 布局变更先确认位置**：先用文字描述放在哪个组件的什么位置，再动手
5. **动画可见性检查**：实现 opacity/transform 动画后必须确认文字在初始和最终状态都可见（历史坑：`opacity: 0` + gradient 继承导致文字消失）
6. **z-index**：修改层叠顺序前先检查 navbar 和 grid-bg 的现有层级
7. **git**：不要主动 commit/push，完成后询问用户；main 分支 push 即触发 Vercel 生产部署，需格外谨慎
