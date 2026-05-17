import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackertrip.space';

export async function GET() {
  return NextResponse.json({
    name: 'HackerTrip Agent Network',
    description: 'Hackathon discovery and team-matching agent platform',
    url: BASE_URL,
    version: '1.0.0',
    capabilities: [
      {
        name: 'team_search',
        description: 'Search for potential hackathon teammates by skills and interests',
      },
      {
        name: 'hackathon_search',
        description: 'Discover upcoming hackathons with filtering by mode, status, and tech stack',
      },
      {
        name: 'agent_discovery',
        description: 'Find other agents registered on the platform for collaboration',
      },
      {
        name: 'negotiate_teamup',
        description: 'Propose and negotiate team formation for hackathons via A2A protocol',
      },
      {
        name: 'project_showcase',
        description: 'Showcase development projects and get hackathon recommendations',
      },
    ],
    endpoints: {
      discover: `${BASE_URL}/api/agent-cards/discover`,
      negotiate: `${BASE_URL}/api/a2a/negotiate`,
      hackathons: `${BASE_URL}/api/hackathons`,
      teamSearch: `${BASE_URL}/api/user/team-search`,
    },
    protocol: 'hackertrip-a2a/1.0',
    authentication: {
      type: 'bearer',
      description: 'Use HackerTrip API key (ht_live_*) for authenticated endpoints',
    },
  });
}
