---
name: ht-scan-project
description: Scan any local project directory and find matching hackathons using AI-native semantic analysis
allowed-tools: Bash, Read
---

# HackerTrip Project Scanner — Find Your Hackathon

Scan a local project directory to understand what it does, then match it against upcoming hackathons using semantic analysis. Works fully offline with bundled data.

## Privacy

All analysis runs **100% locally** on your machine. Project code is **never uploaded**. Only you see the results.

## Triggers

This skill activates when the user says any of:
- `/ht-scan-project`
- `/ht-scan-project [path]`
- "scan this project for hackathons"
- "这个项目适合参加什么黑客松"
- "match project to hackathon"
- "which hackathon for this project"
- "find hackathon for my project"
- "scan project"

## Workflow

### Step 1: Resolve target project

If the user provides a path, use it. Otherwise use the current working directory.

Verify the directory is a code project by checking for any of these files:
- `package.json` (Node.js/JavaScript)
- `requirements.txt` or `pyproject.toml` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- `Gemfile` (Ruby)
- `pubspec.yaml` (Flutter/Dart)

If none exist, tell the user: "This doesn't look like a code project. Try running this command inside a project directory."

### Step 2: Deep project scan

Read the following files (skip any that don't exist):

1. **`package.json`** — Extract: name, description, dependencies (map known packages to tech categories)
2. **`requirements.txt`** or **`pyproject.toml`** — Extract: Python packages
3. **`Cargo.toml`** / **`go.mod`** / **`Gemfile`** / **`pubspec.yaml`** — Extract: language + framework
4. **`README.md`** (first 100 lines) — Extract: project description, domain, features
5. **`CLAUDE.md`** (first 80 lines) — Extract: architecture description, tech stack, design conventions
6. **`.env.example`** or **`.env.sample`** — Extract: service integrations (Stripe, AWS, etc.)
7. **Directory listing** (`ls` root) — Detect signals:
   - `contracts/` or `hardhat.config.*` → Web3/Blockchain
   - `models/` or `notebooks/` → AI/ML
   - `Dockerfile` → Containerized
   - `ios/` or `android/` → Mobile
8. **One entry source file** (`app/page.tsx`, `src/main.ts`, `main.py`, etc., first 30 lines) — Detect imports and frameworks used

After reading these files, synthesize a **Project Profile**:

```
📦 Project Profile
─────────────────────
Name:    [project name]
Stack:   [detected tech stack]
Domain:  [e.g., AI Platform, E-commerce Tool, 3D Visualization]
Summary: [1-2 sentence description of what the project does]
```

### Step 3: Load hackathon catalog

Run this command to get hackathon data (try API first, then fallback to bundled data):

```bash
curl -sf --max-time 5 "https://hackertrip.space/api/match?limit=50&format=json" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d['hackathons'][:30], ensure_ascii=False, indent=2))" 2>/dev/null
```

If the API call fails or returns empty, read the bundled catalog:

```bash
cat ~/.hackertrip/skills/ht-scan-project/data/hackathons.json 2>/dev/null || cat ~/Desktop/hacker_trip/packages/skills/ht-scan-project/data/hackathons.json 2>/dev/null || cat ~/Desktop/hackertrip-cli/data/hackathons-bundled.json 2>/dev/null
```

### Step 4: AI-native semantic matching

This is where YOU (Claude) act as the matching engine. You have read the project files and understand what the project does. Now review each hackathon and evaluate fit across these dimensions:

| Dimension | Weight | What to assess |
|-----------|--------|----------------|
| **Thematic alignment** | 30% | Does the project's purpose/domain match the hackathon's theme and tracks? |
| **Tech stack fit** | 25% | Does the project's tech stack match what the hackathon values or requires? |
| **Novelty potential** | 15% | Would this project stand out in the hackathon context? |
| **Feasibility** | 15% | Can the project be demo'd or adapted within the hackathon timeframe? |
| **Timing & logistics** | 15% | Is the hackathon still open? Is the format accessible? |

For each hackathon, produce:
- **Match Score** (0-100)
- **Best Track**: Which specific track the project fits best
- **Pitch Angle**: A 1-sentence framing of how to position the project
- **Key Strengths**: What makes this project a strong fit
- **Gap**: What would need to be added/adjusted (if any)

### Step 5: Present results

Show the top 5 matches in this format:

```
╔══════════════════════════════════════════════════════════════╗
║         🎯 PROJECT → HACKATHON MATCHER                      ║
║         Powered by HackerTrip                                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📦 Project: [name]                                          ║
║  Stack: [tech stack]                                         ║
║  Domain: [domain categories]                                 ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  #1  [Hackathon Name]              Score: XX/100             ║
║      [dates] · [city] · [format]                             ║
║      Best Track: [track name]                                ║
║      Pitch: "[1-sentence pitch angle]"                       ║
║      Strengths: [what makes this a good fit]                 ║
║      Gap: [what to add/adjust, or "Ready to submit"]         ║
║      🔗 [registration URL]                                   ║
║                                                              ║
║  #2  [Hackathon Name]              Score: XX/100             ║
║      ...                                                     ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Next steps:                                                 ║
║    • Visit hackertrip.space/explore for all events            ║
║    • Run `npx hackertrip` for quick CLI matching              ║
║    • Run /ht-match to find teammates                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 6: Follow-up actions (optional)

After showing results, ask the user if they want to:
1. **Deep dive** into a specific hackathon match (show full details, tracks, prizes)
2. **Generate submission draft** — create a project description, elevator pitch, and demo plan for a selected hackathon
3. **Find teammates** — jump to `/ht-match` for team building
4. **Scan another project** — scan a different directory

## Key Matching Insights

When matching, use your world knowledge to make semantic connections:
- Three.js / React Three Fiber → XR/VR/AR/spatial computing hackathons
- LLM / Claude SDK / AI SDK → AI agent / AI application hackathons
- Web3 / Ethereum / Solidity → blockchain / DeFi / Web3 hackathons
- FastAPI + ML libraries → data science / AI hackathons
- Game engines (Unity/Unreal) → gaming / AIGC / metaverse hackathons
- Medical/bio libraries → healthcare / biotech hackathons
- Payment libraries (Stripe/Plaid) → fintech hackathons
- Maps / geolocation → smart city / travel hackathons

## Example Output

For a project using Next.js + Three.js + Claude SDK:

```
#1  XR黑客松 48小时极限开发挑战        Score: 85/100
    Jul 18-20 · 北京/上海/广州 · Offline
    Best Track: 空间计算
    Pitch: "AI-powered 3D visualization engine for spatial computing experiences"
    Strengths: Three.js expertise directly applicable, AI integration adds novelty
    Gap: Add WebXR device support for immersive demo
    🔗 https://zhuanlan.zhihu.com/p/1928168821384001139
```
