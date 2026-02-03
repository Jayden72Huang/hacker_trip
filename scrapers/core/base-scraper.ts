/**
 * 通用爬虫基类 (Cloudflare Workers 兼容)
 */

import * as cheerio from 'cheerio';
import type { ScrapeResult } from './types';

export abstract class BaseScraper {
  protected timeout = 10000;
  protected userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

  /**
   * 爬取 URL
   */
  async scrape(url: string): Promise<ScrapeResult> {
    try {
      const html = await this.fetchHTML(url);
      const data = await this.parse(html, url);

      return {
        success: true,
        data,
        rawHtml: html,
        confidence: this.calculateConfidence(data),
        platform: this.getPlatformName()
      };
    } catch (error) {
      console.error(`Scrape error for ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0
      };
    }
  }

  /**
   * 获取 HTML 内容 (使用原生 fetch，兼容 CF Workers)
   */
  protected async fetchHTML(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 解析 HTML（由子类实现）
   */
  protected abstract parse(html: string, url: string): Promise<Partial<any>>;

  /**
   * 获取平台名称
   */
  protected abstract getPlatformName(): string;

  /**
   * 计算数据完整度（置信度）
   */
  protected calculateConfidence(data: Partial<any>): number {
    const requiredFields = ['name', 'dateRange', 'city', 'website'];
    const optionalFields = ['prizePool', 'teams', 'venue', 'tracks'];

    let score = 0;
    let total = 0;

    // 必填字段权重更高
    requiredFields.forEach(field => {
      total += 2;
      if (data[field] && data[field].length > 0) score += 2;
    });

    // 可选字段
    optionalFields.forEach(field => {
      total += 1;
      if (data[field] && data[field].length > 0) score += 1;
    });

    return Math.round((score / total) * 100) / 100;
  }

  /**
   * 提取文本内容（去除多余空白）
   */
  protected extractText($: cheerio.CheerioAPI, selector: string): string {
    return $(selector).text().trim().replace(/\s+/g, ' ');
  }

  /**
   * 提取多个文本
   */
  protected extractTexts($: cheerio.CheerioAPI, selector: string): string[] {
    const texts: string[] = [];
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text) texts.push(text);
    });
    return texts;
  }
}
