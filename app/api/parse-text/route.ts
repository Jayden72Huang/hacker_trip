/**
 * API: 解析文本并提取黑客松信息
 * POST /api/parse-text
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: '请提供有效的文本内容' },
        { status: 400 }
      );
    }

    // 解析文本
    const data = parseText(text);

    if (!data.name) {
      return NextResponse.json(
        { error: '无法从文本中提取有效信息，请检查格式' },
        { status: 400 }
      );
    }

    // 计算置信度
    const confidence = calculateConfidence(data);

    return NextResponse.json({
      success: true,
      data,
      confidence
    });

  } catch (error) {
    console.error('Parse text API error:', error);
    return NextResponse.json(
      { error: '解析失败' },
      { status: 500 }
    );
  }
}

/**
 * 解析文本内容
 */
function parseText(text: string): any {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  return {
    id: generateId(),
    name: extractName(text, lines),
    shortName: '',
    city: extractCity(text),
    country: '中国',
    venue: extractVenue(text),
    dateRange: extractDate(text),
    isPast: false,
    status: 'upcoming',
    summary: extractSummary(text, lines),
    prizePool: extractPrize(text),
    teams: extractTeams(text),
    format: extractFormat(text),
    theme: extractTheme(text),
    website: extractWebsite(text),
    brief: '',
    tracks: extractTracks(text),
    agenda: extractAgenda(text)
  };
}

/**
 * 提取名称
 */
function extractName(text: string, lines: string[]): string {
  // 尝试从第一行获取标题
  const firstLine = lines[0];
  if (firstLine && firstLine.length > 5 && firstLine.length < 100) {
    return firstLine;
  }

  // 查找包含"黑客松"的行
  const hackathonLine = lines.find(l => /黑客松|hackathon/i.test(l));
  if (hackathonLine) return hackathonLine;

  return '未命名黑客松';
}

/**
 * 提取城市
 */
function extractCity(text: string): string {
  const cities = [
    '北京', '上海', '深圳', '广州', '杭州', '成都', '重庆', '武汉',
    '西安', '南京', '天津', '苏州', '长沙', '郑州', '东莞', '青岛'
  ];

  for (const city of cities) {
    if (text.includes(city)) return city;
  }

  return '';
}

/**
 * 提取场地
 */
function extractVenue(text: string): string {
  const patterns = [
    /地点[:：\s]*([^\n]{5,50})/,
    /场地[:：\s]*([^\n]{5,50})/,
    /举办地[:：\s]*([^\n]{5,50})/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

/**
 * 提取日期
 */
function extractDate(text: string): string {
  const patterns = [
    /时间[:：\s]*([^\n]{5,50})/,
    /日期[:：\s]*([^\n]{5,50})/,
    /(\d{1,2}月\d{1,2}日[-~至]\d{1,2}月?\d{1,2}日)/,
    /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[-/日])/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

/**
 * 提取简介
 */
function extractSummary(text: string, lines: string[]): string {
  const keywords = ['简介', '介绍', '描述', '关于'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (keywords.some(k => line.includes(k))) {
      // 返回后续几行
      return lines.slice(i + 1, i + 4).join(' ').slice(0, 200);
    }
  }

  // 返回前几行作为简介
  return lines.slice(1, 4).join(' ').slice(0, 200);
}

/**
 * 提取奖金
 */
function extractPrize(text: string): string {
  const patterns = [
    /奖金[:：\s]*([¥$]?\s*[\d,]+\s*[万元KM]?)/,
    /奖池[:：\s]*([¥$]?\s*[\d,]+\s*[万元KM]?)/,
    /总奖励[:：\s]*([¥$]?\s*[\d,]+\s*[万元KM]?)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
}

/**
 * 提取队伍数
 */
function extractTeams(text: string): string {
  const match = text.match(/(\d+\s*[个支]?[队伍团队])/);
  return match ? match[1] : '';
}

/**
 * 提取形式
 */
function extractFormat(text: string): 'offline' | 'online' | 'hybrid' {
  const hasOnline = /线上|在线|远程/i.test(text);
  const hasOffline = /线下|现场/i.test(text);

  if (hasOnline && hasOffline) return 'hybrid';
  if (hasOnline) return 'online';
  return 'offline';
}

/**
 * 提取主题
 */
function extractTheme(text: string): string {
  const themes = [
    'AI', '人工智能', 'Web3', '区块链', 'IoT', '物联网',
    '智慧城市', '金融科技', '医疗健康', '教育科技'
  ];

  for (const theme of themes) {
    if (text.includes(theme)) return theme;
  }

  return '';
}

/**
 * 提取网站
 */
function extractWebsite(text: string): string {
  const match = text.match(/(https?:\/\/[^\s]+)/);
  return match ? match[1] : '';
}

/**
 * 提取赛道
 */
function extractTracks(text: string): Array<{ title: string; description: string }> {
  const tracks: Array<{ title: string; description: string }> = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/赛道|track/i.test(line) && line.length < 50) {
      tracks.push({
        title: line,
        description: lines[i + 1]?.trim() || ''
      });
    }
  }

  return tracks;
}

/**
 * 提取日程
 */
function extractAgenda(text: string): Array<{ title: string; time: string; detail: string }> {
  const agenda: Array<{ title: string; time: string; detail: string }> = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const timeMatch = line.match(/(\d{1,2}:\d{2}|\d{1,2}月\d{1,2}日)/);
    if (timeMatch) {
      agenda.push({
        title: line.slice(0, 30),
        time: timeMatch[1],
        detail: line.slice(30, 100)
      });
    }
  }

  return agenda;
}

/**
 * 生成 ID
 */
function generateId(): string {
  return 'draft-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * 计算置信度
 */
function calculateConfidence(data: any): number {
  let score = 0;
  let total = 0;

  const fields = [
    { key: 'name', weight: 2 },
    { key: 'dateRange', weight: 2 },
    { key: 'city', weight: 2 },
    { key: 'venue', weight: 1 },
    { key: 'prizePool', weight: 1 },
    { key: 'theme', weight: 1 }
  ];

  fields.forEach(({ key, weight }) => {
    total += weight;
    if (data[key] && data[key].length > 0) {
      score += weight;
    }
  });

  return Math.round((score / total) * 100) / 100;
}
