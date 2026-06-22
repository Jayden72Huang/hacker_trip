# Codex 任务：HackerTrip 小程序全量效果图（暖白·紫 v6）

你是设计执行。按以下规范，为 8 个主要页面生成高保真效果图 PNG，自检评分 ≥90 才算合格，未达标就重生。

## 输入文档（必读）
- 页面简报：`/Users/jaydenworkplace/Desktop/hacker_trip/hackertrip-miniprogram/design/hifi/page-specs.md`
- 设计规范：`/Users/jaydenworkplace/Desktop/hacker_trip/hackertrip-miniprogram/design/hifi/hackertrip-design-system.md`
- 完整 PRD：`/Users/jaydenworkplace/Desktop/hacker_trip/hackertrip-miniprogram/design/hifi/hackertrip-product-requirements.md`

## 锁定主题（严格使用，不得偏色）
暖白工作台 + 紫色 accent（Style Guide #04，60-30-10）。
- 页面底 `#FAF9F5`，卡片 `#FFFFFF`，边框 `#ECE9E1`，卡内分隔 `#EEEAF6`
- 主文字 `#010138`，次要 `#5F5F79`，弱 `#9292B4`
- 主 accent 紫 `#4D4DE9`（按钮/选中/进度当前段/图标），按压 `#3A3AD1`，软 `#7171F1`
- 选中chip/kicker底 `#EFEDFF`，快捷入口底 `#F5F4FF`
- 成功/已完成进度 `#BDF6CC`（文字配 `#1E9E5A`），标签点缀 粉 `#F9B9D9` / 黄 `#FFDD99`
- 紧急倒计时<24h `#F2628A`
字体：英文/数字几何无衬线（Indivisible 风格），中文 PingFang SC。
字阶(px@393)：Title 32 / Subtitle 24 / Heading 20 / 正文16 / 次要14 / 小字12。间距 4/8/12/18/26/36/50，页边距 20。
画布：393×852，含状态栏+顶部胶囊安全区+底部 home indicator。真实数据（用 PRD §16 真实赛事 AdventureX/春潮 等），不要 lorem。可读优先、不拥挤、干净留白、圆角卡、细边框、几乎不用重投影。温暖而有科技感。

## 要出的 8 个页面（命名严格）
存到 `/Users/jaydenworkplace/Desktop/hacker_trip/hackertrip-miniprogram/design/prd-design-v2/effect-mockups/v6-warm-purple/`：
1. `01-home.png` 首页 Home（参赛状态面板：AdventureX 报名1/7 + 7段进度 + 倒计时 + 下一任务 + 4快捷入口 + 推荐AI动作 + 底部命令栏）
2. `02-discovery.png` 发现黑客松（城市选择/搜索/筛选chips/精选大卡春潮/普通卡列表）
3. `03-chat.png` AI 匹配聊天（对话流 + 结构化追问chips + 内嵌赛事结果卡 + 输入栏）
4. `04-match.png` 匹配结果（项目画像卡 + Top5 赛事匹配分+进度条，分色阈值≥85绿/60-84紫/<60弱）
5. `05-event.png` 黑客松详情（标题/关键事实chips/简介/赛道/AI适配理由/底部主CTA）
6. `06-schedule.png` 赛程工作台（活跃赛事状态/7阶段进度条/关键任务清单≤3/提醒卡）
7. `07-identity.png` 身份卡工坊（身份卡/配置卡切换/大卡片角色技能统计/保存分享）
8. `08-sync.png` Skills 同步（已同步结果卡/6位配对码输入/获取步骤）

## 自检评分（每页四维，各 25 分，合计 100，<90 重生）
1. 规范符合度：配色严格用上述 hex，字阶/间距/圆角对
2. 交互清晰度：主操作明确、可点元素清楚、符合 page-specs 的关键交互
3. 视觉精致度：层级/对齐/留白/一致性，温暖科技感
4. 可读性：中文不挤、对比度足、信息密度合理

## 产出
- 8 张 PNG 存到上述目录
- 一份 `v6-warm-purple/REVIEW.md`：逐页四维打分 + 总分 + 未达标重生记录
- 若 Figma MCP 可用，把 8 张放进 Figma 文件 FL9PioBRU82uD86pajjt6p 的「01 效果图 / 主图确认」页（不要动其它页）
