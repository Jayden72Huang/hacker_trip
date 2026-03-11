import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/llm';

interface GitHubRepo {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  topics?: string[];
}

interface RepoSummary {
  name: string;
  url: string;
  stars: number;
  description: string;
  language: string;
  updatedAt: string;
  topics: string[];
}

async function searchGitHub(query: string, perPage = 15): Promise<RepoSummary[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'HackerTrip/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
  }

  const params = new URLSearchParams({
    q: query,
    sort: 'stars',
    per_page: String(Math.min(perPage, 30)),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?${params}`,
      { headers, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items: GitHubRepo[] = data.items ?? [];

    return items.map((repo) => ({
      name: repo.full_name,
      url: repo.html_url,
      stars: repo.stargazers_count,
      description: repo.description?.slice(0, 200) ?? '',
      language: repo.language ?? 'Unknown',
      updatedAt: repo.updated_at.split('T')[0],
      topics: repo.topics?.slice(0, 8) ?? [],
    }));
  } catch (err) {
    clearTimeout(timeout);
    console.error('GitHub search failed:', err);
    return [];
  }
}

function extractKeywords(description: string, track?: string): string[] {
  // Remove common Chinese filler words and extract meaningful terms
  const cleanDesc = description
    .replace(/[，。！？、；：""''（）\[\]{}]/g, ' ')
    .replace(/\b(一个|基于|使用|通过|实现|进行|可以|能够|支持|提供|需要|希望|想要|打造|开发|构建|创建)\b/g, ' ');

  // Extract English words and meaningful terms
  const words = cleanDesc
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .filter((w) => !/^(the|a|an|is|are|was|were|be|been|being|and|or|but|for|with|from|to|of|in|on|at|by)$/i.test(w));

  const keywords = Array.from(new Set(words)).slice(0, 6);

  if (track && track !== 'Other') {
    keywords.push(track.toLowerCase());
  }

  return keywords;
}

const SYSTEM_PROMPT = `你是一个专业的黑客松技术顾问。用户会给你一个黑客松项目想法和一些相关的 GitHub 开源项目信息。

你需要基于这些信息，为一个 48 小时的黑客松项目推荐最实用的技术栈，并评估可行性。

要求：
1. 推荐的技术栈必须是成熟、文档完善、适合快速开发的
2. 尽量利用提供的 GitHub 项目中的工具和框架
3. 考虑 48 小时时间限制，推荐最高效的组合
4. 评估维度要客观，基于项目的实际复杂度

你必须严格按照以下 JSON 格式返回（不要包含任何其他文字，只返回 JSON）：

{
  "techStack": {
    "frontend": [{ "name": "框架名", "reason": "推荐理由", "repo": { "url": "GitHub链接", "stars": 星数, "updatedAt": "更新日期" } }],
    "backend": [同上格式],
    "ai": [同上格式，如果项目涉及 AI],
    "deploy": [同上格式]
  },
  "feasibility": {
    "difficulty": 1-10的难度评分,
    "estimatedHours": 预估完成核心功能的小时数(最大48),
    "communitySupport": 1-10的社区支持评分,
    "docQuality": 1-10的文档质量评分,
    "hackathonFit": 1-10的黑客松适配度评分
  },
  "milestones": [
    { "time": "0-6h", "task": "阶段任务描述" },
    { "time": "6-18h", "task": "阶段任务描述" },
    { "time": "18-30h", "task": "阶段任务描述" },
    { "time": "30-42h", "task": "阶段任务描述" },
    { "time": "42-48h", "task": "阶段任务描述" }
  ],
  "risks": ["风险1", "风险2", "风险3"],
  "summary": "一段100字左右的总结，说明这个方案的核心优势和建议"
}

注意：
- 每个技术栈分类至少推荐 1 个，最多 3 个工具
- 如果某些分类不适用（比如纯前端项目不需要 backend），可以返回空数组
- repo 信息如果在提供的 GitHub 项目中找不到精确匹配，可以给出你知道的官方仓库链接
- 所有文本用中文`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, track } = body as {
      description?: string;
      track?: string;
    };

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: '请提供至少 10 个字的项目描述' },
        { status: 400 }
      );
    }

    // Extract keywords and search GitHub
    const keywords = extractKeywords(description, track);
    const searchQueries = [
      keywords.join(' '),
      // Also search with track-specific terms
      track && track !== 'Other' ? `${track} hackathon template` : null,
    ].filter(Boolean) as string[];

    const allRepos: RepoSummary[] = [];
    for (const query of searchQueries) {
      const repos = await searchGitHub(query, 10);
      allRepos.push(...repos);
    }

    // Deduplicate by repo name
    const uniqueRepos = Array.from(
      new Map(allRepos.map((r) => [r.name, r])).values()
    ).slice(0, 15);

    // Build context for Claude
    const repoContext = uniqueRepos.length > 0
      ? uniqueRepos
          .map(
            (r, i) =>
              `${i + 1}. ${r.name} (${r.stars.toLocaleString()} stars, ${r.language})\n   ${r.description}\n   Topics: ${r.topics.join(', ')}\n   URL: ${r.url}\n   Updated: ${r.updatedAt}`
          )
          .join('\n\n')
      : '未找到相关 GitHub 项目，请基于你的知识推荐。';

    const userMessage = `项目描述：${description}
${track ? `赛道：${track}` : ''}

相关 GitHub 开源项目：
${repoContext}

请基于以上信息，为这个黑客松项目推荐技术栈并评估可行性。`;

    // Call LLM (DeepSeek → Gemini fallback)
    const rawText = await chatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      maxTokens: 4096,
    });

    // Parse JSON from response (handle possible markdown code blocks)
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Arsenal recommend error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `生成推荐失败: ${message}` },
      { status: 500 }
    );
  }
}
