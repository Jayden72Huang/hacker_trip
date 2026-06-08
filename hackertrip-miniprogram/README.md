# HackerTrip 微信小程序

> 黑客松发现 + 选手身份卡裂变 + Skills 同步 —— HackerTrip 的微信移动端总入口。
> 原生小程序 + 微信云开发（CloudBase）。深色玻璃主题，与官网 hackertrip.space 同源。

---

## ✨ 功能总览

| Tab | 页面 | 能力 |
|-----|------|------|
| **发现** | `pages/index` | 黑客松搜索 / 状态·形式筛选 / 列表，下拉刷新 |
| | `pages/detail` | 详情、赛道、奖金、收藏、加入报名清单、复制官网 |
| **卡片** | `pages/card` | 🎴 身份卡 / 🧩 配置卡工坊：表单实时判定角色、Canvas 实时预览、保存图片、分享找队友 |
| | `pages/share` | 被分享落地页：「TA 是 XX 角色，你呢？」→「我也要一张」裂变回流 |
| **同步** | `pages/sync` | Skills 同步：输入配对码拉取电脑端 `/ht-scan-project` 扫描结果 |
| | `pages/result` | 项目画像 + Top5 黑客松匹配（分数/赛道/Pitch），一键生成身份卡 |
| **我的** | `pages/profile` | 我的卡片 / 收藏 / 报名清单 / 同步状态 |

**三大同步内容**（你的核心诉求）：扫描匹配结果、身份卡/配置卡、收藏/报名清单，均可在云端账号下跨设备同步。

---

## 🏃 快速跑通（零配置，先看效果）

1. 打开**微信开发者工具** → 导入项目，目录选 `hackertrip-miniprogram/`
2. AppID 选「**测试号**」或「无 AppID / 游客模式」即可（`project.config.json` 已设 `touristappid`）
3. 编译 —— **无需任何后端**，全站走本地 mock 降级（`miniprogram/env.js` 的 `envId` 为空时自动生效）：
   - 黑客松列表用内置 15 条数据
   - 「同步」页点「载入演示数据」即可看到扫描结果落地
   - 卡片工坊、Canvas 预览、保存图片全部可用

> 这一步用来验证 UI 与交互。云端数据与真机分享需下面的正式配置。

---

## ✅ 部署状态（已完成）

> 生产环境已部署并校验（2026-06-07）。
- **环境 ID**：`jayden-01-d1g8nsnkbc91f4680`（上海，已填入 `env.js`）
- **集合**：hackathons（公开只读）+ cards / bookmarks / registrations / sync_pairs（仅创建者）
- **索引**：hackathons(isPublished/startDate/id)、cards/bookmarks/registrations(openid)、sync_pairs(code)
- **云函数**：8 个全部部署（Nodejs16.13）
- **数据**：15 条黑客松已导入校验；getHackathons / pairSync 闭环实测通过
- **待办**：mp 后台配置「用户隐私保护指引」（见 docs/隐私协议.md）后即可提交审核

---

## ☁️ 接入云开发（复现步骤，供迁移/重建）

> ⚠️ **测试号不支持云开发，也不能上架**。云开发与上架都需要**正式注册的小程序 AppID**（个人主体即可，免费）。

### 1. 注册小程序 & 填 AppID
- 在 [mp.weixin.qq.com](https://mp.weixin.qq.com) 注册小程序，拿到 AppID
- 把 `project.config.json` 的 `"appid": "touristappid"` 改成你的真实 AppID

### 2. 开通云开发
- 开发者工具顶部点「**云开发**」按钮 → 开通（选按量付费的免费额度即可）
- 复制**环境 ID**（形如 `hackertrip-7gabc123`）

### 3. 配置环境 ID
编辑 `miniprogram/env.js`：
```js
module.exports = {
  envId: 'hackertrip-7gabc123', // ← 填你的环境 ID
  ...
};
```

### 4. 部署云函数
在开发者工具左侧资源管理器 `cloudfunctions/` 下，对每个函数右键「**上传并部署：云端安装依赖**」：
`getHackathons` `getHackathonDetail` `pairSync` `saveCard` `toggleBookmark` `addRegistration` `getProfile` `seedHackathons`

### 5. 导入黑客松数据
右键 `seedHackathons` → 「**云端测试**」运行一次，把内置 15 条黑客松写入云数据库 `hackathons` 集合。
（之后可改为定时同步官网 Neon 数据库，见下方「与官网打通」）

### 6. 建集合 & 权限
云开发控制台 → 数据库，确认/创建集合：`hackathons`（所有人可读）、`cards` `bookmarks` `registrations` `sync_pairs`（仅创建者可读写）。

完成后重新编译，全站自动切换到云端实时数据。

---

## 🔗 Skills 同步：电脑 → 手机 闭环

```
电脑端 /ht-scan-project 扫描  →  push-sync 推送(带配对码)  →  云端 sync_pairs
                                                                    │
手机「同步」页 输入配对码  ───────── pairSync pull ─────────────────┘
   ↓ 落地：扫描结果 / Top5 匹配 / 一键生成身份卡
```

推送端（电脑）：
1. 给 `pairSync` 云函数配置 **HTTP 触发器**，得到地址 `https://<envId>.service.tcloudbase.com/pairSync`
2. `export HT_SYNC_URL=<上面的地址>`
3. `node tools/push-sync.mjs scan.json` —— 打印一个 6 位配对码
4. 手机「同步」页输入该码即可拉取（30 分钟有效）

> `scan.json` 结构见 `miniprogram/data/mock-scan.js`。可由 `ht-scan-project` skill 输出后直接喂入。

---

## 🎨 设计规范

深色玻璃主题，与官网同源（详见 `app.wxss`）：
- 背景 `#05060a` · 前景 `#ededed`
- accent 紫 `#7c5dff` / 粉紫 `#c759ff` / 青 `#4de1ff`
- 工具类 `.glass` `.glow` `.gradient-text` `.chip` `.btn-primary` `.aurora`

---

## 📁 目录结构

```
hackertrip-miniprogram/
├── miniprogram/
│   ├── app.{js,json,wxss}      # 全局：云初始化、tabBar、主题
│   ├── env.js                  # 云环境 ID（留空=本地 mock）
│   ├── data/                   # 本地降级数据 + mock 扫描结果
│   ├── utils/                  # api(云+mock降级) / roles(角色判定) / card-canvas(卡片绘制)
│   ├── components/hackathon-card/
│   └── pages/                  # index/detail/card/share/sync/result/profile
├── cloudfunctions/             # 8 个云函数
├── tools/push-sync.mjs         # Skills 同步推送端
└── docs/                       # 上架素材（隐私协议、描述、类目、截图脚本）
```

## ✅ 上架

完整上架清单见 [`docs/上架指南.md`](docs/上架指南.md)。
