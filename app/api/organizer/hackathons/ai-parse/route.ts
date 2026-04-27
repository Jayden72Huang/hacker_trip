import { NextRequest, NextResponse } from 'next/server';
import { checkApprovedOrganizer } from '@/lib/auth-helpers';
import { chatCompletion } from '@/lib/llm';

export async function POST(request: NextRequest) {
  const authResult = await checkApprovedOrganizer();
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { text } = await request.json();

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: '文本内容太短，请提供更详细的黑客松信息' },
        { status: 400 }
      );
    }

    const result = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: `你是一个专业的黑客松信息提取助手。你的任务是从用户提供的原始文本中提取结构化的黑客松活动信息。

请严格按照以下 JSON 格式输出，所有字段都尽量从原文提取，提取不到的留空字符串或空数组：

{
  "name": "黑客松全称",
  "shortName": "简称（2-6个字）",
  "city": "举办城市",
  "country": "国家，默认中国",
  "venue": "具体场地名称",
  "startDate": "开始日期 YYYY-MM-DD 格式",
  "endDate": "结束日期 YYYY-MM-DD 格式",
  "mode": "online 或 offline 或 hybrid",
  "theme": "主题标语（一句话）",
  "summary": "活动简介（2-3句话概括）",
  "prizePool": "奖金池（如 ¥500,000 或 $50,000）",
  "teams": "参赛规模描述（如 80组/400+黑客）",
  "website": "官网或报名链接URL",
  "hostOrganizer": "主办方名称",
  "tracks": [{"title": "赛道名称", "description": "赛道描述"}],
  "agenda": [{"title": "环节名称", "time": "时间", "detail": "详情"}],
  "organizers": [{"name": "组织方名称"}],
  "sponsors": [{"name": "赞助商名称", "tier": "platinum/gold/silver/bronze"}],
  "tags": ["标签1", "标签2"]
}

规则：
1. 日期必须转换为 YYYY-MM-DD 格式，如果只有月日没有年份，默认 2026 年
2. mode 判断：提到线上/远程=online，提到线下/现场=offline，两者都有=hybrid
3. prizePool 保留原文的货币符号和格式
4. summary 不要照抄原文，用精炼的语言概括
5. 只返回 JSON，不要添加任何其他文字或 markdown 标记`,
        },
        {
          role: 'user',
          content: `请从以下文本中提取黑客松信息：\n\n${text}`,
        },
      ],
      maxTokens: 2048,
    });

    const cleaned = result
      .replace(/```json?\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ data: parsed });
  } catch (error) {
    console.error('AI parse error:', error);
    return NextResponse.json(
      { error: error instanceof SyntaxError ? 'AI 返回格式异常，请重试' : '解析失败' },
      { status: 500 }
    );
  }
}
