# HackerTrip 小程序 · 交互链路审查 & 迭代 To-Do

> 审查日期：2026-06-22 · 方法：全量扫描 16 页所有 bindtap/navigator/open-type + 逐个核对 handler 实现 + 数据读写链路追踪
> 结论：**跳转链路完整无死链**（所有 navigator/navigateTo 目标页都存在），但**多个按钮是占位实现**，且存在**数据孤岛**（写了 storage 没人读）。

---

## ✅ 已完整实现（无需动）

- **navbar** 返回/首页：goBack（栈深判断 + 单页栈降级 switchTab）、goHome —— AI 直达单页也不迷路
- **发现页**：搜索、筛选 chip、卡片→详情、focus→详情
- **详情页**：去官方报名（webview 真实外链）、问 AI（跳 chat 带 event.fit）、分享
- **match 匹配**：真实规则化算法（技术栈命中计分排序），读 scan 结果
- **identity 身份卡**：canvas 绘制 + 全套表单交互（切卡/锁角色/加减技术栈/打法/组队）+ 保存相册
- **sync 同步**：6 位码 → 降级 mock（已修复）
- **tabBar**：切换 + 高亮跟随（已修复）
- **AI 落地态**：所有页 ?src=ai banner
- **跳转链路**：inbox/profile/schedule/public-site 所有 navigator url 目标页均存在

---

## 🔴 P0 — 影响核心可用性，提审前强烈建议修

### 1. 登录系统基本是空壳
`login.onGetUserInfo` 只 `wx.showToast('登录成功')`，没有任何真实登录。
- [ ] 用 `wx.login()` 取 code，云函数换 openid（云函数待部署）
- [ ] **`open-type="getUserInfo"` 是已废弃 API**（2021 起返回匿名数据），改用 `wx.getUserProfile()` 或头像昵称填写能力（identity-edit 已正确用 `chooseAvatar`，login 没跟上）
- [ ] 存登录态到 storage + globalData
- [ ] **登录后返回原任务**（规范硬要求）：login 接 `?redirect=` 参数，成功后 navigateBack 或跳回来源页
- [ ] 目前**没有任何写操作触发登录引导**（收藏/报名/保存都静默走本地），需建立"未登录 → 引导登录 → 回原任务"统一链路

### 2. "加入赛程"数据不联动（写了没人读）
`detail.joinSchedule` → `api.addRegistration()` 写入 storage，但 **`getRegistrations` 无人调用**。
- [ ] `schedule.js` 改为读 `api.getRegistrations()` 渲染"我加入的赛事"（当前写死取 catalog 第一个 ongoing）
- [ ] 加入后给跳转/提示引导去赛程页

### 3. 身份编辑保存无效（假表单）
`identity-edit.saveProfile` 只 toast，**不写 storage**；`identity`/`public-site`/`share`/`profile`/`settings` 各自硬编码 mock（Jayden/上海/4参赛…），互不联动。
- [ ] 新建统一用户档案 store（如 `api.saveProfile()/getProfile()`，复用 STORAGE）
- [ ] identity-edit 保存 → identity/public-site/share/profile/settings 全部改读同一档案
- [ ] 头像 `onChooseAvatar` 取到的 avatarUrl 也要随档案持久化

---

## 🟠 P1 — 功能缺口

### 4. 收藏功能完全没接
`api` 有完整 `toggleBookmark/isBookmarked/getBookmarks/getBookmarkedHackathons`，但**全部 0 调用**。`hackathon-card` 的 `catchtap onBookmark` 冒泡到 `index.onBookmark`，后者只 toast。
- [ ] `onBookmark` 接 `api.toggleBookmark(id)`，卡片 `bookmarked` 状态读 `isBookmarked` 并持久化
- [ ] 我的页"关注赛事"读 `getBookmarks().length`（当前用全部赛事数充数）

### 5. 退出登录假
`settings.logout` 只 toast，不清登录态/storage、不跳登录页。
- [ ] 清 storage 登录态 + globalData，刷新 UI 或跳登录

### 6. AI 聊天是固定回复
`chat.sendMessage` 返回写死占位文本（"后续接入模型…"），没复用 match 的匹配算法。
- [ ] 短期：接 match 的 `scoreItem` 规则化逻辑，按用户输入返回真实赛事建议
- [ ] 长期：接模型（云函数），返回细化匹配理由
- [ ] 补 **chat → match 跳转入口**（聊到匹配时可进匹配结果页，当前缺）

### 7. Agent 技能库纯展示
`agent.js` 无任何 bindtap，"已启用/待授权"是静态文字，不能操作。
- [ ] 加启用/授权切换交互（或明确标注"即将开放"避免误导审核）

### 8. 设置页两行无功能
`settings` 的"隐私设置""缓存管理"无 bindtap。
- [ ] 缓存管理：接 `wx.clearStorage` / 选择性清理
- [ ] 隐私设置：做开关或说明页

---

## 🟡 P2 — 数据真实性 & 体验细节

- [ ] **身份卡保存后看不到**：`identity.saveCard` 写 `getCards`，但**无人读** → 我的页/身份卡入口应列出已存卡片
- [ ] **缺"设提醒"功能**：规范 J-26 / `event.remind`，详情页应有设提醒按钮（现仅 3 个 CTA）+ 接消息提醒
- [ ] **消息 mock 残留**：`inbox` 文案"深圳湾 AI 硬件方向"是已删除的虚构赛事名，需换真实/通用文案
- [ ] **个人资产数据 mock**：profile/public-site/share/settings 的统计与档案全硬编码，随 P0-3 统一档案一起接真
- [ ] **share 数据 mock**：stats/skills 硬编码，应读用户真实档案
- [ ] **public-site "参赛历史" mock**：现取 catalog 前 3 个充当，应读用户真实报名/参赛记录

---

## 数据孤岛总图（写了没人读 = 功能断头）

| storage 能力 | 写入方 | 读取方 | 状态 |
|---|---|---|---|
| REGISTRATIONS | detail.joinSchedule ✓ | **无** | 🔴 加入赛程无处展示 |
| CARDS | identity.saveCard ✓ | **无** | 🟡 存的卡片看不到 |
| BOOKMARKS | **无**（onBookmark 只 toast） | **无** | 🟠 收藏整个没接 |
| SCAN_RESULTS | sync.pullSyncByCode ✓ | match/identity ✓ | ✅ 唯一打通的闭环 |
| 用户档案 | identity-edit（只 toast） | 各页硬编码 mock | 🔴 无统一档案源 |

---

## 建议迭代顺序

1. **第一迭代（数据闭环）**：统一用户档案 store（P0-3）→ 接收藏（P1-4）→ 加入赛程联动赛程页（P0-2）→ 身份卡列表（P2）。一次把"写了没人读"的孤岛全接通，体验立刻完整。
2. **第二迭代（登录）**：真实登录 + 登录态 + 写操作登录引导 + 登录后回原任务 + 退出登录（P0-1、P1-5）。
3. **第三迭代（AI 能力）**：chat 接 match 算法/模型 + chat→match 入口 + 设提醒（P1-6、P2）。
4. **收尾**：Agent 库交互或标注、设置页功能、mock 文案清理、补真实赛事数据。

> 提审视角：跳转无死链 + 关键信息文本化 + AI 可读性已达标，**当前可作为 MVP 提审**。但 P0 的登录空壳 + 数据孤岛会让真实用户很快撞到"点了没反应/数据对不上"，建议至少完成第一、二迭代再正式推广。
