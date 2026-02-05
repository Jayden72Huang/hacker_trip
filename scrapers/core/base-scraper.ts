/**
 * 通用爬虫基类 (Cloudflare Workers 兼容)
 */

import * as cheerio from 'cheerio';
import type { ScrapeResult } from './types';

// 常见的 User-Agent 列表
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

export abstract class BaseScraper {
  protected timeout = 15000;
  protected maxRetries = 3;

  /**
   * 获取随机 User-Agent
   */
  protected getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * 爬取 URL
   */
  async scrape(url: string): Promise<ScrapeResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const html = await this.fetchHTML(url, attempt);
        const data = await this.parse(html, url);

        return {
          success: true,
          data,
          rawHtml: html,
          confidence: this.calculateConfidence(data),
          platform: this.getPlatformName()
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Scrape attempt ${attempt}/${this.maxRetries} failed for ${url}:`, lastError.message);

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          await this.delay(1000 * attempt); // 递增延迟
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      confidence: 0
    };
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取 HTML 内容 (使用原生 fetch，兼容 CF Workers)
   */
  protected async fetchHTML(url: string, attempt: number = 1): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // 解析 URL 获取 origin
    const urlObj = new URL(url);
    const origin = urlObj.origin;

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': origin,
          'Origin': origin,
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        // 对于某些状态码，尝试不同策略
        if (response.status === 403 || response.status === 429) {
          throw new Error(`HTTP ${response.status}: 网站限制访问，请稍后重试`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';

      // 检查是否是 HTML
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        // 可能是 SPA，尝试继续处理
        console.warn(`Unexpected content type: ${contentType}`);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，网站响应过慢');
      }
      throw error;
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
