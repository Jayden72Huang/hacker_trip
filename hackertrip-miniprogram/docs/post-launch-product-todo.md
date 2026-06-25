# HackerTrip 小程序上线后优化 Todo

更新时间：2026-06-25

## P0 登录与用户数据绑定

- [x] 将微信登录主入口放到“我的”页。
- [x] 写操作未登录时使用浮窗引导登录，不再直接跳转登录页。
- [x] 登录浮窗取消/授权失败不再提示“已取消登录”，避免误导用户以为已登录状态被取消。
- [x] 登录页、登录浮窗共用同一条 `api.loginWithUserInfo()` 链路。
- [x] 设置页不再作为第二个登录入口；未登录时跳回“我的”页完成微信登录。
- [x] 登录后把微信昵称和头像同步到统一身份资料。
- [x] 登录态必须拿到云函数返回的 `openid` 才成立，避免本地假登录导致 UID 未绑定。
- [x] 自动清理历史版本里没有 `openid` 的本地登录缓存，避免旧缓存误显示为已登录。
- [x] 退出登录时清理本地用户绑定缓存，避免旧账号 profile/赛程/收藏/Skills 残留给下一个用户。
- [x] 加入赛程、收藏、保存身份卡前检查登录态，并绑定当前微信账号。
- [x] “我的”页移除“还没有关注的赛事”空态，关注/参赛数据归到“赛程”Tab。

## P0 赛程与收藏

- [x] “加入我的赛程”登录后继续执行当前操作。
- [x] 云端同步失败时不再直接显示成功。
- [x] 收藏赛事登录后执行，并同步到当前账号。
- [x] 增加“取消加入赛程”能力。
- [x] 赛程 Tab 增加收藏赛事和已加入赛事的明确分区。
- [x] 赛程页不再用全站赛事 fallback 伪造“正在关注”，只展示用户真实加入或收藏的赛事。
- [x] 赛程页“取消加入”也接入登录浮窗和云端同步，不再绕过登录态。
- [x] 移除默认 Jayden/AI Builder/作品数等硬编码资产展示，未同步时展示空状态或中性占位。

## P1 身份卡

- [x] 身份卡页顶部增加“编辑资料 / 生成预览 / 保存转发”流程。
- [x] 身份编辑页支持微信登录同步昵称和头像。
- [x] 身份卡“生成 / 刷新”接入登录浮窗，未登录时先授权，成功后继续生成小程序码。
- [x] 身份卡保存、保存图片、分享入口统一到当前账号和公开 profile。
- [x] 身份卡导出图片前会先保存卡片资产，分享前也会尝试保存，避免只生成 canvas 预览但没有进入“我的”身份卡。
- [x] 身份资料保存时云端失败会回滚本地资料，避免提示失败但本地看起来已保存。
- [x] 身份卡保留微信转发能力。
- [x] 身份卡转发路径携带公开 `uid`，分享落地页读取分享者公开 profile，不再展示打开者自己的本地资料。
- [x] 身份卡配置项进一步折叠为更轻量的编辑面板，高级配置默认收起。
- [x] 增加多套身份卡模板。

## P1 Skills 同步

- [x] 取消上线环境的 mock 同步成功。
- [x] Skills 同步必须登录，并绑定当前微信账号。
- [x] 只有云端 `pairSync` 拉取成功才显示同步成功。
- [x] 同步结果在页面展示项目名、简介、技术栈和匹配数量。
- [x] `pairSync` 拉取成功后由云函数绑定卡片，前端只刷新本地缓存，避免 scan 成功但卡片二次保存失败造成半成功状态。
- [x] 桌面 CLI 增加标准 push 命令：扫描项目 -> 生成 6 位配对码 -> 调用 `pairSync(action=push)`，通过 `HACKERTRIP_SYNC_URL` 或 `--sync-url` 指定 HTTP 触发地址。
- [x] Skills 同步升级为一次性配对模型：小程序登录用户先生成 6 位配对码和一次性上传 token，CLI 使用该 token 推送扫描结果，不需要把全局 `SYNC_TOKEN` 分发给用户。
- [x] CLI 扫描器识别微信小程序项目结构：`project.config.json`、`miniprogram/app.json`、`miniprogram/package.json`、`cloudfunctions/`，并提取 WeChat Mini Program、CloudBase、Cloud Functions、JavaScript、ES6 等 Skills。
- [x] Skills 同步页展示一次性桌面端命令，支持复制命令和拉取同步结果；`syncUrl` 已接入 CloudBase `pairSync` HTTP 入口。
- [x] 配对码增加一次性消费或绑定后不可重复拉取策略。

