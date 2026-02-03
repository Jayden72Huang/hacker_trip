/**
 * 通用智能爬取器 - 适用于任何网站
 * 使用启发式规则提取黑客松信息
 */

import * as cheerio from 'cheerio';
import { BaseScraper } from '../core/base-scraper';

export class GenericScraper extends BaseScraper {
  protected getPlatformName(): string {
    return 'generic';
  }

  protected async parse(html: string, url: string): Promise<Partial<any>> {
    const $ = cheerio.load(html);

    // 移除 script 和 style 标签
    $('script, style, nav, footer').remove();

    return {
      name: this.extractName($, url),
      dateRange: this.extractDate($),
      city: this.extractCity($),
      country: '中国',
      venue: this.extractVenue($),
      prizePool: this.extractPrize($),
      teams: this.extractTeams($),
      format: this.extractFormat($),
      theme: this.extractTheme($),
      website: url,
      summary: this.extractSummary($),
      tracks: this.extractTracks($),
      agenda: this.extractAgenda($),
      status: 'upcoming' as const,
      isPast: false
    };
  }

  /**
   * 提取活动名称
   */
  private extractName($: cheerio.CheerioAPI, url: string): string {
    // 尝试多种选择器
    const selectors = [
      'h1',
      '[class*="title"]',
      '[class*="name"]',
      '[class*="event"]',
      'title'
    ];

    for (const selector of selectors) {
      const text = this.extractText($, selector);
      if (text && text.length > 5 && text.length < 100) {
        return text;
      }
    }

    return '未命名黑客松';
  }

  /**
   * 提取时间信息
   */
  private extractDate($: cheerio.CheerioAPI): string {
    const datePatterns = [
      /(\d{1,2}月\d{1,2}日[-~至]\d{1,2}月?\d{1,2}日)/,
      /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[-/日])/,
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}[-–]\d{1,2}/i
    ];

    const bodyText = $('body').text();

    for (const pattern of datePatterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

    return '';
  }

  /**
   * 提取城市
   */
  private extractCity($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text();

    // 中国主要城市列表
    const cities = [
      '北京', '上海', '深圳', '广州', '杭州', '成都', '重庆', '武汉',
      '西安', '南京', '天津', '苏州', '长沙', '郑州', '东莞', '青岛',
      '沈阳', '宁波', '昆明', '合肥', '大连', '厦门', '福州', '济南',
      '香港', '澳门', '台北'
    ];

    for (const city of cities) {
      if (bodyText.includes(city)) {
        return city;
      }
    }

    return '';
  }

  /**
   * 提取场地
   */
  private extractVenue($: cheerio.CheerioAPI): string {
    const keywords = ['地点', '场地', '地址', 'venue', 'location', '举办地'];
    const bodyText = $('body').text();

    for (const keyword of keywords) {
      const index = bodyText.indexOf(keyword);
      if (index !== -1) {
        // 提取关键词后的文本（约100字符）
        const text = bodyText.slice(index, index + 100);
        const lines = text.split(/[\n\r]/).filter(l => l.trim());
        if (lines[0]) return lines[0].replace(keyword, '').trim();
      }
    }

    return '';
  }

  /**
   * 提取奖金
   */
  private extractPrize($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text();
    const patterns = [
      /(奖金[:：]\s*[\d,]+\s*[元万])/,
      /(总奖金[:：]\s*[\d,]+)/,
      /(奖金池[:：]\s*[\$¥]\s*[\d,]+[KMkm]?)/,
      /([\$¥]\s*[\d,]+[KMkm]?\s*奖金)/
    ];

    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

    return '';
  }

  /**
   * 提取参赛队伍/人数
   */
  private extractTeams($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text();
    const patterns = [
      /(\d+\s*[个支]?队伍)/,
      /(\d+\s*人)/,
      /(限\s*\d+\s*组)/
    ];

    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

    return '';
  }

  /**
   * 提取形式（线上/线下/混合）
   */
  private extractFormat($: cheerio.CheerioAPI): 'offline' | 'online' | 'hybrid' {
    const bodyText = $('body').text();

    const hasOnline = /线上|在线|远程|online/i.test(bodyText);
    const hasOffline = /线下|现场|offline/i.test(bodyText);

    if (hasOnline && hasOffline) return 'hybrid';
    if (hasOnline) return 'online';
    return 'offline';
  }

  /**
   * 提取主题
   */
  private extractTheme($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text();
    const themes = [
      'AI', '人工智能', 'Web3', '区块链', 'IoT', '物联网',
      '智慧城市', '金融科技', 'FinTech', '医疗健康', '教育科技',
      '可持续发展', '元宇宙', 'DeFi', 'NFT', '开源', 'DevOps'
    ];

    for (const theme of themes) {
      if (bodyText.includes(theme)) {
        return theme;
      }
    }

    return '';
  }

  /**
   * 提取简介
   */
  private extractSummary($: cheerio.CheerioAPI): string {
    const selectors = [
      '[class*="description"]',
      '[class*="intro"]',
      '[class*="summary"]',
      'meta[name="description"]'
    ];

    for (const selector of selectors) {
      const text = selector.includes('meta')
        ? $(selector).attr('content')
        : this.extractText($, selector);

      if (text && text.length > 20 && text.length < 500) {
        return text.slice(0, 200);
      }
    }

    // 提取第一段文字
    const firstP = $('p').first().text().trim();
    return firstP.slice(0, 200);
  }

  /**
   * 提取赛道
   */
  private extractTracks($: cheerio.CheerioAPI): Array<{ title: string; description: string }> {
    const tracks: Array<{ title: string; description: string }> = [];

    // 查找包含"赛道"的标题
    $('h2, h3, h4').each((_, el) => {
      const title = $(el).text();
      if (/赛道|track/i.test(title)) {
        const description = $(el).next('p').text().trim();
        if (title && description) {
          tracks.push({ title, description });
        }
      }
    });

    return tracks;
  }

  /**
   * 提取日程
   */
  private extractAgenda($: cheerio.CheerioAPI): Array<{ title: string; time: string; detail: string }> {
    const agenda: Array<{ title: string; time: string; detail: string }> = [];

    // 查找包含时间的列表项
    $('li, tr').each((_, el) => {
      const text = $(el).text();
      const timeMatch = text.match(/(\d{1,2}:\d{2}|\d{1,2}月\d{1,2}日)/);

      if (timeMatch) {
        agenda.push({
          title: text.slice(0, 50),
          time: timeMatch[1],
          detail: text.slice(50, 150)
        });
      }
    });

    return agenda.slice(0, 10); // 最多返回10个日程
  }
}
