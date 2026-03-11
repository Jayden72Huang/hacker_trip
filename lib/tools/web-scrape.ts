/**
 * Web Scrape Tool - Reuses existing ScraperFactory infrastructure.
 */

import type { ToolResult } from './types';
import { ScraperFactory } from '@/scrapers/utils/scraper-factory';

interface WebScrapeInput {
  url: string;
  extract_fields?: string[];
}

export async function webScrape(input: WebScrapeInput): Promise<ToolResult> {
  const { url, extract_fields } = input;

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return { success: false, content: '', error: `Invalid URL: ${url}` };
  }

  try {
    const platform = ScraperFactory.identifyPlatform(url);
    const result = await ScraperFactory.smartScrape(url);

    if (!result.success || !result.data) {
      return {
        success: false,
        content: '',
        error: result.error || 'Failed to scrape the page. The site may block automated access.',
      };
    }

    let data = result.data;

    // Filter to requested fields if specified
    if (extract_fields?.length) {
      const filtered: Record<string, unknown> = {};
      for (const field of extract_fields) {
        if (field in data) {
          filtered[field] = data[field as keyof typeof data];
        }
      }
      data = filtered as typeof data;
    }

    // Format as readable text for the AI
    const content = formatScrapeResult(data, platform, result.confidence);

    return {
      success: true,
      content,
      metadata: {
        platform,
        confidence: result.confidence,
        url,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown scraping error';
    return { success: false, content: '', error: message };
  }
}

function formatScrapeResult(
  data: Record<string, unknown>,
  platform: string,
  confidence: number
): string {
  const lines: string[] = [
    `## Scraped Hackathon Data (${platform}, confidence: ${Math.round(confidence * 100)}%)`,
    '',
  ];

  const fieldLabels: Record<string, string> = {
    name: 'Name',
    shortName: 'Short Name',
    city: 'City',
    country: 'Country',
    venue: 'Venue',
    dateRange: 'Dates',
    status: 'Status',
    summary: 'Summary',
    brief: 'Brief',
    prizePool: 'Prize Pool',
    teams: 'Teams',
    format: 'Format',
    theme: 'Theme',
    website: 'Website',
  };

  // Simple fields
  for (const [key, label] of Object.entries(fieldLabels)) {
    if (data[key]) {
      lines.push(`- **${label}**: ${data[key]}`);
    }
  }

  // Tracks
  if (Array.isArray(data.tracks) && data.tracks.length > 0) {
    lines.push('', '### Tracks');
    for (const track of data.tracks) {
      if (typeof track === 'object' && track !== null) {
        const t = track as { title?: string; description?: string };
        lines.push(`- **${t.title || 'Untitled'}**: ${t.description || ''}`);
      } else {
        lines.push(`- ${track}`);
      }
    }
  }

  // Agenda
  if (Array.isArray(data.agenda) && data.agenda.length > 0) {
    lines.push('', '### Schedule');
    for (const item of data.agenda) {
      if (typeof item === 'object' && item !== null) {
        const a = item as { time?: string; title?: string; detail?: string };
        lines.push(`- ${a.time || ''} — **${a.title || ''}** ${a.detail || ''}`);
      }
    }
  }

  // Organizers
  if (Array.isArray(data.organizers) && data.organizers.length > 0) {
    lines.push('', '### Organizers');
    for (const org of data.organizers) {
      if (typeof org === 'object' && org !== null) {
        lines.push(`- ${(org as { name?: string }).name || 'Unknown'}`);
      }
    }
  }

  // Sponsors
  if (Array.isArray(data.sponsors) && data.sponsors.length > 0) {
    lines.push('', '### Sponsors');
    for (const s of data.sponsors) {
      if (typeof s === 'object' && s !== null) {
        const sp = s as { name?: string; tier?: string };
        lines.push(`- ${sp.name || 'Unknown'}${sp.tier ? ` (${sp.tier})` : ''}`);
      }
    }
  }

  return lines.join('\n');
}
