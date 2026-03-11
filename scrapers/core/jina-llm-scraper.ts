/**
 * 智能爬虫 - 多源降级链 + LLM 提取
 *
 * Markdown 获取降级链:
 *   0. Firecrawl (云端 API，反爬能力强，需 API Key)
 *   1. Jina Reader (免费，支持基础 JS 渲染)
 *   2. urltomarkdown.herokuapp.com (免费备用)
 *   3. 付费代理 ScrapingBee / ScraperAPI (处理反爬，按次付费)
 *   4. 直接 fetch HTML (最终降级)
 *
 * 提取: Markdown → LLM (Claude Haiku) → 结构化 Hackathon 数据
 */

import type { ScrapeResult } from './types';
import { extractHackathonFromMarkdown } from '@/lib/extract-hackathon';
import FirecrawlApp from '@mendable/firecrawl-js';

/** Markdown 获取源的结果 */
interface FetchResult {
  markdown: string;
  source: string;
}

export class JinaLLMScraper {
  private timeout = 30000;
  private maxRetries = 2;

  async scrape(url: string): Promise<ScrapeResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Step 1: 多源降级获取 Markdown
        const { markdown, source } = await this.fetchMarkdownWithFallback(url);

        if (!markdown || markdown.length < 100) {
          throw new Error('所有 Markdown 源返回内容过短，页面可能无法访问');
        }

        // 检查是否被反爬拦截
        if (this.isBlockedContent(markdown)) {
          throw new Error('页面被反爬机制拦截（验证码/登录墙）');
        }

        // Step 2: LLM 提取结构化数据
        const extraction = await extractHackathonFromMarkdown(markdown);

        if (!extraction.success || !extraction.data) {
          throw new Error(extraction.error || 'LLM 提取失败');
        }

        extraction.data.website = url;

        return {
          success: true,
          data: extraction.data,
          rawMarkdown: markdown,
          confidence: this.calculateConfidence(extraction.data),
          platform: `smart-scraper (${source})`,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`SmartScraper attempt ${attempt}/${this.maxRetries} failed for ${url}:`, lastError.message);

        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      confidence: 0,
    };
  }

  /**
   * 多源降级链获取 Markdown
   */
  private async fetchMarkdownWithFallback(url: string): Promise<FetchResult> {
    const sources = [
      { name: 'firecrawl', fn: () => this.fetchFromFirecrawl(url) },
      { name: 'jina', fn: () => this.fetchFromJina(url) },
      { name: 'urltomarkdown', fn: () => this.fetchFromUrlToMarkdown(url) },
      { name: 'proxy', fn: () => this.fetchFromProxy(url) },
      { name: 'direct', fn: () => this.fetchDirect(url) },
    ];

    for (const { name, fn } of sources) {
      try {
        const markdown = await fn();
        if (markdown && markdown.length >= 100 && !this.isBlockedContent(markdown)) {
          console.log(`[SmartScraper] ${name} 成功，内容长度: ${markdown.length}`);
          return { markdown, source: name };
        }
        console.warn(`[SmartScraper] ${name} 内容无效（长度: ${markdown?.length || 0}），尝试下一源`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`[SmartScraper] ${name} 失败: ${msg}，尝试下一源`);
      }
    }

    throw new Error('所有 Markdown 获取源均失败');
  }

  /**
   * 源 0: Firecrawl (云端 API，反爬能力强)
   * 优先读取环境变量 FIRECRAWL_API_KEY，其次读取 CLI 认证凭据
   */
  private async fetchFromFirecrawl(url: string): Promise<string> {
    const apiKey = process.env.FIRECRAWL_API_KEY || this.getFirecrawlCliKey();
    if (!apiKey) {
      throw new Error('未配置 FIRECRAWL_API_KEY，且未找到 CLI 认证凭据');
    }

    const firecrawl = new FirecrawlApp({ apiKey });
    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
    });

    return result.markdown || '';
  }

  /**
   * 尝试从 Firecrawl CLI 存储的凭据中读取 API Key
   */
  private getFirecrawlCliKey(): string | null {
    try {
      const os = require('os');
      const fs = require('fs');
      const path = require('path');
      const homeDir = os.homedir();
      const credPath = path.join(homeDir, 'Library', 'Application Support', 'firecrawl-cli', 'credentials.json');
      const cred = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
      return cred.apiKey || null;
    } catch {
      return null;
    }
  }

  /**
   * 源 1: Jina Reader (免费)
   */
  private async fetchFromJina(url: string): Promise<string> {
    return this.fetchWithTimeout(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/markdown',
        'X-Return-Format': 'markdown',
      },
    });
  }

  /**
   * 源 2: urltomarkdown (免费备用)
   */
  private async fetchFromUrlToMarkdown(url: string): Promise<string> {
    return this.fetchWithTimeout(
      `https://urltomarkdown.herokuapp.com/?url=${encodeURIComponent(url)}&title=true`,
      { headers: { 'Accept': 'text/markdown' } }
    );
  }

  /**
   * 源 3: 付费代理 (ScrapingBee / ScraperAPI)
   * 需要环境变量: SCRAPINGBEE_API_KEY 或 SCRAPERAPI_KEY
   */
  private async fetchFromProxy(url: string): Promise<string> {
    // ScrapingBee
    const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
    if (scrapingBeeKey) {
      const params = new URLSearchParams({
        api_key: scrapingBeeKey,
        url: url,
        render_js: 'true',
        premium_proxy: 'true',
      });
      const html = await this.fetchWithTimeout(
        `https://app.scrapingbee.com/api/v1/?${params}`,
        {},
        45000, // 代理服务需要更长超时
      );
      return this.htmlToBasicMarkdown(html);
    }

    // ScraperAPI
    const scraperApiKey = process.env.SCRAPERAPI_KEY;
    if (scraperApiKey) {
      const params = new URLSearchParams({
        api_key: scraperApiKey,
        url: url,
        render: 'true',
      });
      const html = await this.fetchWithTimeout(
        `https://api.scraperapi.com/?${params}`,
        {},
        45000,
      );
      return this.htmlToBasicMarkdown(html);
    }

    throw new Error('未配置付费代理 API Key (SCRAPINGBEE_API_KEY 或 SCRAPERAPI_KEY)');
  }

  /**
   * 源 4: 直接 fetch (最终降级)
   */
  private async fetchDirect(url: string): Promise<string> {
    const html = await this.fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });
    return this.htmlToBasicMarkdown(html);
  }

  /**
   * 带超时的 fetch
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = this.timeout,
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
        throw new Error(`请求超时 (${timeoutMs}ms)`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 简易 HTML → Markdown 转换（去标签提取文本）
   */
  private htmlToBasicMarkdown(html: string): string {
    return html
      // 移除 script/style
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      // 标题转 Markdown
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      // 段落和换行
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      // 移除剩余标签
      .replace(/<[^>]+>/g, '')
      // 解码 HTML 实体
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // 清理多余空白
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
    ];

    // 只检查前 1000 字符（反爬通常在页面开头）
    const head = text.slice(0, 1000);
    return blockedPatterns.some(p => p.test(head));
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