## P1 Agent 配置

- [x] Agent 页从静态展示改为可操作配置页。
- [x] 支持开关 Haki 可读取的项目画像、技术栈、身份卡、赛事匹配结果。
- [x] Haki 聊天请求带上 Agent 配置。
- [x] `aiChat` 云函数按 openid 读取最近一次 Skills 同步数据并注入 prompt。
- [x] 将 Agent 配置同步到云端，支持跨设备恢复。
- [x] Agent 配置同步失败时回滚本地开关，避免 UI 显示已开启但云端未保存。
- [x] Agent 配置页展示上下文数据来源：Skills 同步、身份资料、赛事匹配，并标明已就绪/待完成。
- [x] Skills 同步页说明同步结果会更新 Agent 上下文、身份卡配置和赛事匹配，避免用户误以为只是展示页。

## P2 验证与发布

- [x] 跑 WeChat DevTools `build-npm`。
- [x] 跑 WeChat DevTools 预览包检查。
- [x] 跑 CLI 扫描冒烟验证，确认小程序项目不再显示 `Stack: Not detected`。
- [ ] 真机验证登录浮窗、加入赛程、收藏、身份卡保存、Skills 同步、Haki 上下文。
- [x] 部署更新后的云函数：`addRegistration`、`aiChat`、`getProfile`、`pairSync`、`saveAgentConfig`，以及确认 `login/getProfile/saveProfile/pairSync` 已部署。
- [x] 已为 `pairSync` 配置 HTTP 访问入口，并把入口写入 `miniprogram/env.js` 的 `syncUrl`；函数内部支持一次性上传 token 和内部 `SYNC_TOKEN` 两种校验方式。

## 本轮验证证据

