import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/llm';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

interface GitHubRepoInfo {
  description: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
}

async function fetchGitHubRepo(url: string): Promise<GitHubRepoInfo | null> {
  try {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    const [, owner, repo] = match;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, '')}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      description: data.description,
      language: data.language,
      topics: data.topics || [],
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`launch-generate:${session.user.id}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      );
    }

    const { projectName, description, githubUrl, targetAudience } = await request.json();

    if (!projectName || !description) {
      return NextResponse.json(
        { error: 'projectName and description are required' },
        { status: 400 }
      );
    }

    // Fetch GitHub repo info if URL provided
    let repoInfo: GitHubRepoInfo | null = null;
    if (githubUrl) {
      repoInfo = await fetchGitHubRepo(githubUrl);
    }

    // Build context
    let projectContext = `Project Name: ${projectName}\nDescription: ${description}`;
    if (targetAudience) {
      projectContext += `\nTarget Audience: ${targetAudience}`;
    }
    if (githubUrl) {
      projectContext += `\nGitHub URL: ${githubUrl}`;
    }
    if (repoInfo) {
      projectContext += `\nGitHub Info:`;
      if (repoInfo.description) projectContext += `\n  - Repo description: ${repoInfo.description}`;
      if (repoInfo.language) projectContext += `\n  - Primary language: ${repoInfo.language}`;
      if (repoInfo.topics.length > 0) projectContext += `\n  - Topics: ${repoInfo.topics.join(', ')}`;
      projectContext += `\n  - Stars: ${repoInfo.stargazers_count}`;
      projectContext += `\n  - Forks: ${repoInfo.forks_count}`;
    }

    const systemPrompt = `You are an expert product marketer and copywriter. Given a project's information, generate promotion materials in a single structured JSON response.

You MUST return ONLY valid JSON with no extra text, no markdown code fences, no explanation. The JSON structure:

{
  "productHunt": {
    "tagline": "60 chars max, catchy English tagline",
    "description": "260 chars max, English description for Product Hunt",
    "firstComment": "English first comment for Product Hunt launch, 2-3 paragraphs, warm and authentic tone"
  },
  "tweets": [
    "Tweet 1: Technical angle (English)",
    "Tweet 2: Story angle (English)",
    "Tweet 3: Data/traction angle (English)",
    "Tweet 4: Pain-point angle (English)",
    "Tweet 5: Fun/creative angle (English)"
  ],
  "blog": "A 300-500 word blog post in Chinese (markdown format)",
  "pitchOneLiner": "A concise one-liner pitch in English for investors, max 100 chars"
}

Rules:
- Product Hunt tagline <= 60 characters, description <= 260 characters
- Each tweet <= 280 characters with relevant hashtags
- Blog post in Chinese, 300-500 words, markdown format
- All content professional yet engaging`;

    const rawResponse = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate promotion materials for:\n\n${projectContext}` },
      ],
      maxTokens: 4096,
    });

    // Parse JSON from response (handle potential markdown code fences)
    let rawText = rawResponse.trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Launch generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate promotion materials' },
      { status: 500 }
    );
  }
}
