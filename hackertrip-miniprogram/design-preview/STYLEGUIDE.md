# HackerTrip · Cyber-Mint 设计规范 (v2)

> 从 3 张赛事海报参考图提取，用于 HackerTrip 小程序的视觉重构。
> 配套预览：`index.html`（浏览器）｜Figma：https://www.figma.com/design/LU3ctCktpTPAASsXt6HbPO

---

## 1. 设计理念

**关键词**：深空黑客松 · 赛博科技 · 荧光生长

| 维度 | 主张 |
|------|------|
| 氛围 | 纯黑深空底，营造"算力 / 星空 / 终端"的科技感 |
| 焦点 | 薄荷青→电光绿荧光作为唯一主强调色，克制使用，只点亮关键信息（标题、CTA、数据、当前进度） |
| 节奏 | 大字号粗体中文标题 + 等宽数字，刚柔对比 |
| 细节 | 点阵发光球、像素三角、十字星点 —— 呼应"代码 / 像素 / 数据流" |

设计禁忌：**不要**浅色/白底、不要圆润可爱风、不要多彩撞色。荧光绿是稀缺资源，一屏内高亮元素 ≤ 3 处。

---

## 2. 色彩系统

### 2.1 基础色
| Token | 值 | 用途 |
|-------|-----|------|
| `--bg` | `#050608` | 页面主背景（深空黑） |
| `--bg-2` | `#0a0d12` | 次级背景 |
| `--surface` | `#0c1318` | 高亮卡片实底（资料卡/正在关注卡） |
| `--surface-hero` | `#0b1116` | Hero 卡实底 |

### 2.2 强调色
| Token | 值 | 用途 |
|-------|-----|------|
| `--mint` | `#5FFFC8` | 主强调·电光绿（高亮、CTA、当前态） |
| `--cyan` | `#4DE1FF` | 次强调·薄荷青（数字、链接、辅助高亮） |
| `--violet` | `#7C5DFF` | 点缀（仅 Haki AI 等 AI 相关场景） |
| `--on-mint` | `#04140F` | 荧光底上的文字色（近黑墨绿） |

### 2.3 文字色
| Token | 值 | 用途 |
|-------|-----|------|
| `--ink` | `#EAF3F1` | 主文字 |
| `--ink-dim` | `#8A99A0` | 次文字/描述 |
| `--ink-faint` | `#525E66` | 弱文字/标签/占位 |

### 2.4 透明度叠加（在深色底上构建层次的核心手法）
| 场景 | 值 |
|------|-----|
| 普通卡片填充 | `rgba(255,255,255,0.028)` |
| 卡片边框 | `rgba(255,255,255,0.07)` |
| 高亮卡边框（青光） | `rgba(95,255,220,0.14)` |
| chip 选中底 | `rgba(95,255,200,0.06~0.12)` |
| chip 选中边 | `rgba(95,255,200,0.18)` |
| 分隔线 | `rgba(255,255,255,0.07)` |
| 小标题装饰线 | `rgba(95,255,220,0.18)` |

### 2.5 渐变
```
主渐变 grad-mint:  linear 100° #5FFFC8 → #4DE1FF
AI 渐变 grad-ai:   linear 100° rgba(124,93,255,.16) → rgba(77,225,255,.10)
光晕 radial-glow:  radial #4DE1FF(0.10~0.25) → transparent
```
用途：Logo、CTA 按钮、当前进度图标、TabBar 高亮图标、标题局部字（"黑客松"）、头像底。

---

## 3. 字体系统

| 角色 | 字体族 | 说明 |
|------|--------|------|
| 中文 | **Noto Sans SC**（落地小程序用 PingFang SC / 系统字） | 标题用 Black/Bold，正文 Regular/Medium |
| 数字 / 日期 / 标签 | **JetBrains Mono**（等宽） | 时间轴、奖金、统计数字、英文 kicker |

### 字阶（rpx 为小程序单位，约 = px×2）
| 名称 | px | 字重 | 用途 |
|------|----|----|------|
| Display | 27 | Black | Hero 主标题「发现黑客松」 |
| H1 | 20 | Black | 卡片大标题「正在关注赛事名」 |
| H2 | 17 | Bold | 区块小标题「精选推荐」 |
| Title | 15 | Bold | 卡片标题、列表项标题 |
| Body | 13 | Regular | 正文 |
| Caption | 11–12.5 | Regular | 描述、副文案 |
| Label | 9.5–11 | Mono Regular | 标签、kicker、时间 |
| Stat | 21 | Mono Medium | 数据指标数字 |

字间距：英文 kicker / Label 加 `letterSpacing: 1~2px` 提升科技感。
行高：多行正文 `lineHeight ≈ 字号 × 1.5`。

---

## 4. 间距 · 圆角 · 描边

### 间距（8 基准）
`4 / 8 / 12 / 14 / 16 / 20 / 22` —— 页面左右安全边距 **20**，卡片内边距 **16~22**，区块间距 **20~22**。

