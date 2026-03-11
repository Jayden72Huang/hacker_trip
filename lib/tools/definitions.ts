/**
 * HackerBot Tool Definitions (Anthropic format)
 */

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TOOL_DEFINITIONS: AnthropicTool[] = [
  {
    name: 'github_search',
    description:
      'Search GitHub public repositories, code, and issues. Use this to find open-source projects, code examples, frameworks, and starter templates relevant to hackathon projects.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query (e.g., "react dashboard template", "AI chatbot framework python")',
        },
        type: {
          type: 'string',
          enum: ['repositories', 'code', 'issues'],
          description: 'What to search for. Defaults to repositories.',
        },
        language: {
          type: 'string',
          description:
            'Filter by programming language (e.g., "TypeScript", "Python")',
        },
        sort: {
          type: 'string',
          enum: ['stars', 'forks', 'updated', 'best-match'],
          description: 'Sort order. Defaults to best-match.',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (1-10). Defaults to 5.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_scrape',
    description:
      'Fetch and extract structured content from a hackathon event page URL. Returns the page title, dates, tracks, prizes, rules, and other hackathon-specific information. Use this when a user provides a hackathon URL or when you need to analyze a competition page.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the hackathon page to scrape',
        },
        extract_fields: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Specific fields to extract: name, dates, tracks, prizes, rules, schedule, sponsors, description. Defaults to all.',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'set_reminder',
    description:
      'Set a timed reminder or milestone for the hackathon team. The reminder will be displayed in the team chat when the time arrives. Use this for submission deadlines, check-in times, demo practice, and milestone tracking.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description:
            'What to remind about (e.g., "提交截止", "Demo 彩排")',
        },
        remind_at: {
          type: 'string',
          description:
            'ISO 8601 datetime string for when to trigger the reminder (e.g., "2025-06-15T15:00:00+08:00")',
        },
        type: {
          type: 'string',
          enum: ['deadline', 'milestone', 'checkin', 'custom'],
          description: 'Type of reminder. Defaults to custom.',
        },
        message: {
          type: 'string',
          description:
            'Optional detailed message to show with the reminder',
        },
      },
      required: ['title', 'remind_at'],
    },
  },
];
