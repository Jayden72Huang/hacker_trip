# HackerTrip 每日赛事闭环操作手册

## 管理入口

- 赛事审核与发布：飞书 Base `WeUkbz9xRax4iKs8x1Lcjr6Sn4e`
  - `爬虫采集`：每日候选与人工审核队列
  - `赛事总表`：网站与小程序的正式管理中心
  - `赛事源列表`：数据源镜像
- 主办方合作建联：飞书 Base `RXTAbIgkBaC0v4soMQocwu0AnSe`
- 每日审核群：`HackerTrip 每日赛事更新审核群`
  - 活动和市场负责人：Mandy 马柳艺（飞书显示名：柳艺Mandy）
- 网站草稿和爬虫目标：网站 `/admin`
- 本地批次产物：`runtime/hackathon-ops/YYYY-MM-DD/`
- 自动任务日志：`~/Library/Logs/hackertrip-daily-ops.log`
- 群内数据协作 Agent：见 `docs/feishu-agent-runbook.md`

## 每日自动流程

每天 08:00，macOS LaunchAgent `space.hackertrip.daily-ops` 依次执行：

1. 将上一次人工审核通过的赛事写入飞书赛事总表，并同步网站与小程序。
2. 将赛事总表中“建联成功”的主办方同步到合作建联 Base。
3. 生成审核通过赛事的微信推送预览，并发到审核群。
4. 抓取当天数据源，整理、去重、评分后写入 `爬虫采集`，再发审核群摘要。

自动任务不会根据置信度直接发布。置信度只负责排序和提示，所有新赛事必须经过人工审核。

## 审核状态机

```text
待审核
├─ 补充核验 ──→ 待审核
├─ 拒绝
├─ 重复
└─ 通过待上架 ──→ 已同步 ──→ 网站 / 小程序
```

审核人只需在飞书 `爬虫采集` 表中完成：

1. 核对名称、日期、官方链接、报名状态、主办方与赛事真实性。
2. 选择 `上线平台`：网站、小程序或两者。
3. 把 `审核状态` 改成 `通过待上架`。

下一次 `sync:approved` 会自动完成正式入表和双端发布。

## 主办方建联

在 `赛事总表` 中维护联系人、微信、邮箱、电话、负责人和跟进记录。只有同时满足以下条件才会写入合作建联 Base：

- `建联状态 = 建联成功`
- 有赛事 ID 和主办方名称
- 至少填写一种联系方式

同步成功后，赛事总表状态变为 `已同步建联表`，并回写建联表记录 ID。

## 常用命令

```bash
npm run feishu:setup          # 只读检查三张表缺失字段
npm run feishu:setup:apply    # 创建缺失字段
npm run crawl:daily           # 手动执行今日爬虫和群通知
npm run sync:approved         # 同步审核通过赛事
npm run sync:organizers       # 同步建联成功主办方
npm run preview:wx            # 生成微信推送预览
npm run ops:daily             # 手动执行完整闭环
npm run ops:verify            # 核心逻辑检查
```

危险或外部写入操作可先加 `--dry-run`，例如：

```bash
npx tsx scripts/sync-approved-hackathons.ts --dry-run
npx tsx scripts/sync-organizer-contacts.ts --dry-run
```

## 本地配置

复制 `config/hackathon-ops.example.json` 为被 Git 忽略的 `config/hackathon-ops.local.json`，填写：

- `reviewChatId`：审核群 `oc_xxx`
- `reviewLeadOpenId`：每日审核消息中需要提醒的负责人 Open ID
- `reviewLeadName`：负责人在飞书中的显示名
- `reviewLeadRole`：负责人职责，例如“活动和市场负责人”
- `partnerTableId`：合作建联 Base 的目标表 `tblxxx`
- `feishuIdentity`：默认 `user`
- `miniprogramEnvId`：微信云开发环境 ID

不要把 appSecret、access token 或数据库密码写入该文件。

## 故障处理

- 飞书失败：先运行 `lark-cli doctor --offline`，再恢复 `lark-cli config init --new` 和所需授权。
- 小程序云数据库失败：运行 `cloudbase login`；未登录时脚本会降级尝试已打开的微信开发者工具。
- 某赛事缺少起止日期：保持在审核队列补充信息，不会写入正式表。
- 查看每日运行结果：`tail -100 ~/Library/Logs/hackertrip-daily-ops.log`。
