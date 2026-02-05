/**
 * DoraHacks 中国站爬虫
 * 网站: dorahacks.io/zh (中国区黑客松平台)
 */

import * as cheerio from 'cheerio';
import { BaseScraper } from '../core/base-scraper';

export class DoraHacksScraper extends BaseScraper {
  protected getPlatformName(): string {
    return 'DoraHacks';
  }

  protected async parse(html: string, url: string): Promise<Partial<any>> {
    const $ = cheerio.load(html);

    return {
      name: this.extractText($, 'h1.hackathon-title, .event-title, h1'),
      dateRange: this.extractDateRange($),
      city: this.extractLocation($),
      country: '中国',
      venue: this.extractVenue($),
      prizePool: this.extractPrize($),
      teams: this.extractTeams($),
      format: this.detectFormat($),
      theme: this.extractTheme($),
      website: url,
      summary: this.extractSummary($),
      tracks: this.extractTracks($),
      agenda: [],
      status: 'upcoming' as const,
      isPast: false,
      brief: url
    };
  }

  private extractDateRange($: cheerio.CheerioAPI): string {
    const dateSelectors = [
      '.event-date',
      '.hackathon-date',
      '[class*="date"]',
      '.time-info'
    ];

    for (const selector of dateSelectors) {
      const text = this.extractText($, selector);
      if (text) return text;
    }

    return '';
  }

  private extractLocation($: cheerio.CheerioAPI): string {
    const locationText = this.extractText($, '.location, .event-location, [class*="location"]');

    // 提取城市名
    const cityMatch = locationText.match(/(北京|上海|深圳|广州|杭州|成都|武汉|西安|南京|重庆|苏州|天津)/);
    return cityMatch ? cityMatch[1] : locationText;
  }

  private extractVenue($: cheerio.CheerioAPI): string {
    return this.extractText($, '.venue, .event-venue, [class*="venue"]');
  }

  private extractPrize($: cheerio.CheerioAPI): string {
    const prizeText = this.extractText($, '.prize, .reward, [class*="prize"]');
    if (prizeText) return prizeText;

    // 从正文中查找奖金信息
    const bodyText = $('body').text();
    const match = bodyText.match(/(奖金|总奖池|奖励)[:：\s]*([¥$]?\s*[\d,]+\s*[万元KM]?)/);
    return match ? match[2] : '';
  }

  private extractTeams($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text();
    const match = bodyText.match(/(\d+\s*[个支]?[队伍团队])/);
    return match ? match[1] : '';
  }

  private detectFormat($: cheerio.CheerioAPI): 'offline' | 'online' | 'hybrid' {
    const bodyText = $('body').text().toLowerCase();

    const hasOnline = /线上|在线|remote|online/.test(bodyText);
    const hasOffline = /线下|现场|offline/.test(bodyText);

    if (hasOnline && hasOffline) return 'hybrid';
    if (hasOnline) return 'online';
    return 'offline';
  }

  private extractTheme($: cheerio.CheerioAPI): string {
    const themeText = this.extractText($, '.theme, .category, [class*="theme"]');
    if (themeText) return themeText;

    // 从标题中提取主题
    const title = this.extractText($, 'h1');
    const themes = ['Web3', 'AI', 'DeFi', 'NFT', '区块链', '元宇宙', 'GameFi', 'DAO'];

    for (const theme of themes) {
      if (title.includes(theme)) return theme;
    }

    return '';
  }

  private extractSummary($: cheerio.CheerioAPI): string {
    const summarySelectors = [
      '.description',
      '.event-description',
      '.intro',
      'meta[property="og:description"]'
    ];

    for (const selector of summarySelectors) {
      const text = selector.includes('meta')
        ? $(selector).attr('content')
        : this.extractText($, selector);

      if (text && text.length > 20) {
        return text.slice(0, 200);
      }
    }

    return '';
  }

  private extractTracks($: cheerio.CheerioAPI): Array<{ title: string; description: string }> {
    const tracks: Array<{ title: string; description: string }> = [];

    // 查找赛道信息
    $('.track-item, .challenge-item, [class*="track"]').each((_, el) => {
      const titleEl = $(el).find('h3, h4, .title').first();
      const descEl = $(el).find('p, .description').first();
      const title = titleEl.length ? titleEl.text().trim().replace(/\s+/g, ' ') : '';
      const description = descEl.length ? descEl.text().trim().replace(/\s+/g, ' ') : '';

      if (title) {
        tracks.push({ title, description: description || '' });
      }
    });

    return tracks;
  }
}
