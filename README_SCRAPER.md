# 🎯 HackerTrip 黑客松爬虫系统

专为中国黑客松信息管理设计的智能后台系统。

## 🌟 功能特性

### 1. **URL 智能爬取**
- 输入任意黑客松网站 URL，自动提取信息
- 支持平台：
  - ✅ DoraHacks (dorahacks.io)
  - ✅ 牛客网 (nowcoder.com)
  - ✅ 活动行 (huodongxing.com)
  - ✅ 通用网站（自动识别）

### 2. **文本智能解析**
- 粘贴或上传文本，自动提取结构化信息
- 支持格式：纯文本、TXT 文件
- 自动识别：活动名称、时间、地点、奖金、赛道等

### 3. **草稿箱管理**
- 所有爬取/解析的数据先保存到草稿箱
- 支持人工审核和编辑
- 完善后一键发布到正式数据

### 4. **数据质量评分**
- 自动计算数据完整度（置信度）
- 高亮显示缺失字段
- 智能建议补充内容

### 5. **Google 自动检索**
- 通过 Google Custom Search API 批量检索黑客松活动链接
- 一键爬取并保存为草稿，支持平台筛选与时间范围

### 6. **封面海报生成**
- 在草稿编辑器中自动生成海报封面
- 支持主题配色切换与 SVG/PNG 下载

## 📁 项目结构

```
hacker_trip/
├── app/
│   ├── admin/                    # 后台管理页面
│   │   ├── page.tsx             # 主页面
│   │   └── components/          # UI 组件
│   │       ├── URLScraper.tsx   # URL 爬取组件
│   │       ├── TextUploader.tsx # 文本上传组件
│   │       ├── DraftList.tsx    # 草稿箱列表
│   │       └── HackathonEditor.tsx # 编辑器
│   └── api/                     # API 路由
│       ├── scrape/route.ts      # URL 爬取接口
│       ├── parse-text/route.ts  # 文本解析接口
│       └── drafts/route.ts      # 草稿箱 CRUD
├── scrapers/                    # 爬虫核心
│   ├── core/
│   │   ├── types.ts            # 类型定义
│   │   └── base-scraper.ts     # 爬虫基类
│   ├── sites/
│   │   ├── generic.ts          # 通用爬虫
│   │   └── dorahacks-cn.ts     # DoraHacks 爬虫
│   └── utils/
│       └── scraper-factory.ts  # 爬虫工厂
└── data/
    ├── hackathons.ts           # 正式数据
    └── drafts.json             # 草稿箱数据
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

已安装的爬虫相关依赖：
- `axios` - HTTP 请求
- `cheerio` - HTML 解析
- `puppeteer` - 浏览器自动化（处理 JS 渲染的网站）
- `zod` - 数据验证
- `date-fns` - 日期处理

### 1.5 配置 Google API（可选）

在 `.env.local` 中添加以下变量：

```
GOOGLE_CSE_API_KEY=your_google_custom_search_api_key
GOOGLE_CSE_CX=your_custom_search_engine_id
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问后台

打开浏览器访问：
```
http://localhost:3000/admin
```

## 📝 使用指南

### 方式 1：URL 爬取

1. 在「URL 爬取」标签页输入黑客松网站链接
2. 点击「开始爬取」
3. 系统自动提取信息并显示结果
4. 数据自动保存到草稿箱

示例 URL：
```
https://dorahacks.io/zh/hackathon/xxx
https://www.nowcoder.com/activity/xxx
https://www.huodongxing.com/event/xxx
```

### 方式 2：文本解析

1. 在「文本解析」标签页粘贴或上传文本
2. 点击「开始解析」
3. 系统智能提取结构化信息
4. 数据自动保存到草稿箱

示例文本格式：
```
2024 北京 AI 黑客松
时间: 3月15日-16日
地点: 中关村创业大街
奖金: ¥50,000
形式: 线下
主题: 人工智能与大模型应用

简介:
聚焦 AI 大模型应用创新...

赛道:
1. AI 工具与效率提升
2. AI + 教育创新
```

### 方式 3：草稿箱管理

1. 在「草稿箱」标签页查看所有待审核数据
2. 点击任意草稿进入编辑器
3. 完善和修改信息
4. 保存草稿或直接发布

### 方式 4：Google 自动检索

1. 进入「Google 检索」标签页
2. 输入关键词（如“AI 黑客松 报名 2026”）
3. 选择地区/时间范围/平台筛选
4. 点击「一键爬取」或「批量爬取」生成草稿

### 方式 5：封面海报

1. 在草稿箱中打开任意草稿
2. 在「封面海报」区自动生成预览
3. 切换主题后下载 SVG/PNG

