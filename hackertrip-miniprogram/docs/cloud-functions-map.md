# CloudBase 云函数分组

更新时间：2026-06-28
环境：`test-1-d8gn28apcbf409627`

这份文档是 HackerTrip 小程序云函数的分组和用途说明。CloudBase 控制台的 Description 字段当前通过 MCP 读取仍为空，因此以本文件作为仓库内的函数备注真源。

## 用户与身份

| 函数 | 用途 | 当前调用方 |
| --- | --- | --- |
| `login` | 微信登录，绑定 `OPENID` 并更新 `users` 用户档案。 | `miniprogram/utils/api.js` |
| `getProfile` | 汇总当前用户档案、收藏、报名、身份卡、同步结果和组织者状态。 | `miniprogram/utils/api.js` |
| `saveProfile` | 保存昵称、头像、角色、城市、技能、GitHub 等身份资料。 | `miniprogram/utils/api.js` |
| `getPublicProfile` | 按 `publicId` 或 `uid` 查询公开主页资料，用于分享落地页。 | `miniprogram/utils/api.js` |
| `getProfileQr` | 生成公开主页/身份卡的小程序码，用于身份卡扫码访问。 | `miniprogram/utils/api.js` |
| `saveCard` | 保存或更新当前用户身份卡，供身份卡页面和公开主页复用。 | `miniprogram/utils/api.js` |

## 赛事发现、赛程与收藏

| 函数 | 用途 | 当前调用方 |
| --- | --- | --- |
| `getHackathons` | 查询已发布黑客松列表，支持发现页、更多黑客松和筛选。 | `miniprogram/utils/api.js` |
| `getHackathonDetail` | 查询单场黑客松详情，供详情页、报名和分享使用。 | `miniprogram/utils/api.js` |
| `getHackathonHeat` | 聚合报名和收藏热度，给赛事页或运营展示兴趣数据。 | `miniprogram/utils/api.js` |
| `addRegistration` | 将当前用户加入或移出“我的赛程”，服务端绑定 `OPENID`。 | `miniprogram/utils/api.js` |
| `toggleBookmark` | 收藏或取消收藏黑客松，服务端校验赛事已发布并绑定 `OPENID`。 | `miniprogram/utils/api.js` |

## 组织者与管理员审核

| 函数 | 用途 | 当前调用方 |
| --- | --- | --- |
| `submitOrganizerApplication` | 提交组织者认证申请，内容安全检测后进入审核队列。 | `miniprogram/utils/api.js` |
| `submitHackathonDraft` | 组织者提交黑客松草稿，安全检测后进入人工审核。 | `miniprogram/utils/api.js` |
| `adminHackathonManage` | 管理员审核赛事草稿、组织者申请，并控制赛事上下线。 | `miniprogram/utils/api.js` |
| `eventSync` | 外部 CLI/HTTP 提交活动到 `hackathon_drafts`，待人工审核后上线。 | HTTP 路由 `/eventSync` |

### `eventSync` 安全备注

- 云端已配置 `EVENT_SUBMIT_TOKEN`，外部提交必须通过 `x-sync-token`、`Authorization: Bearer <token>` 或 body 的 `submitToken` 校验。
- 纯 HTTP 提交没有微信 `openid` 时无法调用微信内容安全接口，函数会标记 `needsSecurityReview: true`，必须由管理员人工审核后才能上线。
- 不要把 `EVENT_SUBMIT_TOKEN` 写入仓库。需要给 CLI 使用时，通过本地环境变量或密钥管理注入。

## Agent、Skills 与 AI

| 函数 | 用途 | 当前调用方 |
| --- | --- | --- |
| `pairSync` | 小程序生成配对码，CLI 推送项目扫描/作品，小程序拉取并绑定用户。 | `miniprogram/utils/api.js`、HTTP 路由 `/pairSync` |
| `saveAgentConfig` | 保存用户授权给 Haki/Agent 读取的上下文范围。 | `miniprogram/utils/api.js` |
| `matchHackathonsByStack` | 根据用户技术栈匹配黑客松并生成 `fitReason` 推荐理由。 | 暂未在 `api.js` 直接调用 |
| `aiChat` | Haki 聊天问答，读取赛事数据并调用云开发内置大模型。 | `miniprogram/utils/api.js`、`miniprogram/pages/chat/chat.js` |

### `pairSync` 数据流

1. 小程序调用 `pairSync` 的 `create` 动作生成 6 位配对码和一次性上传 token。
2. CLI 或网页端通过 HTTP 路由 `/pairSync` 调用 `push`，写入 `scan`、`card` 和 `works`。
3. 小程序调用 `pull` 拉取结果，绑定当前 `OPENID`，并 best-effort 写入 `cards` 和 `works` 集合。

## 订阅通知

| 函数 | 用途 | 当前调用方 |
| --- | --- | --- |
| `saveSubscription` | 保存用户微信订阅消息授权结果，供上新、推荐、截止提醒筛选。 | `miniprogram/utils/api.js` |
| `sendHackathonNotifications` | 管理员发送黑客松上新、智能推荐和报名截止订阅消息。 | 管理端/运维调用 |

当前模板环境变量：

- `NEW_HACKATHON_TEMPLATE_ID`：新活动/黑客松通知。
- `SMART_RECOMMENDATION_TEMPLATE_ID`：智能推荐通知。
- `DEADLINE_REMINDER_TEMPLATE_ID`：报名截止提醒。

## 裂变增长

| 函数 | 用途 | 当前调用方 |
| --- | --- | --- |
| `inviteCode` | 为当前用户生成或读取专属邀请暗号。 | `miniprogram/utils/api.js` |
| `redeemInvite` | 核销好友暗号，绑定邀请关系并解锁组队/卡面权益。 | `miniprogram/utils/api.js` |

## 系统与遗留函数

| 函数 | 用途 | 当前调用方 |
| --- | --- | --- |
| `seedHackathons` | 一次性或运维导入内置黑客松数据到 `hackathons` 集合。 | 运维调用 |
| `hackertrip_code` | 早期测试函数，当前小程序代码未引用。 | 无 |

## 清理建议

- `hackertrip_code` 没有本地源码和当前调用方，上线稳定后可在控制台确认无日志调用，再下线或删除。
- `matchHackathonsByStack` 已部署但当前 `api.js` 没有直接调用；如果“适合我的”推荐完全走其他逻辑，需要确认是否保留。
- 现有函数运行时混用 `Nodejs16.13` 和 `Nodejs18.15`。CloudBase 运行时创建后通常不能直接改，后续新增或重建函数时统一使用 `Nodejs18.15`。