### 圆角
| 元素 | 半径 |
|------|------|
| 手机屏/大卡片 | 22–24 |
| 普通卡片 | 16–18 |
| 按钮/输入框 | 13 |
| chip/小图标容器 | 8–10 |
| pill 标签 | 99（全圆） |

### 描边
统一 `1px`，颜色见 §2.4。高亮卡用青光边 `rgba(95,255,220,0.14)`，普通卡用白色 `0.07`。

---

## 5. 光效 · 阴影

**Glow（发光）= 本风格灵魂**，用 `drop-shadow`（offset 0）模拟霓虹：
```
glow-mint:   shadow 0 0 14~18px rgba(95,255,200,0.45)
glow-strong: shadow 0 0 8px  rgba(95,255,200,0.60)   // TabBar 选中图标/未读点
```
使用范围：Logo、CTA、当前进度图标、头像、TabBar 选中态、未读红点。
**不要**给普通卡片加发光，只给"活跃/强调"元素加。

无传统投影。深色卡片靠**填充明度差 + 1px 边框**区分层级，不靠阴影。

---

## 6. 标志性装饰元素

| 元素 | 实现 | 用途 |
|------|------|------|
| **点阵发光球** | radial 渐变环（透明芯 + 青绿光环）+ 实底芯球 + glow | Hero / 高亮卡右上角的"算力球" |
| **像素三角** `▸ ◂` | Mono 字符 + mint 色，包裹小标题 | 所有区块小标题 |
| **十字星点** `+` | Mono 字符，mint 色，opacity 0.5 | 卡片角落点缀（疏密随机） |
| **顶部光晕** | radial cyan 0.10 → transparent | 每屏顶部弥散冷光 |
| **渐变竖条** | 3px 宽 grad-mint + glow | 列表卡左侧"进行中"指示 |
| **点阵网格底** | 18px 网格的微点（HTML 版） | 屏幕背景肌理 |

---

## 7. 组件规范

### 7.1 区块小标题
`▸（mint）+ 标题（H2 Bold ink）+ ◂（mint）+ 渐隐细线（flex 撑满，mint 0.18）`，上 padding 20–22，下 12。

### 7.2 卡片（两类）
- **普通卡**：填充 `white 0.028`，边 `white 0.07`，圆角 16–18，内距 16。
- **高亮卡**（Hero/正在关注/资料卡）：实底 `#0c1318`，青光边，圆角 22，右上角嵌发光球。

### 7.3 Chip / Pill
- 未选中：底 `white 0.04`，边 `white 0.07`，Mono 文字 `--ink-dim`。
- 选中：底 `mint 0.06~0.12`，边 `mint 0.18`，文字 `--cyan`，可前置 5px mint 圆点。

### 7.4 主按钮 CTA
grad-mint 满底 + glow-mint，文字 `--on-mint` Bold，圆角 13，居中。次按钮：透明底 + mint 0.18 边 + mint 文字。

### 7.5 时间轴（赛程）
左列：30×30 图标容器（完成/当前 = grad-mint+glow；未来 = white 0.04 底+灰图标）+ 1px 连接竖线（mint 0.18）。
右列：阶段名（当前态 mint Bold + "进行中"pill）+ Mono 日期（当前/完成 cyan，未来 faint）。

### 7.6 消息卡
左 tag（按级别：截止=mint / 匹配=cyan / 系统=灰）+ 标题 Title + 描述 Caption + 右上 Mono 时间 + 未读 mint 发光点。

### 7.7 资料卡
头像（grad-mint 圆角方块+glow）+ 昵称 H1 + 角色 Caption + 技能 Mono cyan + 编辑按钮；下方 1px 分隔线 + 3 列数据指标（Stat 数字 mint + 标签 faint）。

### 7.8 TabBar
高 74，底 `#070a0d 0.96` + 顶部 1px 边 + 毛玻璃。4 项：图标 21px + 文字 10.5px。选中 = mint + 图标 glow；未选 = `--ink-faint`。

---

## 8. 小程序落地（wxss 变量映射）

```css
page {
  --bg:#050608; --surface:#0c1318;
  --mint:#5fffc8; --cyan:#4de1ff; --violet:#7c5dff; --on-mint:#04140f;
  --ink:#eaf3f1; --ink-dim:#8a99a0; --ink-faint:#525e66;
  --card:rgba(255,255,255,.028); --line:rgba(255,255,255,.07);
  --line-mint:rgba(95,255,220,.14); --chip-on:rgba(95,255,200,.12);
  --grad-mint:linear-gradient(100deg,#5fffc8,#4de1ff);
  --glow-mint:0 0 16rpx rgba(95,255,200,.45);
}
```
落地注意：
1. 小程序中文字体走系统（PingFang SC），数字/日期用 `font-family: 'JetBrains Mono', Menlo, monospace` 兜底。
2. `box-shadow` 模拟 glow；`radial-gradient` 做发光球（background-image，勿用大图直出 → 见项目性能踩坑）。
3. 渐变文字用 `background:var(--grad-mint); -webkit-background-clip:text; color:transparent`。
4. 一屏高亮元素 ≤ 3，保持荧光稀缺感。
