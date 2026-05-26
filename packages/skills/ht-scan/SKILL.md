---
name: ht-scan
description: Scan local AI conversation history to build DAMC profile, extract skills, and compute token usage
allowed-tools: Bash, Read, Write
---

# HackerTrip Scan — Local AI Conversation Analyzer

Analyze your local AI coding conversations to generate:
- **DAMC scores** (Design / Analyze / Market / Code) — 0-100 per dimension
- **Skills & tech stack** — extracted from actual usage
- **Token consumption** — estimated across all AI tools
- **Activity heatmap** — daily coding patterns
- **ViberCard tier** — Bronze / Gold / Platinum / Diamond

## Privacy

All analysis runs **100% locally** on your machine. Raw conversations are **never uploaded**. Only the structured results (DAMC scores, skill tags, token counts) are sent to HackerTrip if you choose to sync.

## Usage

Run this skill when the user types `/ht-scan` or asks to analyze their AI conversations.

## Workflow

### Step 1: Discover sessions

Run the discovery script to find all AI conversation session files on this machine:

```bash
bash ~/.hackertrip/skills/ht-scan/scripts/discover-sessions.sh
```

This scans for sessions from: Claude Code, Cursor, Codex, OpenClaw, Gemini CLI, Windsurf, Trae, ChatGPT.

Environment variables:
- `HT_DAYS=30` — how many days to look back (default: 30)
- `HT_SOURCES=claude-code,cursor,codex` — comma-separated source filter

The script outputs a temp file path containing one session file per line.

### Step 2: Compute stats

Run the analysis engine on discovered sessions:

```bash
python3 ~/.hackertrip/skills/ht-scan/scripts/compute-stats.py <session-list-file>
```

This produces output files in `_ht_scan/` directory (created in current working directory):
- `damc.json` — DAMC dimension scores (0-100 each)
- `skills.json` — extracted tech stack and skill tags
- `stats.json` — token consumption, session count, active days
- `activity.json` — per-day activity heatmap
- `tier.json` — computed ViberCard tier (bronze/gold/platinum/diamond)

### Step 3: Present results

Read the output files and present a formatted summary to the user:

```
╔══════════════════════════════════════════╗
║           HackerTrip Scan Results        ║
╠══════════════════════════════════════════╣
║                                          ║
║  DAMC Profile:                           ║
║    D (Design)  ████████░░  78            ║
║    A (Analyze) ██████░░░░  65            ║
║    M (Market)  ████████░░  82            ║
║    C (Code)    ███████░░░  71            ║
║                                          ║
║  Token Usage:  12.8M consumed            ║
║  Sessions:     142 analyzed (30 days)    ║
║  Active Days:  24 / 30                   ║
║                                          ║
║  Top Skills:                             ║
║    TypeScript, React, Next.js, Python    ║
║    Tailwind, PostgreSQL, Node.js         ║
║                                          ║
║  ViberCard Tier: 💎 Platinum (Lv.50)     ║
║                                          ║
╚══════════════════════════════════════════╝
```

### Step 4: Sync (optional)

Ask the user if they want to sync results to their HackerTrip account:
- If yes: POST to `/api/user/profile` with DAMC + skills + token data
- If no: results stay local in `_ht_scan/`

Requires authentication. If not logged in, prompt: "Run `ht login` first, or visit hackertrip.space to sign in."

## Tier Calculation

| Tier | Conditions |
|------|-----------|
| 🥉 Bronze (Lv.10) | Has conversation history, Token < 1M |
| 🥇 Gold (Lv.25) | Token ≥ 1M OR DAMC average ≥ 40 |
| 💎 Platinum (Lv.50) | Token ≥ 5M AND DAMC average ≥ 60 |
| 👑 Diamond (Lv.99) | Token ≥ 10M AND DAMC average ≥ 75 |

## Triggers

This skill activates when the user says any of:
- `/ht-scan`
- "分析我的 AI 对话"
- "scan my conversations"
- "生成 DAMC 画像"
- "analyze my coding history"
