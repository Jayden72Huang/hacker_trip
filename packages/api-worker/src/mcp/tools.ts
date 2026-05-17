import { eq, desc, ilike, and, sql } from 'drizzle-orm';
import { createDb, schema, type Database } from '../db/client';

// ============ Tool Definitions ============

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'search_hackathons',
    description:
      'Search for hackathons on HackerTrip. Filter by keyword, status, mode, and limit results.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword to match hackathon names' },
        status: {
          type: 'string',
          enum: ['upcoming', 'ongoing', 'ended'],
          description: 'Filter by hackathon status',
        },
        mode: {
          type: 'string',
          enum: ['online', 'offline', 'hybrid'],
          description: 'Filter by hackathon mode',
        },
        limit: {
          type: 'number',
          description: 'Max number of results (default 20, max 100)',
        },
      },
    },
  },
  {
    name: 'get_hackathon_detail',
    description:
      'Get full details of a specific hackathon by its UUID or slug.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Hackathon UUID or slug',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_verified_works',
    description:
      'Search for verified works (projects) on HackerTrip. Only returns approved, public works.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword to match work names' },
        hackathon_id: { type: 'string', description: 'Filter by hackathon ID' },
        tech_stack: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tech stack keywords (matches any)',
        },
        has_awards: {
          type: 'boolean',
          description: 'If true, only return works that have awards',
        },
        limit: {
          type: 'number',
          description: 'Max number of results (default 20, max 50)',
        },
      },
    },
  },
  {
    name: 'get_work_detail',
    description:
      'Get full details of a specific verified work (project) by its UUID, including team members.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Work/project UUID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_teammates',
    description:
      'Search for users looking to join a hackathon team. Filter by skills, interests, and experience level.',
    inputSchema: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by skills (matches any)',
        },
        interests: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by interests or preferred tracks',
        },
        experience_level: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Filter by experience level',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 20, max 50)',
        },
      },
    },
  },
  {
    name: 'discover_agents',
    description:
      'Discover agent cards on HackerTrip. Find agents available for team-up negotiations.',
    inputSchema: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter agents by skills',
        },
        looking_for_team: {
          type: 'boolean',
          description: 'Only show agents whose users are looking for a team',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 20, max 50)',
        },
      },
    },
  },
];

// ============ Tool Handlers ============

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

function textResult(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

// --- search_hackathons ---

async function searchHackathons(
  db: Database,
  params: { query?: string; status?: string; mode?: string; limit?: number }
): Promise<ToolResult> {
  const limit = Math.min(Math.max(params.limit || 20, 1), 100);

  const conditions = [];
  if (params.query) {
    conditions.push(ilike(schema.hackathons.name, `%${params.query}%`));
  }
  if (params.status) {
    conditions.push(
      eq(schema.hackathons.status, params.status as 'upcoming' | 'ongoing' | 'ended')
    );
  }
  if (params.mode) {
    conditions.push(
      eq(schema.hackathons.mode, params.mode as 'online' | 'offline' | 'hybrid')
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(schema.hackathons)
      .where(where)
      .orderBy(desc(schema.hackathons.startDate))
      .limit(limit),
    db.select({ count: sql<number>`count(*)` }).from(schema.hackathons).where(where),
  ]);

  return textResult({
    hackathons: data,
    total: Number(countResult[0]?.count || 0),
    limit,
  });
}

// --- get_hackathon_detail ---

async function getHackathonDetail(
  db: Database,
  params: { id: string }
): Promise<ToolResult> {
  if (!params.id) return errorResult('Missing required parameter: id');

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
  const condition = isUuid
    ? eq(schema.hackathons.id, params.id)
    : eq(schema.hackathons.slug, params.id);

  const [hackathon] = await db
    .select()
    .from(schema.hackathons)
    .where(condition)
    .limit(1);

  if (!hackathon) return errorResult('Hackathon not found');

  return textResult({ hackathon });
}

// --- search_verified_works ---

async function searchVerifiedWorks(
  db: Database,
  params: {
    query?: string;
    hackathon_id?: string;
    tech_stack?: string[];
    has_awards?: boolean;
    limit?: number;
  }
): Promise<ToolResult> {
  const limit = Math.min(Math.max(params.limit || 20, 1), 50);

  const conditions = [
    eq(schema.projects.verificationStatus, 'approved'),
    eq(schema.projects.isPublic, true),
  ];

  if (params.query) {
    conditions.push(ilike(schema.projects.name, `%${params.query}%`));
  }
  if (params.hackathon_id) {
    conditions.push(eq(schema.projects.hackathonId, params.hackathon_id));
  }
  if (params.tech_stack && params.tech_stack.length > 0) {
    // Match any tech_stack keyword against the jsonb tech_stack array
    const techConditions = params.tech_stack.map((tech) =>
      sql`${schema.projects.techStack}::text ILIKE ${'%' + tech + '%'}`
    );
    // OR across all tech keywords
    conditions.push(sql`(${sql.join(techConditions, sql` OR `)})`);
  }
  if (params.has_awards) {
    // awards is a jsonb array — filter where it has at least one element
    conditions.push(sql`jsonb_array_length(${schema.projects.awards}::jsonb) > 0`);
  }

  const where = and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(schema.projects)
      .where(where)
      .orderBy(desc(schema.projects.createdAt))
      .limit(limit),
    db.select({ count: sql<number>`count(*)` }).from(schema.projects).where(where),
  ]);

  // Strip internal verification fields
  const sanitized = data.map(
    ({ aiReviewResult, adminReviewerId, adminReviewNotes, ...rest }) => rest
  );

  return textResult({
    works: sanitized,
    total: Number(countResult[0]?.count || 0),
    limit,
  });
}

