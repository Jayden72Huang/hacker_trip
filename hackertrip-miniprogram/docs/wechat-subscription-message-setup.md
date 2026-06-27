# 微信订阅消息接入流程

HackerTrip 已在小程序侧接入订阅授权、授权结果保存和后台发送云函数。你还需要在微信公众平台申请模板，并把模板 ID 填回配置。

## 1. 在微信后台添加模板

入口：微信公众平台 -> 小程序 -> 功能 -> 订阅消息 -> 公共模板库。

建议先添加 3 类模板：

| 用途 | 代码类型 | 建议内容 |
| --- | --- | --- |
| 黑客松上新 | `new_hackathon` | 新赛事名称、地点/形式、简介或备注 |
| 智能推荐 | `smart_recommendation` | 推荐赛事名称、推荐理由、匹配标签 |
| 截止提醒 | `deadline_reminder` | 赛事名称、报名截止时间、备注 |

注意：微信模板关键词以后台实际选择为准。发送云函数支持通过 `event.data` 传入真实模板字段。

## 2. 填写小程序模板 ID

编辑 `miniprogram/env.js`：

```js
subscribeTemplates: {
  newHackathon: '你的上新模板 ID',
  smartRecommendation: '你的智能推荐模板 ID',
  deadlineReminder: '你的截止提醒模板 ID',
}
```

这些 ID 用于前端调用 `wx.requestSubscribeMessage`，必须和后台模板一致。

## 3. 配置云函数环境变量

在云开发控制台给 `sendHackathonNotifications` 配置：

```text
NEW_HACKATHON_TEMPLATE_ID=你的上新模板 ID
SMART_RECOMMENDATION_TEMPLATE_ID=你的智能推荐模板 ID
DEADLINE_REMINDER_TEMPLATE_ID=你的截止提醒模板 ID
```

如果你在调用发送函数时直接传 `templateId`，也可以不依赖环境变量。

## 4. 创建数据库集合

云数据库需要这两个集合：

```text
message_subscriptions
notification_logs
```

`message_subscriptions` 保存用户授权状态，`notification_logs` 保存发送结果。

## 5. 部署云函数

部署以下函数：

```text
saveSubscription
sendHackathonNotifications
```

`saveSubscription`：用户点订阅按钮后保存授权结果。

`sendHackathonNotifications`：管理员或后台任务调用，用来预览/发送订阅消息。

## 6. 前端入口

已接入两个入口：

- 发现页「精选推荐」下方：订阅黑客松上新
- 设置页「通知提醒」：上新提醒、智能推荐、截止提醒

如果用户未登录，会先弹出登录引导；如果模板 ID 没配置，会提示先配置模板。

## 7. 发送示例

预览可发送用户：

```js
wx.cloud.callFunction({
  name: 'sendHackathonNotifications',
  data: {
    action: 'preview',
    type: 'new_hackathon',
  },
});
```

发送上新通知：

```js
wx.cloud.callFunction({
  name: 'sendHackathonNotifications',
  data: {
    action: 'send',
    type: 'new_hackathon',
    hackathonId: 'ht-demo',
    hackathon: {
      name: 'HackerTrip AI Hackathon',
      city: '深圳',
      summary: '适合 AI Builder 参赛',
    },
    page: '/pages/detail/detail?id=ht-demo',
    data: {
      thing1: { value: 'HackerTrip AI Hackathon' },
      thing2: { value: '深圳 / 混合' },
      thing3: { value: '适合 AI Builder 参赛' },
    },
  },
});
```

`data` 里的 `thing1`、`thing2`、`thing3` 必须替换成你在微信后台模板中实际选择的关键词。

## 8. 官方文档

- `wx.requestSubscribeMessage`: https://developers.weixin.qq.com/miniprogram/dev/api/open-api/subscribe-message/wx.requestSubscribeMessage.html
- `subscribeMessage.send`: https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-message-management/subscribe-message/sendMessage.html
- 订阅消息能力说明: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html