- 业务 JS 语法检查通过：`find miniprogram cloudfunctions tools -path 'miniprogram/miniprogram_npm' -prune -o -name '*.js' -exec node --check {} \;`。
- 上线后专项验收脚本通过：`node tools/verify-post-launch.js`，覆盖登录入口/浮窗、赛程归属、身份卡分享、Agent 配置、Skills 配对链路和云函数引用。
- 专项验收脚本已覆盖所有 `api.requireAuth(this, ...)` 页面必须挂载 `auth-modal`，并禁止旧式跳转登录守卫、误导性的“已取消登录”文案和 Skills 同步 mock 成功。
- 专项验收脚本已补充关键顺序检查：我的页已登录不重复弹窗；详情页必须先登录再写入赛程；Skills 生成命令必须先确认 HTTP endpoint、再登录、再创建一次性配对；Skills 拉取必须先登录并校验 6 位码。
- 页面级运行时 smoke 通过：`node tools/automator-post-launch-smoke.js`。脚本通过 `miniprogram-automator` 驱动微信开发者工具模拟器，覆盖“我的”、赛程、详情、身份卡、Skills 同步、Agent 配置页面的数据字段和关键入口。
- 页面级 smoke 结果：我的页未登录时显示 `微信登录`；赛程页渲染 `已加入赛程` / `已收藏赛事`；详情页加载 `ht-06` 且有 9 个结构化 meta；身份卡页生成 `/pages/share/share?...` 分享路径并展示 `编辑资料/生成预览/保存转发`；Skills 同步页显示 `syncEndpointReady: true`；Agent 配置页展示 `Skills 同步/身份资料/赛事匹配` 数据源和 4 个上下文开关。
- 页面完整性检查通过：`app.json` 中 19 个页面的 `.js/.json/.wxml/.wxss` 文件均存在。
- 函数引用完整性检查通过：`miniprogram/utils/api.js` 内所有 `callFn(...)` 都能在 `cloudfunctions/<name>/index.js` 找到对应实现。
- `app.json` 检查通过：不存在会触发开发者工具警告的 `agent` 字段，已全局注册 `auth-modal`。
- WeChat DevTools `build-npm` 通过，返回 `warnings: []`，最新耗时 `1853ms`。
- WeChat DevTools 预览包通过，最新包体 `787.0 KB`。
- WeChat DevTools `auto --trust-project` 可开启自动化入口；当前项目未安装 `miniprogram-automator` 客户端，因此页面 data 自动化验证仍未替代真机验收。
- CLI 扫描冒烟通过：`node ../hackertrip-cli/bin/hackertrip.mjs scan --path /Users/jaydenworkplace/Desktop/hacker_trip/hackertrip-miniprogram` 输出 `Stack: WeChat Mini Program, Cloud Functions, CloudBase, JavaScript, ES6`。
- CloudBase 远端函数列表确认关键函数均为 `Active`，环境为 `test-1-d8gn28apcbf409627`；`pairSync` 远端更新时间为 `2026-06-25 14:25:47`，`saveAgentConfig` 为 `2026-06-25 13:23:05`。
- CloudBase 路由确认：`pairSync` 远端函数代码已更新到 `action=create/push/pull` 三段式一次性配对模型，HTTP 访问服务路由 `/pairSync` 状态为 `SUCCESS`，函数类型为 `Event`。
- CloudBase 无写入调用验证通过：`getProfile`、`saveProfile`、`saveAgentConfig`、`getProfileQr`、`pairSync` 在无微信上下文时均返回“缺少用户身份”；`getHackathons` 可返回线上赛事；`getPublicProfile` 对缺失 uid 返回“用户不存在”。
- 小程序同步页已接入 HTTP 入口：`miniprogram/env.js` 的 `syncUrl` 指向 CloudBase HTTP 访问服务，页面可生成一次性桌面端命令。
- CloudBase HTTP 入口探测通过：`pairSync` 对错误同步密钥返回 `{"ok":false,"message":"同步密钥无效"}`；`aiChat` 今日多条调用 `RetCode: 0`。
- 尚未完成真机端到端证明：今日 `login` 函数日志为空，不能据此证明真实微信登录、加入赛程、身份资料保存、身份卡分享和 Skills 拉取已经在真机走通。

## 真机验收清单

1. 清理小程序本地缓存后进入“我的”页，点击“微信登录”，确认出现浮窗登录而不是跳转登录页；完成后“我的”页显示微信头像/昵称。
2. 从发现页进入任意赛事详情，点击“加入我的赛程”，确认已登录状态下不再重复弹登录；成功后进入“赛程”Tab，赛事出现在“已加入赛程”。
3. 未登录状态下点击收藏或加入赛程，确认弹出登录浮窗；登录成功后继续执行原操作。
4. 在“我的”页点击个人资料卡，进入编辑身份；用微信头像/昵称同步后保存，确认保存成功并返回“我的”页资料卡更新。
5. 进入“身份卡”，等待底部按钮从“生成中...”变为“分享 / 找队友”，确认卡片内出现小程序码；转发给另一个微信账号打开，确认展示的是分享者 profile。
6. 进入“Agent 配置”，切换任意开关，确认提示“配置已同步”；随后进入 Haki 提问，确认 `aiChat` 日志出现新调用。
7. 如已配置 `pairSync` HTTP 入口，先在“Skills 同步”点击“生成命令”，复制命令到桌面端执行，再回到小程序点击“拉取同步结果”；确认页面展示项目名、简介、技术栈和匹配数量。
