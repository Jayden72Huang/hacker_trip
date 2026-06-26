# HackerTrip 裂变玩法 v1 · 交付总索引

一站式入口。三大功能（F1 Haki 暗号 / F2 集卡卡册 / F3 赛事热度+认领）已落地并部署。

## 📄 文档
| 交付物 | 路径 | 内容 |
|---|---|---|
| 策略设计 | `docs/裂变玩法设计-v1.md` | 脑暴全集 → 收敛逻辑 → 交互链路 → 调研印证(Bonjour/群勾搭/网易/Devpost) → 落地状态 → 路线图 |
| 功能开发文档 | `docs/裂变玩法-功能开发文档-v1.md` | PRD+技术规格：需求/链路/页面组件/数据模型/云函数接口/降级/埋点/验收/部署/风险 |
| 文案物料 | `design/viral-v1/文案物料.md` | 暗号话术5版 + 冷启动文案(朋友圈/群/即刻/Twitter/小红书) + 主办方B端话术 |

## 🎨 视觉物料
| 交付物 | 路径 | 用途 |
|---|---|---|
| 暗号分享卡 | `design/viral-v1/materials/invite-card.png` | 用户分享暗号，引导好友扫码组队 |
| 赛事热度海报 | `design/viral-v1/materials/heat-poster.png` | 煽动选手上车 + 引导主办方认领 |
| Figma 高保真 | https://www.figma.com/design/I3DD8IGGLc0rF4lwAaczEa | 「HackerTrip 裂变玩法 v1 高保真」卡册(node 1:2)/暗号卡(2:2)/热度看板(3:2) 3 页可编辑设计稿 |

## 🧩 代码落地（已实现+编译零报错）
- 云函数：`cloudfunctions/{inviteCode,redeemInvite,getHackathonHeat}` + `aiChat`(升级)，已部署 CloudBase `test-1-d8gn28apcbf409627`
- 集合：`invites`(code唯一索引)、`notifications`(openid索引)，权限 PRIVATE
- 前端：`pages/cardbook`(新)、`utils/unlocks.js`(新)、改 `pages/{chat,identity,detail,profile}` + `utils/{api,roles}`
- storage：`ht_growth`

## ✅ 上线前唯一待办
真机用真实微信号登录，跑通「生成暗号 → 发给 Haki → 组队雷达 → 解锁」（mock 假 openid 会被内容安全拦，真实用户无此问题）。

## 🚀 下一迭代（优先级序）
1. 招募排行榜（拉新榜/赛事邀请王）— 群勾搭验证最强单点
2. inbox 接 notifications（A 看到「有人用你暗号加入」）
3. 平台热度大盘 + 认领后选手画像
4. 线下碰一碰交换卡关系链（Bonjour 杀招）
