# HackerTrip Core High-Fidelity Pages

This folder contains the first core page renders for the HackerTrip mini program redesign.

Design input:

- `../hackertrip-product-requirements.md`
- `../hackertrip-design-system.md`
- Selected blue-white reference images:
  - `ig_0977d353c6752635016a252a623ae48198894a2a4cf5d279a2.png`
  - `ig_0977d353c6752635016a252bdc94a8819898db6846f38db122.png`

## Pages

| File | Page | Purpose |
| --- | --- | --- |
| `00-home-discovery-minimal.png` | Home / Discovery / Minimal | Current preferred homepage direction: sparse content, large type, two recommendations only. |
| `00-home-discovery-refined.png` | Home / Discovery / Refined | Refined reference direction: spacious blue-white discovery page, matching the user's preferred style. |
| `01-home-empty.png` | Home / Idle / No Active Hackathon | User has no active event; AI matching is the primary entry. |
| `02-ai-match-chat.png` | AI Chat Search / Matching | Natural-language matching flow with ranked event recommendations. |
| `03-event-discovery.png` | Event Discovery | Blue-white event discovery feed with filters, featured cards, and match signals. |
| `04-event-detail.png` | Event Detail | Event decision page with AI fit reasons, schedule, and add-to-schedule action. |
| `05-schedule-workspace.png` | Schedule Workspace | Active hackathon cockpit with countdown, stage progress, tasks, and readiness. |
| `06-identity-agent-center.png` | Identity Card / Agent Asset Center | Participant profile, GitHub/social/assets, token usage, and skills/agent configs. |

## Recommended Figma Rebuild Order

1. `00-home-discovery-minimal.png`
2. `02-ai-match-chat.png`
3. `04-event-detail.png`
4. `05-schedule-workspace.png`
5. `06-identity-agent-center.png`

After the first rebuilt Figma page is confirmed, use the same component tokens for the remaining pages.

## Refinement Rule

Do not place all product capabilities on one screen. Each page should only show the features needed for that page's primary job.

- Discovery page: event discovery, filters, recommendations, identity card CTA.
- Home status page: current event status, next task, command bar.
- Schedule page: countdown, stages, task checklist.
- Identity page: profile, connected accounts, works, agent/skills assets.
- Chat page: conversation and matching results.

For the discovery home page specifically:

- Use large headline and large touch targets.
- Show at most two featured event cards in the first screen.
- Do not include a vertical "more events" list in the first screen.
- Keep secondary metadata minimal: date, city/mode, two tags, match score.
