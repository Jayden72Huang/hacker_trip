# Codex 任务：8 页终审（精简·只评分不建图）

对照文档，对 `effect-mockups/v6-warm-purple/` 的 8 张 PNG（已在 Figma「01 效果图」）逐页终审。**只产出一份评审 md，不要新建 Figma 页、不要重渲染**（除非某页 <90 才在 generate-v6-warm-purple.ts 修）。

## 对照文档
- 页面简报：`/Users/jaydenworkplace/Desktop/hacker_trip/hackertrip-miniprogram/design/hifi/page-specs.md`
- 设计规范：`/Users/jaydenworkplace/Desktop/hacker_trip/hackertrip-miniprogram/design/hifi/hackertrip-design-system.md`
- PRD（§12 流转/§13 状态/§25 intent/§26 Agent）：`/Users/jaydenworkplace/Desktop/hacker_trip/hackertrip-miniprogram/design/hifi/hackertrip-product-requirements.md`

## 逐页三维评分（总分100，要求≥90）
1. **交互逻辑**：关键交互、跳转、AI intent 入口、状态是否齐全清晰，对得上 page-specs + §12
2. **规范符合度**：是否严格符合暖白#FAF9F5+紫#4D4DE9 + design-system 组件/字阶/间距
3. **视觉**：层级/对齐/留白/可读

**实查每张 PNG**（真的打开看）。<90 的页才在 generate-v6-warm-purple.ts 修复并重渲染、重推 Figma「01 效果图」对应帧。

## 产出
写 `effect-mockups/v6-warm-purple/FINAL-REVIEW.md`：每页三维分 + 总分 + 发现的交互/规范缺口 + 是否修过。完成后在终端打印一行 `DONE: 全部≥90` 或 `DONE: 以下页<90 [...]`。
