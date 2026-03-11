/**
 * GitHub Public Search Tool
 *
 * Uses GitHub REST API (unauthenticated: 10 req/min, with GITHUB_TOKEN: 30 req/min).
 */

import type { ToolResult } from './types';

interface GitHubSearchInput {
  query: string;
  type?: 'repositories' | 'code' | 'issues';
  language?: string;
  sort?: 'stars' | 'forks' | 'updated' | 'best-match';
  limit?: number;
}

interface GitHubRepo {
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  license?: { spdx_id: string } | null;
  topics?: string[];
}

interface GitHubCodeItem {
  name: string;
  path: string;
  html_url: string;
  repository: { full_name: string; html_url: string };
}

interface GitHubIssue {
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  repository_url: string;
  labels: Array<{ name: string }>;
}

export async function githubSearch(
  input: GitHubSearchInput
): Promise<ToolResult> {
  const {
    query,
    type = 'repositories',
    language,
    sort = 'best-match',
    limit = 5,
  } = input;

  const clampedLimit = Math.min(Math.max(limit, 1), 10);

  let searchQuery = query;
  if (language) searchQuery += ` language:${language}`;

  const endpoint = `https://api.github.com/search/${type}`;
  const params = new URLSearchParams({
    q: searchQuery,
    sort: sort === 'best-match' ? '' : sort,
    per_page: String(clampedLimit),
  });

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'HackerBot/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${endpoint}?${params}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 403) {
        return {
          success: false,
          content: '',
          error: 'GitHub API rate limit exceeded. Please try again later.',
        };
      }
      return {
        success: false,
        content: '',
        error: `GitHub API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const totalCount: number = data.total_count ?? 0;

    if (type === 'repositories') {
      return formatRepoResults(data.items as GitHubRepo[], totalCount, searchQuery);
    } else if (type === 'code') {
      return formatCodeResults(data.items as GitHubCodeItem[], totalCount, searchQuery);
    } else {
      return formatIssueResults(data.items as GitHubIssue[], totalCount, searchQuery);
    }
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'GitHub search timed out (15s)'
        : err instanceof Error
          ? err.message
          : 'Unknown error';
    return { success: false, content: '', error: message };
  }
}

function formatRepoResults(
  items: GitHubRepo[],
  total: number,
  query: string
): ToolResult {
  if (!items?.length) {
    return {
      success: true,
      content: `No repositories found for "${query}".`,
      metadata: { total: 0 },
    };
  }

  const lines = items.map((repo, i) => {
    const stars = repo.stargazers_count.toLocaleString();
    const forks = repo.forks_count.toLocaleString();
    const lang = repo.language || 'N/A';
    const license = repo.license?.spdx_id || 'No license';
    const topics = repo.topics?.slice(0, 5).join(', ') || '';
    const desc = repo.description?.slice(0, 120) || 'No description';
    const updated = repo.updated_at.split('T')[0];

    return [
      `${i + 1}. **${repo.full_name}** ⭐ ${stars} | 🍴 ${forks}`,
      `   ${desc}`,
      `   Language: ${lang} | License: ${license} | Updated: ${updated}`,
      topics ? `   Topics: ${topics}` : '',
      `   URL: ${repo.html_url}`,
    ]
      .filter(Boolean)
      .join('\n');
  });

  const content = `Found ${total.toLocaleString()} repositories for "${query}":\n\n${lines.join('\n\n')}`;
  return { success: true, content, metadata: { total } };
}

function formatCodeResults(
  items: GitHubCodeItem[],
  total: number,
  query: string
): ToolResult {
  if (!items?.length) {
    return {
      success: true,
      content: `No code results found for "${query}".`,
      metadata: { total: 0 },
    };
  }

  const lines = items.map(
    (item, i) =>
      `${i + 1}. **${item.repository.full_name}** / ${item.path}\n   URL: ${item.html_url}`
  );

  const content = `Found ${total.toLocaleString()} code results for "${query}":\n\n${lines.join('\n\n')}`;
  return { success: true, content, metadata: { total } };
}

function formatIssueResults(
  items: GitHubIssue[],
  total: number,
  query: string
): ToolResult {
  if (!items?.length) {
    return {
      success: true,
      content: `No issues found for "${query}".`,
      metadata: { total: 0 },
    };
  }

  const lines = items.map((item, i) => {
    const labels = item.labels.map((l) => l.name).join(', ');
    return `${i + 1}. [${item.state}] **${item.title}**${labels ? ` (${labels})` : ''}\n   URL: ${item.html_url}`;
  });

  const content = `Found ${total.toLocaleString()} issues for "${query}":\n\n${lines.join('\n\n')}`;
  return { success: true, content, metadata: { total } };
}
