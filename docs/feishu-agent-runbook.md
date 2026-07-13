# HackerTrip 飞书赛事助手

## 目标

`HackerTrip 赛事助手`工作在「HackerTrip 每日赛事更新审核群」，协助黄俊涛和活动/市场负责人 Mandy 马柳艺维护：

- 赛事数据：Base `WeUkbz9xRax4iKs8x1Lcjr6Sn4e` 的 `赛事总表`、`爬虫采集`
- 合作方数据：Base `RXTAbIgkBaC0v4soMQocwu0AnSe` 的 `主办方合作管理`

Agent 只接受目标群的事件。查询立即执行；写入必须经过“建议变更 → 再次 @Agent 确认”两步，且只能写白名单字段。

## 群内用法

```text
@HackerTrip 赛事助手 帮助
@HackerTrip 赛事助手 赛事 AdventureX
@HackerTrip 赛事助手 合作方 SHE NICEST
@HackerTrip 赛事助手 待审核
@HackerTrip 赛事助手 数据概览
@HackerTrip 赛事助手 我们已经联系了 Example Labs，负责人是 Mandy，下一步约电话
```

写入类自然语言消息不会直接修改 Base。Agent 会返回类似：

```text
确认更新赛事 ht-12｜建联状态=已联系｜建联负责人=柳艺Mandy｜下一步=约电话
```

群成员核对后，再次 @Agent 发送该命令才会写入。

## 飞书应用配置

建议创建独立的企业自建应用，名称为 `HackerTrip 赛事助手`，不要复用拥有大量权限的通用 CLI 应用。

1. 开启“机器人”能力。
2. 开启“机器人对外共享”，因为目标群包含外部租户成员。
3. 开通最小权限：
   - 接收群聊中 @ 机器人的消息
   - 以应用身份发送消息
   - 读取、写入多维表格记录
4. 事件订阅使用请求地址：`https://hackertrip.space/api/feishu/agent`
5. 订阅事件：`im.message.receive_v1`
6. 不配置 Encrypt Key；配置 Verification Token。
7. 发布应用版本并完成企业管理员审核。
8. 在飞书客户端 V7.19 或更高版本中，由应用所属企业的成员把机器人添加到外部群。

## Vercel 环境变量

生产、Preview、Development 均配置：

```text
FEISHU_AGENT_APP_ID
FEISHU_AGENT_APP_SECRET
FEISHU_AGENT_VERIFICATION_TOKEN
FEISHU_AGENT_CHAT_ID=oc_d4bfe5721c67c3b82d4fb015d7c0c287
```

Base token 和 table ID 已有安全默认值，也可以使用以下变量覆盖：

```text
FEISHU_EVENT_BASE_TOKEN
FEISHU_EVENT_MAIN_TABLE_ID
FEISHU_CRAWLER_TABLE_ID
FEISHU_PARTNER_BASE_TOKEN
FEISHU_PARTNER_TABLE_ID
```

不要把 App Secret、Verification Token 或 access token 写入 Git。

## 验证

```bash
npm run agent:verify
curl https://hackertrip.space/api/feishu/agent
```

健康检查只返回是否完成配置，不返回任何密钥。
