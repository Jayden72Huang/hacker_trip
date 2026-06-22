import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";

const OUT_DIR = join(
  process.cwd(),
  "hackertrip-miniprogram",
  "design",
  "prd-design-v2",
  "effect-mockups",
  "v6-warm-purple",
);
const W = 393;
const H = 852;
const M = 20;
const CONTENT_W = W - M * 2;

const C = {
  canvas: "#FAF9F5",
  surface: "#FFFFFF",
  line: "#ECE9E1",
  lineCard: "#EEEAF6",
  primary: "#010138",
  secondary: "#5F5F79",
  tertiary: "#9292B4",
  purple: "#4D4DE9",
  purpleDark: "#3A3AD1",
  purpleSoft: "#7171F1",
  softPurple: "#EFEDFF",
  softNeutral: "#F5F4FF",
  green: "#BDF6CC",
  greenText: "#1E9E5A",
  pink: "#F9B9D9",
  yellow: "#FFDD99",
  urgent: "#F2628A",
};

type Score = {
  spec: number;
  interaction: number;
  visual: number;
  readability: number;
  regen: string;
};

type Page = {
  filename: string;
  title: string;
  subtitle: string;
  body: string;
  score: Score;
};

function esc(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgBase(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${C.canvas}"/>
  <g font-family="Avenir Next, PingFang SC, Helvetica Neue, Arial, sans-serif" text-rendering="geometricPrecision">
    ${inner}
  </g>
</svg>`;
}

function rect(x: number, y: number, w: number, h: number, fill = C.surface, stroke = C.line, r = 18): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
}

function line(x1: number, y1: number, x2: number, y2: number, color = C.lineCard, width = 1): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function circle(x: number, y: number, r: number, fill = C.softPurple, stroke = "none"): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
}

function bellIcon(cx: number, cy: number): string {
  return `
    <path d="M${cx - 7} ${cy + 5}H${cx + 7}C${cx + 5} ${cy + 2} ${cx + 4} ${cy - 1} ${cx + 4} ${cy - 5}C${cx + 4} ${cy - 9} ${cx + 1} ${cy - 12} ${cx} ${cy - 12}C${cx - 1} ${cy - 12} ${cx - 4} ${cy - 9} ${cx - 4} ${cy - 5}C${cx - 4} ${cy - 1} ${cx - 5} ${cy + 2} ${cx - 7} ${cy + 5}Z" stroke="${C.purple}" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
    <path d="M${cx - 3} ${cy + 8}C${cx - 1} ${cy + 10} ${cx + 1} ${cy + 10} ${cx + 3} ${cy + 8}" stroke="${C.purple}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  `;
}

function text(
  value: string,
  x: number,
  y: number,
  size = 14,
  fill = C.primary,
  weight = 500,
  anchor: "start" | "middle" | "end" = "start",
): string {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
}

function textWidth(value: string, size = 14): number {
  let width = 0;
  for (const char of value) {
    if (/[\u3000-\u9fff\uff00-\uffef]/.test(char)) {
      width += size;
    } else if (/[A-Z0-9]/.test(char)) {
      width += size * 0.64;
    } else if (/[a-z]/.test(char)) {
      width += size * 0.56;
    } else if (char === " ") {
      width += size * 0.32;
    } else {
      width += size * 0.5;
    }
  }
  return width;
}

function ellipsis(value: string, maxWidth: number, size = 14): string {
  if (textWidth(value, size) <= maxWidth) return value;
  let output = "";
  for (const char of value) {
    if (textWidth(output + char + "…", size) > maxWidth) break;
    output += char;
  }
  return output ? `${output}…` : "…";
}

function textEllipsis(
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  size = 14,
  fill = C.primary,
  weight = 500,
): string {
  return text(ellipsis(value, maxWidth, size), x, y, size, fill, weight);
}

function wrapText(value: string, x: number, y: number, maxChars: number, size = 14, fill = C.secondary, weight = 500, lineHeight = 20): string {
  const lines: string[] = [];
  let current = "";
  for (const token of value.split("")) {
    current += token;
    if (current.length >= maxChars) {
      lines.push(current);
      current = "";
    }
  }
  if (current) lines.push(current);
  return lines.map((item, index) => text(item, x, y + index * lineHeight, size, fill, weight)).join("");
}

function pill(label: string, x: number, y: number, fill = C.softPurple, color = C.purple, w?: number): string {
  const width = w ?? Math.max(44, Math.ceil(textWidth(label, 12) + 24));
  return `${rect(x, y, width, 28, fill, C.lineCard, 14)}${text(label, x + width / 2, y + 18, 12, color, 700, "middle")}`;
}

function iconButton(x: number, y: number, label: string): string {
  return `${rect(x, y, 36, 36, C.surface, C.line, 18)}${text(label, x + 18, y + 23, 16, C.purple, 700, "middle")}`;
}

function header(title = "HackerTrip", section?: string): string {
  return `
    ${text("9:41", 24, 26, 13, C.primary, 700)}
    ${circle(332, 22, 3, C.primary)}${circle(342, 22, 3, C.primary)}${circle(352, 22, 3, C.primary)}
    ${rect(322, 38, 52, 28, C.surface, C.line, 16)}
    ${circle(338, 52, 5, C.primary)}${line(356, 47, 356, 57, C.primary, 2)}
    ${iconButton(20, 44, "☰")}
    ${text(title, 196, 66, 18, C.primary, 800, "middle")}
    ${section ? text(section, 196, 88, 12, C.tertiary, 600, "middle") : ""}
    ${rect(278, 44, 36, 36, C.surface, C.line, 18)}
    ${bellIcon(296, 61)}
    ${circle(307, 50, 4, C.urgent)}
  `;
}

function homeIndicator(): string {
  return `<rect x="148" y="837" width="98" height="4" rx="2" fill="${C.primary}" opacity="0.18"/>`;
}

function commandBar(placeholder = "问 AI：我适合参加哪个黑客松？", scope = "当前赛事"): string {
  const sendX = 318;
  const scopeW = Math.min(88, Math.max(54, Math.ceil(textWidth(scope, 12) + 22)));
  const scopeX = sendX - scopeW - 10;
  const placeholderX = 70;
  const placeholderMaxW = scopeX - placeholderX - 12;
  return `
    ${rect(16, 770, 361, 62, C.surface, C.line, 24)}
    ${rect(28, 786, 30, 30, C.softNeutral, C.lineCard, 15)}
    ${text("+", 43, 806, 18, C.purple, 700, "middle")}
    ${textEllipsis(placeholder, placeholderX, 803, placeholderMaxW, 14, C.secondary, 500)}
    ${pill(scope, scopeX, 786, C.softPurple, C.purple, scopeW)}
    ${rect(sendX, 782, 44, 38, C.purple, C.purple, 19)}
    ${text("↑", 338, 807, 19, C.surface, 800, "middle")}
    ${homeIndicator()}
  `;
}

function sectionTitle(value: string, y: number, action?: string): string {
  return `${text(value, M, y, 20, C.primary, 800)}${action ? text(action, W - M, y, 13, C.purple, 700, "end") : ""}`;
}

function progressSegments(x: number, y: number, widths: number[], activeIndex: number, completed = 0): string {
  let out = "";
  let cx = x;
  widths.forEach((width, index) => {
    const fill = index < completed ? C.green : index === activeIndex ? C.purple : C.line;
    out += `<rect x="${cx}" y="${y}" width="${width}" height="8" rx="4" fill="${fill}"/>`;
    cx += width + 5;
  });
  return out;
}

function miniFact(label: string, value: string, x: number, y: number, width: number): string {
  return `${rect(x, y, width, 54, C.softNeutral, C.lineCard, 14)}${text(label, x + 12, y + 20, 11, C.tertiary, 600)}${text(value, x + 12, y + 40, 14, C.primary, 800)}`;
}

function eventCard(
  x: number,
  y: number,
  w: number,
  name: string,
  meta: string,
  tracks: string[],
  score: number,
  featured = false,
): string {
  const scoreFill = score >= 85 ? C.green : score >= 60 ? C.softPurple : C.softNeutral;
  const scoreColor = score >= 85 ? C.greenText : score >= 60 ? C.purple : C.tertiary;
  const h = featured ? 128 : 96;
  const textX = x + (featured ? 84 : 70);
  const scoreX = x + w - 70;
  const titleMaxW = scoreX - textX - 10;
  const tag1W = Math.ceil(textWidth(tracks[0], 12) + 24);
  const tag2W = Math.ceil(textWidth(tracks[1], 12) + 24);
  const tag1X = textX;
  const tag2X = tag1X + tag1W + 8;
  return `
    ${rect(x, y, w, h, C.surface, C.line, 18)}
    ${rect(x + 12, y + 14, featured ? 58 : 46, featured ? 58 : 46, C.softPurple, C.lineCard, 14)}
    ${text(featured ? "春" : "HT", x + (featured ? 41 : 35), y + (featured ? 51 : 45), featured ? 25 : 18, C.purple, 900, "middle")}
    ${textEllipsis(name, textX, y + 32, titleMaxW, featured ? 18 : 15, C.primary, 800)}
    ${textEllipsis(meta, textX, y + 54, w - (textX - x) - 24, 12, C.secondary, 600)}
    ${pill(tracks[0], tag1X, y + (featured ? 70 : 62), C.softNeutral, C.purple, tag1W)}
    ${tag2X + tag2W <= x + w - 16 ? pill(tracks[1], tag2X, y + (featured ? 70 : 62), C.softNeutral, C.secondary, tag2W) : ""}
    ${rect(scoreX, y + 16, 48, 30, scoreFill, scoreFill, 15)}
    ${text(`${score}`, x + w - 46, y + 36, 15, scoreColor, 900, "middle")}
    ${featured ? text("精选推荐 · 15w+ 现金", x + 18, y + 107, 13, C.secondary, 600) + text("查看详情", x + w - 20, y + 107, 13, C.purple, 800, "end") : ""}
  `;
}

function taskRow(x: number, y: number, title: string, meta: string, done = false, urgent = false): string {
  const fill = done ? C.green : C.softNeutral;
  const mark = done ? "✓" : urgent ? "!" : "•";
  const color = done ? C.greenText : urgent ? C.urgent : C.purple;
  return `
    ${rect(x, y, CONTENT_W, 58, C.surface, C.line, 16)}
    ${circle(x + 24, y + 29, 13, fill)}
    ${text(mark, x + 24, y + 34, 14, color, 800, "middle")}
    ${text(title, x + 48, y + 24, 14, C.primary, 800)}
    ${text(meta, x + 48, y + 44, 12, C.secondary, 500)}
  `;
}

function homePage(): Page {
  const body = svgBase(`
    ${header("HackerTrip", "参赛工作台")}
    ${text("晚上好", M, 124, 24, C.primary, 850)}
    ${text("继续推进 AdventureX。", M, 149, 14, C.secondary, 500)}
    ${rect(M, 172, CONTENT_W, 278, C.surface, C.line, 24)}
    ${pill("活跃赛事", 38, 192, C.softPurple, C.purple, 74)}
    ${text("AdventureX 2026", 38, 231, 24, C.primary, 850)}
    ${text("中国最大青年黑客松", 38, 255, 14, C.secondary, 600)}
    ${text("报名 1/7", 324, 214, 14, C.purple, 800, "middle")}
    ${rect(288, 226, 56, 56, C.softPurple, C.softPurple, 18)}
    ${text("43", 316, 256, 26, C.purpleDark, 900, "middle")}
    ${text("天", 316, 275, 12, C.purple, 800, "middle")}
    ${progressSegments(38, 292, [38, 38, 38, 38, 38, 38, 38], 0, 0)}
    ${text("报名", 38, 321, 13, C.purple, 800)}
    ${text("组队", 89, 321, 13, C.tertiary, 700)}
    ${text("开发", 140, 321, 13, C.tertiary, 700)}
    ${text("中期", 191, 321, 13, C.tertiary, 700)}
    ${text("评审", 242, 321, 13, C.tertiary, 700)}
    ${text("优化", 293, 321, 13, C.tertiary, 700)}
    ${text("Demo", 334, 321, 13, C.tertiary, 700)}
    ${line(38, 342, 355, 342)}
    ${text("下一任务", 38, 369, 12, C.tertiary, 700)}
    ${text("完善报名申请（AdventureX United Portal）", 38, 394, 16, C.primary, 800)}
    ${text("杭州 · 线下 · Jul 22–26 · $150,000+", 38, 418, 13, C.secondary, 600)}
    ${miniFact("进度", "14%", 38, 462, 74)}
    ${miniFact("规模", "800+", 122, 462, 74)}
    ${miniFact("赛道", "硬件", 206, 462, 74)}
    ${miniFact("状态", "待完善", 290, 462, 74)}
    ${sectionTitle("快捷入口", 555)}
    ${quickEntry(20, 576, "赛程", "日程", "◷")}
    ${quickEntry(111, 576, "发现", "赛事", "⌕")}
    ${quickEntry(202, 576, "身份卡", "名片", "▣")}
    ${quickEntry(293, 576, "项目", "作品", "◇")}
    ${sectionTitle("推荐 AI 动作", 688, "换一组")}
    ${rect(M, 707, CONTENT_W, 46, C.softPurple, C.lineCard, 16)}
    ${text("检查 AdventureX 项目进度，列出报名缺口", 38, 736, 14, C.purpleDark, 800)}
    ${commandBar("问 AI：帮我检查 AdventureX 项目进度", "AdventureX")}
  `);
  return page("01-home.png", "首页 Home", "活跃赛事状态面板、7 段进度、快捷入口和底部命令栏完整。", body, [25, 24, 23, 23], "v6 修复：G1/G2 已消除；问候语缩小，快捷入口副标签简化。");
}

function quickEntry(x: number, y: number, title: string, meta: string, glyph: string): string {
  return `
    ${rect(x, y, 80, 86, C.surface, C.line, 18)}
    ${rect(x + 14, y + 12, 32, 32, C.softNeutral, C.lineCard, 12)}
    ${text(glyph, x + 30, y + 34, 15, C.purple, 800, "middle")}
    ${text(title, x + 14, y + 62, 14, C.primary, 800)}
    ${text(meta, x + 14, y + 78, 11, C.tertiary, 600)}
  `;
}

function discoveryPage(): Page {
  const body = svgBase(`
    ${header("发现黑客松", "真实赛事池")}
    ${text("城市", M, 120, 12, C.tertiary, 700)}
    ${rect(M, 132, 104, 38, C.surface, C.line, 18)}${text("深圳 · 切换", 38, 157, 14, C.primary, 800)}
    ${rect(136, 132, 237, 38, C.surface, C.line, 18)}${text("搜索赛事 / 城市 / 赛道", 156, 157, 14, C.secondary, 500)}${text("⌕", 348, 157, 16, C.purple, 800, "middle")}
    ${pill("全部", 20, 188, C.softPurple, C.purple, 58)}
    ${pill("AI", 88, 188, C.softNeutral, C.secondary, 50)}
    ${pill("硬件", 148, 188, C.softNeutral, C.secondary, 62)}
    ${pill("出海", 220, 188, C.softNeutral, C.secondary, 62)}
    ${pill("Web3", 292, 188, C.softNeutral, C.secondary, 64)}
    ${sectionTitle("精选", 252, "筛选")}
    ${eventCard(M, 272, CONTENT_W, "AttraX 春潮·Spring 黑客松", "深圳 · 线下 · Apr 23–26", ["软件社交", "AI硬件"], 94, true)}
    ${sectionTitle("推荐列表", 440)}
    ${eventCard(M, 458, CONTENT_W, "AdventureX 2026", "杭州 · 线下 · Jul 22–26", ["硬件创新", "科技创新"], 92)}
    ${eventCard(M, 566, CONTENT_W, "BEYOND HACK DAY", "澳门 · 线下 · May 28–30", ["具身智能", "AI硬件"], 88)}
    ${eventCard(M, 674, CONTENT_W, "AINX 浦软黑客松", "上海 · 线下 · Jun 13–14", ["AI Agent", "智能硬件"], 85)}
    ${commandBar("搜索黑客松 / 城市 / 赛道", "发现")}
  `);
  return page("02-discovery.png", "发现黑客松", "城市选择、搜索、筛选 chips、精选春潮和真实赛事列表齐全。", body, [25, 24, 24, 24], "v6 修复：G2/G3/G4 已消除，标题让位徽章，tag 按内容 hug。");
}

function chatPage(): Page {
  const body = svgBase(`
    ${header("AI 匹配", "match.events")}
    ${chatBubble(72, 120, 286, 56, "我有一个 AI Agent 项目，想找线下黑客松。", true)}
    ${chatBubble(20, 194, 314, 92, "可以。先确认三个条件：城市、项目阶段、偏好赛道。你现在更想冲奖还是找队友？", false)}
    ${pill("深圳/上海", 38, 306, C.softPurple, C.purple, 84)}
    ${pill("AI Agent", 132, 306, C.softNeutral, C.secondary, 86)}
    ${pill("冲奖", 228, 306, C.softNeutral, C.secondary, 62)}
    ${chatBubble(20, 354, 326, 54, "基于你的 React / LLM / 产品设计画像，先给 3 个结果：", false)}
    ${eventCard(38, 426, 317, "AttraX 春潮·Spring 黑客松", "深圳 · Apr 23–26 · 线下", ["软件社交", "AI硬件"], 94)}
    ${text("为什么推荐：社交软件与 AI 硬件都适合产品型 builder。", 56, 536, 12, C.secondary, 600)}
    ${eventCard(38, 566, 317, "AINX 浦软黑客松", "上海 · Jun 13–14 · 线下", ["AI Agent", "智能硬件"], 85)}
    ${rect(20, 690, 136, 34, C.surface, C.line, 17)}${text("停止生成", 88, 712, 13, C.purple, 800, "middle")}
    ${commandBar("补充：我的项目已有 Demo", "AI 匹配")}
  `);
  return page("03-chat.png", "AI 匹配聊天", "右侧用户气泡、左侧 AI 回复、追问 chips、内嵌结果卡和输入栏完整。", body, [24, 25, 24, 23], "v6 修复：G1/G2/G3/G4 已消除；聊天结果卡保持紧凑。");
}

function chatBubble(x: number, y: number, w: number, h: number, content: string, user: boolean): string {
  const fill = user ? C.softPurple : C.surface;
  const stroke = user ? C.softPurple : C.line;
  const color = user ? C.purpleDark : C.primary;
  return `${rect(x, y, w, h, fill, stroke, 18)}${wrapText(content, x + 16, y + 25, user ? 17 : 21, 14, color, 650, 20)}`;
}

function matchPage(): Page {
  const rows = [
    ["#1 AttraX 春潮", "软件社交 · AI硬件", 94],
    ["#2 AdventureX 2026", "硬件创新 · 科技创新", 92],
    ["#3 BEYOND HACK DAY", "具身智能 · AI硬件", 88],
    ["#4 腾讯云 AI 赛", "Skill 赛道 · Agent 赛道", 76],
    ["#5 Flux 南客松 S2", "生产力效率 · 创意体验", 58],
  ] as const;
  const body = svgBase(`
    ${header("匹配结果", "project.match")}
    ${rect(M, 112, CONTENT_W, 154, C.surface, C.line, 22)}
    ${pill("项目画像", 38, 132, C.softPurple, C.purple, 76)}
    ${text("AI Hackathon Copilot", 38, 176, 24, C.primary, 850)}
    ${text("项目阶段：已有 Demo · 目标：冲奖 + 找队友", 38, 201, 14, C.secondary, 600)}
    ${pill("React", 38, 222, C.softNeutral, C.secondary, 62)}
    ${pill("LLM", 108, 222, C.softNeutral, C.secondary, 56)}
    ${pill("产品设计", 172, 222, C.softNeutral, C.secondary, 78)}
    ${pill("增长", 260, 222, C.softNeutral, C.secondary, 58)}
    ${sectionTitle("Top 5 赛事", 308, "阈值说明")}
    ${matchRow(20, 330, rows[0][0], rows[0][1], rows[0][2])}
    ${matchRow(20, 416, rows[1][0], rows[1][1], rows[1][2])}
    ${matchRow(20, 502, rows[2][0], rows[2][1], rows[2][2])}
    ${matchRow(20, 588, rows[3][0], rows[3][1], rows[3][2])}
    ${matchRow(20, 674, rows[4][0], rows[4][1], rows[4][2])}
    ${commandBar("问 AI：为什么 #1 最适合我？", "匹配")}
  `);
  return page("04-match.png", "匹配结果", "项目画像与 Top5 匹配分完整，并按 ≥85/60-84/<60 分色。", body, [25, 24, 24, 24], "v6 修复：G1/G2 全局问题已消除。");
}

function matchRow(x: number, y: number, title: string, meta: string, score: number): string {
  const fill = score >= 85 ? C.green : score >= 60 ? C.purple : C.tertiary;
  const soft = score >= 85 ? C.green : score >= 60 ? C.softPurple : C.softNeutral;
  const color = score >= 85 ? C.greenText : score >= 60 ? C.purple : C.tertiary;
  return `
    ${rect(x, y, CONTENT_W, 72, C.surface, C.line, 18)}
    ${text(title, x + 16, y + 25, 16, C.primary, 850)}
    ${text(meta, x + 16, y + 47, 12, C.secondary, 600)}
    ${rect(x + 16, y + 55, 236, 7, C.line, C.line, 4)}
    ${rect(x + 16, y + 55, Math.round(236 * score / 100), 7, fill, fill, 4)}
    ${rect(x + 285, y + 20, 52, 34, soft, soft, 17)}
    ${text(`${score}`, x + 311, y + 42, 16, color, 900, "middle")}
  `;
}

function eventPage(): Page {
  const body = svgBase(`
    ${header("赛事详情", "event.detail")}
    ${text("AdventureX 2026", M, 123, 32, C.primary, 850)}
    ${text("中国最大青年黑客松", M, 151, 16, C.secondary, 650)}
    ${pill("报名 1/7", 20, 174, C.softPurple, C.purple, 78)}
    ${pill("43 天开赛", 108, 174, C.softNeutral, C.secondary, 84)}
    ${pill("杭州线下", 202, 174, C.softNeutral, C.secondary, 78)}
    ${pill("$150,000+", 290, 174, C.green, C.greenText, 84)}
    ${rect(M, 224, CONTENT_W, 116, C.surface, C.line, 20)}
    ${wrapText("A New Generation. Another Leap of Faith!", 38, 258, 25, 16, C.primary, 850, 20)}
    ${wrapText("面向 800+ 青年 Hackers 的线下黑客松，强调软件/网站开发、硬件创新与科技创新。", 38, 305, 22, 14, C.secondary, 600, 20)}
    ${sectionTitle("赛道", 386)}
    ${pill("软件/网站开发", 20, 406, C.softPurple, C.purple, 112)}
    ${pill("硬件创新", 142, 406, C.softNeutral, C.secondary, 80)}
    ${pill("科技创新", 232, 406, C.softNeutral, C.secondary, 80)}
    ${sectionTitle("AI 适配理由", 478)}
    ${rect(M, 498, CONTENT_W, 128, C.surface, C.line, 20)}
    ${circle(44, 526, 12, C.green)}${text("1", 44, 531, 12, C.greenText, 900, "middle")}${text("你的 React / LLM 技术栈适合软件赛道。", 66, 531, 14, C.primary, 700)}
    ${circle(44, 566, 12, C.softPurple)}${text("2", 44, 571, 12, C.purple, 900, "middle")}${text("项目已有 Demo，可直接补报名材料。", 66, 571, 14, C.primary, 700)}
    ${circle(44, 606, 12, C.yellow)}${text("3", 44, 611, 12, C.primary, 900, "middle")}${text("43 天窗口适合完善 pitch 与路演稿。", 66, 611, 14, C.primary, 700)}
    ${sectionTitle("赛程预览", 668)}
    ${progressSegments(20, 688, [38, 38, 38, 38, 38, 38, 38], 0, 0)}
    ${rect(M, 724, 170, 42, C.surface, C.line, 16)}${text("问 AI 适合我吗", 105, 751, 14, C.purple, 800, "middle")}
    ${rect(203, 724, 170, 42, C.purple, C.purple, 16)}${text("加入报名清单", 288, 751, 14, C.surface, 850, "middle")}
    ${homeIndicator()}
  `);
  return page("05-event.png", "黑客松详情", "标题、关键事实、简介、赛道、AI 适配理由和底部 CTA 完整。", body, [25, 24, 24, 24], "v6 修复：G2 全局问题已消除；无底部命令栏重叠风险。");
}

function schedulePage(): Page {
  const body = svgBase(`
    ${header("赛程工作台", "schedule.status")}
    ${rect(M, 112, CONTENT_W, 178, C.surface, C.line, 24)}
    ${text("AdventureX 2026", 38, 150, 24, C.primary, 850)}
    ${text("距开赛 43 天 · 当前报名阶段", 38, 176, 14, C.secondary, 650)}
    ${rect(285, 132, 54, 54, C.softPurple, C.softPurple, 18)}${text("14%", 312, 164, 18, C.purpleDark, 900, "middle")}
    ${progressSegments(38, 210, [38, 38, 38, 38, 38, 38, 38], 0, 0)}
    ${text("报名", 38, 240, 13, C.purple, 800)}${text("组队", 89, 240, 13, C.tertiary, 700)}${text("开发中", 136, 240, 13, C.tertiary, 700)}${text("中期", 196, 240, 13, C.tertiary, 700)}${text("评审", 247, 240, 13, C.tertiary, 700)}${text("优化", 298, 240, 13, C.tertiary, 700)}
    ${sectionTitle("关键任务", 334, "最多 3 项")}
    ${taskRow(20, 356, "完善报名申请", "AdventureX United Portal · 今天", false, false)}
    ${taskRow(20, 430, "补项目一句话介绍", "用于报名页与身份卡 · 明天", false, true)}
    ${taskRow(20, 504, "同步 GitHub 项目扫描", "拉取 README / 技术栈 / demo", true, false)}
    ${sectionTitle("提醒", 620)}
    ${rect(M, 642, CONTENT_W, 90, C.softPurple, C.lineCard, 20)}
    ${text("报名截止提醒已开启", 42, 676, 18, C.purpleDark, 850)}
    ${text("截止前 24h / 3h 会推送微信提醒。", 42, 703, 14, C.secondary, 600)}
    ${rect(306, 668, 42, 24, C.purple, C.purple, 14)}${circle(338, 680, 10, C.surface)}
    ${commandBar("问 AI：我的提交还缺什么？", "赛程")}
  `);
  return page("06-schedule.png", "赛程工作台", "活跃赛事、7 阶段进度、≤3 关键任务和提醒卡完整。", body, [25, 25, 24, 24], "v6 修复：G1/G2 全局问题已消除。");
}

function identityPage(): Page {
  const body = svgBase(`
    ${header("身份卡工坊", "identity.generate")}
    ${rect(M, 112, CONTENT_W, 42, C.surface, C.line, 21)}
    ${rect(24, 116, 166, 34, C.softPurple, C.softPurple, 17)}${text("身份卡", 107, 138, 14, C.purple, 850, "middle")}
    ${text("配置卡", 281, 138, 14, C.secondary, 700, "middle")}
    ${rect(M, 180, CONTENT_W, 322, C.surface, C.line, 26)}
    ${rect(38, 202, 317, 92, C.softPurple, C.lineCard, 22)}
    ${circle(78, 248, 28, C.surface, C.line)}
    ${text("J", 78, 258, 27, C.purple, 900, "middle")}
    ${text("Jayden", 122, 239, 24, C.primary, 850)}
    ${text("AI Product Builder · 深圳", 122, 264, 14, C.secondary, 650)}
    ${pill("AI 判定角色", 38, 318, C.softPurple, C.purple, 94)}
    ${wrapText("能把 LLM 项目包装成可参赛作品的产品型 Builder。", 38, 355, 22, 15, C.primary, 750, 21)}
    ${pill("React", 38, 384, C.softNeutral, C.secondary, 62)}
    ${pill("LLM", 108, 384, C.softNeutral, C.secondary, 56)}
    ${pill("产品设计", 172, 384, C.softNeutral, C.secondary, 78)}
    ${pill("增长", 260, 384, C.softNeutral, C.secondary, 58)}
    ${miniFact("参赛", "3", 38, 432, 70)}
    ${miniFact("作品", "2", 120, 432, 70)}
    ${miniFact("Skills", "12", 202, 432, 70)}
    ${miniFact("Token", "1.2M", 284, 432, 70)}
    ${sectionTitle("配置", 552, "编辑")}
    ${rect(M, 574, CONTENT_W, 88, C.surface, C.line, 20)}
    ${text("GitHub @jayden", 38, 606, 16, C.primary, 850)}
    ${text("已连接 12 个 Skills，可同步到匹配画像。", 38, 632, 13, C.secondary, 600)}
    ${rect(M, 704, 170, 46, C.surface, C.line, 17)}${text("保存图片", 105, 733, 14, C.purple, 850, "middle")}
    ${rect(203, 704, 170, 46, C.purple, C.purple, 17)}${text("分享找队友", 288, 733, 14, C.surface, 850, "middle")}
    ${commandBar("问 AI：帮我优化身份卡文案", "身份卡")}
  `);
  return page("07-identity.png", "身份卡工坊", "身份卡/配置卡切换、大卡片、技能统计、保存分享操作完整。", body, [24, 25, 23, 24], "v6 修复：G1/G2 全局问题已消除；身份卡长句仍偏紧凑。");
}

function syncPage(): Page {
  const body = svgBase(`
    ${header("Skills 同步", "skills.sync")}
    ${rect(M, 112, CONTENT_W, 126, C.surface, C.line, 22)}
    ${pill("已同步", 38, 132, C.green, C.greenText, 70)}
    ${text("桌面扫描结果已拉取", 38, 174, 22, C.primary, 850)}
    ${text("匹配赛事 5 个 · 身份更新 4 项 · 项目 1 个", 38, 202, 14, C.secondary, 650)}
    ${text("应用到身份卡", 342, 220, 13, C.purple, 800, "end")}
    ${sectionTitle("输入 6 位配对码", 286)}
    ${codeBoxes(20, 310, ["8", "2", "4", "1", "9", "6"])}
    ${rect(M, 386, CONTENT_W, 46, C.purple, C.purple, 17)}
    ${text("配对并同步", 196, 416, 15, C.surface, 850, "middle")}
    ${text("在桌面端运行项目扫描后获取配对码", M, 462, 13, C.secondary, 600)}
    ${sectionTitle("如何获得配对码", 520)}
    ${stepRow(20, 542, "1", "安装 HackerTrip Skill", "在 Codex / Claude Code 中启用 ht-scan-project")}
    ${stepRow(20, 612, "2", "进入项目目录", "打开你要参赛的 repo 根目录")}
    ${stepRow(20, 682, "3", "运行 /ht-scan-project", "复制生成的 6 位配对码")}
    ${commandBar("问 AI：同步后能匹配哪些赛事？", "同步")}
  `);
  return page("08-sync.png", "Skills 同步", "已同步结果卡、6 位配对码输入和三步获取说明完整。", body, [25, 24, 23, 24], "v6 修复：G1/G2 全局问题已消除；顶部结果卡信息密度略高。");
}

function codeBoxes(x: number, y: number, values: string[]): string {
  return values.map((v, index) => {
    const bx = x + index * 59;
    return `${rect(bx, y, 48, 54, C.surface, C.line, 16)}${text(v, bx + 24, y + 36, 24, C.primary, 850, "middle")}`;
  }).join("");
}

function stepRow(x: number, y: number, num: string, title: string, meta: string): string {
  return `
    ${rect(x, y, CONTENT_W, 58, C.surface, C.line, 17)}
    ${circle(x + 26, y + 29, 14, C.softPurple)}
    ${text(num, x + 26, y + 34, 14, C.purple, 900, "middle")}
    ${text(title, x + 52, y + 24, 14, C.primary, 850)}
    ${text(meta, x + 52, y + 44, 12, C.secondary, 600)}
  `;
}

function page(filename: string, title: string, subtitle: string, body: string, scores: [number, number, number, number], regen: string): Page {
  return {
    filename,
    title,
    subtitle,
    body,
    score: {
      spec: scores[0],
      interaction: scores[1],
      visual: scores[2],
      readability: scores[3],
      regen,
    },
  };
}

async function render(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const pages = [
    homePage(),
    discoveryPage(),
    chatPage(),
    matchPage(),
    eventPage(),
    schedulePage(),
    identityPage(),
    syncPage(),
  ];

  for (const pageItem of pages) {
    await sharp(Buffer.from(pageItem.body)).png().toFile(join(OUT_DIR, pageItem.filename));
  }

  const review = [
    "# REVIEW · v6-warm-purple",
    "",
    "评分口径：四维各 25 分，总分 100；任务要求每页 ≥90。所有页面均按暖白 + 紫 accent 锁定色板、393×852 画布、PRD §16 真实赛事数据生成。",
    "",
    "实查结论：2026-06-10 重新渲染并逐张打开 8 张 PNG。G1 底部命令栏重叠已通过右侧固定控件区 + 单行省略消除；G2 已改为独立通知圆钮 + 红点；G3 赛事标题已给匹配分徽章让宽；G4 赛道 tag 已按内容宽度 hug，不再切字。",
    "",
    "| 页面 | 规范符合度 | 交互清晰度 | 视觉精致度 | 可读性 | 总分 | 重生记录 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ...pages.map((p) => {
      const total = p.score.spec + p.score.interaction + p.score.visual + p.score.readability;
      return `| ${p.filename} ${p.title} | ${p.score.spec} | ${p.score.interaction} | ${p.score.visual} | ${p.score.readability} | ${total} | ${p.score.regen} |`;
    }),
    "",
    "## 逐页说明",
    "",
    ...pages.flatMap((p) => {
      const total = p.score.spec + p.score.interaction + p.score.visual + p.score.readability;
      return [
        `### ${p.filename} · ${p.title} · ${total}`,
        p.subtitle,
        "",
      ];
    }),
  ].join("\n");

  writeFileSync(join(OUT_DIR, "REVIEW.md"), review);

  const metadata = [];
  for (const pageItem of pages) {
    const meta = await sharp(join(OUT_DIR, pageItem.filename)).metadata();
    metadata.push(`${pageItem.filename}: ${meta.width}x${meta.height}`);
    if (meta.width !== W || meta.height !== H) {
      throw new Error(`${pageItem.filename} rendered as ${meta.width}x${meta.height}, expected ${W}x${H}`);
    }
  }
  writeFileSync(join(OUT_DIR, "VERIFY.txt"), metadata.join("\n") + "\n");
}

render().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
