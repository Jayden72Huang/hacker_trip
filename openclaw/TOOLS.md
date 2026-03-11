# Hacker_Bot Tools

## Built-in OpenClaw Tools

### browser
- Purpose: Fetch and parse hackathon web pages, documentation, GitHub repos
- Usage: Scraping hackathon rules, reading API docs, reviewing GitHub READMEs
- Rate limit: 10 requests per minute
- Restriction: Whitelisted domains only (hackathon platforms, GitHub, docs sites)

### canvas
- Purpose: Generate structured documents and artifacts
- Usage: Analysis reports, project plans, pitch deck outlines, task boards
- Output format: Markdown with embedded tables and diagrams

### cron
- Purpose: Schedule recurring check-ins and reminders
- Usage: Daily standup prompts, deadline warnings, milestone check-ins
- Timezone: Inherited from hackathon record

### webhooks
- Purpose: Receive external events
- Usage: GitHub commit notifications, CI/CD status, hackathon announcements

## Custom MCP Tools (HackerTrip Integration)

### hackertrip_api
- Endpoint: /api/agent
- Auth: Bearer token (team-scoped, issued per session)
- Operations:
  - GET /context/:hackathonId - Load hackathon details, tracks, rules, deadlines
  - GET /team/:teamId - Load team member profiles (skills, experience, GitHub)
  - POST /artifacts - Save generated artifacts (reports, plans, decks)
  - POST /scrape - Trigger URL scraping via existing ScraperFactory
  - POST /tasks - Create/update task board entries
  - GET /tasks?teamId=:teamId - Fetch current task board

### github_search
- Purpose: Search GitHub for relevant open-source projects
- Method: GitHub Search API (repos, code, topics)
- Parameters: query, language, stars_min, updated_after, sort
- Returns: Structured list with repo name, description, stars, last updated, license
- Rate limit: 30 requests per hour (authenticated), 10 per hour (unauthenticated)

### mcp_discovery
- Purpose: Discover relevant MCP servers and tools for the project
- Method: Query MCP registry / curated list
- Parameters: category, keywords, platform
- Returns: MCP server name, description, installation command, capabilities

## Tool Usage Guidelines
1. Always use hackertrip_api for hackathon data instead of generic web scraping
2. Cache GitHub search results for 1 hour to avoid rate limits
3. Generate artifacts via canvas tool and persist via hackertrip_api POST /artifacts
4. Use cron for all time-based operations (never rely on message timing)
5. When a tool call fails, report the error clearly and suggest manual alternatives
