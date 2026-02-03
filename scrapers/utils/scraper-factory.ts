/**
 * 爬虫工厂 - 根据 URL 自动选择合适的爬虫
 */

import { BaseScraper } from '../core/base-scraper';
import { GenericScraper } from '../sites/generic';
import { DoraHacksScraper } from '../sites/dorahacks-cn';

export class ScraperFactory {
  /**
   * 根据 URL 创建爬虫实例
   */
  static createScraper(url: string): BaseScraper {
    const domain = this.extractDomain(url);

    // DoraHacks
    if (domain.includes('dorahacks')) {
      return new DoraHacksScraper();
    }

    // TODO: 添加更多中国平台
    // if (domain.includes('juejin')) return new JuejinScraper();
    // if (domain.includes('nowcoder')) return new NowcoderScraper();
    // if (domain.includes('huodongxing')) return new HuodongxingScraper();

    // 默认使用通用爬虫
    return new GenericScraper();
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

    return '通用';
  }
}
