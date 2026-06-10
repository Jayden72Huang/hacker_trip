/**
 * LLM 结构化提取黑客松信息
 * 将 Markdown 文本通过 LLM 提取为结构化的 Hackathon 数据
 */

import type { Hackathon } from '@/scrapers/core/types';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const EXTRACTION_PROMPT = `你是一个专业的黑客松信息提取器。从给定的网页内容中提取黑客松/编程马拉松赛事信息。

严格按以下 JSON 格式输出，不要输出任何其他内容：

{
  "name": "活动名称",
  "dateRange": "日期范围，如 2025年3月15日-17日",
  "city": "城市名",
  "country": "国家，默认中国",
  "venue": "具体场地",
  "prizePool": "奖金池，如 ¥100,000",
  "teams": "参赛队伍/人数",
  "format": "offline 或 online 或 hybrid",
  "theme": "主题标签，如 AI、Web3",
  "summary": "一句话简介（50字内）",
  "tracks": [{"title": "赛道名", "description": "赛道描述"}],
  "agenda": [{"title": "环节名", "time": "时间", "detail": "详情"}],
  "organizers": [{"name": "主办方名称", "url": "主办方官网链接（如有）"}],
  "sponsors": [{"name": "赞助商名称", "url": "赞助商官网链接（如有）", "logo": "logo图片完整URL（页面中真实存在时才填）", "tier": "platinum/gold/silver/bronze（页面明确标注时才填）"}]
}

规则：
- 如果某个字段在内容中找不到，设为空字符串或空数组
- 日期尽量使用中文格式
- city 只填城市名，不要省份
- format 根据内容判断：提到线下/现场=offline，提到线上/远程=online，两者都有=hybrid
- tracks 和 agenda 如果没有明确信息就返回空数组
- sponsors 只提取明确标注为赞助商/合作伙伴/支持方的公司，logo 必须是页面中真实存在的图片 URL，不要猜测
- 只返回 JSON，不要任何解释文字`;

export interface ExtractionResult {
  success: boolean;
  data?: Partial<Hackathon>;
  error?: string;
  tokensUsed?: number;
}

/**
 * 使用 LLM 从 Markdown 内容提取黑客松信息
 */
export async function extractHackathonFromMarkdown(
  markdown: string,
  apiKey?: string
): Promise<ExtractionResult> {
  const key = apiKey || ANTHROPIC_API_KEY;
  if (!key) {
    return { success: false, error: '未配置 ANTHROPIC_API_KEY' };
  }

  // 截断过长的内容（避免 token 浪费）
  const truncated = markdown.slice(0, 15000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `${EXTRACTION_PROMPT}\n\n---\n\n以下是网页内容：\n\n${truncated}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { success: false, error: `Anthropic API 错误: ${response.status} - ${errText}` };
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';
    const tokensUsed = result.usage?.output_tokens || 0;

    // 提取 JSON（处理可能的 markdown 代码块包裹）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'LLM 未返回有效 JSON', tokensUsed };
    }

    const data = JSON.parse(jsonMatch[0]) as Partial<Hackathon>;
    return { success: true, data, tokensUsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : '提取失败';
    return { success: false, error: message };
  }
}
