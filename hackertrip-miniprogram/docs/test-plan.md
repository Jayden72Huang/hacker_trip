# HackerTrip 小程序 · 测试方案与用户交互路线

> 用途：开发完成后照此执行测试（mcp 自动化 + 人工核对）。通过后方可提审。
> 依据：`interaction-flow.md`(J-xx 跳转)、`微信AI可调用性规范.md`(AI可读性)、`build-handoff.md`(页面)。

---

## 一、用户交互路线（主路径，对应选手 6 阶段）

```
① 冷启动/逛   发现(游客直达,免登录)
                ├─ 卡片 → 详情 (J-01)
                └─ AI入口 → 聊天 (J-04)
② 找赛事       发现→搜索/筛选(J-02,同页刷新)
                聊天→匹配结果(J-11)→详情(J-10)
③ 决策报名     详情 ──去官方报名(J-20,webview真实链接)
                    ├─加入赛程(J-21)
                    ├─设提醒(J-26,需登录)
                    └─问AI适合吗(J-22→聊天带赛事上下文)
④ 参赛中       赛程(状态面板/7段进度J-31/任务勾选J-32) + 消息(提醒J-40→详情/赛程)
⑤ 提交冲刺     赛程紧急态(deadline<24h,J-34)→提交清单/作品集
⑥ 赛后资产     我的→身份卡(J-50)→编辑(J-51)/分享导出(J-53)→分享落地页→裂变回①
              旁路：Skills同步(07)注入资产；Agent/Skills库(J-52)
```

**AI 调用路线（微信AI Agent → src=ai 落地）**：
微信AI → deep-link(`?src=ai&intent=…`) → 对应页落地态(banner+结果优先) → `在HackerTrip里继续`CTA → 深度功能。
intent→页：match.events→chat / event.detail→detail / identity.generate→identity / schedule.status→schedule / skills.sync→sync。

---

## 二、核心功能测试用例

| # | 功能 | 操作 | 预期 | mcp 方法 |
|---|---|---|---|---|
| F1 | 数据加载 | 进发现页 | 列表渲染、`status` 派生正确、不含 ended | navigate + page_data |
| F2 | 搜索 | 搜索框输 "AI" | 列表筛出 AI 相关赛事 | automator input+tap |
| F3 | 筛选 chip | 点 "硬件" | 列表按 track/tag 过滤 | tap + page_data |
| F4 | 详情完整性 | 进详情 | name/date/city/mode/prize/tracks 全部**文本**呈现 | page_data 断言文本字段 |
| F5 | 去官方报名 | 详情点「去官方报名」 | 打开 webview(真实 website) | tap + page_stack |
| F6 | 加入赛程 | 详情点「加入赛程」 | 写入并跳赛程/提示 | tap |
| F7 | 收藏(未登录) | 点 ☆ | 触发登录引导(非静默失败) | tap + page_data(needAuth) |
| F8 | 赛程进度 | 进赛程 | 7段进度/当前阶段/倒计时正确 | page_data |
| F9 | 身份卡 | 进身份卡 | 卡渲染、数据填充 | navigate |
| F10 | Skills同步 | 输 6 位码 | 走 pending/success/fail 态 | input+tap |
| F11 | AI 落地态 | 带 `?src=ai` 进 detail | 显示「来自微信AI」banner + 结果优先 | navigate(query) + page_data(aiBanner=true) |

---

## 三、页面跳转测试（J-xx 执行清单）

| J | 源→目标 | 验证点 |
|---|---|---|
| J-01 | 发现卡 → 详情 | 当前页=detail，参数带 slug/id |
| J-02 | 发现 搜索/筛选 → 本页结果态 | 同页刷新，非新页 |
| J-03 | 发现 CTA → 身份卡 | 游客可进(空态) |
| J-04 | 发现 AI入口 → 聊天 | intent=match |
| J-10/11 | 聊天 → 详情/匹配结果 | 焦点流，左上返回可回 |
| J-20 | 详情 → 官方报名 webview | 外链真实 |
| J-21/26 | 详情 → 赛程/设提醒 | 写操作未登录走 J-90 |
| J-30~34 | 赛程内 跳转/页内态 | 进度/任务/紧急态 |
| J-40/41 | 消息 → 详情/匹配结果 | 分组项点击目标正确 |
| J-50~56 | 我的 → 身份卡/编辑/作品集/Agent库/同步/设置 | 各子页可达，左上返回 |
| J-90 | 写操作 → 登录 | 登录后回原任务 |
| tabBar | 发现/赛程/消息/我的 | switchTab 切换，custom-tab-bar 高亮正确 |

---

## 四、AI 可调用性测试（自动模式 · 提审依赖，规范§3/§5）

| # | 检查 | 预期 | 方法 |
|---|---|---|---|
| A1 | 每页标题语义化 | `navigationBarTitleText` 各页不同且达意 | read_file 各 .json |
| A2 | 关键信息机读 | 详情页 name/date/city/prize 在 DOM 文本(非纯图) | page_data / element_info |
| A3 | CTA 可识别 | 主操作用原生 button/navigator | read_page 检查标签 |
| A4 | 列表语义分层 | 列表项 标题/副标题/标签分层 | element_info |
| A5 | 写操作授权 | 返回 `{ok,needAuth,message}` 结构 | evaluate |

---

## 五、可用性 / 视觉可读性检查（逐页）

每页执行：
1. `wechat_navigate` 跳转 → `wechat_inspector(cdp)` 采集日志 → **无 error/exception/WXML警告**
2. `wechat_screenshot` 截长图 → 人工核对：野兽派配色、对齐、文字可读(对比度)、无溢出/重叠、tabBar/导航正确
3. `wechat_build compile` → 全项目**编译 0 error**

---

## 六、测试执行工具（mcp）

- `wechat_build compile`：编译检查（基线）
- `wechat_automator start` → `tap/input/page_data/evaluate/page_stack`：功能与跳转
- `wechat_navigate`：逐页跳转 + CDP 日志
- `wechat_screenshot`：逐页截图核对
- `wechat_inspector`：console/CDP 异常采集

---

## 七、通过标准（提审门槛）

- [ ] 16 页 `compile` 0 error
- [ ] 核心功能用例 F1–F11 全通过
- [ ] 跳转用例 J-xx 主路径全通过
- [ ] AI 可读性 A1–A5 达标（自动模式提审依赖）
- [ ] 逐页 CDP 日志无 error/exception
- [ ] 逐页截图视觉核对通过（配色/对齐/可读/无溢出）
- [ ] 关键数据真实（无伪造赛事/报名链接，publish 质量门槛）

> 测试全绿 → 整理测试报告 + 用户交互路线 → 同步用户 → 提交审核。
