# Hacker Trip 项目规则

## 项目概况

- **技术栈**: Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript 5 + Drizzle ORM + Neon DB
- **部署**: Cloudflare (OpenNext)
- **认证**: next-auth v5 (GitHub OAuth)
- **语言**: 中文为主，品牌名/技术术语保留英文

---

## UI/设计规范（必须遵守）

### 主题色系
本项目使用**深色主题**，所有 UI 修改必须遵循以下配色：

- **背景主色**: `#05060a`（body）/ `#0a0a0a`（dark mode variable）
- **前景文字**: `#ededed`
- **Accent 紫**: `#7c5dff`（var(--accent-1)）
- **Accent 粉紫**: `#c759ff`（var(--accent-2)）
- **Accent 青**: `#4de1ff`（var(--accent-3)）
- **卡片背景**: `rgba(255, 255, 255, 0.04)`（var(--card)）
- **边框**: `rgba(255, 255, 255, 0.08)`（var(--border)）
- **玻璃效果**: `rgba(255, 255, 255, 0.06)`（var(--glass)）

### 设计原则
- **绝对不要**使用浅色/白色主题的设计风格
- 新组件必须与现有深色风格保持一致，先检查 `app/globals.css` 中的 CSS 变量
- 使用 `.glass` / `.glow` / `.shimmer` 等现有工具类，避免重复定义
- 字体使用 Sora 字体族（已在项目中配置）

### 动画/可见性检查
- 实现动画组件（如 opacity 过渡、scroll 效果）后，**必须确认文字可见**
- 检查 `opacity: 0` 初始状态是否有对应的显示逻辑
- 检查 gradient/mask 是否会遮挡文字内容
- 避免 CSS 继承导致的意外隐藏

---

## 布局变更流程

当用户请求修改 UI 布局或添加新元素时：
1. **先确认位置**：描述你打算将元素放在哪个组件的哪个位置，等用户确认后再动手
2. **说明影响范围**：列出会修改哪些文件
3. **参考现有组件**：优先复用项目中已有的组件和样式模式

---

## Next.js 配置注意事项

### 图片域名
- 添加外部图片源时，**立即**更新 `next.config.ts` 的 `images.remotePatterns`
- 当前已配置：`googleusercontent.com`、`avatars.githubusercontent.com`
- 使用 `<Image>` 组件时必须确认域名已注册

### 环境变量
- **绝对不要**修改 `.env.local` 文件，除非用户明确要求
- 不要在代码中硬编码密钥或敏感信息
- 新增环境变量时提醒用户手动配置

---

## 代码规范

### 文件组织
- 页面文件: `app/[route]/page.tsx`
- 组件: 就近放置在使用它的路由目录中，或 `components/` 共享目录
- 数据库: `db/` 目录（schema、migrations）

### TypeScript
- 优先使用 `interface` 定义组件 props
- 使用严格类型，避免 `any`
- 服务端组件默认，客户端组件需标注 `"use client"`

### Tailwind CSS
- 优先使用 Tailwind 工具类，避免内联 style
- 自定义样式写入 `globals.css` 并使用 CSS 变量
- 响应式设计使用 Tailwind 断点（sm/md/lg/xl）

---

## 工作流程规范

### 复杂任务（>3 个文件的改动）
1. 先进入 Plan Mode 研究代码库
2. 给出实现方案让用户确认
3. 确认后再开始编码

### 任务拆分
- 不要一次性实现多个不相关的功能
- 每完成一个功能点先展示结果，确认后再继续下一个

### 部署前检查
- 确保 `npm run build` 无报错
- 确保没有意外修改 `.env.local`
- 确保新增的外部图片域名已配置

---

## 常见陷阱（历史问题记录）

1. **主题色搞错**: 不要用 Google 风格的蓝白配色，本项目是深紫+青色的暗黑风格
2. **ScrollFloat 不可见**: opacity 动画 + gradient 继承 = 文字消失，实现前检查
3. **图片域名未配置**: 添加 GitHub 头像等外部图片后 app crash
4. **布局位置放错**: "时间线旁边"≠"标题行右侧"，先确认再动手
5. **z-index 冲突**: 修改层叠顺序前先检查 navbar 和 grid-bg 的 z-index
