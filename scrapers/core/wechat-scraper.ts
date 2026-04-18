/**
 * 微信公众号文章爬虫
 *
 * 微信公众号 (mp.weixin.qq.com) 有强反爬措施，
 * 采用多源降级策略获取文章内容。
 *
 * 降级链:
 *   1. Jina Reader（对公开文章有效）
 *   2. 直接 fetch + 浏览器级 headers
 *   3. 将 markdown 传入 LLM 结构化提取
 */

import type { ScrapeResult } from './types';
import { extractHackathonFromMarkdown } from '@/lib/extract-hackathon';

export class WechatScraper {
  private timeout = 30000;

  async scrape(url: string): Promise<ScrapeResult> {
    try {
      // Step 1: 尝试多种方式获取文章内容
      let markdown = '';
      let source = '';

      // 方式 1: Jina Reader
      try {
        markdown = await this.fetchFromJina(url);
        if (markdown && markdown.length >= 100 && !this.isBlockedContent(markdown)) {
          source = 'jina';
          console.log(`[WechatScraper] Jina Reader 成功，内容长度: ${markdown.length}`);
        } else {
          markdown = '';
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`[WechatScraper] Jina Reader 失败: ${msg}`);
      }

      // 方式 2: 直接 fetch
      if (!markdown) {
        try {
          const html = await this.fetchDirect(url);
          if (html && html.length >= 200) {
            markdown = this.extractWechatContent(html);
            source = 'direct';
            console.log(`[WechatScraper] 直接 fetch 成功，内容长度: ${markdown.length}`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          console.warn(`[WechatScraper] 直接 fetch 失败: ${msg}`);
        }
      }

      if (!markdown || markdown.length < 50) {
        return {
          success: false,
          error: '微信公众号文章内容获取失败（Jina Reader 和直接 fetch 均失败）',
          confidence: 0,
          platform: '微信公众号',
        };
      }

      // 检查是否被反爬拦截
      if (this.isBlockedContent(markdown)) {
        return {
          success: false,
          error: '微信公众号文章被反爬机制拦截（需要验证或登录）',
          rawMarkdown: markdown,
          confidence: 0,
          platform: '微信公众号',
        };
      }

      // Step 2: LLM 结构化提取
      const extraction = await extractHackathonFromMarkdown(markdown);

      if (!extraction.success || !extraction.data) {
        return {
          success: false,
          error: extraction.error || 'LLM 提取失败',
          rawMarkdown: markdown,
          confidence: 0,
          platform: '微信公众号',
        };
      }

      extraction.data.website = url;

      return {
        success: true,
        data: extraction.data,
        rawMarkdown: markdown,
        confidence: this.calculateConfidence(extraction.data),
        platform: '微信公众号',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      return {
        success: false,
        error: `微信公众号爬取失败: ${message}`,
        confidence: 0,
        platform: '微信公众号',
      };
    }
  }

  /**
   * 通过 Jina Reader 获取文章 markdown
   */
  private async fetchFromJina(url: string): Promise<string> {
    const jinaUrl = `https://r.jina.ai/${url}`;
    return this.fetchWithTimeout(jinaUrl, {
      headers: {
        'Accept': 'text/markdown',
        'X-Return-Format': 'markdown',
      },
    });
  }

  /**
   * 直接 fetch 微信文章（带浏览器级 headers）
   */
  private async fetchDirect(url: string): Promise<string> {
    return this.fetchWithTimeout(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://mp.weixin.qq.com/',
      },
      redirect: 'follow',
    });
  }

  /**
   * 从微信文章 HTML 中提取正文内容
   * 微信文章正文在 #js_content 容器中
   */
  private extractWechatContent(html: string): string {
    // 尝试提取微信文章标题
    let title = '';
    const titleMatch = html.match(/<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch?.[1]) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // 尝试提取公众号名称
    let author = '';
    const authorMatch = html.match(
      /var\s+nickname\s*=\s*["']([^"']+)["']|class="profile_nickname"[^>]*>([\s\S]*?)<\//i
    );
    if (authorMatch) {
      author = (authorMatch[1] || authorMatch[2] || '').trim();
    }

    // 尝试提取正文（#js_content）
    let content = '';
    const contentMatch = html.match(/<div[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>\s*(?:<div|<\/div>)/i);
    if (contentMatch?.[1]) {
      content = this.htmlToBasicMarkdown(contentMatch[1]);
    } else {
      // 降级到全页面文本
      content = this.htmlToBasicMarkdown(html);
    }

    // 组装 markdown
    const parts: string[] = [];
    if (title) parts.push(`# ${title}`);
    if (author) parts.push(`\n**来源**: ${author} (微信公众号)`);
    parts.push('');
    parts.push(content);

    return parts.join('\n');
  }

  /**
   * 带超时的 fetch
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时 (${this.timeout}ms)`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 简易 HTML → Markdown 转换
   */
  private htmlToBasicMarkdown(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * 检测是否被反爬拦截
   */
  private isBlockedContent(text: string): boolean {
    const blockedPatterns = [
      /环境异常[\s\S]*完成验证/,
      /请完成安全验证/,
      /access denied/i,
      /please verify you are a human/i,
      /checking your browser/i,
      /captcha/i,
      /just a moment[\s\S]*cloudflare/i,
      /请在微信客户端打开/,
      /此内容因违规无法查看/,
    ];

    const head = text.slice(0, 1000);
    return blockedPatterns.some((p) => p.test(head));
  }

  /**
   * 计算数据完整度
   */
  private calculateConfidence(data: Partial<Record<string, unknown>>): number {
    const requiredFields = ['name', 'dateRange', 'city'];
    const optionalFields = ['prizePool', 'teams', 'venue', 'tracks', 'summary', 'theme', 'organizers'];

    let score = 0;
    let total = 0;

    for (const field of requiredFields) {
      total += 3;
      const val = data[field];
      if (val && (typeof val === 'string' ? val.length > 0 : Array.isArray(val) && val.length > 0)) {
        score += 3;
      }
    }

    for (const field of optionalFields) {
      total += 1;
      const val = data[field];
      if (val && (typeof val === 'string' ? val.length > 0 : Array.isArray(val) && val.length > 0)) {
        score += 1;
      }
    }

    return Math.round((score / total) * 100) / 100;
  }
}