// --- get_work_detail ---

async function getWorkDetail(
  db: Database,
  params: { id: string }
): Promise<ToolResult> {
  if (!params.id) return errorResult('Missing required parameter: id');

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(
      and(
        eq(schema.projects.id, params.id),
        eq(schema.projects.verificationStatus, 'approved'),
        eq(schema.projects.isPublic, true)
      )
    )
    .limit(1);

  if (!project) return errorResult('Work not found');

  const teamMembers = await db
    .select()
    .from(schema.workTeamMembers)
    .where(eq(schema.workTeamMembers.projectId, params.id));

  const { aiReviewResult, adminReviewerId, adminReviewNotes, ...safe } = project;

  return textResult({ work: { ...safe, teamMembers } });
}

// --- search_teammates ---

async function searchTeammates(
  db: Database,
  params: {
    skills?: string[];
    interests?: string[];
    experience_level?: string;
    limit?: number;
  }
): Promise<ToolResult> {
  const limit = Math.min(Math.max(params.limit || 20, 1), 50);

  const conditions = [eq(schema.users.lookingForTeam, true)];

  if (params.skills && params.skills.length > 0) {
    for (const skill of params.skills) {
      conditions.push(sql`${schema.users.skills}::text ILIKE ${'%' + skill + '%'}`);
    }
  }
  if (params.interests && params.interests.length > 0) {
    for (const interest of params.interests) {
      conditions.push(
        sql`(${schema.users.interests}::text ILIKE ${'%' + interest + '%'} OR ${schema.users.preferredTracks}::text ILIKE ${'%' + interest + '%'})`
      );
    }
  }
  if (params.experience_level) {
    conditions.push(eq(schema.users.experienceLevel, params.experience_level));
  }

  const data = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      username: schema.users.username,
      bio: schema.users.bio,
      skills: schema.users.skills,
      interests: schema.users.interests,
      experienceLevel: schema.users.experienceLevel,
      github: schema.users.github,
      linkedin: schema.users.linkedin,
    })
    .from(schema.users)
    .where(and(...conditions))
    .limit(limit);

  return textResult({ teammates: data, total: data.length });
}

// --- discover_agents ---

async function discoverAgents(
  db: Database,
  params: {
    skills?: string[];
    looking_for_team?: boolean;
    limit?: number;
  }
): Promise<ToolResult> {
  const limit = Math.min(Math.max(params.limit || 20, 1), 50);

  const conditions = [
    eq(schema.agentCards.isPublic, true),
    eq(schema.agentCards.allowAgentContact, true),
  ];

  if (params.skills && params.skills.length > 0) {
    for (const skill of params.skills) {
      conditions.push(sql`${schema.agentCards.skills}::text ILIKE ${'%' + skill + '%'}`);
    }
  }
  if (params.looking_for_team) {
    conditions.push(eq(schema.users.lookingForTeam, true));
  }

  const query = db
    .select({
      id: schema.agentCards.id,
      name: schema.agentCards.name,
      description: schema.agentCards.description,
      capabilities: schema.agentCards.capabilities,
      skills: schema.agentCards.skills,
      interests: schema.agentCards.interests,
      autoNegotiate: schema.agentCards.autoNegotiate,
      userName: schema.users.name,
      userUsername: schema.users.username,
    })
    .from(schema.agentCards)
    .innerJoin(schema.users, eq(schema.users.id, schema.agentCards.userId))
    .where(and(...conditions))
    .limit(limit);

  const data = await query;

  return textResult({ agents: data, total: data.length });
}

// ============ Tool Dispatcher ============

export async function callTool(
  db: Database,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case 'search_hackathons':
      return searchHackathons(db, args as Parameters<typeof searchHackathons>[1]);
    case 'get_hackathon_detail':
      return getHackathonDetail(db, args as Parameters<typeof getHackathonDetail>[1]);
    case 'search_verified_works':
      return searchVerifiedWorks(db, args as Parameters<typeof searchVerifiedWorks>[1]);
    case 'get_work_detail':
      return getWorkDetail(db, args as Parameters<typeof getWorkDetail>[1]);
    case 'search_teammates':
      return searchTeammates(db, args as Parameters<typeof searchTeammates>[1]);
    case 'discover_agents':
      return discoverAgents(db, args as Parameters<typeof discoverAgents>[1]);
    default:
      return errorResult(`Unknown tool: ${name}`);
  }
}
