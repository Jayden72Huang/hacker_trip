/**
 * Tool Executor - Dispatches tool calls to implementations.
 */

import type { ToolResult, ToolContext } from './types';
import { githubSearch } from './github-search';
import { webScrape } from './web-scrape';
import { setReminder } from './set-reminder';
import { recommendHackathons } from './recommend-hackathons';
import { searchVerifiedWorks } from './search-verified-works';

const TOOL_TIMEOUT = 15000; // 15 seconds

export async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const startTime = Date.now();

  try {
    const result = await Promise.race([
      dispatchTool(name, input, context),
      timeoutPromise(TOOL_TIMEOUT),
    ]);

    const executionTime = Date.now() - startTime;
    return {
      ...result,
      metadata: { ...result.metadata, executionTimeMs: executionTime },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown tool execution error';
    return { success: false, content: '', error: message };
  }
}

async function dispatchTool(
  name: string,
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  switch (name) {
    case 'github_search':
      return githubSearch(input as unknown as Parameters<typeof githubSearch>[0]);
    case 'web_scrape':
      return webScrape(input as unknown as Parameters<typeof webScrape>[0]);
    case 'set_reminder':
      return setReminder(
        input as unknown as Parameters<typeof setReminder>[0],
        context
      );
    case 'recommend_hackathons':
      return recommendHackathons(
        input as unknown as Parameters<typeof recommendHackathons>[0],
        context
      );
    case 'search_verified_works':
      return searchVerifiedWorks(
        input as unknown as Parameters<typeof searchVerifiedWorks>[0]
      );
    default:
      return {
        success: false,
        content: '',
        error: `Unknown tool: ${name}`,
      };
  }
}

function timeoutPromise(ms: number): Promise<ToolResult> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Tool execution timed out after ${ms}ms`)), ms)
  );
}
