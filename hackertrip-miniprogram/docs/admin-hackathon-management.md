# HackerTrip 小程序审核工作台说明

## 为什么赛事上线需要人工审查

需要。组织者提交的赛事会先进入 `hackathon_drafts`，管理员人工确认活动真实性、官网链接、时间地点、奖金描述和内容合规后，再发布到正式 `hackathons` 集合。

这样可以避免虚假赛事、垃圾链接、违规内容、过期赛事直接展示给用户，也更符合微信小程序审核要求。

## 管理员授权

管理员入口不会对普通用户展示，云函数也会二次校验权限。

任选一种方式授权：

1. 在云函数 `adminHackathonManage` 环境变量配置：
   - `ADMIN_OPENIDS=openid1,openid2`
2. 或在 CloudBase 数据库添加 `admin_users` 集合文档：
   - `openid`: 管理员 openid
   - `active`: `true`

推荐生产环境使用 `admin_users` 集合，便于随时增删管理员。

## 管理入口

小程序路径：

`我的` -> `设置` 区域 -> `审核工作台`

只有管理员登录后才会出现该入口。

## 管理动作

### 组织者审核

管理员在 `组织者审核` 页签查看组织者认证申请。

点击 `通过` 后：

1. 云函数读取 `organizer_applications`
2. 将申请状态改为 `approved`
3. 组织者可以提交黑客松草稿

点击 `拒绝` 后：

1. 云函数将申请状态改为 `rejected`
2. 保存拒绝原因
3. 组织者不会获得发布入口

### 审核发布

管理员在 `赛事审核` 页签查看组织者提交的赛事草稿。

点击 `发布` 后：

1. 云函数读取 `hackathon_drafts`
2. 标准化字段
3. 写入或更新 `hackathons`
4. 设置 `isPublished=true`
5. 把草稿状态改为 `approved`

### 拒绝草稿

点击 `拒绝` 后填写原因。

云函数会把草稿状态改为 `rejected`，不会进入正式赛事列表。

### 上线 / 下线正式赛事

正式赛事页签可以切换：

- `isPublished=true`: 用户可见
- `isPublished=false`: 用户不可见

`getHackathons` 已过滤 `isPublished=false`，下线赛事不会出现在普通列表里。

## 数据集合

- `hackathon_drafts`: 组织者提交的待审核草稿
- `organizer_applications`: 组织者认证申请
- `hackathons`: 正式展示给用户的赛事
- `admin_users`: 管理员白名单
- `users`: 用户资料，不用于管理员授权
