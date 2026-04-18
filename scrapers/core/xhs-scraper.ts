/**
 * 小红书 (XHS) 爬虫
 *
 * 利用 XHS 移动端 SSR 渲染的 __INITIAL_STATE__ 提取笔记数据，
 * 无需 Playwright 即可获取完整内容。
 *
 * 降级链:
 *   1. 移动端 UA fetch → 解析 __INITIAL_STATE__ JSON
 *   2. HTML 文本降级提取（strip tags）
 *   3. 将 markdown 传入 LLM 结构化提取
 */

import type { ScrapeResult } from './types';
import { extractHackathonFromMarkdown } from '@/lib/extract-hackathon';

/** 从 __INITIAL_STATE__ 中解析出的笔记数据 */
interface XhsNoteData {
  title: string;
  description: string;
  author: string;
  time: string;
  likes: string;
  collects: string;
  comments: string;
  tags: string[];
  images: string[];
}

export class XhsScraper {
  private timeout = 30000;

  async scrape(url: string): Promise<ScrapeResult> {
    try {
      // Step 1: 用移动端 UA 获取页面 HTML
      const html = await this.fetchWithMobileUA(url);

      if (!html || html.length < 200) {
        return {
          success: false,
          error: '小红书页面内容过短，可能被拦截',
          confidence: 0,
          platform: '小红书',
        };
      }

      // Step 2: 尝试从 __INITIAL_STATE__ 提取结构化数据
      let markdown: string;
      const noteData = this.extractFromInitialState(html);

      if (noteData) {
        // Step 3a: 格式化为 markdown
        markdown = this.formatNoteAsMarkdown(noteData);
      } else {
        // Step 3b: 降级到 HTML 文本提取
        console.warn('[XhsScraper] __INITIAL_STATE__ 解析失败，降级到 HTML 文本提取');
        markdown = this.htmlToBasicMarkdown(html);
      }

      if (!markdown || markdown.length < 50) {
        return {
          success: false,
          error: '小红书内容提取为空',
          confidence: 0,
          platform: '小红书',
        };
      }

      // Step 4: LLM 结构化提取
      const extraction = await extractHackathonFromMarkdown(markdown);

      if (!extraction.success || !extraction.data) {
        // 即使 LLM 提取失败，仍返回原始 markdown
        return {
          success: false,
          error: extraction.error || 'LLM 提取失败',
          rawMarkdown: markdown,
          confidence: 0,
          platform: '小红书',
        };
      }

      extraction.data.website = url;

      return {
        success: true,
        data: extraction.data,
        rawMarkdown: markdown,
        confidence: this.calculateConfidence(extraction.data),
        platform: '小红书',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      return {
        success: false,
        error: `小红书爬取失败: ${message}`,
        confidence: 0,
        platform: '小红书',
      };
    }
  }

  /**
   * 使用移动端 User-Agent 获取页面 HTML
   * XHS 对移动端返回包含 __INITIAL_STATE__ 的 SSR 页面
   */
  private async fetchWithMobileUA(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
        redirect: 'follow',
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
   * 从 HTML 中提取 __INITIAL_STATE__ 并解析笔记数据
   */
  private extractFromInitialState(html: string): XhsNoteData | null {
    try {
      // 尝试多种正则匹配 __INITIAL_STATE__
      const patterns = [
        /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/,
        new RegExp('window\\.__INITIAL_STATE__\\s*=\\s*(\\{[\\s\\S]+?\\})\\s*;?\\s*<\\/script>'),
      ];

      let stateStr: string | null = null;
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          stateStr = match[1];
          break;
        }
      }

      if (!stateStr) {
        return null;
      }

      // XHS 的 __INITIAL_STATE__ 中可能包含 undefined，需要替换
      const sanitized = stateStr.replace(/\bundefined\b/g, 'null');
      const state = JSON.parse(sanitized);

      // 解析笔记详情
      const noteMap = state?.note?.noteDetailMap || state?.note?.noteDetail || {};
      const entries = Object.entries(noteMap);

      if (entries.length === 0) {
        return null;
      }

      // 取第一条笔记
      const [, noteWrapper] = entries[0];
      const note = (noteWrapper as any)?.note || noteWrapper;

      if (!note) {
        return null;
      }

      return {
        title: note.title || '',
        description: note.desc || note.description || '',
        author: note.user?.nickname || note.user?.name || '',
        time: note.time || note.createTime || note.publishTime || '',
        likes: String(note.interactInfo?.likedCount || note.likeCount || '0'),
        collects: String(note.interactInfo?.collectedCount || note.collectCount || '0'),
        comments: String(note.interactInfo?.commentCount || note.commentCount || '0'),
        tags: (note.tagList || note.tags || []).map((t: any) => t.name || t.tagName || String(t)),
        images: (note.imageList || note.images || []).map(
          (img: any) => img.urlDefault || img.url || img.infoList?.[0]?.url || ''
        ),
      };
    } catch (err) {
      console.warn('[XhsScraper] __INITIAL_STATE__ 解析出错:', err);
      return null;
    }
  }

  /**
   * 将笔记数据格式化为 markdown
   */
  private formatNoteAsMarkdown(note: XhsNoteData): string {
    const parts: string[] = [];

    if (note.title) {
      parts.push(`# ${note.title}`);
    }

    parts.push('');

    if (note.author) {
      parts.push(`**作者**: ${note.author}`);
    }

    if (note.time) {
      parts.push(`**发布时间**: ${note.time}`);
    }

    if (note.likes !== '0' || note.collects !== '0' || note.comments !== '0') {
      parts.push(`**互动**: ${note.likes}赞 · ${note.collects}收藏 · ${note.comments}评论`);
    }

    parts.push('');

    if (note.description) {
      parts.push(note.description);
    }

    if (note.tags.length > 0) {
      parts.push('');
      parts.push(`**标签**: ${note.tags.map((t) => `#${t}`).join(' ')}`);
    }

    return parts.join('\n');
  }

  /**
   * 简易 HTML → Markdown 转换（降级方案）
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
