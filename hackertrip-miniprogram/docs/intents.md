# HackerTrip 意图语料（intents.md）

> 依据 微信AI可调用性规范 §2。**用户怎么问 → 命中哪个能力**，每能力配 ≥5 条真实问法。
> 随能力增减同步维护。这是「被微信 AI 搜到」的命脉——AI 据此判断何时召唤 HackerTrip。

---

## searchHackathons —— 搜索/浏览赛事
- "最近有什么 AI 黑客松"
- "周末上海的 hackathon"
- "有没有线上的黑客松"
- "深圳有什么编程比赛"
- "12 月有哪些黑客松"
- "推荐几个最近的 hackathon"

## matchHackathonsByStack —— 按技术栈匹配（核心差异化）
- "我会 React 和 Node，能参加哪些比赛"
- "我想做硬件项目参赛"
- "适合 AI / 大模型方向的黑客松"
- "我是做前端的，有什么适合的 hackathon"
- "我的项目是 IoT 的，推荐几个比赛"
- "我想用 Python 做数据项目，哪些比赛合适"

## getHackathonDetail —— 赛事详情
- "AdventureX 什么时候、在哪、奖金多少"
- "详细介绍下春潮黑客松"
- "这场比赛的赛道有哪些"
- "XX 黑客松报名截止了吗"
- "XX 比赛奖金池多少"
- "这个比赛是线上还是线下"

## registerHackathon —— 报名【需授权·二次确认】
- "帮我报名 AdventureX"
- "我要参加这个"
- "报名春潮黑客松"
- "给我加到这个比赛"
- "我想参赛 XX"

## bookmarkHackathon —— 收藏【需授权】
- "收藏这个"
- "先存一下 AdventureX"
- "把这个加到我的收藏"
- "标记一下这场比赛"
- "我想关注 XX 黑客松"

## listProjectsByHackathon —— 赛事项目【预留，项目名片上线后】
- "这场比赛都有哪些项目"
- "看看 XX 的获奖作品"
- "AdventureX 有什么参赛项目"

---

> 落地：开发模式开放后，本表与 `mcp.json` 的 `description` 字段对齐（描述写「用户想干什么时调用」）。
