# HackerTrip 小程序 · v2 优化清单（代码 + 交互层面）

> 基于 2026-06-23 生产级代码扫描。当前已完成：云数据真实化、登录系统、AI 问答(混元)、微信 AI 开发者模式、数据闭环。
> 本清单是**让小程序达到"生产级精致"还差的部分**，按优先级排。我（AI）能全部代码层完成。

---

## 🔴 P0 — 生产级必须（真实用户会撞到）

### 1. 登录后云端数据同步（数据一致性）
**问题**：收藏/报名/身份卡/档案目前以**本地 storage 为主**，登录时云函数(callFn)只是 best-effort 单向上推，**没有"登录后从云端拉取合并到本地"**。换设备/重装后数据丢失，云本地不一致。
**改法**：登录成功后调 `getProfile` 云函数拉取云端 cards/bookmarks/registrations/profile，合并进本地 storage（云端为准 or 时间戳合并）。
**文件**：login.js（finishLogin 后）、api.js（加 syncFromCloud）

### 2. 写操作登录引导（规范要求，现缺失）
**问题**：扫描确认——只有 settings 用了 auth。**detail 的"加入赛程"、收藏 ☆、身份卡保存等写操作未登录时静默写本地**，没有"引导登录→回原任务"。规范 §6 要求写操作触发登录。
**改法**：写操作前检查 `getApp().globalData.auth`，未登录 → `navigateTo login?redirect=当前页`（login 已支持 redirect 回跳）。给一句理由（"登录后可在多设备同步赛程"）。
**文件**：detail.js(joinSchedule)、index.js(onBookmark)、identity.js(saveCard)

### 3. loading 骨架屏（现在白屏）
**问题**：扫描确认——7 页 data 都有 `loading` 字段，但**没有一个 wxml 渲染 loading 态**。云函数异步加载期间（200ms~3s）页面空白。
**改法**：各页 wxml 加 `<view wx:if="{{loading}}">` 骨架/加载提示（野兽派风格，简单灰块即可），数据到了再显示内容。
**文件**：index/detail/schedule/inbox/match/public-site/profile 的 wxml

---

## 🟠 P1 — 交互完整性

### 4. 空态 / 错误态补全
**问题**：只有 schedule 有空态。缺：收藏列表空、搜索无结果、网络/云端失败、AI 问答失败的友好提示。
**改法**：发现页搜索无结果"换个词试试"；我的页未登录引导；AI 问答失败显示重试按钮。
**文件**：index/profile/chat 等 wxml + js

### 5. 消息通知去 mock（现假数据）
**问题**：扫描确认——inbox 有写死文案"Haki 找到 3 个潜在队友"、"深圳湾 AI 硬件"（**深圳湾是已删除的虚构赛事名**，残留）。
**改法**：截止提醒基于真实 registrations 的 deadline 生成；移除/替换虚构社交通知；或明确标注"示例通知"。
**文件**：inbox.js（buildGroups）

### 6. AI 问答流式输出
**问题**：现在非流式，用户等 1.7~3.3s 才一次性出现回答。
**改法**：aiChat 云函数改 `streamText`，chat.js 逐字追加显示（打字机效果，体验大幅提升）。
**文件**：cloudfunctions/aiChat/index.js、chat.js

---

## 🟡 P2 — 功能完善

### 7. 作品集接真实数据
现 portfolio 是 mock 项目卡。接 cards 集合或用户真实项目（Skills 同步带入）。

### 8. Agent 技能库交互
现纯展示（已启用/待授权不可点）。加启用/授权开关，或明确标"即将开放"。

### 9. 设提醒功能（event.remind）
规范 J-26。详情页加"设提醒"按钮 → 写提醒 → 消息中心展示。需登录。

### 10. 写操作云函数 _openid 一致性
确认 toggleBookmark/addRegistration/saveCard 云函数写入时带 `_openid`（cloud.getWXContext），否则客户端按 _openid 读不到自己的数据。

---

## 🟢 P3 — 打磨 / 提审细节

### 11. 数据库集合安全规则
cards/bookmarks/registrations/users/sync_pairs 设为"仅创建者可读写"（doc._openid == auth.openid）。现走云函数服务端不影响，但规范化更安全。hackathons 已设公开读。

### 12. 身份卡 canvas 真机验证
canvas 2d 绘制逻辑正确（之前读像素确认），但需真机确认渲染（开发者工具 CDP 截不到 canvas）。

### 13. 占位插图替换
login 的"🚀 一站式..."、作品集的"插图"色块，上线前可换真实视觉（或保留野兽派色块，设计 §4 允许）。

### 14. 性能
- 分包加载（skills/ 次级页可分包）
- 赛事海报图 lazy-load + WebP（如果接真实海报）

---

## 建议执行顺序
1. **P0 全做**（数据一致性 + 登录引导 + loading）—— 这是"生产级"和"demo 级"的分水岭
2. **P1 全做**（空态 + 消息去 mock + AI 流式）—— 体验精致度
3. P2/P3 按需

> 建议先做 P0+P1（一轮搞定，可用 Codex 分担），就达到生产级可提审。P2/P3 可上线后迭代。
> 告诉我从哪个开始，或"P0+P1 全做"我就安排。
