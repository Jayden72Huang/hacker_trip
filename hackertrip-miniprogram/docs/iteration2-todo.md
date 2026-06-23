# HackerTrip 小程序 · 第二轮迭代 To-Do（UI 美化 + 数据真实化 + 登录）

> 审查日期：2026-06-22 · 基于 automator 真机截图 + 云端实查（云函数/云库）

---

## 关键发现：数据为什么"写死"

实查结果（不是猜测）：
- ✅ **9 个云函数全部已部署且 Active**（getHackathons/getHackathonDetail/getProfile/addRegistration/toggleBookmark/saveCard/pairSync/seedHackathons）
- ✅ **云数据库 `hackathons` 集合有 15 条真实数据**
- ❌ **但所有页面的赛事数据走的是本地 `catalog.js`（写死的 `hackathons.js`），完全没调用云函数** —— `api.getHackathons`（读云库）是孤立的、没有页面用它

**结论**：后端（云函数+云库）是真实的，但前端页面绕过了它们直接读本地包。这就是"数据写死"的根因。

---

## A. UI 美化

| # | 问题 | 改法 | 文件 |
|---|---|---|---|
| A1 🔴 | **收藏按钮巨大**（占卡片顶部半宽）—— `<button class="bookmark">` 被微信 wx-button 内置 width 撑满（和之前 filter-chip 同一个坑） | `width:58rpx !important` + `flex-shrink:0` + `.bookmark::after{border:none}` | hackathon-card/index.wxss |
| A2 | 全面排查其他 `<button>` 是否也被撑大（CTA 全宽是正常的，只有"想做成小图标"的才是 bug） | 逐个核对，必要时同 A1 修 | 各页 |

## B. 数据真实化（核心，最重要）

| # | 任务 | 说明 | 文件 |
|---|---|---|---|
| B1 🔴 | **页面数据源切到云函数** | 把 index/detail/schedule/inbox/match/public-site 的 `catalog.getAll()/getById()`（本地同步）改为 `await api.getHackathons()/getHackathonDetail()`（云函数异步读云库）。保留 status 派生逻辑（移到 api 层 decorate） | 6 个页面 + api.js + catalog.js |
| B2 🔴 | **云库清理假数据** | 云库 `hackathons` 还有 5 个 `example.com` 占位赛事（ht-10~14），删掉（之前只删了本地包） | 云库（cloudbase 工具直接删） |
| B3 | **异步加载态** | 页面改异步后加 loading 骨架 + 失败降级本地兜底（api.js 已有降级，页面加 loading UI） | 6 个页面 |
| B4 | 统一 decorate | status/modeText/canRegister 派生逻辑统一到 api 层，云数据和本地数据都经过它 | api.js |

## C. 登录系统（第二迭代核心）

| # | 任务 | 说明 | 文件 |
|---|---|---|---|
| C1 🔴 | **真实微信登录** | `wx.login()` 取 code → 云函数换 openid → 存登录态（globalData + storage） | login.js + 云函数(login) + app.js |
| C2 🔴 | **替换废弃 API** | login 现在用已废弃的 `getUserInfo`，改用 `wx.getUserProfile()` 或头像昵称填写能力（identity-edit 已用 chooseAvatar，login 跟上） | login.js |
| C3 🔴 | **写操作登录引导** | 收藏/报名/保存身份卡等写操作未登录时 → 引导登录 → 登录后回原任务（login 接 `?redirect=`） | login.js + detail/identity 等写操作点 |
| C4 | **退出登录** | settings.logout 当前只 toast，改为真实清除登录态/storage + 刷新 | settings.js |
| C5 | 账号信息真实化 | settings/profile 显示真实登录用户（昵称/头像），不再硬编码 | settings.js + profile.js |

---

## 分工建议（我 + Codex）

- **我**：A（UI 修复）+ B1/B3/B4（前端数据源切云 + 异步态）—— 前端改造
- **Codex（cloudbase 能力）**：B2（云库清假数据）+ C1（login 云函数 + openid）—— 后端
- **协作点**：登录态 contract（globalData.openid/userInfo 结构）先定，前后端对齐

## 执行顺序

1. **A1 收藏按钮**（10 分钟，立竿见影）
2. **B 数据真实化**（核心，页面切云函数 + 云库清理）—— 让数据真正实时
3. **C 登录系统**（前后端配合）
4. 真机回归测试（automator）

> 待你确认范围后开工。第一迭代（数据闭环）已 commit/push，本轮在其基础上继续。
