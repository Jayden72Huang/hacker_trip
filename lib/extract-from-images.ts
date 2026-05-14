/**
 * 图片识别提取黑客松信息
 * 从海报/截图中识别文字，用于补充纯文本爬取的信息
 */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

interface ImageExtractionResult {
  success: boolean;
  text: string;
  error?: string;
}

/**
 * 从 Markdown 内容中提取图片 URL
 */
export function extractImageUrls(markdown: string): string[] {
  const urls: string[] = [];

  // Markdown 图片语法: ![alt](url)
  const mdPattern = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = mdPattern.exec(markdown)) !== null) {
    if (isValidImageUrl(match[1])) urls.push(match[1]);
  }

  // HTML img 标签
  const htmlPattern = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlPattern.exec(markdown)) !== null) {
    if (isValidImageUrl(match[1])) urls.push(match[1]);
  }

  // 裸链接 (常见图片后缀)
  const barePattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]*)?/gi;
  while ((match = barePattern.exec(markdown)) !== null) {
    if (!urls.includes(match[0])) urls.push(match[0]);
  }

  return [...new Set(urls)].slice(0, 5);
}

function isValidImageUrl(url: string): boolean {
  if (!url || url.startsWith('data:')) return false;
  if (url.includes('Base64-Image-Removed')) return false;
  if (url.includes('emoji') || url.includes('icon')) return false;
  return url.startsWith('http');
}

/**
 * 用 Gemini Vision 识别单张图片中的文字
 */
async function recognizeImage(imageUrl: string): Promise<ImageExtractionResult> {
  if (!GOOGLE_API_KEY) {
    return { success: false, text: '', error: '未配置 GOOGLE_API_KEY' };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: '请识别这张图片中的所有文字内容，特别关注以下信息：活动名称、时间日期、地点城市、奖金金额、主办方、赛道主题。按原始布局输出文字，不要添加解释。如果图片中没有相关文字，回复"无文字内容"。',
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: await fetchImageAsBase64(imageUrl),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.1,
          },
        }),
      }
    );

    if (!res.ok) {
      return { success: false, text: '', error: `Gemini API 错误: ${res.status}` };
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (text === '无文字内容' || text.length < 10) {
      return { success: false, text: '', error: '图片中无有效文字' };
    }

    return { success: true, text };
  } catch (err) {
    return {
      success: false,
      text: '',
      error: err instanceof Error ? err.message : '图片识别失败',
    };
  }
}

/**
 * 下载图片并转为 base64
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: new URL(url).origin,
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 批量识别图片并合并结果
 * 最多处理 3 张图片（海报通常 1-2 张就够了）
 */
export async function extractTextFromImages(imageUrls: string[]): Promise<string> {
  if (!GOOGLE_API_KEY || imageUrls.length === 0) return '';

  const toProcess = imageUrls.slice(0, 3);
  const results = await Promise.allSettled(toProcess.map(recognizeImage));

  const texts: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.success) {
      texts.push(result.value.text);
    }
  }

  if (texts.length === 0) return '';

  return texts.map((t, i) => `[图片 ${i + 1} 识别内容]\n${t}`).join('\n\n');
}
