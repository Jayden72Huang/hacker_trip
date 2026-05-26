# 🎯 HackerTrip Project Scanner

**一行命令，AI 帮你找到最适合参加的黑客松！**

在 Claude Code / Cursor / Windsurf 等 AI 编程助手中运行，自动扫描你的项目代码，语义匹配最适合的黑客松比赛。

## 安装（10 秒）

```bash
curl -sfL https://raw.githubusercontent.com/Jayden72Huang/hacker_trip/main/packages/skills/ht-scan-project/install.sh | bash
```

自动适配：Claude Code · Cursor · Codex · Windsurf · Trae · Gemini CLI

## 使用

在任意项目目录打开 AI 编程助手，输入：

```
/ht-scan-project
```

或者用自然语言：

```
这个项目适合参加什么黑客松？
```

## 它做了什么？

```
📦 你的项目                    🎯 匹配结果
─────────────                ─────────────
package.json                 #1 AdventureX 2026     92/100
requirements.txt    ──AI──→  #2 腾讯云黑客松         87/100
README.md                    #3 BEYOND HACK DAY     81/100
源代码 imports               #4 蚂蚁黑客松          76/100
.env.example                 #5 Sea x OpenAI        72/100
```

**扫描内容**：`package.json` / `requirements.txt` / `Cargo.toml` / `go.mod` + README + 源码 imports + 目录结构

**匹配维度**：主题契合度 30% · 技术栈匹配 25% · 创新潜力 15% · 可行性 15% · 时间物流 15%

**输出内容**：匹配分数 · 推荐赛道 · Pitch 角度 · 优劣势分析 · 一键报名链接

## 特性

- **🔒 100% 本地运行** — 代码永远不会上传，只有你能看到结果
- **🧠 AI 语义匹配** — 不是关键词匹配，Claude 真正理解你的项目做什么
- **📡 实时数据** — 自动从 HackerTrip API 获取最新赛事，离线也能用
- **🌏 中英双语** — 中文项目、英文项目都能准确匹配
- **⚡ 零配置** — 一行安装，进项目目录就能用

## 支持的项目类型

| 语言/框架 | 检测方式 |
|-----------|---------|
| JavaScript / TypeScript | `package.json` |
| Python | `requirements.txt` / `pyproject.toml` |
| Rust | `Cargo.toml` |
| Go | `go.mod` |
| Ruby | `Gemfile` |
| Flutter / Dart | `pubspec.yaml` |

## 示例输出

```
╔══════════════════════════════════════════════════════════════╗
║         🎯 PROJECT → HACKATHON MATCHER                      ║
║         Powered by HackerTrip.Space                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📦 Project: my-ai-app                                       ║
║  Stack: Next.js, TypeScript, Claude SDK, Tailwind CSS        ║
║  Domain: AI Application Platform                             ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  #1  AdventureX 2026                  Score: 92/100          ║
║      Aug 15-17 · 上海 · Offline                              ║
║      Best Track: AI 应用创新                                  ║
║      Pitch: "AI-native developer tool powered by Claude"     ║
║      Strengths: 技术栈完美匹配，AI赛道首选                     ║
║      Gap: Ready to submit                                    ║
║      📋 详情+报名 → hackertrip.space/hackathon/adventurex    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## 数据来源

赛事数据来自 [HackerTrip.Space](https://hackertrip.space) — 中国黑客松聚合平台，涵盖 AI、Web3、开源、XR 等多赛道黑客松。

- 🌐 浏览全部赛事：[hackertrip.space/explore](https://hackertrip.space/explore)
- 📧 订阅每周赛事周报：[hackertrip.space](https://hackertrip.space/#subscribe)
- 🤝 社区组队：[hackertrip.space/community](https://hackertrip.space/community)

## 开源协议

MIT License — 随意使用、修改、分发。

---

**[HackerTrip.Space](https://hackertrip.space)** — 发现你的下一场黑客松 🚀