## 🎨 数据字段说明

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| name | ✅ | 活动名称 | "2024 北京 AI 黑客松" |
| shortName | - | 短名称 | "北京 AI" |
| dateRange | ✅ | 时间范围 | "Mar 15-16" |
| city | ✅ | 城市 | "北京" |
| venue | - | 场地 | "中关村创业大街" |
| prizePool | - | 奖金 | "¥50,000" |
| teams | - | 参赛队伍 | "50 组" |
| format | ✅ | 形式 | "offline" / "online" / "hybrid" |
| theme | - | 主题 | "人工智能" |
| summary | - | 简介 | "聚焦 AI 大模型..." |
| website | - | 官网 | "https://..." |
| tracks | - | 赛道 | [{ title, description }] |
| agenda | - | 日程 | [{ title, time, detail }] |

## 🔧 扩展开发

### 添加新平台爬虫

1. 创建新的爬虫类：

```typescript
// scrapers/sites/your-platform.ts
import { BaseScraper } from '../core/base-scraper';

export class YourPlatformScraper extends BaseScraper {
  protected getPlatformName(): string {
    return 'Your Platform';
  }

  protected async parse(html: string, url: string): Promise<Partial<any>> {
    const $ = cheerio.load(html);

    return {
      name: this.extractText($, '.event-title'),
      dateRange: this.extractText($, '.event-date'),
      // ... 其他字段
    };
  }
}
```

2. 注册到工厂类：

```typescript
// scrapers/utils/scraper-factory.ts
import { YourPlatformScraper } from '../sites/your-platform';

static createScraper(url: string): BaseScraper {
  const domain = this.extractDomain(url);

  if (domain.includes('your-platform')) {
    return new YourPlatformScraper();
  }

  // ...
}
```

### 自定义文本解析规则

编辑 [app/api/parse-text/route.ts](app/api/parse-text/route.ts) 中的解析函数：

```typescript
function extractName(text: string, lines: string[]): string {
  // 添加自定义规则
}
```

## 📊 API 接口

### POST /api/scrape
爬取 URL 并提取信息

**请求体：**
```json
{
  "url": "https://example.com/hackathon"
}
```

**响应：**
```json
{
  "success": true,
  "data": { /* 黑客松数据 */ },
  "platform": "DoraHacks",
  "confidence": 0.85
}
```

### POST /api/parse-text
解析文本并提取信息

**请求体：**
```json
{
  "text": "活动文本内容..."
}
```

### GET /api/drafts
获取所有草稿

### POST /api/drafts
创建草稿

### PUT /api/drafts
更新草稿

### DELETE /api/drafts?draftId=xxx
删除草稿

## ⚠️ 注意事项

### 法律合规
- ✅ 仅用于个人学习和非商业用途
- ✅ 遵守网站的 robots.txt 规则
- ✅ 控制请求频率，避免过载
- ❌ 不得用于商业盈利（除非获得授权）

### 数据准确性
- 爬虫提取的数据可能不完整或不准确
- **务必在草稿箱中人工审核和完善**
- 定期验证已发布的数据

### 反爬虫
- 某些网站可能有反爬虫机制
- 爬取失败时可以尝试：
  - 使用文本解析代替
  - 手动复制内容后粘贴解析
  - 联系平台获取 API 权限

## 🐛 常见问题

### Q1: 爬取失败怎么办？
A:
1. 检查 URL 是否正确
2. 尝试使用「文本解析」
3. 手动复制网页内容后粘贴解析

### Q2: 数据不完整？
A:
1. 查看置信度评分
2. 在草稿箱中手动补充
3. 保存后再发布

### Q3: 如何发布草稿？
A:
目前需要手动操作：
1. 在草稿箱编辑完善信息
2. 点击「发布」（提示手动添加到 hackathons.ts）
3. 或连接数据库实现自动发布

### Q4: 支持哪些网站？
A:
- 专门适配：DoraHacks
- 通用支持：任何包含黑客松信息的网页
- 建议：先测试爬取效果，不理想则用文本解析

## 🎯 未来计划

- [ ] 集成更多中国黑客松平台
- [ ] 使用 LLM 进一步提升解析准确率
- [ ] 连接数据库实现自动发布
- [ ] 添加定时任务自动爬取更新
- [ ] 支持批量导入（Excel/CSV）
- [ ] 数据去重和相似度检测
- [ ] 图片识别和 OCR 支持

## 📄 许可证

MIT License

---

**开发者**: HackerTrip Team
**更新时间**: 2024-02
**问题反馈**: [GitHub Issues](https://github.com/your-repo/issues)
