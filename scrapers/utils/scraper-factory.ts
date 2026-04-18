/**
 * 爬虫工厂 - 根据 URL 和配置选择合适的爬虫
 *
 * 策略:
 * - 默认使用 JinaLLMScraper（Jina Reader + LLM，通吃所有网站）
 * - 如果没有 ANTHROPIC_API_KEY，降级到传统 Cheerio 爬虫
 */

import type { ScrapeResult } from '../core/types';
import { BaseScraper } from '../core/base-scraper';
import { GenericScraper } from '../sites/generic';
import { DoraHacksScraper } from '../sites/dorahacks-cn';
import { JinaLLMScraper } from '../core/jina-llm-scraper';
import { XhsScraper } from '../core/xhs-scraper';
import { WechatScraper } from '../core/wechat-scraper';

export class ScraperFactory {
  /**
   * 创建爬虫并执行爬取
   * 优先使用 Jina+LLM，失败时降级到传统爬虫
   */
  static async smartScrape(url: string): Promise<ScrapeResult> {
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const platform = this.identifyPlatform(url);

    // 0. 平台专属爬虫（XHS、微信等需要特殊处理的平台）
    if (platform === '小红书') {
      try {
        const result = await new XhsScraper().scrape(url);
        if (result.success) return result;
        console.warn('XHS scraper failed, falling back:', result.error);
      } catch (err) {
        console.warn('XHS scraper failed, falling back:', err);
      }
    }

    if (platform === '微信公众号') {
      try {
        const result = await new WechatScraper().scrape(url);
        if (result.success) return result;
        console.warn('WeChat scraper failed, falling back:', result.error);
      } catch (err) {
        console.warn('WeChat scraper failed, falling back:', err);
      }
    }

    // 1. 优先：Jina + LLM（需要 API Key）
    if (hasAnthropicKey) {
      try {
        const jinaResult = await new JinaLLMScraper().scrape(url);
        if (jinaResult.success && jinaResult.confidence > 0.3) {
          return jinaResult;
        }
        console.warn(`Jina+LLM 置信度过低 (${jinaResult.confidence})，降级到传统爬虫`);
      } catch (err) {
        console.warn('Jina+LLM 爬虫失败，降级到传统爬虫:', err);
      }
    }

    // 2. 降级：传统 Cheerio 爬虫
    const legacyScraper = this.createLegacyScraper(url);
    return legacyScraper.scrape(url);
  }

  /**
   * 创建传统爬虫实例（基于 CSS 选择器）
   */
  static createLegacyScraper(url: string): BaseScraper {
    const domain = this.extractDomain(url);

    if (domain.includes('dorahacks')) {
      return new DoraHacksScraper();
    }

    return new GenericScraper();
  }

  /**
   * 创建爬虫实例（保持向后兼容）
   */
  static createScraper(url: string): BaseScraper {
    return this.createLegacyScraper(url);
  }

  /**
   * 提取域名
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  /**
   * 识别平台类型
   */
  static identifyPlatform(url: string): string {
    const domain = this.extractDomain(url);

    if (domain.includes('dorahacks')) return 'DoraHacks';
    if (domain.includes('juejin')) return '掘金';
    if (domain.includes('nowcoder')) return '牛客网';
    if (domain.includes('huodongxing')) return '活动行';
    if (domain.includes('hudongba')) return '互动吧';
    if (domain.includes('xiaohongshu') || domain.includes('xhslink')) return '小红书';
    if (domain.includes('mp.weixin.qq.com') || domain.includes('weixin.qq.com')) return '微信公众号';

    return '通用';
  }
}
